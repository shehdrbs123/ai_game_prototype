# 프로젝트 API 문서 인덱스

이 문서는 AI Game Prototype 프로젝트의 전체 아키텍처와 주요 모듈의 역할을 요약하고, 각 상세 문서로 안내합니다.

## 핵심 아키텍처 (Core Architecture)

| 클래스 | 파일 경로 | 역할 요약 | 상세 문서 |
| --- | --- | --- | --- |
| `Overview` | - | **전체 프로젝트 구조 및 아키텍처 개요** | [상세 보기](./Structure_API/Architecture_Overview.md) |
| `DIContainer` | `src/core/DIContainer.js` | 각종 Manager 모듈의 인스턴스를 중앙에서 관리하는 의존성 주입 컨테이너. | [상세 보기](./Structure_API/DIContainer.md) |
| `GameEngine` | `src/core/GameEngine.js` | 게임의 메인 루프, 상태 관리, 렌더링을 총괄하는 메인 컨트롤 타워. | [상세 보기](./Structure_API/GameEngine.md) |

## 관리자 모듈 (Managers)

| 클래스 | 파일 경로 | 역할 요약 | 상세 문서 |
| --- | --- | --- | --- |
| `AudioSystem` | `src/managers/AudioSystem.js` | 모든 소리(효과음, BGM)를 절차적으로 생성하고 재생합니다. | [상세 보기](./Structure_API/AudioSystem.md) |
| `CheatManager`| `src/managers/CheatManager.js`| 개발 및 테스트용 치트 콘솔 기능을 관리합니다. | [상세 보기](./Structure_API/CheatManager.md) |
| `DataManager` | `src/managers/DataManager.js` | 아이템, 제작법 등 게임의 모든 정적 데이터를 관리하는 중앙 저장소. | [상세 보기](./Structure_API/DataManager.md) |
| `EntityManager`| `src/managers/EntityManager.js`| 게임 월드 내의 모든 동적 객체(플레이어, 적 등)를 그룹별로 관리합니다. | [상세 보기](./Structure_API/EntityManager.md) |
| `InputManager`| `src/managers/InputManager.js` | 키보드, 마우스, 터치 등 모든 사용자 입력을 수신하고 상태를 관리합니다. | [상세 보기](./Structure_API/InputManager.md) |
| `MapManager` | `src/managers/MapManager.js` | '마을'과 '던전' 맵을 절차적으로 생성하고 타일 데이터를 관리합니다. | [상세 보기](./Structure_API/MapManager.md) |
| `PlayerSession`|`src/managers/PlayerSession.js`| 플레이어의 영구 데이터와 현재 탐험 데이터를 분리하여 관리합니다. | [상세 보기](./Structure_API/PlayerSession.md) |
| `UIManager` | `src/managers/UIManager.js` | HUD, 인벤토리, 제작 등 모든 UI의 렌더링과 상호작용 로직을 총괄합니다. | [상세 보기](./Structure_API/UIManager.md) |

## 기타

| 항목 | 파일 경로 | 역할 요약 | 상세 문서 |
| --- | --- | --- | --- |
| Entities & Data | `src/entities/`, `src/data/` | `Player`, `Enemy` 등 개별 객체 클래스 및 아이템 같은 원시 데이터. | [상세 보기](./Structure_API/Entities_and_Data.md) |
| **AI Skills** | `.gemini/skills/` | **프로젝트 특화 AI 전문가 스킬 (DI, Data, Visual)** | [상세 보기](./Structure_API/AI_Skills.md) |
