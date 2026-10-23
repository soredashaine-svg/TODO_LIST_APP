// =========================================================
// To-Do List App
// Each task is an object: { id, text, priority, due, done }
// All tasks are kept in the "tasks" array and saved in localStorage.
// =========================================================

const STORAGE_KEY = "todo-app-tasks";

// ---------- 1. Get the elements we need ----------
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const dueInput = document.getElementById("dueInput");
const formError = document.getElementById("formError");
const searchInput = document.getElementById("searchInput");
const filterButtons = document.querySelectorAll(".filter");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");
const counter = document.getElementById("counter");
const clearDoneButton = document.getElementById("clearDone");

// ---------- 2. App state ----------
let tasks = loadTasks();
let currentFilter = "all";   // "all", "active", or "done"
let editingId = null;        // id of the task being edited, if any

// ---------- 3. Saving and loading ----------
function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];               // if storage is blocked, start with an empty list
  }
}

function saveTasks() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch (e) { /* ignore */ }
}

// ---------- 4. Helper functions ----------
function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

function formatDate(dateString) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Returns only the tasks that match the current filter and search text
function getVisibleTasks() {
  const search = searchInput.value.trim().toLowerCase();
  return tasks.filter(function (task) {
    if (currentFilter === "active" && task.done) return false;
    if (currentFilter === "done" && !task.done) return false;
    return task.text.toLowerCase().includes(search);
  });
}

// ---------- 5. Drawing the list ----------
function render() {
  taskList.innerHTML = "";
  const visible = getVisibleTasks();

  visible.forEach(function (task) {
    const li = document.createElement("li");
    li.className = "task priority-" + task.priority + (task.done ? " done" : "");

    // Checkbox to mark the task as done
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", "Mark as done");
    checkbox.addEventListener("change", function () { toggleTask(task.id); });

    // Task text and details
    const body = document.createElement("div");
    body.className = "task-body";

    if (editingId === task.id) {
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "edit-input";
      editInput.value = task.text;
      editInput.maxLength = 120;
      editInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") saveEdit(task.id, editInput.value);
        if (e.key === "Escape") { editingId = null; render(); }
      });
      body.appendChild(editInput);
      setTimeout(function () { editInput.focus(); }, 0);
    } else {
      const text = document.createElement("div");
      text.className = "task-text";
      text.textContent = task.text;   // textContent keeps user text safe (no HTML)
      body.appendChild(text);
    }

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1) + " priority";
    if (task.due) {
      const due = document.createElement("span");
      due.textContent = " · Due " + formatDate(task.due);
      if (!task.done && task.due < todayString()) {
        due.className = "overdue";
        due.textContent += " (overdue)";
      }
      meta.appendChild(due);
    }
    body.appendChild(meta);

    // Edit and delete buttons
    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.textContent = editingId === task.id ? "Save" : "Edit";
    editButton.addEventListener("click", function () {
      if (editingId === task.id) {
        saveEdit(task.id, body.querySelector(".edit-input").value);
      } else {
        editingId = task.id;
        render();
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.className = "delete";
    deleteButton.addEventListener("click", function () { deleteTask(task.id); });

    actions.append(editButton, deleteButton);
    li.append(checkbox, body, actions);
    taskList.appendChild(li);
  });

  // Empty message
  if (tasks.length === 0) {
    emptyMessage.textContent = "No tasks yet. Add one above!";
    emptyMessage.hidden = false;
  } else if (visible.length === 0) {
    emptyMessage.textContent = "No tasks match your search or filter.";
    emptyMessage.hidden = false;
  } else {
    emptyMessage.hidden = true;
  }

  // Counter of tasks that are not done yet
  const left = tasks.filter(function (t) { return !t.done; }).length;
  counter.textContent = left + (left === 1 ? " task left" : " tasks left");
  clearDoneButton.hidden = !tasks.some(function (t) { return t.done; });
}

// ---------- 6. Actions ----------
function addTask(text, priority, due) {
  tasks.unshift({
    id: Date.now().toString(),
    text: text,
    priority: priority,
    due: due,
    done: false
  });
  saveTasks();
  render();
}

function toggleTask(id) {
  const task = tasks.find(function (t) { return t.id === id; });
  task.done = !task.done;
  saveTasks();
  render();
}

function saveEdit(id, newText) {
  const text = newText.trim();
  if (text === "") return;          // do not allow an empty task
  const task = tasks.find(function (t) { return t.id === id; });
  task.text = text;
  editingId = null;
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter(function (t) { return t.id !== id; });
  saveTasks();
  render();
}

// ---------- 7. Events ----------
taskForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const text = taskInput.value.trim();

  if (text === "") {
    formError.textContent = "Please type a task first.";
    taskInput.focus();
    return;
  }
  formError.textContent = "";

  addTask(text, priorityInput.value, dueInput.value);
  taskInput.value = "";
  dueInput.value = "";
  priorityInput.value = "medium";
  taskInput.focus();
});

searchInput.addEventListener("input", render);

filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    filterButtons.forEach(function (b) { b.classList.remove("active"); });
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    render();
  });
});

clearDoneButton.addEventListener("click", function () {
  tasks = tasks.filter(function (t) { return !t.done; });
  saveTasks();
  render();
});

// ---------- 8. Start ----------
render();