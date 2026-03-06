# Milestone Plan

- Version: v0.1
- Last Updated: 2026-03-06
- Owner: Planning

## Alpha (Core Loop Proof)

- 목표: Town-Run-Return 루프 안정화
- 산출물:
- 전투/루팅/탈출/정산 end-to-end 동작
- Must scope 핵심 기능 플레이 가능
- 완료 기준:
- 10분 루프 테스트 통과
- 치명 진행불가 이슈 해결

## Beta (Retention Tuning)

- 목표: 재도전 동기 강화
- 산출물:
- 무기/적/보상 변주 강화
- 메타 성장 체감 개선
- 완료 기준:
- 3회차 재도전율 지표 개선
- 플레이테스트 피드백 반영 루프 확립

## Launch Candidate (Polish + Docs)

- 목표: 배포 가능한 품질 확보
- 산출물:
- 밸런스 1차 고정
- 주요 문서/온보딩 정리
- 완료 기준:
- 주요 회귀 이슈 없음
- 핵심 KPI 계측 가능 상태

## Post-Launch: Multiplayer Track

- 목표: Co-op Multiplayer 수직 슬라이스 구축
- 산출물:
- 2인 Co-op 세션(생성/입장/완료)
- 동기화 핵심 이벤트(이동/전투/루팅/탈출) 안정화
- 완료 기준:
- Co-op 세션 완료율 목표 달성
- 동기화 관련 치명 이슈(진행불가) 0건

## Dependency Notes

- 데이터 밸런싱은 `src/data/gameData.js` 기준으로 단계별 잠금
- UI/UX 개선은 Core loop 안정화 이후 우선순위 재평가
- 멀티플레이 상세 범위는 `docs/Planning/Multiplayer_Strategy.md`를 단일 기준으로 사용
