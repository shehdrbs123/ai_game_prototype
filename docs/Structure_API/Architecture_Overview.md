# 프로젝트 아키텍처 및 코드 구조 개요 (Architecture Overview)

이 문서는 AI Game Prototype의 전체적인 코드 구조와 시스템 간의 상호작용 방식을 설명합니다.

## 1. 핵심 아키텍처 원칙

이 프로젝트는 다음과 같은 세 가지 주요 원칙에 기반하여 설계되었습니다.

1.  **매니저 패턴 (Manager Pattern):** 게임의 각 주요 기능(입력, 엔티티, UI, 사운드 등)은 독립적인 `Manager` 클래스에 의해 관리됩니다.
2.  **의존성 주입 (Dependency Injection):** `DIContainer`를 통해 모든 매니저 인스턴스를 중앙에서 관리하며, 각 매니저는 필요한 다른 매니저에 접근할 때 이 컨테이너를 사용합니다. 이를 통해 모듈 간의 결합도를 낮춥니다.
3.  **3D 렌더링 시스템 (Rendering System):** `Three.js`를 사용하여 3D 공간을 구축하고, `FBXLoader`를 통해 3D 에셋을 로드합니다. `Animator` 클래스를 통해 본(Bone) 애니메이션을 제어합니다.
4.  **데이터 중심 설계 (Data-Driven Design):** 아이템, 제작법, 초기 스탯 등 모든 게임 밸런스 데이터는 로직과 분리되어 `src/data/gameData.js`에서 관리됩니다.
5.  **UI MVVM 패턴:** `UIManager`는 Model(`PlayerSession`)과 View(HTML) 사이에서 ViewModel 역할을 수행하며, 데이터와 UI의 상태를 동기화합니다.

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
    *   `EntityManager`가 관리하는 모든 엔티티(플레이어, 적 등)의 상태와 애니메이션을 업데이트합니다.
    *   `Three.js WebGLRenderer`를 호출하여 3D Scene을 렌더링합니다.
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

---

## 6. Unity/C# 이식 가이드 (Porting Guide)

본 아키텍처는 향후 Unity(C#) 환경으로의 원활한 이식을 고려하여 설계되었습니다. 주요 컴포넌트의 대응 관계는 다음과 같습니다.

| Web/JS Component | Unity/C# Equivalent | 이식 시 주의사항 |
| :--- | :--- | :--- |
| `DIContainer` | `Zenject` / `Extenject` / `Service Locator` | 인터페이스 기반 바인딩 추천 |
| `Three.js Scene` | `Unity Scene` | 좌표계 차이(Y-up vs Z-up) 유의 |
| `Animator.js` | `Animator Controller` | 파라미터 기반 상태 전환 구조 유지 |
| `BaseManager` | `MonoBehaviour` 또는 `ScriptableObject` | `init()` -> `Awake`/`Start` 대응 |
| `EventBus` | `UnityEvent`, `Action`, `delegate` | 형식 안정성(Type-safe) 이벤트 정의 |
| `DataManager` | `JSON Serialization` + `ScriptableObject` | `gameData.js`를 JSON/C# Class로 변환 |
| `GameEngine` | `GameManager` (Singleton or DI) | `loop()` -> `Update()` / `FixedUpdate()` |
| `EntityManager` | `Object Pooling` + `Factory Pattern` | Unity의 `Instantiate`/`Destroy` 최적화 |

**이식성 확보를 위한 코딩 규칙:**
- 클래스 멤버 변수와 메소드에 대한 명확한 접근 제어자(Public/Private)를 주석으로 명시.
- 동적 타입(`any`) 사용을 지양하고, 가능한 정형화된 객체 구조 유지.
- 비동기 로직(`Promise`, `async/await`)은 Unity의 `Coroutine` 또는 `UniTask`로 변환하기 쉬운 구조로 작성.
