// Selectors
const toDoListContainer = document.querySelector("#todo__list");
const addToDoFormElement = document.querySelector("form#todo__new-input-form");
const newToDoInput = document.querySelector("#todo__new-inputbox");

// List of todos
let toDoList = JSON.parse(localStorage.getItem("todos")) || [];

// Display todo list
function renderToDosList() {
    toDoListContainer.innerHTML = "";

    // if no todo
    if (toDoList.length === 0) {
        toDoListContainer.style.border = "none";
        toDoListContainer.innerHTML = `
            <div class="todo__empty-list" style="text-align: center; margin-top: 2em;">
                <div>
                    <img src="assets/images/offday.png" alt="Off Day" style="height: 20em; width: 20em;">
                </div>
                <div>
                    <p>You have no todos today!</p>
                </div>
            </div>
            `;
        return;
    }

    // else render all todo
    toDoListContainer.style.margin = "3em auto 0em";
    toDoListContainer.style.width = "50%";
    toDoListContainer.style.listStyle = "none";
    toDoList.forEach((todo) => {
        const toDoElement = createToDoElement(todo);
        toDoListContainer.appendChild(toDoElement);
    });

    // add click event to update button
    [...document.getElementsByClassName("todo__edit-button")].forEach((updateButton) => {
        updateButton.addEventListener("click", function () {
            const toDoId = this.getAttribute("data-id");
            const toDoIndex = toDoList.findIndex((t) => t.id == toDoId);
            const { desc } = toDoList[toDoIndex];
            
            renderModal();
            const modalBody = document.querySelector("#todo__dynamic-modal .modal-body");
            modalBody.innerHTML = `
            <input id="modal__todo-id" type="hidden" value="${toDoId}">
            <input id="modal__todo-desc" type="text" value="${desc.trim()}">
            `;
            openModal("Update To-Do Description", "Confirm", () => updateToDo(+toDoId));
        });
    });

    // add click event to delete button
    [...document.getElementsByClassName("todo__delete-button")].forEach((deleteButton) => {
        deleteButton.addEventListener("click", function () {
            const toDoId = this.getAttribute("data-id");
            renderModal();
            const modalBody = document.querySelector("#todo__dynamic-modal .modal-body");
            modalBody.innerHTML = `
            <p>Are you sure you want to delete this todo?</p>
            `;
            openModal("Delete To-Do", "Confirm", () => deleteToDo(+toDoId));
        });
    });

    // add click event to complete checkbox
    [...document.getElementsByClassName("todo__complete-checkbox")].forEach((completeCheckBox) => {
        completeCheckBox.addEventListener("click", function () {
            const toDoId = this.getAttribute("data-id");
            completeToDo(toDoId);
        });
    });
}

// Create each todo element
function createToDoElement(todo) {
    const toDoElement = document.createElement("li");
    toDoElement.innerHTML = `
        <div class="todo__desc-container" style="align-self: center; display: flex; gap: 0.5em;">
            <div class="todo__checkbox-container" style="align-self: center;">
                <input data-id="${todo.id}" id="todo__completed-checkbox-${todo.id}" class="todo__complete-checkbox" type="checkbox" ${todo.completed ? 'checked' : ''}>
            </div>
            <div>
                <label for="todo__completed-checkbox-${todo.id}" style="cursor: pointer;">${todo.completed ? `<del class="todo__completed-strike-animation">${todo.desc}</del>` : `${todo.desc}`}</label>
            </div>
        </div>
        <div>
            <button data-id="${todo.id}" class="todo__edit-button"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></button>
            <button data-id="${todo.id}" class="todo__delete-button"><i class="fa fa-trash" aria-hidden="true"></i></button>
        </div>
    `;
    return toDoElement;
}

// Add new todo
function addToDo(event) {
    event.preventDefault();

    // check if it is empty on the new todo input
    const toDoDesc = newToDoInput.value.trim();
    if (toDoDesc.length === 0) {
        return;
    }

    // new todo object
    const newToDo = {
        id: toDoList.length > 0 ? toDoList[0].id + 1 : 1,
        desc: toDoDesc,
        completed: false,
    };
    // insert at the begining of the array
    toDoList.unshift(newToDo);
    localStorage.setItem("todos", JSON.stringify(toDoList));
    newToDoInput.value = "";

    showNotification("success", "New todo was added successfully!");
    renderToDosList();
}

// Update todo description
function updateToDo(id) {
    const toDoDesc = document.querySelector("#modal__todo-desc").value;

    if (toDoDesc.trim().length === 0) return;
    const toDoIndex = toDoList.findIndex((t) => t.id == id);

    toDoList[toDoIndex].desc = toDoDesc;
    localStorage.setItem("todos", JSON.stringify(toDoList));

    const modal = document.getElementById("todo__dynamic-modal");
    modal.style.display = "none";
    modal.remove();

    showNotification("success", "Todo was updated successfully!");
    renderToDosList();
}

// Delete todo
function deleteToDo(id) {
    toDoList = toDoList.filter((t) => t.id !== id);
    localStorage.setItem("todos", JSON.stringify(toDoList));

    const modal = document.getElementById("todo__dynamic-modal");
    modal.style.display = "none";
    modal.remove();

    showNotification("success", "Todo was deleted successfully.");
    renderToDosList();
}

// Mark todo as completed
function completeToDo(id) {
    const toDoIndex = toDoList.findIndex((t) => t.id == id);
    const toDo = toDoList[toDoIndex];

    toDo.completed = !toDo.completed;
    toDoList[toDoIndex] = toDo;
    localStorage.setItem("todos", JSON.stringify(toDoList));

    renderToDosList();
}

// trigger modal to display
function openModal(headerTitle, actionBtnText, actionFn) {
    document.querySelector("#modal-action-btn").addEventListener("click", actionFn);

    const modal = document.getElementById("todo__dynamic-modal");
    var span = document.getElementsByClassName("close-modal-btn")[0];
    document.getElementById("modal-header-title").innerHTML = headerTitle;
    document.getElementById("modal-action-btn").innerHTML = actionBtnText;

    modal.style.display = "block";
    span.onclick = function () {
        modal.style.display = "none";
        modal.remove();
    };

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
            modal.remove();
        }
    };
}

// render modal
function renderModal() {
    const modalContainer = document.createElement("DIV");
    modalContainer.setAttribute('id', "todo__dynamic-modal");
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

// notification object
function showNotification(type, text) {
    const notyf = new Notyf();
    if (type == "success") {
        notyf.success(text);
    }
}

addToDoFormElement.addEventListener("submit", addToDo);
renderToDosList();
