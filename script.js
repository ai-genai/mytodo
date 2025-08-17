/**
 * Professional Todo Application
 * Features: Error handling, performance optimization, accessibility, event delegation
 * @author Senior Developer
 * @version 2.0.0
 */

// Constants and configuration
const CONFIG = {
    STORAGE_KEY: 'todos',
    MAX_TODO_LENGTH: 100,
    NOTIFICATION_DURATION: 3000,
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 300
};

// Utility functions
const Utils = {
    /**
     * Generate unique ID with better collision resistance
     */
    generateId: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    
    /**
     * Debounce function for performance optimization
     */
    debounce: (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
    },
    
    /**
     * Escape HTML to prevent XSS attacks
     */
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Escape text for safe use in HTML attribute values
     * Escapes &, <, >, ", '
     */
    escapeAttribute: (text) => {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },
    
    /**
     * Validate todo text
     */
    validateTodoText: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return { valid: false, error: 'Todo text cannot be empty' };
        if (trimmed.length > CONFIG.MAX_TODO_LENGTH) {
            return { valid: false, error: `Todo text cannot exceed ${CONFIG.MAX_TODO_LENGTH} characters` };
        }
        return { valid: true, text: trimmed };
    },
    
    /**
     * Check for duplicate todos (case-insensitive)
     */
    isDuplicate: (text, todos, excludeId = null) => {
        return todos.some(todo => 
            todo.id !== excludeId && 
            todo.text.toLowerCase() === text.toLowerCase()
        );
    }
};
// Storage service with error handling
class StorageService {
    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);
            return false;
        }
    }
    
    static load(key, defaultValue = []) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage load error:', error);
            return defaultValue;
        }
    }
    
    static clear(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
}

// Notification service
class NotificationService {
    constructor() {
        this.container = null;
        this.init();
    }
    
    init() {
        this.createContainer();
        this.ensureStyles();
    }
    
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = CONFIG.NOTIFICATION_DURATION) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);
        
        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
        
        // Auto remove
        setTimeout(() => {
            this.remove(notification);
        }, duration);
        
        return notification;
    }
    
    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${Utils.escapeHtml(message)}</span>
                <button class="notification-close" aria-label="Close notification">×</button>
            </div>
        `;
        
        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.remove(notification));
        
        return notification;
    }
    
    remove(notification) {
        notification.classList.add('hiding');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, CONFIG.ANIMATION_DURATION);
    }
    
    ensureStyles() {
        if (document.getElementById('notification-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 10px;
                max-width: 350px;
                opacity: 0;
                transform: translateX(100%);
                transition: all ${CONFIG.ANIMATION_DURATION}ms ease-out;
                pointer-events: auto;
            }
            
            .notification.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .notification.hiding {
                opacity: 0;
                transform: translateX(100%);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
            }
            
            .notification-message {
                flex: 1;
                margin-right: 8px;
                font-size: 14px;
                font-weight: 500;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: #6c757d;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background-color 0.2s;
            }
            
            .notification-close:hover {
                background-color: #f8f9fa;
                color: #495057;
            }
            
            .notification-info {
                border-left: 4px solid #17a2b8;
            }
            
            .notification-success {
                border-left: 4px solid #28a745;
            }
            
            .notification-error {
                border-left: 4px solid #dc3545;
            }
            
            .notification-warning {
                border-left: 4px solid #ffc107;
            }
        `;
        document.head.appendChild(style);
    }
}

// Main Todo Application Class
class TodoApp {
    constructor() {
        this.todos = [];
        this.editingId = null;
        this.notificationService = new NotificationService();
        this.debouncedSave = Utils.debounce(this.saveTodos.bind(this), CONFIG.DEBOUNCE_DELAY);
        
        this.elements = {
            todoInput: null,
            addTodoBtn: null,
            todoList: null,
            emptyState: null,
            todoCount: null
        };
        
        this.init();
    }
    
    init() {
        this.validateElements();
        this.loadTodos();
        this.bindEvents();
        this.render();
        this.notificationService.show('Todo app loaded successfully!', 'success');
    }
    
    validateElements() {
        const requiredElements = [
            'todoInput',
            'addTodoBtn', 
            'todoList',
            'emptyState'
        ];
        
        for (const elementName of requiredElements) {
            const element = document.getElementById(elementName);
            if (!element) {
                throw new Error(`Required element not found: ${elementName}`);
            }
            this.elements[elementName] = element;
        }
        
        // Optional elements
        this.elements.todoCount = document.getElementById('todoCount');
    }
    
    bindEvents() {
        // Form submission
        const todoForm = document.getElementById('todoForm');
        if (todoForm) {
            todoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addTodo();
            });
        }
        
        // Rely solely on form submit to add todos (prevents double-trigger on click/Enter)
                // Event delegation for todo list
        this.elements.todoList.addEventListener('click', (e) => {
            const target = e.target;
            
            if (target.matches('.edit-btn')) {
                const todoId = target.closest('.todo-item').dataset.id;
                this.startEdit(todoId);
            } else if (target.matches('.delete-btn')) {
                const todoId = target.closest('.todo-item').dataset.id;
                this.deleteTodo(todoId);
            } else if (target.matches('.save-btn')) {
                const todoId = target.closest('.todo-item').dataset.id;
                this.saveEdit(todoId);
            } else if (target.matches('.cancel-btn')) {
                this.cancelEdit();
            }
        });        
        // Keyboard events for edit mode
        this.elements.todoList.addEventListener('keydown', (e) => {
            if (this.editingId && e.target.matches('.edit-input')) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.saveEdit(this.editingId);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cancelEdit();
                }
            }
        });
        
        // Focus management
        this.elements.todoList.addEventListener('focusin', (e) => {
            if (e.target.matches('.edit-input')) {
                e.target.select();
            }
        });
        
        // Action buttons
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => this.clearAll());
        }
        
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportTodos());
        }
        
        // Modal functionality
        this.bindModalEvents();
    }
    
    bindModalEvents() {
        // Keyboard shortcuts modal
        const shortcutsBtn = document.getElementById('keyboardShortcutsBtn');
        const shortcutsModal = document.getElementById('shortcutsModal');
        
        if (shortcutsBtn && shortcutsModal) {
            shortcutsBtn.addEventListener('click', () => this.showModal(shortcutsModal));
        }
        
        // About modal
        const aboutBtn = document.getElementById('aboutBtn');
        const aboutModal = document.getElementById('aboutModal');
        
        if (aboutBtn && aboutModal) {
            aboutBtn.addEventListener('click', () => this.showModal(aboutModal));
        }
        
        // Close modal events
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal-close') || e.target.classList.contains('modal')) {
                this.hideAllModals();
            }
        });
        
        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }
    
    showModal(modal) {
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        
        // Focus trap
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    }
    
    hideAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
        });
    }
    
    loadTodos() {
        this.todos = StorageService.load(CONFIG.STORAGE_KEY, []);
        
        // Validate loaded data
        if (!Array.isArray(this.todos)) {
            console.warn('Invalid todos data found, resetting to empty array');
            this.todos = [];
        }
    }
    
    saveTodos() {
        const success = StorageService.save(CONFIG.STORAGE_KEY, this.todos);
        if (!success) {
            this.notificationService.show('Failed to save todos. Please check your browser storage.', 'error');
        }
    }
    
    addTodo() {
        const inputValue = this.elements.todoInput.value;
        const validation = Utils.validateTodoText(inputValue);
        
        if (!validation.valid) {
            this.notificationService.show(validation.error, 'error');
            this.elements.todoInput.focus();
            return;
        }
        
        if (Utils.isDuplicate(validation.text, this.todos)) {
            this.notificationService.show('This todo already exists', 'warning');
            this.elements.todoInput.focus();
            return;
        }
        
        const newTodo = {
            id: Utils.generateId(),
            text: validation.text,
            createdAt: new Date().toISOString(),
            completed: false
        };
        
        this.todos.unshift(newTodo); // Add to beginning for better UX
        this.debouncedSave();
        this.render();
        
        // Clear input and focus
        this.elements.todoInput.value = '';
        this.elements.todoInput.focus();
        
        this.notificationService.show('Todo added successfully!', 'success');
    }
    
    deleteTodo(id) {
        const todoIndex = this.todos.findIndex(todo => todo.id === id);
        if (todoIndex === -1) return;
        
        const deletedTodo = this.todos.splice(todoIndex, 1)[0];
        this.debouncedSave();
        this.render();
        
        this.notificationService.show(`"${deletedTodo.text}" deleted`, 'info');
    }
    
    startEdit(id) {
        this.editingId = id;
        this.render();
        
        // Focus the edit input
        requestAnimationFrame(() => {
            const editInput = this.elements.todoList.querySelector(`[data-edit-id="${id}"]`);
            if (editInput) {
                editInput.focus();
                editInput.select();
            }
        });
    }
    
    saveEdit(id) {
        const editInput = this.elements.todoList.querySelector(`[data-edit-id="${id}"]`);
        if (!editInput) return;
        
        const validation = Utils.validateTodoText(editInput.value);
        
        if (!validation.valid) {
            this.notificationService.show(validation.error, 'error');
            editInput.focus();
            return;
        }
        
        if (Utils.isDuplicate(validation.text, this.todos, id)) {
            this.notificationService.show('This todo already exists', 'warning');
            editInput.focus();
            return;
        }
        
        const todoIndex = this.todos.findIndex(todo => todo.id === id);
        if (todoIndex === -1) return;
        
        this.todos[todoIndex].text = validation.text;
        this.todos[todoIndex].updatedAt = new Date().toISOString();
        
        this.editingId = null;
        this.debouncedSave();
        this.render();
        
        this.notificationService.show('Todo updated successfully!', 'success');
    }
    
    cancelEdit() {
        this.editingId = null;
        this.render();
        this.notificationService.show('Edit cancelled', 'info');
    }
    
    render() {
        this.updateTodoCount();
        this.renderTodoList();
    }
    
    updateTodoCount() {
        if (this.elements.todoCount) {
            this.elements.todoCount.textContent = this.todos.length;
        }
        
        const completedCount = document.getElementById('completedCount');
        if (completedCount) {
            const completed = this.todos.filter(todo => todo.completed).length;
            completedCount.textContent = completed;
        }
    }
    
    renderTodoList() {
        if (this.todos.length === 0) {
            this.elements.todoList.style.display = 'none';
            this.elements.emptyState.style.display = 'block';
        } else {
            this.elements.todoList.style.display = 'block';
            this.elements.emptyState.style.display = 'none';
            
            this.elements.todoList.innerHTML = this.todos.map(todo => 
                this.renderTodoItem(todo)
            ).join('');
        }
    }
    
    renderTodoItem(todo) {
        const isEditing = this.editingId === todo.id;
        const createdAt = new Date(todo.createdAt).toLocaleDateString();
        
        if (isEditing) {
            return `
            return `
                <li class="todo-item editing" data-id="${todo.id}" role="listitem">
                    <div class="edit-form">
                        <input 
                            type="text" 
                            class="edit-input" 
                           value="${Utils.escapeAttribute(todo.text)}"
                            data-edit-id="${todo.id}"
                            maxlength="${CONFIG.MAX_TODO_LENGTH}"
                            aria-label="Edit todo text"
                        >
                        <div class="edit-buttons">
                            <button class="save-btn" type="button" aria-label="Save changes">
                                Save
                            </button>
                            <button class="cancel-btn" type="button" aria-label="Cancel editing">
                                Cancel
                            </button>
                        </div>
                    </div>
                </li>
            `;        
        return `
            <li class="todo-item" data-id="${todo.id}" role="listitem">
                <div class="todo-content">
                    <span class="todo-text" tabindex="0" role="text">${Utils.escapeHtml(todo.text)}</span>
                    <div class="todo-meta">
                        <small class="todo-date">Created: ${createdAt}</small>
                    </div>
                </div>
                <div class="todo-buttons">
                    <button class="edit-btn" type="button" aria-label="Edit todo">
                        Edit
                    </button>
                    <button class="delete-btn" type="button" aria-label="Delete todo">
                        Delete
                    </button>
                </div>
            </li>
        `;
    }
    
    // Public API methods
    getTodos() {
        return [...this.todos]; // Return copy to prevent external mutation
    }
    
    clearAll() {
        if (this.todos.length === 0) {
            this.notificationService.show('No todos to clear', 'info');
            return;
        }
        
        if (confirm(`Are you sure you want to delete all ${this.todos.length} todos?`)) {
            this.todos = [];
            this.editingId = null;
            StorageService.clear(CONFIG.STORAGE_KEY);
            this.render();
            this.notificationService.show('All todos cleared', 'success');
        }
    }
    
    exportTodos() {
        const data = {
            todos: this.todos,
            exportedAt: new Date().toISOString(),
            version: '2.0.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.notificationService.show('Todos exported successfully', 'success');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.todoApp = new TodoApp();
        console.log('Todo app initialized successfully');
    } catch (error) {
        console.error('Failed to initialize todo app:', error);
        document.body.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #dc3545;">
                <h2>Application Error</h2>
                <p>Failed to initialize the todo application. Please refresh the page.</p>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    if (window.todoApp && window.todoApp.notificationService) {
        window.todoApp.notificationService.show('An unexpected error occurred', 'error');
    }
});

// Handle page visibility changes for better UX
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.todoApp) {
        // Reload todos when page becomes visible (in case of storage changes)
        window.todoApp.loadTodos();
        window.todoApp.render();
    }
});
