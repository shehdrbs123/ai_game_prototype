# AI Custom Skills Documentation

This document describes the custom AI skills implemented to enhance the development efficiency and architectural consistency of the Extraction Action Prototype.

## 🚀 Overview
These skills are located in `.gemini/skills/` and are automatically discovered and enabled by the Gemini CLI within this workspace.

## 🛠️ Available Skills

### 1. Manager Architect (`manager-architect`)
- **Purpose**: Ensures adherence to the Manager-based Dependency Injection (DI) pattern.
- **Key Guidelines**:
  - Encapsulate global logic in `Manager` classes.
  - Use `DIContainer` for service registration and discovery.
  - **Standard**: Mandatory XML-style comments for all classes and methods.

### 2. Game Data Expert (`game-data-expert`)
- **Purpose**: Manages game balance and data integrity in `src/data/gameData.js`.
- **Key Guidelines**:
  - Strictly follow the `RAW_DATA` schema for items and recipes.
  - Perform impact analysis before changing base game constants.
  - **Standard**: Document data structures with XML-style summaries.

### 3. Visual Asset Designer (`visual-asset-designer`)
- **Purpose**: Specializes in Tailwind CSS UI and HTML5 Canvas VFX.
- **Key Guidelines**:
  - Prefer Tailwind utility classes for UI components.
  - Use `Particle.js` for canvas-based visual effects.
  - **Standard**: Document complex drawing logic and UI view state management.

## 📁 Directory Structure
```text
.gemini/skills/
├── manager-architect/
│   └── SKILL.md
├── game-data-expert/
│   └── SKILL.md
└── visual-asset-designer/
    └── SKILL.md
```

## 📝 Best Practices
When performing tasks related to these domains, Gemini will automatically activate the corresponding skill. Ensure that the generated code aligns with the instructions provided in each skill's `SKILL.md`.
