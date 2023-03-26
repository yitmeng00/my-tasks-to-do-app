const tasksList = document.querySelector("#to-do-list");
const addTaskForm = document.querySelector("form#add-to-do-form");
const addTaskInput = document.querySelector("#add-to-do-input");

// List Of To-Dos
let list = JSON.parse(localStorage.getItem("tasks")) || [];

// Display All To-Do
function showTasksList() {
    tasksList.innerHTML = "";
    const list = JSON.parse(localStorage.getItem("tasks")) || [];

    if (list.length === 0) {
        const element = String.raw`
			<div class="no-task-content">
                <div>
                    <img src="assets/images/no-task-vector.png" alt="No Task">
                </div>
				<div>
					<p>You have no tasks today!</p>
				</div>
			</div>
		`;

        tasksList.style.border = "none";
        return tasksList.insertAdjacentHTML("beforeend", element);
    }

    tasksList.style.border = "1px solid rgba(34,36,38,.15)";
    list.reverse().forEach((task) => {
        const element = String.raw`
				<li>
					<div class="task-desc">
						<input data-id="${task.id}" type="checkbox" ${task.completed ? "checked" : ""}>
						<label>${task.text}</label>
					</div>
					<div>
						<i data-id="${
                            task.id
                        }" id="to-do-update-btn" class="fa fa-pencil-square-o update" aria-hidden="true"></i>
						<i data-id="${
                            task.id
                        }" id="to-do-delete-btn" class="fa fa-trash remove" aria-hidden="true"></i>
					</div>
				</li>
			`;

        tasksList.insertAdjacentHTML("beforeend", element);
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

    list.push({
        id: list.length + 1,
        text: taskText,
        completed: false,
    });
    localStorage.setItem("tasks", JSON.stringify(list));
    addTaskInput.value = "";

    showNotification("success", "Task was successfully added");
    showTasksList();
}

function updateTask(id) {
    const taskText = document.querySelector("#modal-to-do-desc").value;

    if (taskText.trim().length === 0) return;
    const taskIndex = list.findIndex((t) => t.id == id);

    list[taskIndex].text = taskText;
    localStorage.setItem("tasks", JSON.stringify(list));

    const modal = document.getElementById("dynamic-modal");
    modal.style.display = "none";
    showNotification("success", "Updated Successfully.");
    showTasksList();
}

function showUpdateModal(id) {
    const taskIndex = list.findIndex((t) => t.id == id);
    const { text } = list[taskIndex];

    document.querySelector("#dynamic-modal .modal-body #modal-to-do-id").value =
        id;
    document.querySelector(
        "#dynamic-modal .modal-body #modal-to-do-desc"
    ).value = text.trim();
    document
        .querySelector("#modal-action-btn")
        .addEventListener("click", () => updateTask(+id));

    const modal = document.getElementById("dynamic-modal");
    var span = document.getElementsByClassName("close-modal-btn")[0];
    document.getElementById("modal-header-title").innerHTML =
        "Update To-Do Description";
    document.getElementById("modal-action-btn").innerHTML = "Confirm";
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

function removeTask(id) {
    list = list.filter((t) => t.id !== id);
    localStorage.setItem("tasks", JSON.stringify(list));
    const modal = document.getElementById("dynamic-modal");
    modal.style.display = "none";
    showNotification("success", "Deleted Successfully.");
    showTasksList();
}

function showRemoveModal(id) {
    document
        .querySelector("#modal-action-btn")
        .addEventListener("click", () => removeTask(+id));

    const modal = document.getElementById("dynamic-modal");
    var span = document.getElementsByClassName("close-modal-btn")[0];
    document.getElementById("modal-header-title").innerHTML = "Delete To-Do";
    document.getElementById("modal-action-btn").innerHTML = "Confirm";
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

// Change To-Do State to Completed
function completeTask(id) {
    const taskIndex = list.findIndex((t) => t.id == id);
    const task = list[taskIndex];

    task.completed = !task.completed;
    list[taskIndex] = task;

    localStorage.setItem("tasks", JSON.stringify(list));
    showTasksList();
}

function showNotification(type, text) {
    var notyf = new Notyf();
    if (type == "success") {
        notyf.success(text);
    }
}

addTaskForm.addEventListener("submit", addTask);
showTasksList();
