import test from "node:test";
import assert from "node:assert/strict";
import {
  createNote,
  createTask,
  deleteNote,
  deleteTask,
  filterTasks,
  toggleTask,
  updateNote,
  updateTask,
} from "../core.js";

test("task CRUD validates input and prevents duplicate IDs", () => {
  let tasks = createTask([], { id: "a", title: "  Write tests  ", priority: "High" });
  assert.equal(tasks[0].title, "Write tests");
  assert.throws(() => createTask(tasks, { id: "a", title: "Duplicate" }), /already exists/);
  assert.throws(() => createTask(tasks, { id: "b", title: "   " }), /cannot be empty/);
  assert.throws(() => createTask(tasks, { id: "b", title: "Task", priority: "Urgent" }), /Priority/);
  tasks = updateTask(tasks, "a", { title: "Revise tests", priority: "Medium" });
  assert.deepEqual([tasks[0].title, tasks[0].priority], ["Revise tests", "Medium"]);
  assert.deepEqual(deleteTask(tasks, "a"), []);
});

test("completion toggles and task filters return the expected tasks", () => {
  const tasks = [
    { id: "a", title: "First", priority: "High", completed: false },
    { id: "b", title: "Second", priority: "Low", completed: true },
    { id: "c", title: "Third", priority: "High", completed: true },
  ];
  assert.equal(toggleTask(tasks, "a")[0].completed, true);
  assert.deepEqual(filterTasks(tasks, "active").map((task) => task.id), ["a"]);
  assert.deepEqual(filterTasks(tasks, "completed").map((task) => task.id), ["b", "c"]);
  assert.deepEqual(filterTasks(tasks, "high").map((task) => task.id), ["a", "c"]);
  assert.equal(filterTasks(tasks, "all").length, 3);
});

test("notes can be created, updated, and deleted with whitespace validation", () => {
  let notes = createNote([], { id: "n1", content: "  Remember this  " });
  assert.deepEqual([notes[0].title, notes[0].content], ["Untitled note", "Remember this"]);
  assert.throws(() => createNote(notes, { id: "n1", content: "Duplicate" }), /already exists/);
  assert.throws(() => createNote(notes, { id: "n2", content: "  " }), /cannot be empty/);
  notes = updateNote(notes, "n1", { title: "  Ideas  ", content: "Updated" });
  assert.deepEqual([notes[0].title, notes[0].content], ["Ideas", "Updated"]);
  assert.deepEqual(deleteNote(notes, "n1"), []);
});