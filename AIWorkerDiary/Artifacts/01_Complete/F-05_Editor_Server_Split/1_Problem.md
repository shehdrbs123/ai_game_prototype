# Problem Definition: [F-05] Editor Server Split

## Background
- Editor를 홈(게임) 서버와 분리해 별도 서버로 운영 필요.

## Requirements
- Root server는 Editor를 인식하지 않아야 함.
- Editor는 Editor 폴더 기준 전용 서버에서 동작.
- Editor 프론트/API 경로 정합성 유지.
