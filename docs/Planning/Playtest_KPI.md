# Playtest KPI

- Version: v0.1
- Last Updated: 2026-03-06
- Owner: Planning

## KPI Set (MVP)

- Time to First Run Start: 게임 시작 후 첫 run 진입까지 시간
- Run Completion Rate: run 종료(성공/실패 포함) 도달 비율
- Extraction Success Rate: 탈출 성공 비율
- Retry Intent Rate: 1회 플레이 후 즉시 재도전 비율
- Combat Clarity Score: 전투 피드백 이해도(정성 설문)

## Target (Initial)

- First Run Start <= 60초
- Run Completion Rate >= 85%
- Extraction Success Rate = 난이도 목표에 맞춰 40~60%
- Retry Intent Rate >= 60%

## Measurement Plan

- 로그 포인트:
- run_start, run_end, extract_success, extract_fail
- damage_taken, enemy_kill, loot_value, death_reason
- 수집 단위: 세션 단위 + run 단위
- 리뷰 주기: 플레이테스트 배치 종료 후 1회

## Qualitative Questions

- 무엇이 가장 긴장되는 순간이었는가?
- 탈출 결정을 언제/왜 했는가?
- 다시 플레이하고 싶은 이유 또는 이유 없음?
