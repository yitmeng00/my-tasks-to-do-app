// Selectors
const tasksList = document.querySelector("#to-do-list");
const addTaskForm = document.querySelector("form#add-to-do-form");
const addTaskInput = document.querySelector("#add-to-do-input");

// List Of To-Dos
const toDoList = JSON.parse(localStorage.getItem("tasks")) || [];

// Display All To-Do
function showTasksList() {
    tasksList.innerHTML = "";
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    if (tasks.length === 0) {
        tasksList.style.border = "none";
        tasksList.innerHTML = `
            <div class="no-task-content">
                <div>
                <img src="assets/images/no-task-vector.png" alt="No Task">
                </div>
                <div>
                <p>You have no tasks today!</p>
                </div>
            </div>
            `;
        return;
    }

    tasksList.style.border = "1px solid rgba(34,36,38,.15)";
    tasks.reverse().forEach((task) => {
        const taskElement = document.createElement("li");
        taskElement.innerHTML = `
            <div class="task-desc">
                <input data-id="${task.id}" type="checkbox" ${task.completed ? 'checked' : ''}>
                <label>${task.text}</label>
            </div>
            <div>
                <i data-id="${task.id}" class="fa fa-pencil-square-o update" aria-hidden="true"></i>
                <i data-id="${task.id}" class="fa fa-trash remove" aria-hidden="true"></i>
            </div>
        `;
        tasksList.appendChild(taskElement);
    });

    document.querySelectorAll(`li i.update`).forEach((item) => {
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            showUpdateModal(+e.target.dataset.id);
        });
    });

    document.querySelectorAll(`li i.remove`).forEach((item) => {
        item.addEventListener("click", (e) => {
            e.stopPropagation();
            showRemoveModal(+e.target.dataset.id);
        });
    });

    document
        .querySelectorAll(`li input[type="checkbox"]`)
        .forEach((checkbox) => {
            checkbox.addEventListener("click", (e) => {
                e.stopPropagation();
                completeTask(+e.target.dataset.id);
            });
        });
}

// Add new To-Do
function addTask(event) {
    event.preventDefault();

    const taskText = addTaskInput.value;
    if (taskText.trim().length === 0) {
        return (addTaskInput.value = "");
    }

    toDoList.push({
        id: toDoList.length + 1,
        text: taskText,
        completed: false,
    });
    localStorage.setItem("tasks", JSON.stringify(toDoList));
    addTaskInput.value = "";

    showNotification("success", "Task was successfully added");
    showTasksList();
}

// Update To-Do Description
function updateTask(id) {
    const taskText = document.querySelector("#modal-to-do-desc").value;

    if (taskText.trim().length === 0) return;
    const taskIndex = toDoList.findIndex((t) => t.id == id);

    toDoList[taskIndex].text = taskText;
    localStorage.setItem("tasks", JSON.stringify(toDoList));

    const modal = document.getElementById("dynamic-modal");
    modal.style.display = "none";
    showNotification("success", "Updated Successfully.");
    showTasksList();
}

// Delete To-Do
function removeTask(id) {
    toDoList = toDoList.filter((t) => t.id !== id);
    localStorage.setItem("tasks", JSON.stringify(toDoList));
    const modal = document.getElementById("dynamic-modal");
    modal.style.display = "none";
    showNotification("success", "Deleted Successfully.");
    showTasksList();
}

// Change To-Do State to Completed
function completeTask(id) {
    const taskIndex = toDoList.findIndex((t) => t.id == id);
    const task = toDoList[taskIndex];

    task.completed = !task.completed;
    toDoList[taskIndex] = task;

    localStorage.setItem("tasks", JSON.stringify(toDoList));
    showTasksList();
}

function showModal(headerTitle, actionBtnText, actionFn) {
    document.querySelector("#modal-action-btn").addEventListener("click", actionFn);

    const modal = document.getElementById("dynamic-modal");
    var span = document.getElementsByClassName("close-modal-btn")[0];
    document.getElementById("modal-header-title").innerHTML = headerTitle;
    document.getElementById("modal-action-btn").innerHTML = actionBtnText;
    modal.style.display = "block";
    span.onclick = function () {
        modal.style.display = "none";
    };

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

function showUpdateModal(id) {
    const taskIndex = toDoList.findIndex((t) => t.id == id);
    const { text } = toDoList[taskIndex];

    document.querySelector("#dynamic-modal .modal-body #modal-to-do-id").value = id;
    document.querySelector("#dynamic-modal .modal-body #modal-to-do-desc").value = text.trim();

    showModal("Update To-Do Description", "Confirm", () => updateTask(+id));
}

function showRemoveModal(id) {
    showModal("Delete To-Do", "Confirm", () => removeTask(+id));
}

function showNotification(type, text) {
    const notyf = new Notyf();
    if (type == "success") {
        notyf.success(text);
    }
}

addTaskForm.addEventListener("submit", addTask);
showTasksList();
