const API_URL = "http://localhost:3000/";

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const openModal = $(".add-btn");
const taskModal = $("#addTaskModal");
const closeModal = $(".modal-close");
const cancelModal = $(".modal-cancel");
const taskGrid = $(".task-grid");
const todoForm = $(".todo-app-form");
const createBtn = $(".create-task");
const title = $("#taskTitle");
const description = $("#taskDescription");
const category = $("#taskCategory");
const priority = $("#taskPriority");
const startTime = $("#startTime");
const endTime = $("#endTime");
const dueDate = $("#taskDate");
const cardColor = $("#taskColor");
const tabButton = $$(".tab-button");
const search = $(".search-input");

let currentEditId = null;
let allTasks = [];
let currentFilter = "all";
let searchText = "";
let searchTimeout = null;

function exitModal() {
  taskModal.classList.remove("show");
}

//filter tabs
function filterTasks() {
  let filteredTask = [];

  if (currentFilter === "all") {
    filteredTask = allTasks;
  } else if (currentFilter === "active") {
    filteredTask = allTasks.filter((task) => !task.completed);
  } else if (currentFilter === "completed") {
    filteredTask = allTasks.filter((task) => task.completed);
  }

  if (searchText !== "") {
    filteredTask = filteredTask.filter((task) => {
      return task.title.toLowerCase().includes(searchText);
    });
  }

  renderTasks(filteredTask);
}

//search
if (search) {
  search.addEventListener("input", (e) => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      searchText = e.target.value.trim().toLowerCase();
      filterTasks();
    }, 300);
  });
}

//tabs
tabButton.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    $(".tab-button.active").classList.remove("active");
    btn.classList.add("active");

    const tabText = btn.textContent.trim().toLowerCase();

    if (tabText === "all") {
      currentFilter = "all";
    } else if (tabText === "active task") {
      currentFilter = "active";
    } else if (tabText === "completed") {
      currentFilter = "completed";
    }

    filterTasks();
  });
});

openModal.addEventListener("click", () => {
  currentEditId = null;
  createBtn.textContent = "Create Task";
  taskModal.classList.add("show");
  setTimeout(() => {
    title.focus();
  }, 300);
});

closeModal.addEventListener("click", exitModal);
cancelModal.addEventListener("click", () => {
  exitModal();
  if (todoForm) todoForm.reset();
});

//create task
createBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  if (todoForm && !todoForm.reportValidity()) return;

  const newTask = {
    title: title.value,
    description: description.value,
    category: category.value,
    priority: priority.value,
    startTime: startTime.value,
    endTime: endTime.value,
    dueDate: dueDate.value,
    cardColor: cardColor.value,
    completed: false,
  };

  try {
    if (!currentEditId) {
      newTask.completed = false;
      await fetch(`${API_URL}tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
    } else {
      await fetch(`${API_URL}tasks/${currentEditId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
    }

    await fetchTasks();
    todoForm.reset();
    exitModal();
  } catch (error) {
    console.error("Error create task:", error);
  }
});

//get API task to UI
async function fetchTasks() {
  try {
    const response = await fetch(`${API_URL}tasks?_sort=id&_order=desc`);
    allTasks = await response.json();
    filterTasks();
  } catch (error) {
    console.error("Error fetch tasks:", error);
  }
}

//render task
function renderTasks(tasks) {
  taskGrid.innerHTML = "";

  if (tasks.length === 0) {
    const noTasks = document.createElement("div");
    noTasks.className = "no-tasks";
    noTasks.innerText = "No task found";
    taskGrid.appendChild(noTasks);
    return;
  }

  tasks.forEach((task) => {
    const taskCard = document.createElement("div");
    taskCard.className = `task-card ${task.cardColor || ""}`;

    if (task.completed) {
      taskCard.classList.add("completed");
    }

    const taskHeader = document.createElement("div");
    taskHeader.className = "task-header";

    const taskTitle = document.createElement("h3");
    taskTitle.className = "task-title";
    taskTitle.textContent = task.title;

    const taskMenu = document.createElement("button");
    taskMenu.className = "task-menu";
    taskMenu.type = "button";

    const menuIcon = document.createElement("i");
    menuIcon.className = "fa-solid fa-ellipsis fa-icon";

    const dropdownMenu = document.createElement("div");
    dropdownMenu.className = "dropdown-menu";

    const editItem = document.createElement("div");
    editItem.className = `${task.completed ? "dropdown-item edit-task disabled" : "dropdown-item edit-task"}`;
    editItem.innerHTML = `<i class="fa-solid fa-pen-to-square fa-icon"></i> Edit`;
    editItem.dataset.id = task.id;

    const completeItem = document.createElement("div");
    completeItem.className = "dropdown-item complete-task";
    completeItem.innerHTML = `
      <i class="fa-solid fa-check fa-icon"></i>
      ${task.completed ? "Mark as Active" : "Mark as Complete"}
    `;
    completeItem.dataset.id = task.id;
    completeItem.dataset.completed = task.completed;

    const deleteItem = document.createElement("div");
    deleteItem.className = "dropdown-item delete-task";
    deleteItem.innerHTML = `<i class="fa-solid fa-trash fa-icon"></i> Delete`;
    deleteItem.dataset.id = task.id;

    const taskDescription = document.createElement("p");
    taskDescription.className = "task-description";
    taskDescription.textContent = task.description;

    const taskFooter = document.createElement("div");
    taskFooter.className = "task-footer";

    const taskTime = document.createElement("div");
    taskTime.className = "task-time";
    taskTime.textContent = `${convertTo12Hour(task.startTime)} - ${convertTo12Hour(task.endTime)}`;

    const taskDate = document.createElement("div");
    taskDate.className = "task-date";
    taskDate.textContent = task.dueDate;

    taskFooter.append(taskTime, taskDate);
    dropdownMenu.append(editItem, completeItem, deleteItem);
    taskMenu.append(menuIcon, dropdownMenu);
    taskHeader.append(taskTitle, taskMenu);
    taskCard.append(taskHeader, taskDescription, taskFooter);

    taskGrid.append(taskCard);
  });
}

//function delete, edit, completed
taskGrid.addEventListener("click", async (e) => {
  const taskCard = e.target.closest(".task-card");
  const deleteBtn = e.target.closest(".delete-task");
  const completeBtn = e.target.closest(".complete-task");
  const editBtn = e.target.closest(".edit-task");

  if (deleteBtn) {
    e.preventDefault();
    const id = deleteBtn.dataset.id;

    try {
      await fetch(`${API_URL}tasks/${id}`, {
        method: "DELETE",
      });

      allTasks = allTasks.filter((task) => task.id != id);
      if (taskCard) taskCard.remove();
    } catch (error) {
      console.error("Error remove task:", error);
    }
  }

  if (completeBtn) {
    e.preventDefault();
    const id = completeBtn.dataset.id;
    const currentStatus = completeBtn.dataset.completed === "true";
    const newStatus = !currentStatus;

    try {
      const response = await fetch(`${API_URL}tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newStatus }),
      });

      if (response.ok) {
        const taskIndex = allTasks.findIndex((task) => task.id == id);
        if (taskIndex !== -1) {
          allTasks[taskIndex].completed = newStatus;
        }

        filterTasks();
      } else {
        throw new Error(`Connection error: ${response.status}`);
      }
    } catch (error) {
      console.log("Error complete:", error);
    }
  }

  if (editBtn) {
    e.preventDefault();
    const id = editBtn.dataset.id;
    currentEditId = id;

    try {
      const response = await fetch(`${API_URL}tasks/${id}`);
      const task = await response.json();

      title.value = task.title;
      description.value = task.description || "";
      category.value = task.category || "";
      priority.value = task.priority || "low";
      startTime.value = task.startTime || "";
      endTime.value = task.endTime || "";
      dueDate.value = task.dueDate || "";
      cardColor.value = task.cardColor || "";

      createBtn.textContent = "Save Changes";

      taskModal.classList.add("show");
      closeModal.addEventListener("click", () => {
        exitModal;
        if (todoForm) todoForm.reset();
      });
    } catch (error) {
      console.error("Error get info", error);
    }
  }
});

//trans hours, minutes
function convertTo12Hour(time) {
  if (time === "" || time === null) return "";
  let [hours, minutes] = time.split(":");
  hours = Number(hours);

  let meridiem = hours >= 12 ? "PM" : "AM";

  let h = hours % 12;
  if (h === 0) h = 12;
  let formattedHour = String(h).padStart(2, "0");
  let formattedMinute = String(minutes).padStart(2, "0");

  return `${formattedHour}:${formattedMinute} ${meridiem}`;
}

fetchTasks();
