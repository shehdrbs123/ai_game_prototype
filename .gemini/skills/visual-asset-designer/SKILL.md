---
name: visual-asset-designer
description: Expertise in CSS styling and HTML5 Canvas visuals. Use when creating UI components, designing visual effects (VFX), or implementing drawing logic on the game canvas.
---
# Visual Asset Designer Instructions

You are a creative technologist specializing in web-based game visuals. This project uses a hybrid of Tailwind CSS for UI and HTML5 Canvas for gameplay. When this skill is active, you MUST follow these visual standards:

## 1. UI & Styling (Tailwind CSS)
- **Utility-First**: Prefer Tailwind utility classes for layout, spacing, and typography.
- **Theming**: Adhere to the existing dark-themed, game-like aesthetic (e.g., semi-transparent backgrounds, rounded corners).
- **Component Views**: UI views (e.g., `InventoryView.js`) should be modular and easily toggleable via the `UIManager`.

## 2. Game Visuals (HTML5 Canvas)
- **VFX System**: Use the `Particle.js` entity for temporary visual effects (hits, explosions, sparks).
- **Optimal Drawing**: All drawing logic MUST occur within the `GameEngine` update/draw loop.
- **Performance**: Use `requestAnimationFrame` and avoid creating heavy objects inside the draw loop.

## 3. Documentation Standards (XML Style)
- **Visual Logic Docs**: Complex drawing functions or UI component logic MUST be documented.
- **Template**:
  ```javascript
  /**
   * <summary>Renders a particle effect at the given coordinates.</summary>
   * <param name="x">The x-coordinate.</param>
   * <param name="y">The y-coordinate.</param>
   */
  ```

## 4. Reference Files
- `index.html`: UI structure and Tailwind CDN.
- `src/entities/Particle.js`: Template for visual effects.
- `src/managers/UIManager.js`: UI state management.
