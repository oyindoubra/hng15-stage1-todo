const priorities = new Set(["Low", "Medium", "High"]);

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${label} cannot be empty.`);
  }
  return value.trim();
}

function requireId(id) {
  return requireText(id, "ID");
}

function requireUniqueId(items, id) {
  if (items.some((item) => item.id === id)) {
    throw new Error(`An item with ID "${id}" already exists.`);
  }
}

function requirePriority(priority) {
  if (!priorities.has(priority)) {
    throw new TypeError("Priority must be Low, Medium, or High.");
  }
  return priority;
}

export function createTask(tasks, { id, title, priority = "Medium" }) {
  const taskId = requireId(id);
  requireUniqueId(tasks, taskId);
  return [
    ...tasks,
    { id: taskId, title: requireText(title, "Task title"), priority: requirePriority(priority), completed: false },
  ];
}

export function updateTask(tasks, id, changes) {
  const taskId = requireId(id);
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) throw new Error(`Task "${taskId}" was not found.`);
  const updated = { ...tasks[index] };
  if (Object.hasOwn(changes, "title")) updated.title = requireText(changes.title, "Task title");
  if (Object.hasOwn(changes, "priority")) updated.priority = requirePriority(changes.priority);
  const next = [...tasks];
  next[index] = updated;
  return next;
}

export function toggleTask(tasks, id) {
  const taskId = requireId(id);
  let found = false;
  const next = tasks.map((task) => {
    if (task.id !== taskId) return task;
    found = true;
    return { ...task, completed: !task.completed };
  });
  if (!found) throw new Error(`Task "${taskId}" was not found.`);
  return next;
}

export function deleteTask(tasks, id) {
  const taskId = requireId(id);
  return tasks.filter((task) => task.id !== taskId);
}

export function filterTasks(tasks, filter) {
  switch (filter) {
    case "all":
      return tasks;
    case "active":
      return tasks.filter((task) => !task.completed);
    case "completed":
      return tasks.filter((task) => task.completed);
    case "high":
      return tasks.filter((task) => task.priority === "High");
    default:
      throw new TypeError(`Unknown task filter: ${filter}`);
  }
}

export function createNote(notes, { id, title = "", content }) {
  const noteId = requireId(id);
  requireUniqueId(notes, noteId);
  return [
    ...notes,
    {
      id: noteId,
      title: title.trim() || "Untitled note",
      content: requireText(content, "Note content"),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function updateNote(notes, id, changes) {
  const noteId = requireId(id);
  const index = notes.findIndex((note) => note.id === noteId);
  if (index === -1) throw new Error(`Note "${noteId}" was not found.`);
  const updated = { ...notes[index] };
  if (Object.hasOwn(changes, "title")) updated.title = changes.title.trim() || "Untitled note";
  if (Object.hasOwn(changes, "content")) updated.content = requireText(changes.content, "Note content");
  updated.updatedAt = new Date().toISOString();
  const next = [...notes];
  next[index] = updated;
  return next;
}

export function deleteNote(notes, id) {
  const noteId = requireId(id);
  return notes.filter((note) => note.id !== noteId);
}