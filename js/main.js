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
						<input data-id="${task.id}" type="checkbox">
						<label>${task.text}</label>
					</div>
					<div>
						<i data-id="${
                            task.id
                        }" id="to-do-update-btn" class="fa fa-pencil-square-o edit" aria-hidden="true"></i>
						<i data-id="${
                            task.id
                        }" id="to-do-delete-btn" class="fa fa-trash remove" aria-hidden="true"></i>
					</div>
				</li>
			`;

        tasksList.insertAdjacentHTML("beforeend", element);
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
    showTasksList();
}

addTaskForm.addEventListener("submit", addTask);
showTasksList();
