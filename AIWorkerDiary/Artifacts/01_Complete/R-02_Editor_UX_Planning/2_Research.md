# Research Result: [R-02] Editor UX Planning

## 1. Relevant Files & Symbols (Verified Paths)
- [ ] `./docs/index.md`: 프로젝트 문서 루트 인덱스.
- [ ] `./docs/Structure_API/DataManager.md`: 데이터 구조/로드 관점 참고 문서.
- [ ] `./Editor/index.html`: 단일 페이지 내 `datasetSelect`, `btnLoad`, `btnSave`, `btnReset`, `btnMonitor`, `configEditor` 존재 확인.
- [ ] `./Editor/editor.js`: `loadDatasetList`, `loadConfig`, `saveConfig`, `resetConfig`, `refreshMonitor`, `applyEventOverride` 로직 확인.
- [ ] `./Editor/editor.css`: 단일 textarea 중심 레이아웃 확인.
- [ ] `./Editor/server.js`: `GET/PUT /api/datasets/:datasetId`, `POST /api/datasets/:datasetId/reset`, `GET /api/monitor`, `POST /api/event-override` 확인.
- [ ] `./Editor/README.md`: 분리 서버 실행/접속 가이드 확인.

## 2. Issue Analysis / Root Cause
- 문제 1: 편집 표면이 `Config JSON textarea` 하나로 집중되어 있어 구조적 입력 유도(Form)가 없다.
- 문제 2: 데이터셋별 입력 패턴이 다른데도 화면이 동일하여 기획자 맥락 전환 비용이 크다.
- 문제 3: 대량 수치 조정(밸런스 튜닝) 시 Sheet 방식이 부재해 작업 속도가 낮다.
- 문제 4: 저장 전 필드 단위 validation이 없어 JSON parse 통과만으로 잘못된 값이 저장될 수 있다.
- 문제 5: 변경 diff가 없어 "무엇이 바뀌었는지" 확인이 어렵다.

## 3. Infrastructure & Conventions
- Editor는 분리 서버(`Editor/server.js`, 기본 `3100`)에서 동작한다.
- API base는 상대 경로(`/api/*`)로 통일되어 있어 화면 구조 변경 시 라우팅 영향이 작다.
- 프로젝트는 번들러 없이 module script 기반이므로 파일 분할 시 import 경로 관리가 핵심이다.
- 현재 CSS/HTML는 단순 구조라 탭/패널/그리드 확장 시 구조 리팩토링이 필요하다.

## 4. Technical Risks & Side-effects
- 리스크 1: Grid 편집 도입 시 focus/keyboard/clipboard 처리 복잡도가 증가한다.
- 리스크 2: dataset별 Form 스키마를 코드 하드코딩하면 유지보수 비용이 상승한다.
- 리스크 3: 대규모 DOM 업데이트는 성능 저하를 유발할 수 있다.
- 리스크 4: 기존 Raw JSON 사용자 흐름을 제거하면 숙련 사용자 생산성이 떨어질 수 있다.
- 리스크 5: `dungeonOfferingSystem` 특화 패널(Event/Monitor)과 공통 패널이 충돌할 수 있다.

## 5. Internal Reflection
- **Mistakes**: 초기 조사에서 `styles.css`를 조회했으나 실제 파일명은 `editor.css`였다.
- **Improvements**: 이후 파일명 추정 대신 `Get-ChildItem` 기반 경로 확정 후 조회를 고정한다.
