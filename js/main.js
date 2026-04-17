"use strict";

const STORAGE_KEY = "mytasks_todos_v2";

const PRIORITY_CONFIG = {
    high: { label: "High", icon: "fa-flag", order: 1 },
    medium: { label: "Medium", icon: "fa-flag", order: 2 },
    low: { label: "Low", icon: "fa-flag", order: 3 },
};

const CATEGORY_CONFIG = {
    work: { label: "Work", icon: "fa-briefcase" },
    personal: { label: "Personal", icon: "fa-user" },
    health: { label: "Health", icon: "fa-heart" },
    finance: { label: "Finance", icon: "fa-dollar-sign" },
    other: { label: "Other", icon: "fa-ellipsis" },
};

const FILTER = Object.freeze({
    ALL: "all",
    ACTIVE: "active",
    COMPLETED: "completed",
    OVERDUE: "overdue",
});
const SORT = Object.freeze({
    NEWEST: "newest",
    OLDEST: "oldest",
    PRIORITY: "priority",
    DUEDATE: "duedate",
});

const getTodayStr = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

const getDateStatus = (dateStr, completed) => {
    if (!dateStr || completed) return null;
    const today = getTodayStr();
    if (dateStr < today) return "overdue";
    if (dateStr === today) return "today";
    return "upcoming";
};

const escapeHtml = (str) => {
    const el = document.createElement("div");
    el.appendChild(document.createTextNode(str));
    return el.innerHTML;
};

const generateId = (todos) => {
    return todos.length > 0 ? Math.max(...todos.map((todo) => todo.id)) + 1 : 1;
};

/* Storage Manager */
const StorageManager = {
    load() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    },
    save(todos) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    },
};

/* State Manager */
const State = (() => {
    let todos = StorageManager.load();
    let filter = FILTER.ALL;
    let sort = SORT.NEWEST;
    let search = "";

    const persist = () => StorageManager.save(todos);

    return {
        get todos() {
            return todos;
        },
        get filter() {
            return filter;
        },
        get sort() {
            return sort;
        },
        get search() {
            return search;
        },

        setFilter(v) {
            filter = v;
        },
        setSort(v) {
            sort = v;
        },
        setSearch(v) {
            search = v;
        },

        addTodo(todo) {
            todos.unshift(todo);
            persist();
        },
        deleteTodo(id) {
            todos = todos.filter((todo) => todo.id !== id);
            persist();
        },
        updateTodo(id, patch) {
            const idx = todos.findIndex((todo) => todo.id === id);
            if (idx !== -1) {
                todos[idx] = { ...todos[idx], ...patch };
                persist();
            }
        },
        toggleComplete(id) {
            const todo = todos.find((todo) => todo.id === id);
            if (todo) {
                todo.completed = !todo.completed;
                persist();
            }
        },
        clearCompleted() {
            todos = todos.filter((todo) => !todo.completed);
            persist();
        },
        markAllComplete() {
            const allDone = todos.every((todo) => todo.completed);
            todos.forEach((todo) => {
                todo.completed = !allDone;
            });
            persist();
        },

        getFiltered() {
            const today = getTodayStr();
            let list = [...todos];

            if (search.trim()) {
                const searchStr = search.trim().toLowerCase();
                list = list.filter((todo) =>
                    todo.desc.toLowerCase().includes(searchStr),
                );
            }

            switch (filter) {
                case FILTER.ACTIVE:
                    list = list.filter((todo) => !todo.completed);
                    break;
                case FILTER.COMPLETED:
                    list = list.filter((todo) => todo.completed);
                    break;
                case FILTER.OVERDUE:
                    list = list.filter(
                        (todo) =>
                            !todo.completed &&
                            todo.dueDate &&
                            todo.dueDate < today,
                    );
                    break;
            }

            switch (sort) {
                case SORT.OLDEST:
                    list.sort((a, b) => a.id - b.id);
                    break;
                case SORT.PRIORITY:
                    list.sort(
                        (a, b) =>
                            PRIORITY_CONFIG[a.priority].order -
                            PRIORITY_CONFIG[b.priority].order,
                    );
                    break;
                case SORT.DUEDATE:
                    list.sort((a, b) => {
                        if (!a.dueDate && !b.dueDate) return 0;
                        if (!a.dueDate) return 1;
                        if (!b.dueDate) return -1;
                        return a.dueDate.localeCompare(b.dueDate);
                    });
                    break;
                default:
                    list.sort((a, b) => b.id - a.id);
            }

            return list;
        },

        getStats() {
            const today = getTodayStr();
            const total = todos.length;
            const completed = todos.filter((todo) => todo.completed).length;
            const overdue = todos.filter(
                (todo) =>
                    !todo.completed && todo.dueDate && todo.dueDate < today,
            ).length;
            return { total, completed, overdue };
        },

        generateId() {
            return generateId(todos);
        },
        completedCount() {
            return todos.filter((todo) => todo.completed).length;
        },
    };
})();

/* Notification Service */
const NotificationService = (() => {
    const notyf = new Notyf({
        duration: 2500,
        position: { x: "right", y: "bottom" },
        types: [
            {
                type: "success",
                background: "#6B8E6B",
                icon: {
                    className: "fa-solid fa-check",
                    tagName: "i",
                    color: "white",
                },
            },
            {
                type: "error",
                background: "#C0392B",
                icon: {
                    className: "fa-solid fa-xmark",
                    tagName: "i",
                    color: "white",
                },
            },
        ],
    });

    return {
        success: (msg) => notyf.success(msg),
        error: (msg) => notyf.error(msg),
    };
})();

/* Modal Service */
const ModalService = (() => {
    const getOverlay = () => document.getElementById("modal-overlay");
    const getTitle = () =>
        document.querySelector("#modal-overlay .modal__title");
    const getBody = () => document.getElementById("modal-body");
    const getConfirmBtn = () => document.getElementById("modal-confirm-btn");
    const getCancelBtn = () => document.getElementById("modal-cancel-btn");
    const getCloseBtn = () =>
        document.querySelector("#modal-overlay .modal__close-btn");

    let _cleanup = null;

    const close = () => {
        getOverlay().classList.remove("is-open");
        if (_cleanup) {
            _cleanup();
            _cleanup = null;
        }
    };

    const open = ({
        title,
        body,
        confirmText = "Confirm",
        confirmClass = "btn--primary",
        onConfirm,
    }) => {
        getTitle().textContent = title;
        getBody().innerHTML = body;
        getConfirmBtn().textContent = confirmText;
        getConfirmBtn().className = `btn ${confirmClass}`;

        getOverlay().classList.add("is-open");

        const handleConfirm = () => {
            close();
            if (onConfirm) onConfirm();
        };
        const handleCancel = () => close();
        const handleOverlay = (e) => {
            if (e.target === getOverlay()) close();
        };

        getConfirmBtn().addEventListener("click", handleConfirm);
        getCancelBtn().addEventListener("click", handleCancel);
        getCloseBtn().addEventListener("click", handleCancel);
        getOverlay().addEventListener("click", handleOverlay);

        _cleanup = () => {
            getConfirmBtn().removeEventListener("click", handleConfirm);
            getCancelBtn().removeEventListener("click", handleCancel);
            getCloseBtn().removeEventListener("click", handleCancel);
            getOverlay().removeEventListener("click", handleOverlay);
        };
    };

    return { open, close };
})();

/* Renderer */
const Renderer = {
    renderAll() {
        this.renderStats();
        this.renderProgress();
        this.renderList();
    },

    renderStats() {
        const { total, completed, overdue } = State.getStats();
        document.getElementById("stat__total").textContent = total;
        document.getElementById("stat__completed").textContent = completed;
        document.getElementById("stat__overdue").textContent = overdue;
    },

    renderProgress() {
        const { total, completed } = State.getStats();
        const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
        document.getElementById("progress-bar").style.width = `${pct}%`;
    },

    renderList() {
        const list = document.getElementById("todo__list");
        list.innerHTML = "";

        const todos = State.getFiltered();

        if (todos.length === 0) {
            list.appendChild(this._buildEmptyState());
            return;
        }

        todos.forEach((todo) => list.appendChild(this._buildTodoItem(todo)));
        this._bindItemEvents();
    },

    _buildEmptyState() {
        const wrap = document.createElement("div");
        wrap.className = "empty-state";
        const isFiltered = State.filter !== FILTER.ALL || State.search.trim();
        wrap.innerHTML = `
            <img src="assets/images/offday.png" alt="No tasks" />
            <p class="empty-state__title">${isFiltered ? "No matching tasks" : "All clear!"}</p>
            <p class="empty-state__subtitle">${isFiltered ? "Try adjusting your filters or search." : "Add a task above to get started."}</p>
        `;
        return wrap;
    },

    _buildTodoItem(todo) {
        const dateStatus = getDateStatus(todo.dueDate, todo.completed);
        const isOverdue = dateStatus === "overdue";
        const isToday = dateStatus === "today";

        const li = document.createElement("li");
        li.className = [
            "todo-item",
            `todo-item--${todo.priority}`,
            todo.completed ? "todo-item--completed" : "",
            isOverdue ? "todo-item--overdue" : "",
        ]
            .filter(Boolean)
            .join(" ");
        li.setAttribute("data-id", todo.id);

        const priorityCfg = PRIORITY_CONFIG[todo.priority];
        const priBadge = `
            <span class="badge badge--priority-${todo.priority}">
                <i class="fa-solid ${priorityCfg.icon}"></i>${priorityCfg.label}
            </span>`;

        let catBadge = "";
        if (todo.category && CATEGORY_CONFIG[todo.category]) {
            const catCfg = CATEGORY_CONFIG[todo.category];
            catBadge = `
                <span class="badge badge--cat-${todo.category}">
                    <i class="fa-solid ${catCfg.icon}"></i>${catCfg.label}
                </span>`;
        }

        let dueDateHtml = "";
        if (todo.dueDate) {
            const label = formatDisplayDate(todo.dueDate);
            const cssClass = isOverdue
                ? "todo-item__due-date--overdue"
                : isToday
                  ? "todo-item__due-date--today"
                  : "";
            const iconClass = isOverdue
                ? "fa-circle-exclamation"
                : "fa-calendar-day";
            const prefix = isOverdue ? "Overdue · " : isToday ? "Today · " : "";
            dueDateHtml = `
                <span class="todo-item__due-date ${cssClass}">
                    <i class="fa-regular ${iconClass}"></i>${prefix}${label}
                </span>`;
        }

        li.innerHTML = `
            <div class="todo-item__checkbox-wrap">
                <input
                    type="checkbox"
                    class="todo-item__checkbox"
                    id="todo-chk-${todo.id}"
                    data-id="${todo.id}"
                    ${todo.completed ? "checked" : ""}
                    aria-label="Mark as complete"
                />
            </div>
            <div class="todo-item__content">
                <label class="todo-item__desc" for="todo-chk-${todo.id}">${escapeHtml(todo.desc)}</label>
                <div class="todo-item__meta">
                    ${priBadge}
                    ${catBadge}
                    ${dueDateHtml}
                </div>
            </div>
            <div class="todo-item__actions">
                <button class="action-btn action-btn--edit"   data-id="${todo.id}" title="Edit task"   aria-label="Edit task">
                    <i class="fa-regular fa-pen-to-square"></i>
                </button>
                <button class="action-btn action-btn--delete" data-id="${todo.id}" title="Delete task" aria-label="Delete task">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </div>
        `;
        return li;
    },

    _bindItemEvents() {
        document.querySelectorAll(".todo-item__checkbox").forEach((el) => {
            el.addEventListener("change", () => {
                State.toggleComplete(+el.dataset.id);
                Renderer.renderAll();
            });
        });

        document.querySelectorAll(".action-btn--edit").forEach((el) => {
            el.addEventListener("click", () =>
                EventHandlers.onEditClick(+el.dataset.id),
            );
        });

        document.querySelectorAll(".action-btn--delete").forEach((el) => {
            el.addEventListener("click", () =>
                EventHandlers.onDeleteClick(+el.dataset.id),
            );
        });
    },
};

/* Event Handlers */

const EventHandlers = {
    onAddSubmit(e) {
        e.preventDefault();
        const desc = document.getElementById("todo__new-inputbox").value.trim();
        const priority = document.getElementById("todo__new-priority").value;
        const dueDate =
            document.getElementById("todo__new-duedate").value || null;
        const category =
            document.getElementById("todo__new-category").value || null;

        if (!desc) {
            NotificationService.error("Task description cannot be empty.");
            return;
        }

        State.addTodo({
            id: State.generateId(),
            desc,
            completed: false,
            priority,
            dueDate,
            category,
            createdAt: Date.now(),
        });

        document.getElementById("todo__new-inputbox").value = "";
        document.getElementById("todo__new-duedate").value = "";
        document.getElementById("todo__new-priority").value = "medium";
        document.getElementById("todo__new-category").value = "";

        NotificationService.success("Task added.");
        Renderer.renderAll();
    },

    onEditClick(id) {
        const todo = State.todos.find((t) => t.id === id);
        if (!todo) return;

        const body = `
            <div class="modal-field">
                <label class="modal-field__label" for="modal__edit-desc">Description</label>
                <input id="modal__edit-desc" class="modal-field__input" type="text" value="${escapeHtml(todo.desc)}" maxlength="300" autocomplete="off" />
            </div>
            <div class="modal-field">
                <label class="modal-field__label" for="modal__edit-priority">Priority</label>
                <select id="modal__edit-priority" class="modal-field__select">
                    <option value="high"   ${todo.priority === "high" ? "selected" : ""}>High</option>
                    <option value="medium" ${todo.priority === "medium" ? "selected" : ""}>Medium</option>
                    <option value="low"    ${todo.priority === "low" ? "selected" : ""}>Low</option>
                </select>
            </div>
            <div class="modal-field">
                <label class="modal-field__label" for="modal__edit-duedate">Due Date</label>
                <input id="modal__edit-duedate" class="modal-field__date" type="date" value="${todo.dueDate || ""}" />
            </div>
            <div class="modal-field">
                <label class="modal-field__label" for="modal__edit-category">Category</label>
                <select id="modal__edit-category" class="modal-field__select">
                    <option value=""         ${!todo.category ? "selected" : ""}>None</option>
                    <option value="work"     ${todo.category === "work" ? "selected" : ""}>Work</option>
                    <option value="personal" ${todo.category === "personal" ? "selected" : ""}>Personal</option>
                    <option value="health"   ${todo.category === "health" ? "selected" : ""}>Health</option>
                    <option value="finance"  ${todo.category === "finance" ? "selected" : ""}>Finance</option>
                    <option value="other"    ${todo.category === "other" ? "selected" : ""}>Other</option>
                </select>
            </div>
        `;

        ModalService.open({
            title: "Edit Task",
            body,
            confirmText: "Save Changes",
            confirmClass: "btn--primary",
            onConfirm() {
                const desc = document
                    .getElementById("modal__edit-desc")
                    .value.trim();
                const priority = document.getElementById(
                    "modal__edit-priority",
                ).value;
                const dueDate =
                    document.getElementById("modal__edit-duedate").value ||
                    null;
                const category =
                    document.getElementById("modal__edit-category").value ||
                    null;

                if (!desc) {
                    NotificationService.error("Description cannot be empty.");
                    return;
                }

                State.updateTodo(id, { desc, priority, dueDate, category });
                NotificationService.success("Task updated.");
                Renderer.renderAll();
            },
        });

        setTimeout(() => {
            const input = document.getElementById("modal__edit-desc");
            const dateEl = document.getElementById("modal__edit-duedate");
            if (input) {
                input.focus();
                input.select();
            }
            if (dateEl) {
                dateEl.min = getTodayStr();
            }
        }, 60);
    },

    onDeleteClick(id) {
        const todo = State.todos.find((t) => t.id === id);
        if (!todo) return;

        ModalService.open({
            title: "Delete Task",
            body: `<p class="modal-confirm-text">Are you sure you want to delete <strong>"${escapeHtml(todo.desc)}"</strong>? This cannot be undone.</p>`,
            confirmText: "Delete",
            confirmClass: "btn--danger",
            onConfirm() {
                State.deleteTodo(id);
                NotificationService.success("Task deleted.");
                Renderer.renderAll();
            },
        });
    },

    onFilterChange(filter) {
        State.setFilter(filter);
        document.querySelectorAll(".filter-tab").forEach((btn) => {
            btn.classList.toggle(
                "filter-tab--active",
                btn.dataset.filter === filter,
            );
        });
        Renderer.renderList();
    },

    onSortChange(sort) {
        State.setSort(sort);
        Renderer.renderList();
    },

    onSearchInput(query) {
        State.setSearch(query);
        Renderer.renderList();
    },

    onMarkAllComplete() {
        if (State.todos.length === 0) {
            NotificationService.error("No tasks to update.");
            return;
        }
        const willBeAllDone = !State.todos.every((todo) => todo.completed);
        State.markAllComplete();
        NotificationService.success(
            willBeAllDone
                ? "All tasks marked as done."
                : "All tasks marked as active.",
        );
        Renderer.renderAll();
    },

    onClearCompleted() {
        const count = State.todos.filter((t) => t.completed).length;
        if (count === 0) {
            NotificationService.error("No completed tasks to clear.");
            return;
        }

        ModalService.open({
            title: "Clear Completed",
            body: `<p class="modal-confirm-text">Remove all <strong>${count} completed task${count !== 1 ? "s" : ""}</strong>? This cannot be undone.</p>`,
            confirmText: "Clear",
            confirmClass: "btn--danger",
            onConfirm() {
                State.clearCompleted();
                NotificationService.success(
                    `${count} task${count !== 1 ? "s" : ""} cleared.`,
                );
                Renderer.renderAll();
            },
        });
    },
};

/* App */
const App = {
    init() {
        this._setHeaderDate();
        this._setMinDueDates();
        this._bindGlobalEvents();
        Renderer.renderAll();
    },

    _setMinDueDates() {
        const today = getTodayStr();
        document.getElementById("todo__new-duedate").min = today;
    },

    _setHeaderDate() {
        const el = document.getElementById("app-header__date");
        if (!el) return;
        el.textContent = new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
        });
    },

    _bindGlobalEvents() {
        document
            .getElementById("todo__new-input-form")
            .addEventListener("submit", (e) => EventHandlers.onAddSubmit(e));

        document
            .getElementById("filter-tabs")
            .addEventListener("click", (e) => {
                const btn = e.target.closest(".filter-tab");
                if (btn) EventHandlers.onFilterChange(btn.dataset.filter);
            });

        document
            .getElementById("todo__sort-select")
            .addEventListener("change", (e) =>
                EventHandlers.onSortChange(e.target.value),
            );

        document
            .getElementById("todo__search-input")
            .addEventListener("input", (e) =>
                EventHandlers.onSearchInput(e.target.value),
            );

        document
            .getElementById("btn__mark-all-complete")
            .addEventListener("click", () => EventHandlers.onMarkAllComplete());

        document
            .getElementById("btn__clear-completed")
            .addEventListener("click", () => EventHandlers.onClearCompleted());

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") ModalService.close();
        });
    },
};

document.addEventListener("DOMContentLoaded", () => App.init());
