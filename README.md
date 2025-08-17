# My Todo App

A simple, responsive web application for managing todo items with local storage persistence.

## Features

- ✅ **Add new todo items** - Enter and save new tasks
- ✅ **View all todos** - See all your saved todo items in a clean list
- ✅ **Delete todos** - Remove completed or unwanted items
- ✅ **Local storage persistence** - Todos are saved in your browser and persist between sessions
- ✅ **Responsive design** - Works perfectly on desktop, tablet, and mobile devices
- ✅ **Clean, minimal UI** - Modern and intuitive interface
- ✅ **Input validation** - Prevents empty todos and duplicates
- ✅ **Keyboard support** - Press Enter to add todos
- ✅ **Success/error notifications** - Visual feedback for user actions

## Usage

1. **Open the application** - Simply open `index.html` in any modern web browser
2. **Add a todo** - Type your task in the input field and click "Add Todo" or press Enter
3. **View todos** - All your todos will appear in the list below
4. **Delete a todo** - Click the "Delete" button next to any todo item to remove it
5. **Data persistence** - Your todos are automatically saved and will remain even after closing the browser

## File Structure

```
mytodo/
├── index.html      # Main HTML file
├── styles.css      # CSS styling and responsive design
├── script.js       # JavaScript functionality
├── README.md       # This file
└── LICENSE         # License information
```

## Technical Details

- **Pure HTML, CSS, and JavaScript** - No frameworks or dependencies required
- **Local Storage API** - Uses browser's localStorage for data persistence
- **ES6 Classes** - Modern JavaScript with class-based architecture
- **Responsive CSS** - Mobile-first design with media queries
- **Error Handling** - Robust error handling for localStorage operations
- **XSS Protection** - HTML escaping to prevent cross-site scripting

## Browser Compatibility

This application works in all modern browsers that support:
- ES6 (ES2015) features
- Local Storage API
- CSS Grid and Flexbox

## Getting Started

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start adding your todos!

No server setup or installation required - it's ready to use immediately.

## License

This project is licensed under the terms specified in the LICENSE file.
