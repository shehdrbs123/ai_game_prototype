# High-Resolution Implementation Plan: [R-02] Editor UX Planning

## 1. Context Synchronization (Stateless Check)
- **Problem Context**: Editor를 실제 기획자가 쓰기 쉬운 형태로 개선해야 하며, 데이터셋별 편집 UX를 분리해야 한다.
- **Research Evidence**: 현재는 textarea 단일 편집 구조이고, dataset별 특성 차이를 UI가 흡수하지 못한다.
- **Execution Scope**: 이번 Plan은 Phase 4 구현을 바로 시작할 수 있도록 파일 단위 수정 절차와 검증 시나리오를 정의한다.
- **Non-goal**: 서버 API 계약 자체를 대규모 변경하지 않는다.

## 2. Alternative Strategy Comparison
- **Option A: Full Sheet First**
- 장점: 대량 편집 속도가 빠르다.
- 단점: 중첩 JSON/도메인 제약 반영이 어렵고 validation UX가 약하다.
- 적합성: `gameplayBalance` 같은 단순 수치셋에는 높음, `dungeonOfferingSystem`에는 낮음.

- **Option B: Full Form First**
- 장점: 입력 가이드, validation, 제약 모델링이 명확하다.
- 단점: 대량 편집 생산성이 떨어진다.
- 적합성: 복잡 구조 데이터셋에는 높음, 반복 수치 튜닝에는 낮음.

- **Option C: Dataset Tabs + Hybrid View(Form/Grid/Raw)**
- 장점: 데이터셋 성격에 맞춰 모드를 선택할 수 있고 숙련/비숙련 사용자 모두 커버 가능.
- 단점: 초기 구현량이 Option A/B보다 크다.
- 적합성: 현재 요구사항(기획자 실사용성 + 안정성 + 점진 확장)에 가장 높다.

- **Winner Strategy**: Option C
- 선정 사유 1: 운영 안정성(Form validation)과 편집 생산성(Grid)을 함께 확보한다.
- 선정 사유 2: 기존 Raw JSON 흐름을 유지해 회귀 리스크를 낮춘다.
- 선정 사유 3: dataset별 템플릿/뷰 메타를 추가해 확장 가능 구조를 만든다.

## 3. Resource Mapping & Impact Analysis
- `./Editor/index.html`: 상단 탭/뷰 토글/패널 영역 마크업 추가.
- `./Editor/editor.css`: 탭, split layout, grid table, validation badge 스타일 추가.
- `./Editor/editor.js`: 상태 모델, dataset 메타, 뷰 전환, form/grid 렌더러, diff 계산 로직 추가.
- `./Editor/server.js`: API 유지, 필요시 `GET /api/datasets` 응답에 메타 확장 검토.
- `./Editor/README.md`: 새 UX 사용 흐름과 단축 조작(있다면) 문서화.
- 영향 모듈: 브라우저 단일 페이지 렌더링 흐름, 기존 event override 패널 동작, monitor 갱신 루틴.

## 4. Atomic Step-by-Step Implementation Guide (Min. 100 lines)
### Phase A: Foundation & Setup
1. [ ] Step A-1: `./Editor/editor.js` 상단에 `uiState` 객체를 추가한다.
   - **Logic**: `currentDatasetId`, `currentViewMode(form|grid|raw)`, `dirty`, `lastSavedSnapshot`를 저장.
   - **Validation**: 초기 로드 시 `uiState.currentViewMode === 'form'` 확인.
2. [ ] Step A-2: `./Editor/editor.js`에 `DATASET_UI_META` 상수를 정의한다.
   - **Logic**: dataset별 기본 뷰와 허용 뷰를 선언한다.
   - **Validation**: `loadDatasetList` 후 선택 dataset 메타 접근 가능 여부 확인.
3. [ ] Step A-3: `./Editor/index.html`에 `dataset tabs` 컨테이너를 추가한다.
   - **Logic**: select 유지 + tab 버튼 동시 지원으로 점진 마이그레이션.
   - **Validation**: 탭 클릭 시 dataset 변경 핸들러가 1회만 호출되는지 확인.
4. [ ] Step A-4: `./Editor/index.html`에 `view mode toggle` 섹션을 추가한다.
   - **Logic**: `Form`, `Grid`, `Raw JSON` 세 버튼과 active 상태 클래스를 둔다.
   - **Validation**: 버튼 전환 시 숨김/표시 패널이 의도대로 토글되는지 확인.
5. [ ] Step A-5: `./Editor/index.html`에 `formPanel`, `gridPanel`, `rawPanel` 영역을 분리한다.
   - **Logic**: 기존 textarea는 `rawPanel`로 이동한다.
   - **Validation**: 기존 저장 로직이 rawPanel 기준에서도 동작하는지 확인.
6. [ ] Step A-6: `./Editor/editor.css`에 `.tabs`, `.view-toggle`, `.panel-hidden` 스타일을 추가한다.
   - **Logic**: 현재 다크 테마 유지, 탭 active 대비를 명확히 한다.
   - **Validation**: 모바일 폭(<=768px)에서 줄바꿈/overflow가 깨지지 않는지 확인.
7. [ ] Step A-7: `./Editor/editor.js`에 `renderShell()`을 만든다.
   - **Logic**: 현재 dataset/뷰 상태에 따라 기본 UI 뼈대를 갱신한다.
   - **Validation**: 최초 init에서 에러 없이 1회 렌더되는지 콘솔 확인.
8. [ ] Step A-8: `./Editor/editor.js`에 `setDirtyState(isDirty)`를 추가한다.
   - **Logic**: status 메시지와 저장 버튼 강조를 함께 업데이트한다.
   - **Validation**: 입력 후 `dirty=true`, 저장 후 `dirty=false` 전환 확인.

### Phase B: Dataset-Aware Form View
9. [ ] Step B-1: `./Editor/editor.js`에 `renderFormForDataset(datasetId, data)`를 추가한다.
   - **Logic**: dataset별 렌더러 dispatch 패턴 사용(`formRenderers[datasetId]`).
   - **Validation**: 미구현 dataset은 fallback 메시지와 raw 전환 버튼 노출.
10. [ ] Step B-2: `dungeonOfferingSystem` 전용 폼 렌더러를 구현한다.
   - **Logic**: `slots`, `eventOverrides`, `generationProfiles` 핵심 필드를 카드형 입력으로 표현.
   - **Validation**: 숫자 필드 범위 벗어나면 저장 버튼 비활성화.
11. [ ] Step B-3: `settings` 전용 폼 렌더러를 구현한다.
   - **Logic**: boolean/small scalar 중심 토글+input 사용.
   - **Validation**: 값 변경이 내부 data 모델에 즉시 반영되는지 확인.
12. [ ] Step B-4: 공통 `bindFormField(path, type)` 유틸을 만든다.
   - **Logic**: path 기반 getter/setter로 중첩 필드 접근을 표준화한다.
   - **Validation**: path가 없을 때 안전하게 기본값 생성되는지 확인.
13. [ ] Step B-5: `validateDataset(datasetId, data)`를 프론트에도 추가한다.
   - **Logic**: 서버 validation 전 사전 체크로 UX 개선.
   - **Validation**: invalid 상태에서 에러 목록과 필드 하이라이트 노출.
14. [ ] Step B-6: `validationSummaryPanel`을 `index.html`에 추가한다.
   - **Logic**: 경고/오류 개수와 주요 메시지 5개를 출력한다.
   - **Validation**: 필드 수정 시 요약이 실시간 갱신되는지 확인.
15. [ ] Step B-7: 저장 시점 `preSaveGuard()`를 추가한다.
   - **Logic**: 오류가 있으면 저장 중단, 경고는 확인 후 저장 허용.
   - **Validation**: 오류 1개 이상이면 PUT 요청이 전송되지 않는지 확인.

### Phase C: Grid View for Bulk Editing
16. [ ] Step C-1: `./Editor/editor.js`에 `renderGridForDataset(datasetId, data)`를 추가한다.
   - **Logic**: 2차원 테이블로 flatten 가능한 dataset만 grid 활성화.
   - **Validation**: 비지원 dataset에서 grid 버튼 disabled 처리 확인.
17. [ ] Step C-2: `items` dataset용 grid 컬럼 스키마를 정의한다.
   - **Logic**: `id`, `name`, `rarity`, `value` 등 고정 컬럼 매핑.
   - **Validation**: 100행 이상 로딩 시 스크롤/입력 지연이 허용 수준인지 확인.
18. [ ] Step C-3: `recipes` dataset용 grid 컬럼 스키마를 정의한다.
   - **Logic**: recipe key + output + cost summary를 열로 분리.
   - **Validation**: 편집 후 JSON 역직렬화 시 구조 보존 확인.
19. [ ] Step C-4: 셀 편집 핸들러 `onGridCellCommit()`를 구현한다.
   - **Logic**: blur/enter 시 data 모델에 반영하고 dirty 상태 갱신.
   - **Validation**: undo 없는 상태에서도 잘못된 타입 입력은 즉시 롤백.
20. [ ] Step C-5: grid 필터 박스(`quick filter`)를 추가한다.
   - **Logic**: 텍스트 포함 검색으로 행 가시성만 제어한다.
   - **Validation**: 필터 해제 시 원본 행 개수 복구 확인.
21. [ ] Step C-6: grid 일괄 붙여넣기(탭 구분 텍스트) 최소 구현을 추가한다.
   - **Logic**: 선택 시작 셀 기준으로 행/열 매핑 후 유효성 검사.
   - **Validation**: 범위 초과 붙여넣기 시 안전 차단 메시지 확인.
22. [ ] Step C-7: grid 변경점 하이라이트(`cell-dirty`)를 추가한다.
   - **Logic**: lastSavedSnapshot 대비 변경 셀에 클래스 부여.
   - **Validation**: 저장 후 하이라이트가 초기화되는지 확인.

### Phase D: Raw JSON + Diff + Safety Nets
23. [ ] Step D-1: 기존 textarea를 `rawPanel` 전용으로 재연결한다.
   - **Logic**: view 전환 시 raw 텍스트와 현재 data 모델을 동기화한다.
   - **Validation**: form 변경 -> raw 전환 시 값 반영 여부 확인.
24. [ ] Step D-2: `computeDiffSummary(oldData, newData)` 유틸을 추가한다.
   - **Logic**: 경로 단위 changed/added/removed 카운트 계산.
   - **Validation**: 저장 직전 diff 요약이 상태 패널에 출력되는지 확인.
25. [ ] Step D-3: `btnPreviewDiff` 버튼을 추가한다.
   - **Logic**: 실제 저장 전 diff를 확인하고 사용자 판단을 유도한다.
   - **Validation**: diff 없을 때 "No changes" 메시지 출력 확인.
26. [ ] Step D-4: `btnRevertLocal` 버튼을 추가한다.
   - **Logic**: 마지막 로드 스냅샷으로 메모리 상태를 복원한다.
   - **Validation**: 복원 후 dirty false, 렌더 재동기화 확인.
27. [ ] Step D-5: `beforeunload` 가드를 추가한다.
   - **Logic**: dirty=true 상태에서 페이지 이탈 시 기본 경고 트리거.
   - **Validation**: 저장 후에는 이탈 경고가 사라지는지 확인.

### Phase E: Dungeon-Specific Panels Integration
28. [ ] Step E-1: event override 패널 표시 조건을 view와 분리한다.
   - **Logic**: dataset이 dungeon일 때만 패널 활성화, view 모드와 독립 유지.
   - **Validation**: dungeon 외 dataset에서 패널 비활성 상태 고정 확인.
29. [ ] Step E-2: monitor 패널을 `dock` 형태로 재배치한다.
   - **Logic**: form/grid/raw 어떤 뷰에서도 모니터를 접거나 펼칠 수 있게 한다.
   - **Validation**: monitor refresh가 view 전환과 무관하게 동작하는지 확인.
30. [ ] Step E-3: dungeon form 저장 성공 후 monitor 자동 갱신 유지.
   - **Logic**: 기존 `if (isDungeonDataset()) await refreshMonitor();` 경로 유지.
   - **Validation**: 저장 후 offeringPerDungeon 값이 즉시 반영되는지 확인.

### Phase F: Documentation & Rollout
31. [ ] Step F-1: `./Editor/README.md`에 새 UX 섹션을 추가한다.
   - **Logic**: dataset tabs, view modes, diff preview, revert 사용법을 기술.
   - **Validation**: 신규 사용자가 README만 보고 편집 흐름 재현 가능 여부 점검.
32. [ ] Step F-2: `./docs/Structure_API` 내 Editor 관련 문서 연결을 추가한다.
   - **Logic**: 필요 시 `docs/index.md`에서 Editor 운영 문서로 링크한다.
   - **Validation**: 문서 링크 dead path 없음 확인.
33. [ ] Step F-3: 릴리즈 노트 형태의 변경 로그를 Draft artifact에 기록한다.
   - **Logic**: UX 변경점/리스크/검증 결과를 요약한다.
   - **Validation**: Phase 8 문서화 시 그대로 재사용 가능한 수준인지 확인.

## 5. Unit & Integration Test Scenarios
- [ ] Test Case 1: dataset 탭 전환
  - Input: `settings` -> `items` -> `dungeonOfferingSystem`
  - Expected: 각 dataset 메타에 맞는 기본 뷰가 자동 선택된다.
- [ ] Test Case 2: form validation block
  - Input: `dungeonOfferingSystem.slots.offeringSlotCount = -1`
  - Expected: 오류 표시, 저장 버튼 비활성, PUT 미전송.
- [ ] Test Case 3: grid bulk edit
  - Input: `items` grid에서 3x3 셀 붙여넣기
  - Expected: 유효 타입만 반영, invalid 셀은 롤백 및 경고.
- [ ] Test Case 4: raw sync
  - Input: form에서 값 수정 후 raw 전환
  - Expected: textarea JSON이 최신 값으로 동기화됨.
- [ ] Test Case 5: diff preview
  - Input: 임의 필드 2개 수정 후 Preview Diff
  - Expected: changed 경로 2건 이상 표시.
- [ ] Test Case 6: revert local
  - Input: 수정 후 Revert Local
  - Expected: 마지막 로드 상태로 복원, dirty=false.
- [ ] Test Case 7: dungeon monitor coupling
  - Input: dungeon dataset 저장
  - Expected: monitor 자동 갱신, 경고 목록 최신화.
- [ ] Test Case 8: root/editor 서버 분리 회귀
  - Input: game server(3000), editor server(3100) 동시 실행
  - Expected: `3000/editor` 404, `3100/` 정상.

## 6. Internal Reflection
- **Mistakes**: 초기에 전략 대안은 제시했지만 구현 단계 분해가 원자 단위까지 내려가지 않았다.
- **Improvements**: 이후 Execute에서는 본 계획의 Step 번호를 commit/검증 로그에 1:1 매핑해 추적성을 강화한다.
