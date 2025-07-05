// TaskMaster Pro - Advanced To-Do List Application
// Created by: Deenprasath

class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('taskmaster-tasks')) || [];
        this.currentFilter = 'all';
        this.currentSort = 'created';
        this.selectedTasks = new Set();
        this.currentEditId = null;
        this.tutorialStep = 1;
        this.maxTutorialSteps = 5;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTheme();
        this.renderTasks();
        this.updateStats();
        this.showTutorialOnFirstVisit();
    }

    bindEvents() {
        // Form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Clear search
        document.getElementById('clearSearch').addEventListener('click', () => {
            document.getElementById('searchInput').value = '';
            this.renderTasks();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        document.getElementById('closeTutorial').addEventListener('click', () => {
    this.closeTutorial();
});

        // Sort dropdown
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.renderTasks();
        });

        // Bulk actions
        document.getElementById('selectAllBtn').addEventListener('click', () => {
            this.toggleSelectAll();
        });

        document.getElementById('deleteSelectedBtn').addEventListener('click', () => {
            this.deleteSelectedTasks();
        });

        // Form toggle
        document.getElementById('formToggle').addEventListener('click', () => {
            this.toggleForm();
        });

        // Edit modal
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEditedTask();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Close modal on outside click
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeEditModal();
            }
        });
    }

    showTutorialOnFirstVisit() {
        const hasSeenTutorial = localStorage.getItem('taskmaster-tutorial-seen');
        if (!hasSeenTutorial) {
            this.showTutorial();
        }
    }

    showTutorial() {
        document.getElementById('tutorialOverlay').classList.remove('hidden');
        this.tutorialStep = 1;
        this.updateTutorialStep();
    }

    updateTutorialStep() {
        document.querySelectorAll('.tutorial-step').forEach((step, index) => {
            step.classList.toggle('active', index + 1 === this.tutorialStep);
        });
    }

    nextTutorialStep() {
        if (this.tutorialStep < this.maxTutorialSteps) {
            this.tutorialStep++;
            this.updateTutorialStep();
        }
    }

    prevTutorialStep() {
        if (this.tutorialStep > 1) {
            this.tutorialStep--;
            this.updateTutorialStep();
        }
    }

    finishTutorial() {
        document.getElementById('tutorialOverlay').classList.add('hidden');
        localStorage.setItem('taskmaster-tutorial-seen', 'true');
        this.showNotification('Welcome to TaskMaster Pro! 🎉', 'success');
    }

    closeTutorial() {
        document.getElementById('tutorialOverlay').classList.add('hidden');
        localStorage.setItem('taskmaster-tutorial-seen', 'true');
    }

    addTask() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const dueDate = document.getElementById('taskDueDate').value;

        if (!title) {
            this.showNotification('Please enter a task title', 'error');
            return;
        }

        const task = {
            id: Date.now(),
            title,
            description,
            priority,
            dueDate,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        this.tasks.unshift(task);
        this.saveTasks();
        this.clearForm();
        this.renderTasks();
        this.updateStats();
        this.showNotification('Task added successfully! ✅', 'success');
        
        // Add animation to new task
        setTimeout(() => {
            const newTaskElement = document.querySelector('.task-card');
            if (newTaskElement) {
                newTaskElement.classList.add('bounce-in');
            }
        }, 100);
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        this.currentEditId = id;
        
        // Populate edit form
        document.getElementById('editTitle').value = task.title;
        document.getElementById('editDescription').value = task.description || '';
        document.getElementById('editPriority').value = task.priority;
        document.getElementById('editDueDate').value = task.dueDate || '';

        // Show modal
        document.getElementById('editModal').classList.add('active');
    }

    saveEditedTask() {
        const task = this.tasks.find(t => t.id === this.currentEditId);
        if (!task) return;

        const title = document.getElementById('editTitle').value.trim();
        if (!title) {
            this.showNotification('Please enter a task title', 'error');
            return;
        }

        task.title = title;
        task.description = document.getElementById('editDescription').value.trim();
        task.priority = document.getElementById('editPriority').value;
        task.dueDate = document.getElementById('editDueDate').value;

        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.closeEditModal();
        this.showNotification('Task updated successfully! ✏️', 'success');
    }

    closeEditModal() {
        document.getElementById('editModal').classList.remove('active');
        this.currentEditId = null;
    }

    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.selectedTasks.delete(id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.showNotification('Task deleted successfully! 🗑️', 'success');
        }
    }

    toggleTaskComplete(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;

        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        const message = task.completed ? 'Task completed! 🎉' : 'Task marked as pending';
        const type = task.completed ? 'success' : 'info';
        this.showNotification(message, type);
    }

    toggleTaskSelection(id) {
        if (this.selectedTasks.has(id)) {
            this.selectedTasks.delete(id);
        } else {
            this.selectedTasks.add(id);
        }
        this.updateBulkActions();
        this.renderTasks();
    }

    toggleSelectAll() {
        const visibleTasks = this.getFilteredAndSortedTasks();
        const allSelected = visibleTasks.every(task => this.selectedTasks.has(task.id));

        if (allSelected) {
            visibleTasks.forEach(task => this.selectedTasks.delete(task.id));
        } else {
            visibleTasks.forEach(task => this.selectedTasks.add(task.id));
        }

        this.updateBulkActions();
        this.renderTasks();
    }

    deleteSelectedTasks() {
        if (this.selectedTasks.size === 0) return;

        const count = this.selectedTasks.size;
        if (confirm(`Are you sure you want to delete ${count} selected task${count > 1 ? 's' : ''}?`)) {
            this.tasks = this.tasks.filter(task => !this.selectedTasks.has(task.id));
            this.selectedTasks.clear();
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            this.updateBulkActions();
            this.showNotification(`${count} task${count > 1 ? 's' : ''} deleted successfully! 🗑️`, 'success');
        }
    }

    updateBulkActions() {
        const deleteBtn = document.getElementById('deleteSelectedBtn');
        const selectAllBtn = document.getElementById('selectAllBtn');
        
        deleteBtn.disabled = this.selectedTasks.size === 0;
        
        const visibleTasks = this.getFilteredAndSortedTasks();
        const allSelected = visibleTasks.length > 0 && visibleTasks.every(task => this.selectedTasks.has(task.id));
        selectAllBtn.textContent = allSelected ? 'Deselect All' : 'Select All';
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.renderTasks();
    }

    handleSearch(query) {
        this.searchQuery = query.toLowerCase();
        this.renderTasks();
        
        // Show/hide clear button
        const clearBtn = document.getElementById('clearSearch');
        clearBtn.style.opacity = query ? '1' : '0';
    }

    getFilteredAndSortedTasks() {
        let filtered = [...this.tasks];

        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(task => 
                task.title.toLowerCase().includes(this.searchQuery) ||
                (task.description && task.description.toLowerCase().includes(this.searchQuery))
            );
        }

        // Apply status filter
        switch (this.currentFilter) {
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
            case 'pending':
                filtered = filtered.filter(task => !task.completed);
                break;
        }

        // Apply sorting
        switch (this.currentSort) {
            case 'due':
                filtered.sort((a, b) => {
                    if (!a.dueDate && !b.dueDate) return 0;
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
            case 'priority':
                const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
                filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'alphabetical':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            default: // 'created'
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return filtered;
    }

    renderTasks() {
        const tasksGrid = document.getElementById('tasksGrid');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredAndSortedTasks();

        if (filteredTasks.length === 0) {
            tasksGrid.innerHTML = '';
            emptyState.classList.remove('hidden');
            this.updateBulkActions();
            return;
        }

        emptyState.classList.add('hidden');

        tasksGrid.innerHTML = filteredTasks.map(task => this.createTaskHTML(task)).join('');
        this.updateBulkActions();

        // Add event listeners to task elements
        this.bindTaskEvents();
    }

    createTaskHTML(task) {
        const isSelected = this.selectedTasks.has(task.id);
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isOverdue = dueDate && dueDate < new Date() && !task.completed;
        
        return `
            <div class="task-card ${task.completed ? 'completed' : ''} priority-${task.priority.toLowerCase()} ${isSelected ? 'selected' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="taskManager.toggleTaskComplete(${task.id})"></div>
                    <div class="task-content">
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                        <div class="task-meta">
                            <div class="task-priority ${task.priority.toLowerCase()}">
                                ${this.getPriorityIcon(task.priority)} ${task.priority}
                            </div>
                            ${task.dueDate ? `
                                <div class="task-due-date ${isOverdue ? 'overdue' : ''}">
                                    📅 ${this.formatDate(task.dueDate)}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="task-selection">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="taskManager.toggleTaskSelection(${task.id})">
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn edit-btn" onclick="taskManager.editTask(${task.id})">
                        ✏️ Edit
                    </button>
                    <button class="task-btn delete-btn" onclick="taskManager.deleteTask(${task.id})">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }

    bindTaskEvents() {
        // Add any additional event listeners for task elements if needed
    }

    getPriorityIcon(priority) {
        switch (priority) {
            case 'High': return '🔴';
            case 'Medium': return '🟡';
            case 'Low': return '🟢';
            default: return '⚪';
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
        if (diffDays < 7) return `In ${diffDays} days`;

        return date.toLocaleDateString();
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(t => t.completed).length;
        const pendingTasks = totalTasks - completedTasks;
        const highPriorityTasks = this.tasks.filter(t => t.priority === 'High' && !t.completed).length;

        // Update progress bar
        const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        document.getElementById('progressFill').style.width = `${progressPercentage}%`;

        // Update stats
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingCount').textContent = pendingTasks;
        document.getElementById('completedCount').textContent = completedTasks;
        document.getElementById('highPriorityCount').textContent = highPriorityTasks;
    }

    toggleForm() {
        const form = document.querySelector('.task-form');
        const toggle = document.getElementById('formToggle');
        
        form.classList.toggle('collapsed');
        toggle.textContent = form.classList.contains('collapsed') ? '+' : '−';
    }

    clearForm() {
        document.getElementById('taskForm').reset();
        document.getElementById('taskPriority').value = 'Medium';
    }

    saveTasks() {
        localStorage.setItem('taskmaster-tasks', JSON.stringify(this.tasks));
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('taskmaster-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeToggle(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('taskmaster-theme', newTheme);
        this.updateThemeToggle(newTheme);
    }

    updateThemeToggle(theme) {
        const toggle = document.getElementById('themeToggle');
        toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N: Add new task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            document.getElementById('taskTitle').focus();
        }

        // Ctrl/Cmd + F: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('searchInput').focus();
        }

        // Escape: Close modals
        if (e.key === 'Escape') {
            this.closeEditModal();
            this.closeTutorial();
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.background = '#10b981';
                break;
            case 'error':
                notification.style.background = '#ef4444';
                break;
            case 'warning':
                notification.style.background = '#f59e0b';
                break;
            default:
                notification.style.background = '#6366f1';
        }

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export/Import functionality (bonus feature)
    exportTasks() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `taskmaster-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Tasks exported successfully! 📁', 'success');
    }

    importTasks(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    this.tasks = importedTasks;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateStats();
                    this.showNotification('Tasks imported successfully! 📥', 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                this.showNotification('Error importing tasks. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Global functions for HTML onclick handlers
function showTutorial() {
    taskManager.showTutorial();
}

function nextTutorialStep() {
    taskManager.nextTutorialStep();
}

function prevTutorialStep() {
    taskManager.prevTutorialStep();
}

function finishTutorial() {
    taskManager.finishTutorial();
}

function closeTutorial() {
    taskManager.closeTutorial();
}

function closeEditModal() {
    taskManager.closeEditModal();
}

function toggleTheme() {
    taskManager.toggleTheme();
}

// Initialize the application
let taskManager;

document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
    
    // Add some sample tasks for demonstration (only on first visit)
    if (taskManager.tasks.length === 0 && !localStorage.getItem('taskmaster-tutorial-seen')) {
        const sampleTasks = [
            {
                id: Date.now() - 3,
                title: "Welcome to TaskMaster Pro!",
                description: "This is a sample task to show you how the app works. You can edit or delete it.",
                priority: "High",
                dueDate: "",
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: Date.now() - 2,
                title: "Try adding your first task",
                description: "Use the form above to create your own tasks with priorities and due dates.",
                priority: "Medium",
                dueDate: "",
                completed: false,
                createdAt: new Date().toISOString(),
                completedAt: null
            },
            {
                id: Date.now() - 1,
                title: "Explore the features",
                description: "Try searching, filtering, and sorting your tasks. Don't forget to mark tasks as complete!",
                priority: "Low",
                dueDate: "",
                completed: true,
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString()
            }
        ];
        
        taskManager.tasks = sampleTasks;
        taskManager.saveTasks();
        taskManager.renderTasks();
        taskManager.updateStats();
    }
});

// Service Worker registration for offline support (optional enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}