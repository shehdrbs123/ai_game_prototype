# `EntityManager`

**파일 경로**: `src/managers/EntityManager.js`

## 역할
게임 월드 내의 모든 동적 객체(플레이어, 적, 아이템 등)를 그룹별로 저장하고 관리합니다.

## 주요 속성
*   `player`, `enemies`, `items`, `interactables`, `projectiles`, `particles`

## 주요 API
*   `clear()`: 모든 엔티티 목록을 초기화합니다.
*   `createParticles(x, y, color, count)`: 지정된 위치에 파티클을 생성합니다.
