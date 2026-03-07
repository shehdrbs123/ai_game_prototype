# Technical Roadmap & Pending Tasks

이 문서는 AI Game Prototype의 핵심 시스템 구축 현황과 기획 확정 전후로 구현되어야 할 기술적 과제들을 관리합니다. 리드 프로그래머는 이 문서를 통해 시스템 간의 우선순위를 조정하고 구현 상태를 추적합니다.

## 1. 핵심 인프라 시스템 (Foundations)

| 시스템 명 | 상태 | 핵심 요구사항 | 관련 파일 |
| :--- | :---: | :--- | :--- |
| **DataSystem** | InProgress | 데이터 주도(Data-Driven) 구조, 동적 데이터 생성 및 로딩 전략 | `DataManager.js`, `gameData.js` |
| **AssetSystem** | Pending | 이미지/사운드 리소스의 비동기 로딩 및 로딩 진행률 관리 | `AssetManager.js` |
| **SoundSystem** | InProgress | BGM/SFX 채널 분리, 오디오 풀링, UI 사운드 재생 | `AudioSystem.js`, `SoundManager.js` |
| **UIManager** | InProgress | UI 레이어 우선순위(Order), 팝업 관리, UX 인터랙션 표준화 | `UIManager.js`, `ui/` |
| **InputSystem** | InProgress | 입력 추상화(Action Mapping), 키 바인딩 변경 지원 | `InputManager.js` |

## 2. 게임 로직 및 엔진 확장 (Engine & Logic)

| 시스템 명 | 상태 | 핵심 요구사항 | 관련 파일 |
| :--- | :---: | :--- | :--- |
| **SceneManager** | Pending | 타이틀/인게임/결과 등 전역 상태(FSM) 및 씬 전환 제어 | TBD |
| **CameraSystem** | Pending | 플레이어 추적, 화면 흔들림, 줌, 2D/3D 전환 대응 구조 | TBD |
| **PhysicsSystem** | Pending | 충돌 판정 최적화(Spatial Partitioning), 트리거 시스템 | `EntityManager.js` 내 로직 분리 필요 |
| **EventBus** | Pending | 시스템 간 디커플링을 위한 Pub/Sub 메시징 시스템 | `utils.js` 또는 전역 이벤트 클래스 |

## 3. 서비스 및 편의 시스템 (Service & Tools)

| 시스템 명 | 상태 | 핵심 요구사항 | 관련 파일 |
| :--- | :---: | :--- | :--- |
| **SaveLoadSystem** | Pending | 플레이어 진행 상황 직렬화, 로컬 저장 및 버전 관리 | TBD |
| **DebugSystem** | InProgress | 런타임 콘솔, 치트 명령, 성능 모니터링, 기즈모 표시 | `CheatManager.js` |

---

## 차기 작업 우선순위 (Next Steps)
1. **의존성 맵 정의:** 시스템 간 참조 규칙(DIP) 및 초기화 순서 확립 (진행 중)
2. **이벤트 프로토콜:** 매니저 간 직접 참조를 줄이기 위한 이벤트 버스 설계
3. **데이터 로딩 전략:** `AssetManager`와 `DataManager` 간의 연동 시퀀스 정의
