# Research Result: Custom Skills Creation

## 1. Relevant Files & Symbols (Verified Paths)
- [x] `gemini.md`: 프로젝트의 핵심 지침 (매니저 패턴, DI 컨테이너, 데이터 중심 설계 명시 확인)
- [x] `src/core/DIContainer.js`: `register(name, instance)`, `get(name)` 메서드를 통한 서비스 관리 로직 확인됨.
- [x] `src/data/gameData.js`: `RAW_DATA` (settings, items, recipes) 구조 확인됨. 밸런싱 작업 시 이 파일을 주 타겟으로 삼아야 함.
- [x] `src/managers/`: 각 매니저는 생성자에서 DI 컨테이너(`c`)를 주입받아 `this.c.get('ManagerName')`으로 의존성 해결.
- [x] `src/main.js`: (추정) 서비스 등록이 일어나는 진입점. 스킬에서 새로운 시스템 추가 시 참고 필요.

## 2. Issue Analysis / Root Cause
- **문제점**: 현재 프로젝트는 순수 JS와 HTML로 구성되어 있어, 코드 수정 시 아키텍처 컨벤션(DI 접근 등)을 수동으로 지켜야 함.
- **필요성**: AI 에이전트가 매번 전체 파일을 읽지 않고도, 프로젝트의 DI 구조와 데이터 포맷을 즉시 이해하고 일관성 있게 코드를 작성할 수 있도록 돕는 전문가 지침(Skill)이 부재함.
- **폴더 부재**: `.gemini/skills/` 디렉토리가 현재 존재하지 않음 (Test-Path 결과 False).

## 3. Infrastructure & Conventions
- **Dependency Injection**: `DIContainer`를 통해 모든 시스템이 연결됨. 전역 변수 지양.
- **Data-Driven**: 게임 로직과 데이터가 분리되어 있음. 새로운 아이템이나 레시피 추가 시 `gameData.js` 수정이 우선임.
- **Manager Pattern**: 모든 글로벌 시스템은 `Manager` 클래스로 캡슐화되어야 함.
- **UI Architecture**: Tailwind CSS(CDN)를 사용하며 `UIManager`가 각 View(InventoryView 등)를 관리함.

## 4. Technical Risks & Side-effects
- **DI 순환 참조**: 새로운 매니저 추가 시 DI 등록 순서에 따른 초기화 문제 발생 가능성.
- **데이터 정합성**: `gameData.js` 수정 시 ID 중복이나 잘못된 타입 지정 시 런타임 에러 발생 위험.
- **스킬 오작동**: 스킬의 `description`이 모호할 경우, 의도하지 않은 시점에 스킬이 활성화되어 컨텍스트를 오염시킬 수 있음.

## 5. Internal Reflection
- **Mistakes**: `src/main.js`를 직접 읽어보지 않고 추정으로만 기록함. Plan 단계 이전에 진입점 구조를 명확히 할 필요가 있음.
- **Improvements**: `.gemini/skills/` 디렉토리 생성은 쉘 명령어로 수행해야 하며, 이는 Execution 단계의 첫 번째 작업이 될 것임.
