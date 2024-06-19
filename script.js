let tasks = [];
let taskToRevive = null;
let taskToEdit = null;
let subtaskToEdit = null;
let taskToAddSubtask = null;

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

function showEditTaskModal(taskIndex, subtaskIndex) {
    taskToEdit = taskIndex;
    subtaskToEdit = subtaskIndex;

    const task = subtaskIndex === null ? tasks[taskIndex] : tasks[taskIndex].subtasks[subtaskIndex];

    document.getElementById('editTaskDescription').value = task.description;

    if (subtaskIndex === null) {
        document.getElementById('editTaskCounter').value = task.counter;
        document.getElementById('editTaskCounter').style.display = 'block';
    } else {
        document.getElementById('editTaskCounter').style.display = 'none';
    }

    const modal = document.getElementById('editTaskModal');
    modal.style.display = "block";
}

function closeEditTaskModal() {
    const modal = document.getElementById('editTaskModal');
    modal.style.display = "none";
}

function showAddSubtaskModal(taskIndex) {
    taskToAddSubtask = taskIndex;
    const modal = document.getElementById('addSubtaskModal');
    modal.style.display = "block";
}

function closeAddSubtaskModal() {
    const modal = document.getElementById('addSubtaskModal');
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

        renderTasks();
        saveTasks();
        updateTaskDependencyOptions();
        closeAddTaskModal();
    }
}

function addSubtask() {
    const description = document.getElementById('subtaskDescription').value;

    if (description && taskToAddSubtask !== null) {
        const subtask = {
            description,
            dependent: false,
            revived: false,
            dormant: false
        };

        tasks[taskToAddSubtask].subtasks.push(subtask);

        renderTasks();
        saveTasks();
        closeAddSubtaskModal();
    }
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    const maxCounter = Math.max(...tasks.map(task => task.counter));

    tasks.forEach((task, index) => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.setAttribute('data-id', index);

        if (task.counter === maxCounter && task.counter >= 1) {
            taskItem.classList.add('max-index');
        } else if (task.counter >= 1) {
            taskItem.classList.add('highlight');
        }

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
            <span ondblclick="showEditTaskModal(${index}, null)">${task.description} [${task.counter.toFixed(1)}]${dependencyText}</span>
            <div class="task-actions">
                <button onclick="completeTask(${index})" ${task.subtasks.length > 0 ? 'disabled' : ''}>Completar</button>
                <button onclick="showAddSubtaskModal(${index})">Subtarea</button>
            </div>
        `;
        taskItem.onclick = () => toggleDormantTask(index);

        taskList.appendChild(taskItem);

        task.subtasks.forEach((subtask, subIndex) => {
            const subtaskItem = document.createElement('li');
            subtaskItem.className = 'task-item subtask';
            subtaskItem.setAttribute('data-id', `${index}-${subIndex}`);

            if (subtask.dormant) {
                subtaskItem.classList.add('dormant');
            }

            subtaskItem.innerHTML = `
                <span ondblclick="showEditTaskModal(${index}, ${subIndex})">${subtask.description}</span>
                <div class="task-actions">
                    <button onclick="completeSubtask(${index}, ${subIndex})">Completar Subtarea</button>
                </div>
            `;
            subtaskItem.onclick = () => toggleDormantSubtask(index, subIndex);
            taskList.appendChild(subtaskItem);
        });
    });
}

function reorderTasks() {
    tasks.sort((a, b) => b.counter - a.counter);
    renderTasks();
    saveTasks();
}

function confirmEditTask() {
    const newDescription = document.getElementById('editTaskDescription').value;
    let newCounter = document.getElementById('editTaskCounter').value;

    newCounter = newCounter.replace(',', '.');

    if (isNaN(newCounter)) {
        alert('El índice debe ser un número válido.');
        return;
    }

    newCounter = parseFloat(newCounter);

    if (taskToEdit !== null) {
        let task;
        if (subtaskToEdit === null) {
            task = tasks[taskToEdit];
            task.counter = newCounter;
        } else {
            task = tasks[taskToEdit].subtasks[subtaskToEdit];
        }

        task.description = newDescription;

        renderTasks();
        saveTasks();
        closeEditTaskModal();
    }
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

function generatePDF() {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF();
    const taskList = document.getElementById('taskList');
    let yOffset = 10;

    tasks.forEach((task, index) => {
        const text = `${task.description} [${task.counter.toFixed(1)}]`;
        doc.text(text, 10, yOffset);
        yOffset += 10;

        task.subtasks.forEach((subtask) => {
            const subText = `  - ${subtask.description}`;
            doc.text(subText, 10, yOffset);
            yOffset += 10;
        });

        yOffset += 5; // Extra space between tasks
    });

    doc.save('tasks.pdf');
}

window.onload = loadTasks;

window.onclick = function(event) {
    const addTaskModal = document.getElementById('addTaskModal');
    const addSubtaskModal = document.getElementById('addSubtaskModal');
    const editTaskModal = document.getElementById('editTaskModal');
    if (event.target == addTaskModal) {
        closeAddTaskModal();
    }
    if (event.target == addSubtaskModal) {
        closeAddSubtaskModal();
    }
    if (event.target == editTaskModal) {
        closeEditTaskModal();
    }
}
