# Problem Definition: [R-02] Gameplay Detail Spec Authoring

## 1. Background
- 사용자 요청: 워크플로우 절차와 지침을 준수해 R-02 상세기획서 작업 수행.
- 현재 목적: Execute 이전에 Plan 산출물까지 확정하고 사용자 검토 대기.
- 기준 문서:
- `AIWorkerDiary/Artifacts/02_Pending/R-02_Core_Loop_Rules_Freeze_Request/R-02_Core_Loop_Rules_Freeze_Request.md`
- `AIWorkerDiary/Artifacts/02_Pending/R-02_Core_Loop_Rules_Freeze_Request/R-02_Planning_Expansion_Package.md`

## 2. Infrastructure Reference (Stateless 기초)
- **Project Root**: `C:/Github/ai_game_prototype_skill`
- **Workflow Root**: `C:/Users/shehd/.ai/Workflow`
- **Tracker**: `C:/Github/ai_game_prototype_skill/AIWorkerDiary/WORK-TRACKER.md`

## 3. Resource Mapping (Explicit Paths)
- [ ] `./AIWorkerDiary/Artifacts/02_Pending/R-02_Core_Loop_Rules_Freeze_Request/R-02_Core_Loop_Rules_Freeze_Request.md` (규칙 기준선)
- [ ] `./AIWorkerDiary/Artifacts/02_Pending/R-02_Core_Loop_Rules_Freeze_Request/R-02_Planning_Expansion_Package.md` (상세기획서 필수 포함 항목)
- [ ] `./docs/Planning/Core_Loop_Spec.md` (기획 기준선 참조)
- [ ] `./src/core/GameEngine.js` (상태 전이/런 준비 관련 구현 기준)
- [ ] `./src/managers/DataManager.js` (risk/seed/dungeon 결정 관련 구현 기준)

## 4. Requirements & Standard Mode
- **Mode:** Standard (10-Phase Pipeline)
- 핵심 요구사항:
- 상세기획서 문서 대상은 `R-02_Gameplay_Detail_Spec.md`.
- 문서에는 6단계 루프의 목적/의사결정 포인트가 포함되어야 함.
- 위험도 0~3별 기대 경험 차이를 포함해야 함.
- 성공/실패 시 보상 심리 설계를 포함해야 함.
- 애매한 표현 없이 QA/개발이 동일 시나리오를 설명 가능해야 함.
- 이번 턴 종료 조건은 **Phase 3 Plan(Hold) 완료 후 사용자 검토 대기**.

## 5. Constraints & Assumptions
- 제약:
- 사용자 지시로 이번 턴은 계획 단계까지만 수행.
- 승인 단계(Phase 3)에서 다음 단계 진행 금지.
- 가정:
- Task ID는 요청 문맥상 `R-02`를 사용.
- 상세기획서 최종 저장 경로는 Pending 요청 폴더 내 신규 파일을 사용.

## 6. Open Questions
- 현재 질문 없음.
- 계획서 검토 후 사용자 피드백을 받아 Phase 4로 진입.

## 7. Internal Reflection
- **Mistakes**: 이전 턴에서 사용자 요청(Plan 후 대기)을 선반영하지 못하고 Execute까지 진행하려고 한 점.
- **Improvements**: 승인 지점(Phase 3, Phase 8)에서 자동 진행을 중단하고 사용자 확인을 명시적으로 기다리도록 운영.
