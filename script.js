// Todo App JavaScript
class TodoApp {
    constructor() {
        this.todos = [];
        this.todoInput = document.getElementById('todoInput');
        this.addTodoBtn = document.getElementById('addTodoBtn');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        
        this.init();
    }
    
    init() {
        // Load todos from localStorage
        this.loadTodos();
        
        // Add event listeners
        this.addTodoBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.addTodo();
            }
        });        
        // Initial render
        this.renderTodos();
    }
    
    loadTodos() {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            try {
                this.todos = JSON.parse(savedTodos);
            } catch (error) {
                console.error('Error loading todos from localStorage:', error);
                this.todos = [];
            }
        }
    }
    
    saveTodos() {
        try {
            localStorage.setItem('todos', JSON.stringify(this.todos));
        } catch (error) {
            console.error('Error saving todos to localStorage:', error);
        }
    }
    
    addTodo() {
        const todoText = this.todoInput.value.trim();
        
        if (todoText === '') {
            this.showError('Please enter a todo item');
            return;
        }
        
        // Check for duplicate todos
        if (this.todos.some(todo => todo.text.toLowerCase() === todoText.toLowerCase())) {
            this.showError('This todo already exists');
            return;
        }
        
        const newTodo = {
            id: Date.now(),
            text: todoText,
            createdAt: new Date().toISOString()
        };
        
        this.todos.push(newTodo);
        this.saveTodos();
        this.renderTodos();
        
        // Clear input and focus
        this.todoInput.value = '';
        this.todoInput.focus();
        
        // Show success message
        this.showSuccess('Todo added successfully!');
    }
    
    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.renderTodos();
        this.showSuccess('Todo deleted successfully!');
    }
    
    renderTodos() {
        if (this.todos.length === 0) {
            this.todoList.style.display = 'none';
            this.emptyState.style.display = 'block';
        } else {
            this.todoList.style.display = 'block';
            this.emptyState.style.display = 'none';
            
            this.todoList.innerHTML = this.todos.map(todo => `
                <li class="todo-item" data-id="${todo.id}">
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                    <button class="delete-btn" onclick="todoApp.deleteTodo(${todo.id})">
                        Delete
                    </button>
                </li>
            `).join('');
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showNotification(message, type) {
        // Ensure shared styles are added only once
        this.ensureNotificationStyles();
        
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
    
    ensureNotificationStyles() {
        // Check if notification styles already exist
        if (document.getElementById('notification-styles')) {
            return;
        }
        
        // Create shared stylesheet
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                font-weight: 500;
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
            }
            
            .notification-error {
                background: #dc3545;
            }
            
            .notification-success {
                background: #28a745;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.todoApp = new TodoApp();
});
