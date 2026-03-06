# R-02 후속 기획 패키지 제안서 (Lead Planner)

- Version: v0.1
- Date: 2026-03-07
- Owner: Planning
- Context: `R-02_Core_Loop_Rules_Freeze_Request.md`는 "규칙 고정" 문서이며, 구현/검증/운영까지 연결하려면 후속 문서 세트가 필요함.

## 1. 목적

R-02를 개발팀이 오해 없이 구현하고, QA/밸런스/콘텐츠 팀이 같은 기준으로 검증하도록 공통 컨텍스트를 추가한다.

## 2. 왜 추가 문서가 필요한가

1. 현재 R-02는 규칙 중심이라 "플레이 의도"와 "UX 흐름" 설명이 부족하다.
2. 시스템 경계(데이터 저장 시점, 예외 처리, 상태 전이) 정의가 약하다.
3. UI 화면 단위 행동 규칙이 없어 구현 방식이 팀마다 달라질 위험이 있다.
4. KPI 계측/테스트 기준이 문서화되지 않으면 완료 판정이 주관적이 된다.

## 3. 필수 추가 문서 (Must)

1. 상세 기획서 (Gameplay Spec)
- 파일 제안: `R-02_Gameplay_Detail_Spec.md`
- 목적: 플레이 경험 관점에서 코어 루프 의도, 감정 곡선, 예외 시나리오를 정의
- 필수 포함:
- 6단계 루프의 목적과 플레이어 의사결정 포인트
- 위험도 0~3별 기대 경험 차이
- 실패/성공 시 보상 심리 설계
- 완료 기준: PM/개발/QA가 동일한 유저 시나리오를 설명 가능

2. 시스템 기획서 (System Design Spec)
- 파일 제안: `R-02_System_Design_Spec.md`
- 목적: 구현 단위로 데이터/상태/이벤트를 고정
- 필수 포함:
- 상태 전이(State): Town -> Altar -> Dungeon -> Result -> Town
- 데이터 스키마: `riskLevel`, `runLoadoutSnapshot`, `insuranceEnabled`, `insurancePremium`, `deathDropPool`
- 예외 규칙: disconnect, cancel, inventory full, insurance 토글 타이밍
- seed 재현성 규칙
- 완료 기준: 개발자가 추가 질문 없이 task 분할 가능

3. UI 와이어프레임 패키지
- 파일 제안: `R-02_UI_Wireframe_and_UX_Flow.md`
- 목적: 화면/상호작용을 고정해 UI 해석 차이를 제거
- 필수 포함:
- 화면 목록: Town HUD, Altar Setup, Risk Preview, Insurance Option, Result
- 각 화면의 입력/출력/CTA 버튼 상태
- 오류/경고 문구(예: 슬롯 부족, 보험료 부족)
- 완료 기준: UI 구현자가 컴포넌트 목록을 바로 뽑아낼 수 있음

4. 텔레메트리/로그 명세서
- 파일 제안: `R-02_Telemetry_Event_Spec.md`
- 목적: KPI 측정을 위한 이벤트 정의
- 필수 포함:
- 이벤트: `altar_open`, `altar_confirm`, `run_start`, `player_death`, `corpse_spawn`, `corpse_recover`, `insurance_buy`, `insurance_restore`, `run_end`
- 필수 파라미터: `riskLevel`, `loadoutValue`, `restoreRatio`, `seed`
- 완료 기준: 계측 코드와 대시보드 항목 1:1 매핑 가능

5. 테스트 시나리오 명세서
- 파일 제안: `R-02_Test_Scenarios.md`
- 목적: 수용 기준을 테스트 케이스로 변환
- 필수 포함:
- 위험도 0~3 정상/예외/경계 케이스
- 보험 가입/미가입 분기
- seed 고정 재현 테스트
- 완료 기준: QA가 체크리스트만으로 pass/fail 판정 가능

## 4. 권장 추가 문서 (Should)

1. 밸런스 기초 시트 명세
- 파일 제안: `R-02_Balance_Baseline.md`
- 내용: 위험도별 기대 손실/보상 곡선, 보험료 계수 초안

2. 콘텐츠 확장 가이드
- 파일 제안: `R-02_Content_Expansion_Guide.md`
- 내용: 제물/옥 아이템군 확장 규칙, targetDungeon 확장 규칙

3. 라이브 운영 룰 초안
- 파일 제안: `R-02_LiveOps_Rulebook.md`
- 내용: 이벤트 기간 던전 강제 오버라이드 정책, 공지 규칙

## 5. 작성 우선순위

1. `R-02_System_Design_Spec.md`
2. `R-02_UI_Wireframe_and_UX_Flow.md`
3. `R-02_Test_Scenarios.md`
4. `R-02_Telemetry_Event_Spec.md`
5. `R-02_Gameplay_Detail_Spec.md`

## 6. 문서 품질 기준 (Definition of Done)

1. 모든 규칙이 "입력 -> 처리 -> 출력" 형태로 명시됨
2. 애매한 표현("적당히", "상황에 따라") 없음
3. 화면/데이터/이벤트가 서로 참조 가능한 ID로 연결됨
4. QA 체크리스트와 개발 task가 문서에서 직접 파생됨
5. 변경 이력(Version/Date/Owner/Decision Log) 유지

## 7. 다음 실행 제안

1. 즉시 착수 문서: `R-02_System_Design_Spec.md`
2. 병행 문서: `R-02_UI_Wireframe_and_UX_Flow.md`
3. 이후 검증 문서: `R-02_Test_Scenarios.md`
