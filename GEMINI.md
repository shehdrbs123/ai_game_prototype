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

### 🛠️ Unity/C# Migration Readiness (Core Mandate)
본 프로젝트의 모든 JavaScript 코드는 향후 **Unity(C#) 환경으로의 이식**을 전제로 작성됩니다. 따라서 아래의 원칙을 반드시 준수해야 합니다.

1.  **클래스 기반 구조:** JavaScript의 프로토타입 기반 핵(Hack)을 지양하고, C# 클래스와 유사한 구조(`class`, `constructor`, `static`)를 유지합니다.
2.  **명시적 인터페이스 지향:** `BaseManager`를 통한 생명주기(`init`, `update`, `destroy`) 관리를 철저히 하여 Unity의 `MonoBehaviour` 또는 `ScriptableObject` 생명주기와 대응시킵니다.
3.  **데이터와 로직의 분리:** C#의 `Serializable` 데이터 구조(POCO)로 변환하기 쉽도록 JSON 및 데이터 객체를 정형화합니다.
4.  **느슨한 결합 (Decoupling):** Unity의 `EventSystem` 또는 `Action/Delegate`로 대체 가능한 `EventBus` 패턴을 적극 활용합니다.
5.  **DI(의존성 주입):** Unity의 `Zenject` 또는 `Service Locator` 패턴으로 전환하기 쉽도록 `DIContainer`를 통한 참조 관리를 고수합니다.

---

*   **Manager Pattern:** When adding new global systems, create a Manager class and register it in `src/main.js` via the `DIContainer`.
*   **Dependency Access:** Prefer getting dependencies from the `DIContainer` rather than global variables.
*   **Data Separation:** Keep item definitions, recipes, and balance constants in `src/data/gameData.js`.
*   **State Management:** The `GameEngine` manages the `GAME_STATE` (TOWN, PLAYING, RESULT).
*   **Input Handling:** All inputs (keyboard, mouse, virtual gamepad) should be routed through `InputManager`.

## 🧪 Testing
*   No formal testing framework is currently integrated.
*   Manual verification via the browser and the `CheatManager` console (press `/` in-game) is the primary testing method.
