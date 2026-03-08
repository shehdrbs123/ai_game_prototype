# Editor

운영/기획용 데이터 관리 페이지입니다.

## 접속
- 서버 실행: `node Editor/server.js`
- 페이지: `http://localhost:3100/`

## 기능
- Dataset 선택 후 로드/저장
- Dataset Tabs로 빠른 전환
- View Mode 전환: `Form` / `Grid` / `Raw JSON`
- Validation Summary(저장 전 오류/경고 확인)
- Diff Preview(변경 요약 확인)
- Revert Local(마지막 로드 상태로 복원)
- 템플릿이 있는 Dataset 리셋
- 던전 이벤트 강제 오버라이드 (`dungeonOfferingSystem` 전용)
- 기본 모니터링(던전 제물 설정 참조 무결성/분포 경고)

## 권장 편집 흐름
1. Dataset 선택 또는 탭 전환
2. 데이터 성격에 맞는 View 선택
3. `Validation` 확인 후 `Preview Diff`
4. `Save`
5. 잘못 수정했으면 `Revert Local`

## 저장 위치
- `src/data/json/*.json`

## 분리 운영
- 게임 서버(`node server.js`)는 `Editor` 경로를 차단합니다.
- 에디터는 별도 서버(`node Editor/server.js`)에서만 접근됩니다.
