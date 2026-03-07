# Plan: [F-04] Data JSON Editor Expansion

## 1. Option Review
- A: 기존 구조 유지 + 부분 패치
- B: JSON 중심 전환 + Editor 다중 dataset (선택)
- C: 전체 리팩토링(과도)

## 2. Execution Steps
1. 데이터셋 파일 생성(settings/items/armorTemplates/recipes/dungeonOfferingSystem/gameplayBalance).
2. DataManager initialize(fetch) 구현.
3. main.js 부트 순서를 await initialize로 변경.
4. gameState 분리 및 import 정리.
5. Enemy/GameEngine/PlayerSession 하드코딩을 gameplayBalance 참조로 치환.
6. server.js에 /editor/api/datasets CRUD 추가.
7. Editor UI에 dataset selector 추가.
8. 문서(Editor/README) 갱신.
9. 검증 및 기록.
