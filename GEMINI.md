# Extraction Action Prototype - GEMINI Instructions

This project is a 2D top-down extraction action game prototype built with plain HTML, CSS, and JavaScript. It follows a modular, manager-based architecture with dependency injection.

> **Note:** For the Korean version, see `GEMINI.ko.md`. When modifying one version, ensure the other is updated to maintain synchronization.

## 🚀 Project Overview

*   **Genre:** Extraction RPG (Dungeon crawling, looting, escaping, and town upgrading).
*   **Tech Stack:**
    *   **Frontend:** Vanilla JavaScript (ES6 Modules), HTML5 Canvas, Tailwind CSS (CDN).
    *   **Backend:** Node.js (Simple `http` server for static files).
    *   **Audio:** Web Audio API, Magenta Music (`@magenta/music`), and `html-midi-player`.
*   **Architecture:**
    *   **Dependency Injection:** A custom `DIContainer` (`src/core/DIContainer.js`) manages service lifecycles.
    *   **Manager Pattern:** Domain-specific logic is encapsulated in Manager classes (e.g., `InputManager`, `EntityManager`, `MapManager`).
    *   **Data-Driven:** Game balance and definitions are centralized in `src/data/gameData.js`.

## 🛠️ Building and Running

### Prerequisites
*   Node.js installed.

### Commands
*   **Start Server:** Run `start-server.bat` or execute `npx nodemon server.js`.
*   **Access Game:** Open `http://localhost:3000` in a modern web browser.
*   **Debug:** The `DIContainer` instance is exposed globally as `window.gameApp`.

## 📂 Directory Structure

*   `/`: Server and configuration files.
*   `/src/`: Core game logic.
    *   `/core/`: `GameEngine` and `DIContainer`.
    *   `/managers/`: Manager classes for Input, UI, Audio, Map, Entities, etc.
    *   `/entities/`: Classes for `Player`, `Enemy`, `Projectile`, `Interactable`, etc.
    *   `/data/`: Centralized game data and constants.
*   `/docs/`: API and structural documentation.
*   `/private_assets/`: Source audio and sprite assets.

## 📜 Development Conventions

*   **Manager Pattern:** When adding new global systems, create a Manager class and register it in `src/main.js` via the `DIContainer`.
*   **Dependency Access:** Prefer getting dependencies from the `DIContainer` rather than global variables.
*   **Data Separation:** Keep item definitions, recipes, and balance constants in `src/data/gameData.js`.
*   **State Management:** The `GameEngine` manages the `GAME_STATE` (TOWN, PLAYING, RESULT).
*   **Input Handling:** All inputs (keyboard, mouse, virtual gamepad) should be routed through `InputManager`.

## 🧪 Testing
*   No formal testing framework is currently integrated.
*   Manual verification via the browser and the `CheatManager` console (press `/` in-game) is the primary testing method.
