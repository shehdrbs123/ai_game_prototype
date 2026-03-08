# Problem Definition: [F-04] Data JSON Editor Expansion

## 1. Background
- 에디터에서 전체 게임 데이터를 JSON 기반으로 관리하기 위한 기반 구축 요청.

## 2. Infrastructure Reference
- Project Root: `C:/Github/ai_game_prototype_worktree`

## 3. Resource Mapping
- `src/managers/DataManager.js`
- `src/data/json/*.json`
- `src/core/GameEngine.js`
- `src/entities/Enemy.js`
- `src/managers/PlayerSession.js`
- `server.js`
- `Editor/index.html`, `Editor/editor.js`, `Editor/editor.css`

## 4. Requirements
- DataManager가 JSON 파일들을 로드해야 함.
- gameData.js 단일 구조를 데이터셋 단위 JSON으로 분리.
- 하드코딩 밸런스 일부를 JSON으로 외부화.
- Editor에서 dataset 단위 CRUD 지원.

## 5. Constraints
- 기존 플레이 동작과 값은 최대한 유지.
- 최소 침습 변경.

## 6. Open Questions
- 없음 (사용자 '그래'로 다음 단계 진행 승인).
