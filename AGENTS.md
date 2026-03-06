# Repository Guidelines

## Project Structure & Module Organization
This is a plain HTML/CSS/JavaScript game prototype (no bundler). Keep code modular and aligned with current folders:
- `src/core/`: engine services (`GameEngine`, `DIContainer`)
- `src/managers/`: system managers (UI, input, map, data, audio, entities)
- `src/entities/`: gameplay objects (`Player`, `Enemy`, `Projectile`, etc.)
- `src/data/gameData.js`: tunable game balance/config values
- `docs/Structure_API/`: API and architecture docs
- `private_assets/Sounds/`: non-public audio assets

Avoid putting gameplay logic directly in `index.html`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `node server.js`: run the local server at `http://localhost:3000`.
- `start-server.bat`: run with `nodemon` for auto-reload.
- `npm test`: placeholder script (currently fails intentionally).

Example:
```bash
npm install
node server.js
```

## Coding Style & Naming Conventions
- Use 4-space indentation and semicolons (match existing files).
- Use ES modules in `src/` (`import` / `export`).
- Naming: classes `PascalCase`, functions/variables `camelCase`, constants `UPPER_SNAKE_CASE`.
- Keep managers single-responsibility; wire dependencies through `DIContainer`.

## Testing Guidelines
There is no automated suite yet. Validate with:
- Local run via `node server.js`
- Manual checks on impacted systems (movement, combat, UI, inventory, audio)
- Browser console review for runtime errors

If you add tests, place them under `tests/` and name files `*.test.js`.

## Commit & Pull Request Guidelines
Git history uses bracketed tags, e.g. `[feat] : ...`, `[docs] : ...`, `[chore] : ...`.

Use concise, imperative commit subjects and keep one logical change per commit.
PRs should include:
- Purpose and scope
- Key files changed (example: `src/managers/UIManager.js`)
- Manual test steps and results
- Screenshots/short clips for visible UI or gameplay changes

## Security & Configuration Tips
- Do not commit secrets.
- Keep private media inside `private_assets/` and avoid exposing internal-only assets in docs.

## Project Skills
- `game-planning`: Use when the user asks for game concepting, core loop/progression design, MVP scope, milestone planning, risk planning, or playtest KPI definition.
  - Path: `C:/Github/ai_game_prototype_worktree/skills/game-planning/SKILL.md`
  - Trigger examples:
    - "게임 기획안 만들어줘"
    - "이 아이디어로 MVP 범위 정리해줘"
    - "알파/베타/런치 마일스톤 짜줘"
- `commit-helper`: Use when the user asks to split commits by logic/feature/dependency boundaries, generate commit messages in the required template, or automate commit command usage.
  - Path: `C:/Github/ai_game_prototype_worktree/skills/commit-helper/SKILL.md`
  - Trigger examples:
    - "변경사항 커밋 단위로 나눠줘"
    - "커밋 메시지 템플릿으로 자동 커밋해줘"
    - "논리적으로 분리 커밋하고 싶어"
