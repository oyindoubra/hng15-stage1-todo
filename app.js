import {
  createNote,
  createTask,
  deleteNote,
  deleteTask,
  filterTasks,
  toggleTask,
  updateNote,
  updateTask,
} from "./core.js";

const STORAGE_KEY = "daymark-state-v1";
const filters = { all: "all", active: "active", completed: "completed", high: "high" };
const taskList = document.querySelector("#task-list");
const noteList = document.querySelector("#note-list");
const taskEmpty = document.querySelector("#task-empty");
const noteEmpty = document.querySelector("#note-empty");
const taskForm = document.querySelector("#task-form");
const noteForm = document.querySelector("#note-form");
const taskError = document.querySelector("#task-error");
const noteError = document.querySelector("#note-error");

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      tasks: Array.isArray(saved.tasks) ? saved.tasks : [],
      notes: Array.isArray(saved.notes) ? saved.notes : [],
    };
  } catch {
    return { tasks: [], notes: [] };
  }
}

let state = loadState();
let activeFilter = "all";
let editingTaskId = null;
let editingNoteId = null;

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showError(taskError, "Changes could not be saved in this browser.");
  }
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function showError(element, message = "") {
  element.textContent = message;
  element.hidden = !message;
}

function commit(nextState) {
  state = nextState;
  persist();
  render();
}

function renderTasks() {
  const visibleTasks = filterTasks(state.tasks, activeFilter);
  document.querySelector("#task-count").textContent = String(state.tasks.filter((task) => !task.completed).length);
  document.querySelector("#clear-completed").hidden = !state.tasks.some((task) => task.completed);
  taskEmpty.hidden = visibleTasks.length > 0;
  taskEmpty.querySelector(".empty-title").textContent = state.tasks.length === 0
    ? "A fresh page."
    : "Nothing in this view.";
  taskEmpty.lastElementChild.textContent = state.tasks.length === 0
    ? "Your next small win can go here."
    : "Try another filter or add a new task.";
  taskList.innerHTML = visibleTasks.map((task) => {
    const isEditing = task.id === editingTaskId;
    const completedClass = task.completed ? " is-completed" : "";
    return `<li class="task-item${completedClass}" data-id="${escapeHtml(task.id)}">
      <input class="complete-toggle" type="checkbox" data-action="toggle-task" aria-label="Mark ${escapeHtml(task.title)} ${task.completed ? "active" : "complete"}" ${task.completed ? "checked" : ""}>
      <div class="task-copy"><div class="task-title">${escapeHtml(task.title)}</div><div class="task-meta"><span class="priority-label" data-priority="${escapeHtml(task.priority)}">${escapeHtml(task.priority)} priority</span></div></div>
      <div class="task-actions"><button class="icon-button" type="button" data-action="edit-task" aria-label="Edit ${escapeHtml(task.title)}" title="Edit task">✎</button><button class="icon-button delete-button" type="button" data-action="delete-task" aria-label="Delete ${escapeHtml(task.title)}" title="Delete task">×</button></div>
      ${isEditing ? `<form class="edit-form" data-action="save-task"><input name="title" aria-label="Edit task title" maxlength="140" value="${escapeHtml(task.title)}" required><select name="priority" aria-label="Edit priority"><option ${task.priority === "Low" ? "selected" : ""}>Low</option><option ${task.priority === "Medium" ? "selected" : ""}>Medium</option><option ${task.priority === "High" ? "selected" : ""}>High</option></select><button type="submit">Save</button><button type="button" data-action="cancel-edit-task">Cancel</button></form>` : ""}
    </li>`;
  }).join("");
}

function renderNotes() {
  document.querySelector("#note-count").textContent = `${state.notes.length} ${state.notes.length === 1 ? "NOTE" : "NOTES"}`;
  noteEmpty.hidden = state.notes.length > 0;
  noteList.innerHTML = [...state.notes].reverse().map((note) => {
    if (note.id === editingNoteId) {
      return `<li class="note-item" data-id="${escapeHtml(note.id)}"><form class="note-edit-form" data-action="save-note"><input name="title" aria-label="Edit note title" maxlength="80" value="${escapeHtml(note.title)}"><textarea name="content" aria-label="Edit note" maxlength="2000" required>${escapeHtml(note.content)}</textarea><button type="submit">Save changes</button></form></li>`;
    }
    const date = new Date(note.updatedAt);
    const dateLabel = Number.isNaN(date.getTime()) ? "Saved note" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `<li class="note-item" data-id="${escapeHtml(note.id)}"><h3>${escapeHtml(note.title)}</h3><p>${escapeHtml(note.content)}</p><time>${dateLabel}</time><div class="note-actions"><button class="icon-button" type="button" data-action="edit-note" aria-label="Edit ${escapeHtml(note.title)}" title="Edit note">✎</button><button class="icon-button delete-button" type="button" data-action="delete-note" aria-label="Delete ${escapeHtml(note.title)}" title="Delete note">×</button></div></li>`;
  }).join("");
}

function render() {
  renderTasks();
  renderNotes();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(taskForm);
  try {
    commit({ ...state, tasks: createTask(state.tasks, { id: makeId(), title: formData.get("title"), priority: formData.get("priority") }) });
    taskForm.reset();
    document.querySelector("#task-priority").value = "Medium";
    showError(taskError);
    document.querySelector("#task-title").focus();
  } catch (error) {
    showError(taskError, error.message);
  }
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const item = button.closest("[data-id]");
  if (!item) return;
  const { id } = item.dataset;
  switch (button.dataset.action) {
    case "edit-task": editingTaskId = id; renderTasks(); break;
    case "cancel-edit-task": editingTaskId = null; renderTasks(); break;
    case "delete-task": editingTaskId = null; commit({ ...state, tasks: deleteTask(state.tasks, id) }); break;
  }
});

taskList.addEventListener("change", (event) => {
  if (event.target.matches('[data-action="toggle-task"]')) {
    commit({ ...state, tasks: toggleTask(state.tasks, event.target.closest("[data-id]").dataset.id) });
  }
});

taskList.addEventListener("submit", (event) => {
  if (!event.target.matches('[data-action="save-task"]')) return;
  event.preventDefault();
  const { id } = event.target.closest("[data-id]").dataset;
  const formData = new FormData(event.target);
  try {
    const tasks = updateTask(state.tasks, id, { title: formData.get("title"), priority: formData.get("priority") });
    editingTaskId = null;
    commit({ ...state, tasks });
  } catch (error) {
    showError(taskError, error.message);
  }
});

document.querySelector(".filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeFilter = filters[button.dataset.filter];
  document.querySelectorAll(".filter-button").forEach((filterButton) => {
    const selected = filterButton === button;
    filterButton.classList.toggle("is-active", selected);
    filterButton.setAttribute("aria-pressed", String(selected));
  });
  renderTasks();
});

document.querySelector("#clear-completed").addEventListener("click", () => {
  commit({ ...state, tasks: state.tasks.filter((task) => !task.completed) });
});

noteForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.querySelector("#note-title").value;
  const content = document.querySelector("#note-content").value;
  try {
    commit({ ...state, notes: createNote(state.notes, { id: makeId(), title, content }) });
    noteForm.reset();
    showError(noteError);
    document.querySelector("#note-content").focus();
  } catch (error) {
    showError(noteError, error.message);
  }
});

noteList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { id } = button.closest("[data-id]").dataset;
  switch (button.dataset.action) {
    case "edit-note": editingNoteId = id; renderNotes(); break;
    case "delete-note": editingNoteId = null; commit({ ...state, notes: deleteNote(state.notes, id) }); break;
  }
});

noteList.addEventListener("submit", (event) => {
  if (!event.target.matches('[data-action="save-note"]')) return;
  event.preventDefault();
  const { id } = event.target.closest("[data-id]").dataset;
  const formData = new FormData(event.target);
  try {
    const notes = updateNote(state.notes, id, { title: formData.get("title"), content: formData.get("content") });
    editingNoteId = null;
    commit({ ...state, notes });
  } catch (error) {
    showError(noteError, error.message);
  }
});

document.querySelector("#today-label").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
render();