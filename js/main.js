// Selectors
const tasksList = document.querySelector("#to-do-list");
const addTaskForm = document.querySelector("form#add-to-do-form");
const addTaskInput = document.querySelector("#add-to-do-input");

// List Of To-Dos
let toDoList = JSON.parse(localStorage.getItem("todos")) || [];
let modalTaskId;

// Display All To-Do
function renderToDosList() {
    tasksList.innerHTML = "";

    if (toDoList.length === 0) {
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
    toDoList.forEach((task) => {
        const taskElement = createToDoElement(task);
        tasksList.appendChild(taskElement);
    });

    [...document.getElementsByClassName("update-button")].forEach((updateButton) => {
        updateButton.addEventListener("click", function () {
            const taskId = this.getAttribute("data-id");
            const taskIndex = toDoList.findIndex((t) => t.id == taskId);
            const { text } = toDoList[taskIndex];

            modalTaskId = taskId; // store the id of the task being edited
            
            renderModal();
            const modalBody = document.querySelector("#dynamic-modal .modal-body");
            modalBody.innerHTML = `
            <input id="modal-to-do-id" type="hidden" value="${taskId}">
            <input id="modal-to-do-desc" type="text" value="${text.trim()}">
            `;

            openModal("Update To-Do Description", "Confirm", () => updateToDo());
        });
    });

    [...document.getElementsByClassName("delete-button")].forEach((deleteButton) => {
        deleteButton.addEventListener("click", function () {
            const taskId = this.getAttribute("data-id");
            renderModal();
            openModal("Delete To-Do", "Confirm", () => deleteToDo(+taskId));
        });
    });

    [...document.getElementsByClassName("to-do-complete-checkbox")].forEach((completeCheckBox) => {
        completeCheckBox.addEventListener("click", function () {
            const taskId = this.getAttribute("data-id");
            completeToDo(taskId);
        });
    });
}

function createToDoElement(task) {
    const taskElement = document.createElement("li");
    taskElement.innerHTML = `
      <div class="task-desc">
        <input data-id="${task.id}" class="to-do-complete-checkbox" type="checkbox" ${task.completed ? 'checked' : ''}>
        <label>${task.text}</label>
      </div>
      <div>
        <button data-id="${task.id}" class="update-button"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></button>
        <button data-id="${task.id}" class="delete-button"><i class="fa fa-trash" aria-hidden="true"></i></button>
      </div>
    `;
    return taskElement;
}

// Add new To-Do
function addToDo(event) {
    event.preventDefault();

    const taskText = addTaskInput.value.trim();
    if (taskText.length === 0) {
        return;
    }

    const newTask = {
        id: toDoList.length > 0 ? toDoList[0].id + 1 : 1,
        text: taskText,
        completed: false,
    };
    toDoList.unshift(newTask);
    localStorage.setItem("todos", JSON.stringify(toDoList));
    addTaskInput.value = "";

    showNotification("success", "Task was successfully added");
    renderToDosList();
}

// Update To-Do Description
function updateToDo() {
    const taskText = document.querySelector("#modal-to-do-desc").value;

    if (taskText.trim().length === 0) return;
    const taskIndex = toDoList.findIndex((t) => t.id == modalTaskId);

    toDoList[taskIndex].text = taskText;
    localStorage.setItem("todos", JSON.stringify(toDoList));

    const modal = document.getElementById("dynamic-modal");
    modal.style.display = "none";
    showNotification("success", "Updated Successfully.");
    renderToDosList();
    const dynamicModal = document.querySelector("#dynamic-modal");
    dynamicModal.remove();
}

// Delete To-Do
function deleteToDo(id) {
    toDoList = toDoList.filter((t) => t.id !== id);
    localStorage.setItem("todos", JSON.stringify(toDoList));
    const modal = document.getElementById("dynamic-modal");
    modal.style.display = "none";
    showNotification("success", "Deleted Successfully.");
    renderToDosList();
    const dynamicModal = document.querySelector("#dynamic-modal");
    dynamicModal.remove();
}

// Change To-Do State to Completed
function completeToDo(id) {
    const taskIndex = toDoList.findIndex((t) => t.id == id);
    const task = toDoList[taskIndex];

    task.completed = !task.completed;
    toDoList[taskIndex] = task;

    localStorage.setItem("todos", JSON.stringify(toDoList));
    renderToDosList();
}

function openModal(headerTitle, actionBtnText, actionFn) {
    document.querySelector("#modal-action-btn").addEventListener("click", actionFn);

    const modal = document.getElementById("dynamic-modal");
    var span = document.getElementsByClassName("close-modal-btn")[0];
    document.getElementById("modal-header-title").innerHTML = headerTitle;
    document.getElementById("modal-action-btn").innerHTML = actionBtnText;
    modal.style.display = "block";
    span.onclick = function () {
        modal.style.display = "none";
        const dynamicModal = document.querySelector("#dynamic-modal");
        dynamicModal.remove();
    };

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
            const dynamicModal = document.querySelector("#dynamic-modal");
            dynamicModal.remove();
        }
    };
}

function showNotification(type, text) {
    const notyf = new Notyf();
    if (type == "success") {
        notyf.success(text);
    }
}

function renderModal() {
    const modalContainer = document.createElement("DIV");
    modalContainer.setAttribute('id', "dynamic-modal");
    modalContainer.setAttribute('class', "modal");
    const modalContent = document.createElement("DIV");
    modalContent.setAttribute('class', "modal-content");
    const modalHeader = document.createElement("DIV");
    modalHeader.setAttribute('class', "modal-header");
    const modalHeaderTitle = document.createElement("DIV");
    modalHeaderTitle.setAttribute('id', "modal-header-title");
    const divBtn = document.createElement("DIV");
    const closeModalBtn = document.createElement("SPAN");
    closeModalBtn.setAttribute('class', "close-modal-btn");
    closeModalBtn.innerHTML="&times;";
    const modalBody = document.createElement("DIV");
    modalBody.setAttribute('class', "modal-body");
    const modalFooter = document.createElement("DIV");
    modalFooter.setAttribute('class', "modal-footer");
    const modalActionBtn = document.createElement("DIV");
    modalActionBtn.setAttribute('id', "modal-action-btn");
    modalActionBtn.setAttribute('class', "button");
    modalContainer.appendChild(modalContent);
    modalContent.appendChild(modalHeader);
    modalHeader.appendChild(modalHeaderTitle);
    modalHeader.appendChild(divBtn);
    divBtn.appendChild(closeModalBtn);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalFooter.appendChild(modalActionBtn);
    document.body.appendChild(modalContainer);
}

addTaskForm.addEventListener("submit", addToDo);
renderToDosList();
