# `MapManager`

**파일 경로**: `src/managers/MapManager.js`

## 역할
'마을'과 '던전' 맵을 절차적으로 생성하고, 맵의 타일 데이터(`grid`)를 관리합니다.

## 주요 API
*   `generateTown()`: 고정된 마을 맵을 생성합니다.
*   `generateDungeon()`: 무작위 던전 맵을 생성합니다.
*   `checkWall(x, y, radius)`: 특정 좌표 주변에 벽이 있는지 확인합니다.
