# Multiplayer Strategy

- Version: v0.1
- Last Updated: 2026-03-06
- Owner: Planning

## 1) Direction

- 목표: 코어 Extraction 루프를 해치지 않는 범위에서 Co-op Multiplayer를 단계적으로 도입
- 원칙: 싱글플레이 완성도 우선, 멀티는 검증된 루프 위에 증설

## 2) Target Experience

- 모드: 2~3인 Co-op PvE (초기), PvP는 후순위
- 판타지: 팀 단위 진입, 역할 분담, 공동 탈출
- 성공 감정: 위기 공유와 협력 생존

## 3) Scope by Phase

1. Pre-Multiplayer (현재~MVP)
- 네트워크 비의존 구조 정리
- 전투/루팅/탈출 규칙의 authoritative 기준 정의

2. Multiplayer Alpha
- 2인 Co-op 기본 세션 생성/입장/종료
- 동기화 대상 최소화: 위치, 체력, 전투 이벤트, 루팅 이벤트
- 룸 기반 매칭(친구 초대 우선)

3. Multiplayer Beta
- 3인 확장, reconnect, 간단한 세션 복구
- 지연/패킷 손실 환경에서 플레이 가능성 검증

## 4) Rules and Economy

- 전리품 분배: 개인 드랍 + 팀 보너스 하이브리드
- 탈출 처리: 개인 탈출 성공 시 개인 보상 확보, 팀 전원 성공 시 추가 보너스
- 진행 보정: 인원 수에 따른 적 체력/스폰량 스케일링

## 5) Technical Assumptions

- 초기 네트워크 모델: server-authoritative
- 치트/동기화 안정성 이유로 핵심 판정은 서버 기준
- 현재 코드베이스는 싱글 루프 중심이므로 멀티 도입 전 상태 동기화 경계 재정의 필요

## 6) Risks and Mitigation

- 리스크: 동기화 지연으로 전투 체감 저하
- 대응: 히트 판정 서버 권위 + 로컬 보간/예측 최소 도입

- 리스크: 코어 루프 훼손(협력보다 혼잡)
- 대응: 협력 목표(공동 탈출 보너스)와 역할 가치 명확화

- 리스크: 개발 복잡도 급증
- 대응: 2인 Co-op 수직 슬라이스 먼저 완료 후 기능 확장

## 7) KPI (Multiplayer)

- Co-op 세션 완료율
- 팀 전원 탈출 성공률
- 세션 중 이탈율
- Co-op 재플레이율

## Decision Log

- 2026-03-06: Multiplayer는 MVP 제외, Post-MVP 핵심 확장 축으로 채택
