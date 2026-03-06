# Problem Definition: F-01 Custom Skills Creation

## 1. Background
- 사용자는 이 프로젝트(Extraction Action Prototype)의 효율적인 개발과 관리를 위해 전문가 페르소나가 활용할 수 있는 커스텀 스킬들을 정의하고 생성하기를 원함.
- 현재 프로젝트는 Manager 패턴, DI 컨테이너, 데이터 중심 설계를 따르고 있어, 이에 특화된 지침을 가진 스킬이 필요함.

## 2. Infrastructure Reference (Stateless 기초)
- **Project Root**: `C:\Github\ai_game_prototype_skill`
- **Workflow Instructions**: `C:\Users\shehd\.ai\Workflow\`
- **Skills Directory**: `.gemini/skills/` (프로젝트 전용 스킬 저장소로 선정)

## 3. Resource Mapping (Explicit Paths)
- [ ] `src/core/DIContainer.js`: DI 컨테이너 구조 분석 대상
- [ ] `src/data/gameData.js`: 게임 데이터 형식 분석 대상
- [ ] `src/managers/`: 매니저 클래스들 (Input, UI, Audio 등)의 아키텍처 분석 대상
- [ ] `gemini.md`: 프로젝트 전역 지침서 (우선순위 최상위)

## 4. Requirements & Standard Mode
- **Mode:** Standard (10-Phase Pipeline)
- [REQ-01] 프로젝트 아키텍처(DI, Manager)를 이해하고 보조할 수 있는 스킬 설계.
- [REQ-02] 게임 데이터 및 밸런싱을 관리하기 위한 특화 스킬 설계.
- [REQ-03] UI/Canvas 연출 및 이펙트를 구현하기 위한 시각 효과 스킬 설계.
- [REQ-04] 설계된 스킬들을 `.gemini/skills/` 디렉토리에 실제 파일(`SKILL.md`)로 생성.

## 5. Constraints & Assumptions
- 스킬은 `.gemini/skills/` 폴더 내에 각 스킬별 하위 디렉토리로 구성되어야 함.
- 각 스킬은 `SKILL.md`를 필수로 포함하며, 필요 시 `references` 폴더를 포함할 수 있음.
- **Assumptions**: 사용자가 제안된 스킬 목록 중 일부를 선택하거나 추가 요청할 수 있음.

## 6. Open Questions
- **Q1**: 현재 프로젝트 루트에 `.gemini/skills/` 디렉토리가 없습니다. 생성하여 진행해도 될까요?
- **Q2**: 제안드린 3가지 스킬(Manager-Architect, Game-Data-Expert, Visual-Asset-Designer) 외에 추가로 필요한 전문 분야가 있나요?

## 7. Internal Reflection
- **Mistakes**: 최초 답변 시 워크플로우를 즉시 시작하지 않고 Inquiry로 처리하려 했음. `GLOBAL_GUIDELINES`에 따라 Directive 감지 즉시 Standard Mode로 전환함.
- **Improvements**: Directive 감지 로직을 강화하여 첫 번째 턴부터 워크플로우를 초기화하도록 개선 필요.
