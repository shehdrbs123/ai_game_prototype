# Research Result: R-02 Gameplay Detail Spec Authoring

## 1. Relevant Files & Symbols (Verified Paths)
- [ ] `./AIWorkerDiary/Artifacts/02_Pending/R-02_Core_Loop_Rules_Freeze_Request/R-02_Core_Loop_Rules_Freeze_Request.md`: 코어 루프/위험도/보험/수용 기준의 고정 규칙.
- [ ] `./AIWorkerDiary/Artifacts/02_Pending/R-02_Core_Loop_Rules_Freeze_Request/R-02_Planning_Expansion_Package.md`: 상세기획서 목적/필수 포함 항목/완료 기준.
- [ ] `./docs/Planning/Core_Loop_Spec.md`: 기존 기획 기준선(v0.1).
- [ ] `./src/core/GameEngine.js`: Town -> Dungeon -> Result 흐름 제어.
- [ ] `./src/managers/DataManager.js`: riskLevel 계산, targetDungeon 결정, seed tie-break 로직.

## 2. Issue Analysis / Root Cause
- 현재 R-02 요청서는 규칙 고정에 집중되어 있어 플레이 경험 설명(의도/감정 곡선)이 상대적으로 얇다.
- 위험도별 손실/복구 규칙은 정의되었지만 플레이어의 체감 목표와 의사결정 기준이 문서화되어 있지 않다.
- UI/QA 팀이 공통으로 참조할 "상황-행동-결과" 시나리오가 부족하여 해석 편차 가능성이 있다.

## 3. Infrastructure & Conventions
- 문서 워크플로우는 `AIWorkerDiary/Artifacts/00_Draft/[Task]` 산출물 생성 후 승인 단계에서 대기.
- 본 프로젝트는 markdown 기반 planning 문서 체계를 사용하며, 기획 문서는 Pending 폴더에 유지되고 Draft 산출물은 워크플로우 추적용으로 분리됨.
- 코어 구현은 ES modules 기반이며, 위험도/던전 결정 로직은 DataManager에서 이미 일부 처리됨.

## 4. Technical Risks & Side-effects
- 리스크 1: 기획서에서 시스템 규칙을 중복 재정의하면 기존 R-02 고정 규칙과 충돌 가능.
- 리스크 2: 감정 설계를 추상적으로 쓰면 QA 테스트케이스로 변환 불가.
- 리스크 3: 예외 시나리오(disconnect/cancel/inventory full)를 누락하면 후속 System Spec과 불일치 발생.
- 대응:
- 상세기획서는 "경험 의도" 중심으로 작성하되, 규칙 값은 R-02 문서를 소스 오브 트루스로 참조.
- 각 섹션을 입력->처리->출력 문장으로 구조화.
- 수용 기준을 시나리오 단위로 명시하여 테스트 파생 가능성 확보.

## 5. Internal Reflection
- **Mistakes**: 초기 조사에서 WORK-TRACKER 테이블 포맷 불일치를 바로 교정하지 못함.
- **Improvements**: 이후 단계에서 신규 row는 5-column 기준으로 추가하고 기존 구조는 보존하는 방식으로 충돌 최소화.
