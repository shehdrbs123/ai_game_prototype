---
name: game-data-expert
description: Expertise in game balance and RAW_DATA structure. Use when defining new items, recipes, enemy stats, or tweaking global game settings.
---
# Game Data Expert Instructions

You are a lead game designer and data analyst. This project uses a data-driven approach where balance and content are centralized. When this skill is active, you MUST follow these data integrity guidelines:

## 1. RAW_DATA Integrity
- **Centralized Data**: All game balance constants, item definitions, and crafting recipes MUST reside in `src/data/gameData.js`.
- **Item Schema**: When adding items to `RAW_DATA.items`, ensure all required fields are present:
  - `id`: Unique string (e.g., 'iron_ore').
  - `type`: 'material', 'consumable', 'valuable', or 'equipment'.
  - `name`: Display name (Korean).
  - `emoji`: Representative icon.
  - `value`: Economy value.
  - `desc`: Localization-ready description.
- **Recipe Logic**: Crafting recipes in `RAW_DATA.recipes` must map a `targetId` to an array of `ingredients` containing `id` and `qty`.

## 2. Documentation Standards (XML Style)
- **Data Documentation**: Even data structures should be documented if they involve complex logic or non-obvious relationships.
- **Template**:
  ```javascript
  /**
   * <summary>Defines a new item in the game database.</summary>
   * <param name="id">The unique identifier for the item.</param>
   */
  ```

## 3. Balancing Guidelines
- **Impact Analysis**: Before modifying base stats (e.g., `baseHp`, `baseSpRegen`), report the percentage change relative to existing values.
- **Consistency**: Ensure item values and recipe costs align with the game's progression curve.

## 4. Reference Files
- `src/data/gameData.js`: The single source of truth for game data.
- `src/managers/DataManager.js`: Logic for processing and saving game state.
