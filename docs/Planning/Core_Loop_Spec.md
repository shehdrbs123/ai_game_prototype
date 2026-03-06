# Core Loop Spec

- Version: v0.1
- Last Updated: 2026-03-06
- Owner: Planning

## Objective

- 목표: 10분 내 testable한 핵심 루프를 정의하고 검증 기준을 고정

## Loop Definition

1. Town Prep: 장비/소모품/강화 상태 확인
2. Enter Run: 절차형 맵 진입
3. Combat & Loot: 적 처치, 상자/드랍 수집
4. Risk Decision: 더 깊게 탐색 vs 즉시 탈출
5. Extraction: 탈출 성공 시 보상 확보
6. Meta Progression: 제작/강화/재투자

## Input/Output per Step

- Town Prep 입력: 보유 자원, 장비 상태 / 출력: run loadout
- Enter Run 입력: 로드아웃 / 출력: 초기 전장 상태
- Combat & Loot 입력: 전투 선택 / 출력: 자원, 소모, 위험 증가
- Risk Decision 입력: 현재 체력/자원 / 출력: 추가 이익 또는 손실
- Extraction 입력: 탈출 경로/조건 / 출력: 정산 결과
- Meta Progression 입력: 정산 자원 / 출력: 영구 성장 상태

## Validation Criteria

- 첫 run 시작까지 60초 이내
- 첫 run 종료(성공/실패)까지 10분 이내
- 루프 내 의사결정 포인트 최소 2회 이상 발생

## Open Questions

- 탈출 실패 시 손실 규칙(전부/일부/보험형)
- run 난이도 상승 곡선(시간 기반 vs 구역 기반)
- 메타 업그레이드의 상한/초기 비용
