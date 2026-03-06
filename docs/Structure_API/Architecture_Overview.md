# 프로젝트 아키텍처 및 코드 구조 개요 (Architecture Overview)

이 문서는 AI Game Prototype의 전체적인 코드 구조와 시스템 간의 상호작용 방식을 설명합니다.

## 1. 핵심 아키텍처 원칙

이 프로젝트는 다음과 같은 세 가지 주요 원칙에 기반하여 설계되었습니다.

1.  **매니저 패턴 (Manager Pattern):** 게임의 각 주요 기능(입력, 엔티티, UI, 사운드 등)은 독립적인 `Manager` 클래스에 의해 관리됩니다.
2.  **의존성 주입 (Dependency Injection):** `DIContainer`를 통해 모든 매니저 인스턴스를 중앙에서 관리하며, 각 매니저는 필요한 다른 매니저에 접근할 때 이 컨테이너를 사용합니다. 이를 통해 모듈 간의 결합도를 낮춥니다.
3.  **데이터 중심 설계 (Data-Driven Design):** 아이템, 제작법, 초기 스탯 등 모든 게임 밸런스 데이터는 로직과 분리되어 `src/data/gameData.js`에서 관리됩니다.
4.  **UI MVVM 패턴:** `UIManager`는 Model(`PlayerSession`)과 View(HTML) 사이에서 ViewModel 역할을 수행하며, 데이터와 UI의 상태를 동기화합니다.

---

## 2. 프로젝트 디렉토리 구조

```text
/ (Root)
├── index.html          # 게임의 메인 뼈대 및 UI 레이어 정의
├── server.js           # 정적 파일 제공을 위한 Node.js 서버
├── style.css           # 게임 전체 스타일 및 UI 애니메이션
└── src/                # 소스 코드 루트
    ├── main.js         # 엔트리 포인트: DI 컨테이너 초기화 및 게임 시작
    ├── core/           # 엔진의 핵심 구성 요소 (엔진, DI 컨테이너)
    ├── managers/       # 도메인별 로직을 담당하는 매니저 클래스들
    ├── entities/       # 게임 내 동적 객체 (플레이어, 적, 아이템 등)
    ├── data/           # 정적 게임 데이터 (아이템, 레시피, 설정)
    └── utils.js        # 공통 유틸리티 함수
```

---

## 3. 실행 흐름 (Execution Flow)

게임이 시작되고 실행되는 과정은 다음과 같습니다.

1.  **초기화 (`main.js`):**
    *   `DIContainer` 인스턴스(`app`)를 생성합니다.
    *   모든 매니저(`DataManager`, `InputManager`, `UIManager` 등)를 생성하여 컨테이너에 등록합니다.
    *   `GameEngine`을 생성하고 컨테이너를 주입합니다.
    *   `gameEngine.start()`를 호출하여 메인 루프를 시작합니다.

2.  **메인 루프 (`GameEngine.loop`):**
    *   `InputManager`를 통해 현재 프레임의 입력을 확인합니다.
    *   `isGamePaused` 상태가 아닐 때만 `update(deltaTime)`를 실행합니다.
    *   `EntityManager`가 관리하는 모든 엔티티(플레이어, 적 등)의 상태를 업데이트합니다.
    *   `render()`를 호출하여 Canvas에 맵과 엔티티를 그립니다.
    *   `UIManager`를 통해 현재 상태에 맞는 UI를 갱신합니다.

3.  **상태 전환 (`GAME_STATE`):**
    *   **TOWN (마을):** 상호작용 가능한 NPC, 창고, 시설 업그레이드 등의 로직이 실행됩니다.
    *   **PLAYING (던전 탐험):** 절차적 맵 생성, 전투, 아이템 획득, 탈출 등의 로직이 실행됩니다.
    *   **RESULT (결과 창):** 탐험 결과를 요약하여 보여주고 보상을 정산합니다.

---

## 4. 매니저 간의 관계

대부분의 매니저는 생성 시 `DIContainer`를 전달받아 필요한 다른 시스템에 접근합니다.

*   `UIManager` ↔ `PlayerSession` (인벤토리 및 스탯 표시)
*   `EntityManager` ↔ `MapManager` (충돌 체크 및 타일 정보 확인)
*   `InputManager` ↔ `GameEngine` (공격/이동 명령 전달)
*   `AudioSystem` (모든 시스템에서 사운드 재생 요청)

---

## 5. 데이터 관리 (`DataManager` & `gameData.js`)

`DataManager`는 `src/data/gameData.js`에 정의된 `RAW_DATA`를 읽어와 게임 내에서 쉽게 접근할 수 있도록 가공합니다.
새로운 아이템이나 제작법을 추가하고 싶다면, 코드를 수정할 필요 없이 `gameData.js`의 배열에 데이터만 추가하면 즉시 게임에 반영됩니다.
