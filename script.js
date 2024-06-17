let tasks = [];
let taskToRevive = null;

function updateTaskDependencyOptions() {
    const taskDependency = document.getElementById('taskDependency');
    taskDependency.innerHTML = `
        <option value="none">No depende</option>
        <option value="other">Depende de otros</option>
    `;
    tasks.forEach((task, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `Depende de: ${task.description}`;
        taskDependency.appendChild(option);
    });
}

function showAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    modal.style.display = "block";
}

function closeAddTaskModal() {
    const modal = document.getElementById('addTaskModal');
    modal.style.display = "none";
}

function addTask() {
    const description = document.getElementById('taskDescription').value;
    const dependency = document.getElementById('taskDependency').value;

    let dependent = false;
    let dependencyIndex = null;
    if (dependency !== 'none' && dependency !== 'other') {
        dependent = true;
        dependencyIndex = parseInt(dependency, 10);
    }

    if (description) {
        const task = {
            description,
            dependent,
            dependencyIndex,
            revived: false,
            subtasks: [],
            counter: 0,
            dormant: false
        };

        if (dependent && dependencyIndex !== null) {
            tasks[dependencyIndex].subtasks.push(task);
        } else {
            tasks.push(task);
        }

        penalizeTopTasks();
        renderTasks();
        saveTasks();
        updateTaskDependencyOptions();
        closeAddTaskModal();
    }
}

function penalizeTopTasks() {
    if (tasks.length > 0) {
        tasks[0].counter += 0.3;
    }
    if (tasks.length > 1) {
        tasks[1].counter += 0.2;
    }
    if (tasks.length > 2) {
        tasks[2].counter += 0.1;
    }
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    // Encontrar el índice máximo
    const maxCounter = Math.max(...tasks.map(task => task.counter));

    tasks.forEach((task, index) => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';

        // Resaltar tareas con el índice más alto
        if (task.counter === maxCounter && task.counter >= 1) {
            taskItem.classList.add('max-index');
        } else if (task.counter >= 1) {
            taskItem.classList.add('highlight');
        }

        // Aplicar el estado durmiente
        if (task.dormant) {
            taskItem.classList.add('dormant');
        }

        let dependencyText = '';
        if (task.dependent && task.dependencyIndex !== null) {
            const dependentTask = tasks[task.dependencyIndex];
            if (dependentTask) {
                dependencyText = ` [Depende de: ${dependentTask.description}]`;
            }
        }
        taskItem.innerHTML = `
            <span ondblclick="editTask(${index}, null)">${task.description} [${task.counter.toFixed(1)}]${dependencyText}</span>
            <div class="task-actions">
                <button onclick="completeTask(${index})" ${task.subtasks.length > 0 ? 'disabled' : ''}>Completar</button>
                <button onclick="showReviveModal(${index})" ${index === tasks.length - 1 ? 'disabled' : ''}>Revivir</button>
            </div>
        `;
        taskItem.onclick = () => toggleDormantTask(index);

        taskList.appendChild(taskItem);

        task.subtasks.forEach((subtask, subIndex) => {
            const subtaskItem = document.createElement('li');
            subtaskItem.className = 'task-item subtask';

            // Aplicar el estado durmiente a subtareas
            if (subtask.dormant) {
                subtaskItem.classList.add('dormant');
            }

            subtaskItem.innerHTML = `
                <span ondblclick="editTask(${index}, ${subIndex})">${subtask.description}</span>
                <div class="task-actions">
                    <button onclick="completeSubtask(${index}, ${subIndex})">Completar Subtarea</button>
                </div>
            `;
            subtaskItem.onclick = () => toggleDormantSubtask(index, subIndex);
            taskList.appendChild(subtaskItem);
        });
    });
}

function toggleDormantTask(taskIndex) {
    tasks[taskIndex].dormant = !tasks[taskIndex].dormant;
    renderTasks();
    saveTasks();
}

function toggleDormantSubtask(taskIndex, subtaskIndex) {
    tasks[taskIndex].subtasks[subtaskIndex].dormant = !tasks[taskIndex].subtasks[subtaskIndex].dormant;
    renderTasks();
    saveTasks();
}

function completeTask(taskIndex) {
    tasks.splice(taskIndex, 1);
    renderTasks();
    saveTasks();
    updateTaskDependencyOptions();
}

function completeSubtask(taskIndex, subtaskIndex) {
    const task = tasks[taskIndex];
    if (task) {
        task.subtasks.splice(subtaskIndex, 1);
        task.revived = false;
    }
    renderTasks();
    saveTasks();
}

function showReviveModal(taskIndex) {
    taskToRevive = taskIndex;
    const modal = document.getElementById('reviveModal');
    modal.style.display = "block";
}

function confirmReviveTask() {
    const newDescription = document.getElementById('reviveTaskDescription').value;
    if (taskToRevive !== null && newDescription) {
        const task = tasks[taskToRevive];
        const newSubtask = {
            description: newDescription,
            dependent: task.dependent,
            revived: true
        };
        task.subtasks.push(newSubtask);
        task.revived = true;
        task.counter += 1; // Incrementar el contador de revivificaciones

        // Mover la tarea original al final de la pila
        tasks.splice(taskToRevive, 1);
        tasks.push(task);
        renderTasks();
        saveTasks();
        closeModal();
    }
}

function closeModal() {
    const modal = document.getElementById('reviveModal');
    modal.style.display = "none";
    document.getElementById('reviveTaskDescription').value = '';
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
        updateTaskDependencyOptions();
    }
}

function saveTasksToFile() {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const filename = `tasks-${timestamp}.json`;

    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function loadTasksFromFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        tasks = JSON.parse(content);
        renderTasks();
        updateTaskDependencyOptions();
    };
    reader.readAsText(file);
}

window.onload = loadTasks;

window.onclick = function(event) {
    const addTaskModal = document.getElementById('addTaskModal');
    const reviveModal = document.getElementById('reviveModal');
    if (event.target == addTaskModal) {
        closeAddTaskModal();
    }
    if (event.target == reviveModal) {
        closeModal();
    }
}

function editTask(taskIndex, subtaskIndex) {
    let task;
    if (subtaskIndex !== null) {
        task = tasks[taskIndex].subtasks[subtaskIndex];
    } else {
        task = tasks[taskIndex];
    }

    const newDescription = prompt("Editar Descripción de la Tarea:", task.description);
    if (newDescription !== null) {
        task.description = newDescription;
        renderTasks();
        saveTasks();
    }
}
