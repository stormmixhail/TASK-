let tasks = [];

// 添加排序状态追踪
let sortState = {
    startTime: 'none',
    endTime: 'none',
    urgency: 'none',
    completion: 'none'
};

// 在文件开头添加夜间模式状态
let isDarkMode = false;

// 添加视图状态
let currentView = 'grid';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
    }

    const modal = document.getElementById('taskFormModal');
    const showFormBtn = document.getElementById('showFormBtn');
    const closeBtn = document.getElementsByClassName('close')[0];
    const taskForm = document.getElementById('taskForm');

    // 显示模态框
    showFormBtn.onclick = () => {
        modal.style.display = "block";
    }

    // 关闭模态框
    closeBtn.onclick = () => {
        modal.style.display = "none";
    }

    // 点击模态框外部关闭
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // 表单提交
    taskForm.addEventListener('submit', (e) => {
        addTask(e);
        modal.style.display = "none";
    });

    // 更新任务的事件委托
    document.getElementById('taskList').addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const taskId = parseInt(e.target.dataset.taskId);
            showEditModal(taskId);
        } else if (e.target.classList.contains('complete-checkbox')) {
            const taskId = parseInt(e.target.dataset.taskId);
            toggleTaskComplete(taskId);
        } else if (e.target.classList.contains('delete-btn')) {
            const taskId = parseInt(e.target.dataset.taskId);
            deleteTask(taskId);
        }
    });

    // 初始化夜间模式
    isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }

    // 修复编辑表单提交事件
    document.getElementById('editTaskForm').addEventListener('submit', updateTask);

    // 获取所有关闭按钮
    const closeButtons = document.getElementsByClassName('close');
    const editModal = document.getElementById('editTaskModal');
    
    // 为每个关闭按钮添加事件
    Array.from(closeButtons).forEach(btn => {
        btn.onclick = () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.style.display = "none";
            }
        }
    });

    // 点击模态框外部关闭
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = "none";
        }
    }
});

// 添加任务
function addTask(e) {
    e.preventDefault();
    
    const task = {
        id: Date.now(),
        name: document.getElementById('taskName').value,
        startTime: document.getElementById('startTime').value,
        deadline: document.getElementById('deadline').value,
        color: document.getElementById('taskColor').value,
        urgencyLevel: parseInt(document.getElementById('urgencyLevel').value),
        isCompleted: false,
        remainingTime: new Date(document.getElementById('deadline').value) - new Date()
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    e.target.reset();
}

// 保存任务到本地存储
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// 渲染任务列表
function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    const now = new Date();

    tasks.forEach(task => {
        const remainingTime = new Date(task.deadline) - now;
        const isOverdue = !task.isCompleted && remainingTime < 0;
        
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.isCompleted ? 'completed' : ''} 
                               urgency-${task.urgencyLevel} ${isOverdue ? 'overdue' : ''}`;
        taskElement.style.backgroundColor = task.color;

        if (currentView === 'grid') {
            taskElement.innerHTML = `
                <div class="task-header">
                    <h3>${task.name}</h3>
                    <div class="task-controls">
                        <input type="checkbox" 
                               class="complete-checkbox" 
                               data-task-id="${task.id}" 
                               ${task.isCompleted ? 'checked' : ''}>
                        <button class="edit-btn" data-task-id="${task.id}">编辑</button>
                        <button class="delete-btn" data-task-id="${task.id}">删除</button>
                    </div>
                </div>
                <p>开始时间: ${new Date(task.startTime).toLocaleString()}</p>
                <p>截止时间: ${new Date(task.deadline).toLocaleString()}</p>
                <p>剩余时间: ${isOverdue ? 
                    `已逾期 ${Math.abs(Math.ceil(remainingTime / (1000 * 60 * 60 * 24)))} 天` : 
                    `剩余 ${Math.ceil(remainingTime / (1000 * 60 * 60 * 24))} 天`}</p>
                <p>紧急程度: ${'⭐'.repeat(task.urgencyLevel)}</p>
            `;
        } else {
            // 列表视图布局
            taskElement.innerHTML = `
                <div class="task-info">
                    <h3>${task.name}</h3>
                    <p>剩余: ${Math.ceil(remainingTime / (1000 * 60 * 60 * 24))} 天</p>
                    <p>紧急程度: ${'⭐'.repeat(task.urgencyLevel)}</p>
                </div>
                <div class="task-dates">
                    <p>${new Date(task.startTime).toLocaleDateString()} - ${new Date(task.deadline).toLocaleDateString()}</p>
                </div>
                <div class="task-controls">
                    <input type="checkbox" 
                           class="complete-checkbox" 
                           data-task-id="${task.id}" 
                           ${task.isCompleted ? 'checked' : ''}>
                    <button class="edit-btn" data-task-id="${task.id}">编辑</button>
                    <button class="delete-btn" data-task-id="${task.id}">删除</button>
                </div>
            `;
        }

        taskList.appendChild(taskElement);
    });
}

// 排序任务
function sortTasks(method) {
    // 重置其他排序状态
    Object.keys(sortState).forEach(key => {
        if (key !== method) sortState[key] = 'none';
    });

    // 切换当前排序方向：none -> asc -> desc -> none
    switch (sortState[method]) {
        case 'none':
            sortState[method] = 'asc';
            break;
        case 'asc':
            sortState[method] = 'desc';
            break;
        case 'desc':
            sortState[method] = 'none';
            break;
    }

    // 执行排序
    if (sortState[method] !== 'none') {
        const multiplier = sortState[method] === 'asc' ? 1 : -1;
        
        switch (method) {
            case 'startTime':
                tasks.sort((a, b) => {
                    return (new Date(a.startTime) - new Date(b.startTime)) * multiplier;
                });
                break;
            case 'endTime':
                tasks.sort((a, b) => {
                    return (new Date(a.deadline) - new Date(b.deadline)) * multiplier;
                });
                break;
            case 'urgency':
                tasks.sort((a, b) => {
                    // 首先检查是否有逾期任务
                    const now = new Date();
                    const aOverdue = !a.isCompleted && new Date(a.deadline) < now;
                    const bOverdue = !b.isCompleted && new Date(b.deadline) < now;
                    
                    if (aOverdue && bOverdue) {
                        // 如果都逾期，按逾期时间长短排序
                        const aOverdueTime = now - new Date(a.deadline);
                        const bOverdueTime = now - new Date(b.deadline);
                        return (bOverdueTime - aOverdueTime) * multiplier;
                    } else if (aOverdue) {
                        return -1 * multiplier; // a 逾期，排在前面
                    } else if (bOverdue) {
                        return 1 * multiplier; // b 逾期，排在前面
                    }
                    
                    // 如果都没逾期，按紧急程度排序
                    return (a.urgencyLevel - b.urgencyLevel) * multiplier;
                });
                break;
            case 'completion':
                tasks.sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? multiplier : -multiplier));
                break;
        }
    }

    // 更新所有排序按钮的状态
    updateSortButtons();
    saveTasks();
    renderTasks();
}

// 更新排序按钮状态
function updateSortButtons() {
    const sortButtons = {
        startTime: '按开始时间',
        endTime: '按结束时间',
        urgency: '按紧急程度',
        completion: '按完成状态'
    };

    Object.entries(sortButtons).forEach(([key, text]) => {
        const button = document.querySelector(`button[data-sort="${key}"]`);
        if (button) {
            let buttonText = text;
            if (sortState[key] === 'asc') buttonText += ' ↑';
            else if (sortState[key] === 'desc') buttonText += ' ↓';
            button.textContent = buttonText;
            
            // 更新按钮样式
            button.className = 'sort-button ' + (sortState[key] !== 'none' ? 'active' : '');
        }
    });
}

// 显示编辑模态框
function showEditModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const editModal = document.getElementById('editTaskModal');
    const editForm = document.getElementById('editTaskForm');
    
    // 填充表单
    editForm.elements.editTaskName.value = task.name;
    editForm.elements.editStartTime.value = task.startTime;
    editForm.elements.editDeadline.value = task.deadline;
    editForm.elements.editColor.value = task.color;
    editForm.elements.editUrgencyLevel.value = task.urgencyLevel;
    
    // 存储当前编辑的任务ID
    editForm.dataset.taskId = taskId;
    
    editModal.style.display = "block";
}

// 更新任务
function updateTask(e) {
    e.preventDefault();
    const taskId = parseInt(e.target.dataset.taskId);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) return;

    const updatedTask = {
        ...tasks[taskIndex],
        name: document.getElementById('editTaskName').value,
        startTime: document.getElementById('editStartTime').value,
        deadline: document.getElementById('editDeadline').value,
        color: document.getElementById('editColor').value,
        urgencyLevel: parseInt(document.getElementById('editUrgencyLevel').value),
        remainingTime: new Date(document.getElementById('editDeadline').value) - new Date()
    };

    tasks[taskIndex] = updatedTask;
    saveTasks();
    renderTasks();
    
    // 关闭模态框
    const editModal = document.getElementById('editTaskModal');
    if (editModal) {
        editModal.style.display = "none";
    }
}

// 切换任务完成状态
function toggleTaskComplete(taskId) {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;
    
    tasks[taskIndex].isCompleted = !tasks[taskIndex].isCompleted;
    saveTasks();
    renderTasks();
}

// 添加删除任务函数
function deleteTask(taskId) {
    if (confirm('确定要删除这个任务吗？')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
    }
}

// 添加切换夜间模式函数
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// 添加导出功能
function exportTasks() {
    const tasksData = JSON.stringify(tasks, null, 2);
    const blob = new Blob([tasksData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 添加导入功能
function importTasks(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedTasks = JSON.parse(e.target.result);
                tasks = importedTasks;
                saveTasks();
                renderTasks();
                alert('任务导入成功！');
            } catch (error) {
                alert('导入失败：文件格式不正确');
            }
        };
        reader.readAsText(file);
    }
}

// 添加视图切换函数
function toggleView(view) {
    currentView = view;
    const taskList = document.getElementById('taskList');
    const viewButtons = document.querySelectorAll('.view-btn');
    
    // 更新视图类
    taskList.className = `task-list ${view}-view`;
    
    // 更新按钮状态
    viewButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // 重新渲染任务以适应新视图
    renderTasks();
} 