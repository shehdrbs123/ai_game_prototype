# High-Resolution Implementation Plan: [R-02] Gameplay Detail Spec Authoring

## 1. Context Synchronization (Stateless Check)
- **Problem Context**:
- 목표는 R-02 고정 규칙을 구현팀/QA가 동일하게 해석할 수 있는 상세기획서로 확장하는 것.
- 이번 턴은 사용자 지시에 따라 Plan 단계에서 중단한다.
- **Research Evidence**:
- 코어 규칙은 이미 고정되어 있고, 상세기획서는 플레이 경험/의사결정/감정곡선을 명시해야 한다.
- 위험도 0~3 체감 차이, 성공/실패 보상 심리가 필수다.

## 2. Alternative Strategy Comparison
- **Option A: 규칙 재서술 중심 문서**
- 장점: 작성 속도 빠름.
- 단점: 기존 R-02 문서와 중복, 경험 설계 깊이 부족.
- **Option B: 플레이어 여정 중심 문서**
- 장점: 의사결정/감정/리스크 체감을 설명 가능.
- 단점: 시스템 규칙 매핑 누락 위험.
- **Option C: 하이브리드(여정 + 규칙 매핑) 문서**
- 장점: 플레이 경험 설명과 구현 기준 연결을 동시에 충족.
- 단점: 작성 공수 증가.
- **Winner Strategy: Option C (User-Decision Driven)**
- 선정 사유: Expansion Package의 필수 포함 항목과 완료 기준을 충족하면서, 세부 방향은 사용자 인터뷰 기반으로 확정할 수 있음.

## 2.1 User Decision Gate (필수 선행)
- 원칙: 상세기획서의 핵심 방향(톤, 우선순위, 시나리오 강조점)은 사용자가 최종 결정한다.
- AI 역할: 질문 세트 제시, 선택지 정리, 결정안 문서 반영.
- 차단 조건: 아래 결정 질문에 대한 사용자 답변이 없으면 Phase 4 작성을 시작하지 않는다.
- 선행 순서(고정):
- 1) 코어 루프 필수 시스템 선별
- 2) 선별 시스템의 시스템 기획 범위/깊이 결정
- 3) 예외 시나리오 우선순위 결정
- 결정 질문(Phase 3 검토용):
- Q1. 상세기획서 1순위 목적은 무엇인가? `개발 구현 정밀도` / `플레이 감정 전달` / `QA 판정 일관성`
- Q2. 위험도 0~3 설명에서 가장 강조할 축은 무엇인가? `손실/복구 수치 체감` / `감정 곡선` / `의사결정 기준`
- Q3. 성공/실패 보상 심리 설계의 톤은 무엇인가? `안정적 학습형` / `도전-보상형` / `고위험 고긴장형`
- Q4. 코어 루프 필수 시스템 우선순위는 무엇인가? (예: `Altar Entry`, `Risk/Death Recovery`, `Insurance`, `Progression Drop Gating`, `Result/Reinvest`)
- Q5. 선별된 시스템 중 이번 상세기획서에서 "구현 고정"할 범위는 어디까지인가? (입력/처리/출력, 상태전이, 데이터스키마, 예외처리)
- Q6. 예외 시나리오 우선순위는 무엇인가? `disconnect` / `cancel` / `inventory full` / `insurance toggle timing`
- Q7. 상세기획서 리뷰 기준 가중치는 무엇인가? `PM 중심` / `Dev 중심` / `QA 중심` / `균등`

## 2.2 User Decisions (Confirmed)
- Q1 결정: `개발 구현 정밀도`
- 결정 해석:
- 본 문서는 "개발을 위한 상세 기획서"로 작성한다.
- 재미/감정 중심 평가는 본 문서 범위에서 제외하고 별도 평가서로 분리한다.
- Q2 결정: `의사결정 기준` 중심 + `진행 게이팅(progress gating)` 명시
- 결정 해석:
- 위험도 상승 시 전반 몬스터 능력치가 상승한다.
- 위험도별 추가 몬스터가 존재하며, 해당 몬스터 전용 드롭 아이템을 정의한다.
- 전용 드롭 아이템은 제작대 생성 등 다음 단계 해금용 키 아이템으로 사용한다.
- 위험도 상승은 선택적 도전이 아니라 "향후 진행을 위한 필수 코스"로 설계한다.
- 상위 위험도에서는 하위 위험도 드롭 아이템의 수량/키 아이템 드롭 기회도 함께 상승시킨다.
- 문서화 기준은 "난이도 상승 체감 + 진행 보상 증가"의 동시 성립 여부로 둔다.
- Q3 결정: `도전-보상형`
- 결정 해석:
- 성공 보상은 위험 감수의 정당성을 명확히 체감하도록 설계한다.
- 실패 페널티는 유지하되, 재도전 의사결정을 방해하지 않도록 복구/대안 루트를 문서에 명시한다.
- Q4 작업 방식 결정: `라이프사이클 기반 시스템 추출 후 우선순위 확정`
- 라이프사이클(사용자 기준):
- 1) 마을 준비
- 2) 던전 진입(제물/옥/관련 시스템)
- 3) 던전 탐험 및 수집(탐색/전투/루팅)
- 4) 탈출
- 5) 마을 발전
- Q4 시스템 후보(라이프사이클 매핑):
- L1 마을 준비: Loadout Setup, 제작/강화 준비, 출정 리소스 확인
- L2 던전 진입: Altar Entry(제물3+옥1), Risk 산출, Dungeon 결정, 보험 토글/보험료 확정
- L3 탐험/수집: Combat Scaling(위험도별 몬스터 강화), Risk-exclusive Monster Spawn, Progression Drop Gating(전용 드랍/키아이템), 기본 드랍 수량 보정
- L4 탈출: 탈출 조건 판정, 탈출 성공/실패 분기
- L5 마을 발전: Result 정산, 자원 환류, 시설/제작대 해금 진행
- Q4 우선순위 초안(라이프사이클 정렬):
- P1: L2 던전 진입 시스템
- P2: L3 탐험/수집 시스템
- P3: L4 탈출 시스템
- P4: L5 마을 발전 시스템
- P5: L1 마을 준비 시스템
- Q4 최종 확정:
- 1순위: L2 던전 진입 시스템
- 2순위: L3 탐험/수집 시스템
- 3순위: L4 탈출 시스템
- 4순위: L5 마을 발전 시스템
- 5순위: L1 마을 준비 시스템
- 결정 상태:
- Q4(필수 시스템 우선순위): 확정 완료
- Q5(구현 고정 범위): 확정 완료 (L4)
- Q5 확정값: `L4 = 입력/처리/출력 + 상태전이 + 데이터 스키마 + 예외처리 규칙`
- Q6(예외 우선순위): 확정 완료
- Q6 확정값: `inventory full > insurance toggle timing > disconnect > cancel`
- Q7(리뷰 기준 가중치): 확정 완료
- Q7 확정값: `Dev 중심`
- User Decision Gate 상태: 1차(Q1~Q7) 확정 완료, 2차 구현세부 인터뷰 대기

## 2.3 Round 2 Interview Backlog (상세기획서 본문 착수 전 필수)
- 목적: Phase 4 본문을 Dev 구현 수준(L4)로 고정하기 위한 미정 파라미터 수집.
- 상태: 사용자 답변 대기(미확정 항목이 남아있으면 본문 작성 시작 금지).
- R2-Q1. 위험도별 몬스터 강화 방식은 무엇인가?
- 후보: 고정 계수형(HP/ATK/DEF 배수) / 티어 테이블형(패턴/스킬 추가) / 혼합형
- R2-Q2. 위험도별 추가 몬스터 정의는 무엇인가?
- 필요값: Risk 1/2/3별 몬스터 ID, 스폰 규칙(고정/확률/구역), 동시 출현 제한
- R2-Q3. 전용 드랍(진행 게이팅) 규칙은 무엇인가?
- 필요값: 몬스터별 드랍 아이템 ID, 드랍 확률, 최소 보장 여부
- R2-Q4. 제작대/해금 조건은 무엇인가?
- 필요값: 필요 아이템 종류/수량, 해금 트리거 시점(Result 직후/Town 진입 시), UI 알림 정책
- R2-Q5. 상위 위험도 보상 상승 수치는 얼마인가?
- 필요값: 하위 난이도 아이템 드랍 수량 보정치, 키 아이템 드랍 기회 보정치
- R2-Q6. `inventory full` 처리 정책은 무엇인가? (예외 우선순위 1)
- 후보: 즉시 폐기 / 바닥 드랍 유지 / 임시 보관함(Result 수령)
- R2-Q7. `insurance toggle timing` 고정 규칙은 무엇인가? (예외 우선순위 2)
- 필요값: 토글 허용 시점, 잠금 시점, 변경 불가 조건
- R2-Q8. `disconnect`, `cancel` 최소 처리 규칙은 무엇인가?
- 필요값: 자원 차감 롤백 여부, 판정 기준 시점, 로그/알림 문구 기준
- Round 2 완료 조건:
- R2-Q1~Q8 전부 답변 확보
- 숫자 규칙(확률/배수/수량)은 범위가 아닌 단일값 또는 명시 범위로 고정
- 확정값이 `R-02_Gameplay_Detail_Spec.md` 본문 섹션에 1:1 매핑 가능

## 3. Resource Mapping & Impact Analysis
- **Target Files**:
- `./AIWorkerDiary/Artifacts/00_Draft/R-02_Gameplay_Detail_Spec/1_Problem.md`: 문제 정의 및 범위 고정.
- `./AIWorkerDiary/Artifacts/00_Draft/R-02_Gameplay_Detail_Spec/2_Research.md`: 근거 자료 및 리스크 정리.
- `./AIWorkerDiary/Artifacts/00_Draft/R-02_Gameplay_Detail_Spec/3_Plan.md`: 상세 절차 설계서.
- `./AIWorkerDiary/Artifacts/00_Draft/R-02_Gameplay_Detail_Spec/STATUS.md`: 현재 단계 공유.
- `./AIWorkerDiary/Artifacts/02_Pending/R-02_Core_Loop_Rules_Freeze_Request/R-02_Gameplay_Detail_Spec.md`: 최종 상세기획서 산출물(Phase 4에서 생성).
- `./AIWorkerDiary/WORK-TRACKER.md`: 현재 단계/링크 동기화.
- **Dependency Impact**:
- Phase 4 이후 산출되는 상세기획서는 후속 `System Design Spec`, `UI Wireframe`, `Test Scenarios`의 입력 문서가 된다.
- 현재 단계에서 문서 구조를 잘못 고정하면 후속 3개 문서의 기준이 흔들린다.

## 4. Atomic Step-by-Step Implementation Guide (Min. 100 lines)
### Phase A: Foundation & Workflow Sync
1. [ ] Step A-1: `WORK-TRACKER.md`에서 Task ID 미등록 상태 확인.
- **Logic**: Current Focus/Requests/Feature Matrix를 점검해 R-02 신규 태스크임을 확정.
- **Validation**: tracker에 R-02 row가 없음을 확인.
2. [ ] Step A-2: `Artifacts/00_Draft/R-02_Gameplay_Detail_Spec` 폴더 생성.
- **Logic**: 워크플로우 산출물 저장 위치 고정.
- **Validation**: 폴더 존재 확인.
3. [ ] Step A-3: `STATUS.md` 초기 생성.
- **Logic**: 병렬 충돌 방지를 위한 로컬 상태 파일 확보.
- **Validation**: STATUS 파일에 현재 phase 기록 여부 확인.
4. [ ] Step A-4: Phase 1 지침 기반 `1_Problem.md` 작성.
- **Logic**: Background/Resource/Requirements/Open Questions 포함.
- **Validation**: 템플릿 섹션 존재 확인.
5. [ ] Step A-5: tracker에 R-02 current focus row 추가.
- **Logic**: `[Standard]` 표기와 artifact 경로를 동기화.
- **Validation**: 표에 신규 row 출력 확인.
6. [ ] Step A-6: Activity Log에 R-02 시작 로그 추가.
- **Logic**: 날짜/단계/작업명 기록.
- **Validation**: log line 존재.
7. [ ] Step A-7: Phase 2 지침 기반 조사 범위 고정.
- **Logic**: R-02 rule freeze + expansion package + code baseline 포함.
- **Validation**: 2_Research의 file list 완성.
8. [ ] Step A-8: 2_Research에 root cause 작성.
- **Logic**: 규칙 문서 대비 경험 설계 공백을 명시.
- **Validation**: "왜 상세기획서가 필요한지" 문장 검증.
9. [ ] Step A-9: 2_Research에 risks/side-effects 작성.
- **Logic**: 중복 규칙, 추상 문장, 예외 누락 리스크 포함.
- **Validation**: 최소 3개 리스크 확인.
10. [ ] Step A-10: STATUS를 `3. Plan (In Progress)`로 전환.
- **Logic**: 현재 단계 반영.
- **Validation**: STATUS 라인 확인.

### Phase B: Spec Blueprint Design
11. [ ] Step B-1: 사용자 결정 질문 세트 확정 및 전달.
- **Logic**: User Decision Gate Q1~Q7을 사용자에게 제시하고 응답을 수집한다.
- **Validation**: Q1~Q7 전 항목에 대해 사용자 답변 확보.
12. [ ] Step B-2: 사용자 답변 기반 상세기획서 작성 원칙 고정.
- **Logic**: 사용자 답변을 `문서 목적/톤/우선순위` 3축으로 정규화해 작성 규칙으로 전환한다.
- **Validation**: 작성 규칙 3축이 명시된 decision memo 존재.
13. [ ] Step B-3: 상세기획서 문서 헤더 구조 확정.
- **Logic**: Version/Date/Owner/Scope/Source 선언.
- **Validation**: 문서 시작부 메타 정의 체크.
14. [ ] Step B-4: 독자(Reader)와 사용 목적 구분.
- **Logic**: PM/Dev/QA 공용 기준으로 역할별 읽기 포인트 분리.
- **Validation**: 섹션별 대상 독자 표기.
15. [ ] Step B-5: 6단계 루프 섹션 틀 확정.
- **Logic**: 각 단계를 목적-입력-의사결정-출력으로 통일.
- **Validation**: 6개 단계 모두 동일 포맷 적용.
16. [ ] Step B-6: Town 단계 상세 규칙 연결.
- **Logic**: 준비 행동과 다음 단계 진입 조건 정리.
- **Validation**: 진입 조건 문장 존재.
17. [ ] Step B-7: Altar 단계 상세 규칙 연결.
- **Logic**: 제물3+옥1 규칙, 위험도 계산, 던전 결정 다수결/seed tie-break 반영.
- **Validation**: tie-break 규칙 명시.
17.1 [ ] Step B-7a: Dungeon 단계 플레이 의도 정의.
- **Logic**: 리스크 감수와 목표 가치 회수의 긴장감을 문장화.
- **Validation**: 플레이어 선택지 2개 이상 제시.
17.2 [ ] Step B-7b: Escape 단계 의사결정 정의.
- **Logic**: 계속 탐색 vs 즉시 탈출 판단 기준 제시.
- **Validation**: 기준 조건의 수치/상태 명시.
18. [ ] Step B-8: Result 단계 표현 규칙 정의.
- **Logic**: 손실/회수/복구를 분리 표기하는 구조 확정.
- **Validation**: 세 결과 항목 모두 존재.
19. [ ] Step B-9: Reinvest 단계 동기 설계 정의.
- **Logic**: 다음 run 준비와 시설 건축 동기 연결.
- **Validation**: 재투자 행동 최소 2종 명시.
20. [ ] Step B-10: 단계 간 전이 조건 명시.
- **Logic**: Town->Altar->Dungeon->Result->Town 전이 이벤트를 명확화.
- **Validation**: 상태 전이 체인 누락 없음.
21. [ ] Step B-11: Risk 0 경험 설계 작성.
- **Logic**: 안전 학습 구간, 100% 회수 기대감 설정.
- **Validation**: 학습 목적 문장 포함.
22. [ ] Step B-12: Risk 1 경험 설계 작성.
- **Logic**: 손실 공포는 낮고 위치 회수 압박은 존재하도록 설정.
- **Validation**: 압박 요소 1개 이상 명시.
23. [ ] Step B-13: Risk 2 경험 설계 작성.
- **Logic**: 50% 랜덤 회수에 따른 기대/불안 균형 설계.
- **Validation**: 기대 손실 체감 설명 포함.
24. [ ] Step B-14: Risk 3 경험 설계 작성.
- **Logic**: 무보험 전손 리스크와 보험 의사결정 긴장감 명시.
- **Validation**: 보험 ON/OFF 대비 문장 포함.
25. [ ] Step B-15: 위험도별 감정 곡선 비교 섹션 설계.
- **Logic**: 안정-도전-긴장-도박형 경험 축으로 정리.
- **Validation**: 4개 risk 모두 대응 축 존재.
26. [ ] Step B-16: 성공 보상 심리 모델 작성.
- **Logic**: 성취감/회복감/누적 성장감을 분리 기술.
- **Validation**: 심리 요소 3개 확인.
27. [ ] Step B-17: 실패 보상 심리 모델 작성.
- **Logic**: 손실의 납득 가능성과 재도전 동기 유지 조건 정의.
- **Validation**: 재시도 동기 문장 포함.
28. [ ] Step B-18: 보험 실패 경험 설계 작성.
- **Logic**: 보험 가입 실패와 미가입 실패의 감정 차이 서술.
- **Validation**: 두 케이스 비교 문장 포함.
29. [ ] Step B-19: 예외 시나리오 목록 설계.
- **Logic**: disconnect/cancel/inventory full/insurance toggle timing 포함.
- **Validation**: 4개 예외 모두 나열.
30. [ ] Step B-20: 예외별 사용자 메시지 원칙 설계.
- **Logic**: 원인-영향-복구행동 순서로 메시지 규칙 통일.
- **Validation**: 메시지 템플릿 확인.
31. [ ] Step B-21: Normal flow 시나리오 1 작성.
- **Logic**: Risk0 초심자 run 성공 케이스 기술.
- **Validation**: 단계별 행동/결과 포함.
32. [ ] Step B-22: Normal flow 시나리오 2 작성.
- **Logic**: Risk2 숙련자 run 부분 손실 케이스 기술.
- **Validation**: 손실 계산 문장 포함.
33. [ ] Step B-23: Failure flow 시나리오 1 작성.
- **Logic**: Risk3 무보험 사망 케이스 기술.
- **Validation**: 복구 0% 명시.
34. [ ] Step B-24: Failure flow 시나리오 2 작성.
- **Logic**: Risk3 보험 가입 사망 케이스 기술.
- **Validation**: floor(N/3) 복구 공식 명시.
35. [ ] Step B-25: Acceptance mapping 섹션 설계.
- **Logic**: R-02 Acceptance 7항목과 상세기획서 시나리오 연결.
- **Validation**: 1:1 대응 체크.
36. [ ] Step B-26: 용어 사전 섹션 설계.
- **Logic**: riskLevel, runLoadoutSnapshot, deathDropPool 정의 통일.
- **Validation**: 시스템 문서와 충돌 없는지 점검.
37. [ ] Step B-27: 비범위(Out of Scope) 명시.
- **Logic**: 메타 비용 밸런싱, 멀티, 시즌 오버라이드 제외 고정.
- **Validation**: 제외 항목 3개 이상 명시.
38. [ ] Step B-28: 추적 가능성(Traceability) 설계.
- **Logic**: 각 섹션에 source rule 링크 배치.
- **Validation**: 참조 링크 누락 없음.
39. [ ] Step B-29: 문장 규칙 검토.
- **Logic**: "적당히/상황에 따라" 등 모호어 제거.
- **Validation**: 금지어 수동 검색.
40. [ ] Step B-30: 리뷰 체크리스트 설계.
- **Logic**: PM/Dev/QA가 각자 검토할 질문 3개씩 정의.
- **Validation**: 총 9개 질문 존재.

### Phase C: Authoring Execution Plan for Next Phase
41. [ ] Step C-1: Phase 4 시작 시 선행 입력 재검증.
- **Logic**: 최신 R-02 문서 재읽기 후 작성 착수.
- **Validation**: timestamp 확인.
42. [ ] Step C-2: 문서 skeleton 생성.
- **Logic**: 헤더와 major section만 먼저 배치.
- **Validation**: 목차 누락 여부 확인.
43. [ ] Step C-3: 6단계 루프 본문 작성.
- **Logic**: 단계당 4요소(목적/입력/결정/출력) 채움.
- **Validation**: 단계별 길이 균형 검토.
44. [ ] Step C-4: Risk 0~3 경험 본문 작성.
- **Logic**: 플레이 감정과 시스템 결과를 병기.
- **Validation**: risk별 항목 수 동일성 확인.
45. [ ] Step C-5: 성공 심리 섹션 작성.
- **Logic**: 성취, 회복, 성장 3축으로 정리.
- **Validation**: 축별 근거 문장 포함.
46. [ ] Step C-6: 실패 심리 섹션 작성.
- **Logic**: 손실 수용성과 재도전 자극 균형 조정.
- **Validation**: 좌절 완충 요소 명시.
47. [ ] Step C-7: 보험 체감 설계 작성.
- **Logic**: 비용 지불의 심리적 정당화 설명.
- **Validation**: 가입 유도 조건 명시.
48. [ ] Step C-8: 예외 시나리오 본문 작성.
- **Logic**: 트리거-처리-결과-알림 포맷 고정.
- **Validation**: 4개 예외 전부 작성.
49. [ ] Step C-9: 정상 시나리오 작성.
- **Logic**: 초심자/숙련자 2개 흐름 기술.
- **Validation**: 양쪽 모두 end-to-end 완주.
50. [ ] Step C-10: 실패 시나리오 작성.
- **Logic**: 무보험/보험 2개 흐름 기술.
- **Validation**: 복구 계산식 포함.
51. [ ] Step C-11: acceptance mapping 작성.
- **Logic**: 각 기준의 검증 포인트 문장 연결.
- **Validation**: 기준 7개 누락 없음.
52. [ ] Step C-12: QA 파생 포인트 작성.
- **Logic**: 케이스 ID 초안과 판정 기준 명시.
- **Validation**: pass/fail 문장화.
53. [ ] Step C-13: Dev 파생 포인트 작성.
- **Logic**: System/UI/Telemetry 후속 문서로 전달할 TODO 명시.
- **Validation**: 후속 문서명 직접 명시.
54. [ ] Step C-14: 모호 표현 제거 1차.
- **Logic**: 금지어 검색 후 치환.
- **Validation**: 금지어 0건.
55. [ ] Step C-15: 규칙 충돌 점검 1차.
- **Logic**: R-02 고정 규칙 값과 대조.
- **Validation**: 수치 충돌 0건.
56. [ ] Step C-16: 논리 흐름 점검 1차.
- **Logic**: 단계 전이 역행 문장 제거.
- **Validation**: 전이 체인 일관성.
57. [ ] Step C-17: reader 관점 점검 1차.
- **Logic**: PM/Dev/QA 관점에서 읽기 순서 테스트.
- **Validation**: 관점별 핵심 정보 도달 가능.
58. [ ] Step C-18: 문서 버전 메타 입력.
- **Logic**: Version/Date/Owner/Decision Log 초기값 입력.
- **Validation**: 메타 필드 전부 채움.
59. [ ] Step C-19: references 정리.
- **Logic**: source 파일 경로와 섹션 연결.
- **Validation**: dead reference 없음.
60. [ ] Step C-20: 내부 리뷰 후 수정.
- **Logic**: 품질 기준(DoD 5개) 기반 셀프리뷰.
- **Validation**: 체크리스트 all pass.

### Phase D: Validation and Hold Management
61. [ ] Step D-1: Plan 대비 Execute 수행률 검토.
- **Logic**: C단계 20스텝 완료 여부 체크.
- **Validation**: 완료 체크 박스 반영.
62. [ ] Step D-2: Requirement coverage 계산.
- **Logic**: 필수 요구 5개 충족 여부 확인.
- **Validation**: coverage 100%.
63. [ ] Step D-3: Scenario testability 점검.
- **Logic**: QA가 바로 케이스 분리 가능한지 확인.
- **Validation**: 시나리오별 조건/결과 존재.
64. [ ] Step D-4: 10분 루프 테스트 가능성 점검.
- **Logic**: core loop가 10분 내 관측 가능한지 기술.
- **Validation**: session target 문장 포함.
65. [ ] Step D-5: Telemetry 연계 점검.
- **Logic**: 이벤트 명세로 매핑 가능한 지점 표시.
- **Validation**: altar/run/death/end 접점 표기.
66. [ ] Step D-6: 시스템 용어 정합성 점검.
- **Logic**: DataManager 용어와 문서 용어 일치 확인.
- **Validation**: 용어 불일치 0건.
67. [ ] Step D-7: 난이도 표현 정합성 점검.
- **Logic**: risk 0~3가 보상/손실과 일치하는지 확인.
- **Validation**: 역전 규칙 없음.
68. [ ] Step D-8: 보험 정책 정합성 점검.
- **Logic**: risk3 전용, 가입 시점, 복구율 1/3 고정 확인.
- **Validation**: 정책 3요소 모두 명시.
69. [ ] Step D-9: 예외 처리 누락 점검.
- **Logic**: disconnect/cancel/inventory full/toggle timing 재확인.
- **Validation**: 누락 0건.
70. [ ] Step D-10: 문서 품질 기준(DoD) 점검.
- **Logic**: 입력-처리-출력, 모호어 금지, 참조 ID 연결 확인.
- **Validation**: DoD 5항목 통과.
71. [ ] Step D-11: 피드백 포인트 사전 추출.
- **Logic**: 사용자 검토 시 확인할 항목 5개 정리.
- **Validation**: review prompt 생성.
72. [ ] Step D-12: Phase 5 Validation artifact 작성.
- **Logic**: 시나리오 결과와 근거 기록.
- **Validation**: PASS/FAIL 명시.
73. [ ] Step D-13: Phase 6 Feedback artifact 작성.
- **Logic**: 반복 오류/구조 개선 포인트 기록.
- **Validation**: root cause 포함.
74. [ ] Step D-14: Phase 7 Feedback Execution 판단.
- **Logic**: direct fix vs improvement request 분기.
- **Validation**: 분기 근거 작성.
75. [ ] Step D-15: Phase 8 문서화 전략 수립.
- **Logic**: docs 반영 필요성 평가.
- **Validation**: yes/no 근거 작성.
76. [ ] Step D-16: Phase 8 승인 대기 진입.
- **Logic**: 사용자 확인 없이는 finalize 진행 금지.
- **Validation**: hold 상태 기록.
77. [ ] Step D-17: 승인 후 Phase 9 정리.
- **Logic**: 성과 요약, status recap, tracker done 업데이트.
- **Validation**: 링크 경로 일치.
78. [ ] Step D-18: 아카이빙 정책 실행 여부 결정.
- **Logic**: 01_Complete 이동 필요성 판단.
- **Validation**: 이동/미이동 근거 기록.
79. [ ] Step D-19: 최종 보고 포맷 정리.
- **Logic**: 변경사항/검증/리스크 3항목 보고.
- **Validation**: 사용자 이해 가능성 점검.
80. [ ] Step D-20: 종료 체크리스트 완료.
- **Logic**: 단계별 지침 준수 여부를 근거와 함께 확인.
- **Validation**: 체크리스트 all checked.

## 5. Unit & Integration Test Scenarios
- [ ] Scenario 1: Risk 0 성공 루트 문장 검증 (입력-처리-출력 완전성).
- [ ] Scenario 2: Risk 2 사망 후 50% 회수 설명의 재현성 검증.
- [ ] Scenario 3: Risk 3 무보험 사망 시 복구 0% 서술 검증.
- [ ] Scenario 4: Risk 3 보험 가입 사망 시 floor(N/3) 서술 검증.
- [ ] Scenario 5: disconnect 예외 시 사용자 메시지 규칙 검증.
- [ ] Scenario 6: cancel 시점(입장 전/후) 분기 설명 검증.
- [ ] Scenario 7: inventory full 상황에서 결과 처리 설명 검증.
- [ ] Scenario 8: 보험 토글 타이밍 제약 설명 검증.

## 6. Internal Reflection
- **Mistakes**: 상세 설계의 결정권을 AI가 선확정하는 위험을 충분히 분리하지 못함.
- **Improvements**: Phase 3에 User Decision Gate를 고정하고, 사용자 답변 없이는 Phase 4 작성을 시작하지 않도록 절차화.
