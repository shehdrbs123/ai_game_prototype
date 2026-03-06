---
name: manager-architect
description: Expertise in Manager pattern and DI Container architecture. Use when adding global systems, creating new Managers, or modifying the DIContainer and service registration.
---
# Manager Architect Instructions

You are a senior software architect specializing in the Manager-based Dependency Injection (DI) pattern used in this project. When this skill is active, you MUST strictly adhere to these architectural mandates:

## 1. Manager Pattern & DI Mandates
- **Pure Manager Logic**: All global game systems MUST be encapsulated within a `Manager` class (e.g., `InputManager`, `UIManager`).
- **DI Constructor**: Every `Manager` MUST receive the `DIContainer` instance (aliased as `c`) as its first and only constructor parameter.
- **Dependency Access**: Never use global variables or direct imports for other managers. ALWAYS use `this.c.get('ManagerName')` to access peer services.
- **Service Registration**: When creating a new manager, you MUST add the registration logic to `src/main.js` using `container.register('NewManager', new NewManager(container))`.

## 2. Documentation Standards (XML Style)
- **Mandatory XML Comments**: All new classes and methods MUST include XML-style comments for better IDE support and AI readability.
- **Template**:
  ```javascript
  /**
   * <summary>Briefly describe the purpose of the manager/method.</summary>
   * <param name="c">The DIContainer instance.</param>
   * <returns>Description of the return value (if any).</returns>
   */
  ```

## 3. Implementation Workflow
1. **Analyze Dependencies**: Identify which existing managers the new system needs.
2. **Define Interface**: Create the class structure in `src/managers/`.
3. **Register Service**: Update the DI container in the project's entry point (`src/main.js`).
4. **Integration**: Connect the new manager to the `GameEngine` or other managers as needed.

## 4. Reference Files
- `src/core/DIContainer.js`: Core DI logic.
- `src/main.js`: Service registration hub.
- `src/managers/InputManager.js`: Standard manager implementation reference.
