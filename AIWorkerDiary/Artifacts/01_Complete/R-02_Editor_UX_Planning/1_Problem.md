# Problem Definition: [R-02] Editor UX Planning

## 1. Background
- 현재 Editor는 단일 JSON textarea 중심이라 실제 기획자 설정 작업에서 실수 방지, 대량 편집, 구조 탐색이 어렵다.
- 사용자는 "실사용자가 설정하기 쉬운 Editor"를 목표로 데이터셋별 UI 분리 여부와 Sheet/UI 방식의 적합성을 검토했다.
- 이번 작업 범위는 구현 전 단계로, 워크플로우 지침에 따라 Plan(Phase 3)까지 완료하는 것이다.

## 2. Infrastructure Reference (Stateless 기초)
- **Project Root**: `C:/Github/ai_game_prototype_worktree`
- **Workflow Root**: `C:/Users/shehd/.ai/Workflow`
- **Tracker**: `./AIWorkerDiary/WORK-TRACKER.md`
- **Artifact Root**: `./AIWorkerDiary/Artifacts/00_Draft/R-02_Editor_UX_Planning`

## 3. Resource Mapping (Explicit Paths)
- [ ] 대상 파일 1: `./Editor/index.html` (Editor UI 레이아웃 엔트리)
- [ ] 대상 파일 2: `./Editor/editor.js` (데이터셋 로드/저장/모니터/이벤트 핸들러)
- [ ] 대상 파일 3: `./Editor/editor.css` (편집 UI 스타일)
- [ ] 대상 파일 4: `./Editor/server.js` (dataset API, monitor API, event override API)
- [ ] 대상 파일 5: `./Editor/README.md` (사용자 운영 문서)
- [ ] 참고 문서 1: `./docs/index.md` (docs entry)
- [ ] 참고 문서 2: `./docs/Structure_API/DataManager.md` (데이터 구조/운영 연계 참조)

## 4. Requirements & Standard Mode
- **Mode:** Standard (10-Phase Pipeline)
- 데이터셋별 UX 분리 전략을 확정한다.
- 기획자 관점에서 Form(UI)과 Sheet(Grid) 사용 경계를 명시한다.
- 저장/검증/되돌리기/변경 추적 등 운영 필수 기능을 계획에 포함한다.
- Plan 산출물은 Phase 4에서 바로 구현 가능한 원자 단위 절차로 작성한다.
- 이번 턴은 사용자 요청에 따라 Phase 3까지만 진행하고 Hold 상태로 종료한다.

## 5. Constraints & Assumptions
- 기존 API(`/api/datasets`, `/api/monitor`, `/api/event-override`)는 유지하고 프론트 UX를 확장한다.
- 번들러 없는 plain HTML/CSS/JS 구조를 유지한다.
- 자동 테스트 인프라가 없으므로 단계별 수동 검증 포인트를 설계 단계에서 강제한다.
- 데이터 파일 포맷(`src/data/json/*.json`) 호환성을 깨지 않는다.

## 6. Open Questions
- Q1. 1차 구현 범위에 keyboard 대량 편집(Grid 복수 셀 복붙)을 포함할지?
- Q2. 변경 이력(diff) 저장은 세션 메모리 수준으로 시작할지, 파일 저장 이력까지 포함할지?
- Q3. 데이터셋 우선순위는 `dungeonOfferingSystem` 다음으로 `items`/`recipes` 중 무엇을 먼저 할지?
- 현재 턴에서는 보수적으로 "세션 diff + 핵심 데이터셋 우선"을 기본 가정으로 Plan을 작성한다.

## 7. Internal Reflection
- **Mistakes**: 초기 대화에서 UX 방향을 제안했지만, 워크플로우 아티팩트 없이 실행 단계로 넘어갈 위험이 있었다.
- **Improvements**: 이후는 요청이 Directive로 확인되는 즉시 Task 폴더/STATUS부터 생성하고 단계별 지침을 선로딩한다.
