# Extraction Action Prototype

A 2D top-down extraction action game prototype built with plain HTML, CSS, and JavaScript. The player enters a procedurally generated dungeon, fights enemies, loots chests, and must escape to bring their findings back to town. In town, the player can upgrade facilities to enhance their character for future runs.

## ✨ Core Features

*   **Procedural Generation:** Dungeons and background music are generated procedurally for a new experience every time.
*   **Data-Driven Design:** All game data (items, recipes, settings) is separated from the game logic in `src/data/gameData.js`, making it easy to modify and balance.
*   **Item & Inventory System:** Comprehensive inventory, equipment, and quick slot system.
*   **Crafting & Upgrades:** Craft new items at the workbench and upgrade town facilities for permanent character buffs.
*   **Cross-Platform Input:** Supports both Keyboard/Mouse for desktop and a virtual gamepad for mobile/touch devices.
*   **Dynamic Audio:** Sound effects and music are generated in real-time using the Web Audio API.

## 🏛️ Architecture & Design Principles

This prototype is built with a focus on modern software engineering principles to ensure it is scalable and maintainable.

*   **Object-Oriented Programming (OOP):** Game objects (Player, Enemy, etc.) are represented as classes, encapsulating their own data and behavior.
*   **Single Responsibility Principle (SRP):** The code is organized into `Manager` classes, each with a single, well-defined responsibility (e.g., `InputManager` handles input, `UIManager` handles UI).
*   **Dependency Injection (DI):** A simple DI Container (`src/core/DIContainer.js`) is used to manage the dependencies between different managers and services. This decouples the components and makes the system more flexible.
*   **Modular ES6 Structure:** The entire codebase is split into ES6 modules, allowing for clear dependency management via `import` and `export` statements.

## 📚 Documentation

This project maintains a structured API documentation to help developers understand the codebase and contribute effectively. All core components and manager modules are documented.

**[➡️ Go to API Documentation Index](./docs/index.md)**

It is recommended to read this documentation before diving into the code.

## 📂 Project Structure

The project is organized into the following directory structure:

```
/
├── index.html         # Main HTML file (the skeleton of the app)
├── style.css          # All CSS styles
├── README.md          # This documentation file
└── src/
    ├── data/          # Contains all static game data
    ├── core/          # Core engine components (GameEngine, DIContainer)
    ├── managers/      # Manager classes that handle specific domains
    ├── entities/      # Game object classes (Player, Enemy, etc.)
    ├── utils.js       # Shared utility functions
    └── main.js        # The main entry point that initializes the app
```

## 🚀 How to Run

Since this is a plain HTML/CSS/JS project with no build step, you can run it by simply opening the `index.html` file in a modern web browser.

For the best experience, it is recommended to serve the project directory using a local web server. Many code editors have extensions for this (e.g., "Live Server" for VS Code).
