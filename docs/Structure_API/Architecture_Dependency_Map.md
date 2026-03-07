# 시스템 의존성 및 생명주기 설계 (Architecture Dependency Map)

이 문서는 AI Game Prototype의 시스템 간 참조 규칙(Dependency)과 초기화 순서(Lifecycle)를 정의합니다. 리드 프로그래머는 이 가이드를 통해 코드의 결합도를 낮추고 유지보수성을 확보합니다.

## 1. 계층형 아키텍처 (Layered Architecture)

시스템은 아래와 같이 4개의 계층으로 구분되며, **상위 계층은 하위 계층을 알 수 있지만 하위 계층은 상위 계층을 직접 참조해서는 안 됩니다.**

| 계층 | 주요 컴포넌트 | 역할 |
| :--- | :--- | :--- |
| **Layer 4: UI** | `UIManager`, `HUDView`, `InventoryView` | 사용자 인터페이스 표현 및 입출력 처리 |
| **Layer 3: Game Logic** | `PlayerSession`, `CraftingManager`, `CheatManager` | 게임의 규칙, 상태 변경, 진행 상황 관리 |
| **Layer 2: Engine Services**| `EntityManager`, `MapManager`, `AudioSystem` | 월드 객체 관리, 타일맵, 사운드 출력 등 핵심 서비스 |
| **Layer 1: Foundations** | `DataManager`, `AssetManager`, `InputManager` | 데이터 로딩, 리소스 관리, 저수준 입력 처리 |
| **Infrastructure** | `DIContainer`, `GameEngine` | 시스템의 조립(Wiring) 및 메인 루프 실행 |

---

## 2. 초기화 및 실행 순서 (Lifecycle Sequence)

모든 시스템은 `DIContainer`에 등록된 후 아래 순서에 따라 준비(Setup)되어야 합니다.

1.  **Bootstrap (정적 등록):** `main.js`에서 모든 매니저 인스턴스를 생성하여 `DIContainer`에 등록합니다.
2.  **Configuration (데이터 로딩):** `DataManager`가 `gameData.js` 및 외부 JSON 데이터를 로드합니다.
3.  **Asset Loading (리소스 준비):** `AssetManager`가 이미지, 스프라이트 시트, 오디오 파일을 비동기로 로딩합니다. **(이 단계가 완료될 때까지 게임 루프는 대기하거나 로딩 화면을 표시해야 함)**
4.  **System Setup (상호 참조):** 각 매니저의 `init()` 메서드를 호출하여 필요한 다른 매니저의 참조를 가져옵니다.
5.  **Game Start (루프 시작):** `GameEngine.start()`를 호출하여 `requestAnimationFrame` 루프를 진동시킵니다.

---

## 3. 의존성 주입 규칙 (Dependency Injection Rules)

*   **직속 참조 금지:** 클래스 내부에서 `new Manager()`를 직접 호출하지 않습니다. 반드시 `DIContainer`를 통해 주입받습니다.
*   **생성자 제한:** 생성자에서는 의존성 주입(`app`)만 수행하고, 복잡한 로직이나 상호 참조는 `init()` 또는 `onStart()` 단계에서 수행합니다.
*   **이벤트 기반 통신 (DIP):** 하위 계층(예: `EntityManager`)이 상위 계층(예: `UIManager`)에 정보를 전달해야 할 때는 직접 참조 대신 **Event/Message Bus**를 사용합니다.

---

## 4. 시스템 간 의존성 맵 (Current)

| 시스템 | 의존하는 시스템 (Dependency) | 비고 |
| :--- | :--- | :--- |
| `GameEngine` | `InputManager`, `EntityManager`, `UIManager` | 메인 루프에서 각 시스템 호출 |
| `EntityManager` | `MapManager`, `DataManager` | 충돌 체크 및 엔티티 스탯 정보 필요 |
| `UIManager` | `PlayerSession`, `DataManager` | 플레이어 상태 및 아이템 정보 표시 |
| `MapManager` | `DataManager`, `AssetManager` | 타일 데이터 및 텍스처 리소스 필요 |
| `PlayerSession` | `DataManager` | 초기 아이템 및 능력치 데이터 필요 |

---

## 5. 향후 개선 사항 (Architecture Debt)

*   **Global Event Bus 도입:** `UIManager`가 `PlayerSession`을 직접 관찰하지 않고, `PLAYER_DATA_CHANGED` 이벤트를 구독하는 방식으로 전환 필요.
*   **Loading State 명시화:** `AssetManager`의 로딩 완료 이벤트를 `GameEngine`이 수신하여 시작하는 명확한 핸드쉐이크 로직 추가.
