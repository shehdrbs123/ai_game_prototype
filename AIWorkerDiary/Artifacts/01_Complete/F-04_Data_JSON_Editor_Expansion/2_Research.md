# Research Result: [F-04] Data JSON Editor Expansion

## 1. Findings
- 기존 DataManager는 `RAW_DATA` 정적 import 기반.
- Editor API는 `dungeonOfferingSystem` 단일 파일만 처리.
- Enemy/GameEngine/PlayerSession에 밸런스 하드코딩 다수 존재.

## 2. Root Cause
- 데이터 원천이 코드와 editor storage로 분리되어 단일 소스가 없음.

## 3. Risks
- 생성자 시그니처 변경(PlayerSession) 영향.
- 런타임에서 JSON fetch 실패 시 초기화 실패.

## 4. Decision
- `src/data/json`을 소스 오브 트루스로 고정.
- Editor는 해당 경로를 직접 편집.
