# `GameEngine`

**파일 경로**: `src/core/GameEngine.js`

## 역할
게임의 메인 컨트롤 타워. 메인 루프, 상태 관리(마을, 던전, 결과), 렌더링, 게임 이벤트 처리를 총괄합니다.

## 주요 종속성
*   **DIContainer**: 모든 Manager에 접근하기 위해 사용합니다.
*   **모든 Manager**: `InputManager`, `EntityManager`, `UIManager` 등 게임의 모든 하위 시스템을 직접 제어합니다.
*   **DOM**: Canvas 및 UI 요소에 직접 접근합니다.

## 주요 메서드
*   `start()`: 게임을 시작하고 메인 루프를 호출합니다.
*   `initTown()`: '마을' 상태를 초기화합니다.
*   `startRun()`: '던전' 상태를 초기화하고 맵과 적을 생성합니다.
*   `endRun(success)`: 던전 탐험을 종료하고 결과 화면을 처리합니다.
*   `loop(timestamp)`: 매 프레임 실행되는 메인 루프. 모든 객체의 상태를 업데이트하고 렌더링을 호출합니다.
*   `render()`: 타일맵, 모든 엔티티, 시야 효과 등을 Canvas에 그립니다.
