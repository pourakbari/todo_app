const taskInput = document.getElementById("taskInput");
const addButton = document.getElementById("addButton");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");

const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const remainingCount = document.getElementById("remainingCount");

const themeButton = document.getElementById("themeButton");
const clearCompleted = document.getElementById("clearCompleted");


let tasks = [];


async function loadTasks() {

    const response = await fetch("/api/tasks");

    tasks = await response.json();

    render();
}


function render() {

    taskList.innerHTML = "";

    tasks.forEach(task => {

        const element = document.createElement("div");

        element.className = `task ${task.completed ? "completed" : ""}`;

        element.innerHTML = `
            <div class="check">
                ${task.completed ? "✓" : ""}
            </div>

            <span class="title">${escapeHtml(task.title)}</span>

            <button class="delete">×</button>
        `;


        element.querySelector(".check").addEventListener(
            "click",
            () => toggleTask(task.id)
        );


        element.querySelector(".delete").addEventListener(
            "click",
            () => deleteTask(task.id)
        );


        taskList.appendChild(element);

    });


    updateStats();

    emptyState.style.display =
        tasks.length === 0 ? "block" : "none";
}


function updateStats() {

    const total = tasks.length;

    const completed =
        tasks.filter(task => task.completed).length;

    totalCount.textContent = total;
    completedCount.textContent = completed;
    remainingCount.textContent = total - completed;
}


async function addTask() {

    const title = taskInput.value.trim();

    if (!title) return;


    const response = await fetch("/api/tasks", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            title: title
        })
    });


    const task = await response.json();

    tasks.unshift(task);

    taskInput.value = "";

    render();
}


async function toggleTask(id) {

    const response =
        await fetch(`/api/tasks/${id}`, {
            method: "PATCH"
        });


    const updated = await response.json();


    const task =
        tasks.find(task => task.id === id);


    task.completed = updated.completed;

    render();
}


async function deleteTask(id) {

    await fetch(`/api/tasks/${id}`, {
        method: "DELETE"
    });


    tasks = tasks.filter(task => task.id !== id);

    render();
}


function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


addButton.addEventListener("click", addTask);


taskInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        addTask();
    }

});


themeButton.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    themeButton.textContent =
        document.body.classList.contains("dark")
            ? "☾"
            : "☀";
});


clearCompleted.addEventListener("click", async () => {

    const completedTasks =
        tasks.filter(task => task.completed);

    for (const task of completedTasks) {

        await fetch(`/api/tasks/${task.id}`, {
            method: "DELETE"
        });

    }

    tasks = tasks.filter(task => !task.completed);

    render();
});


loadTasks();