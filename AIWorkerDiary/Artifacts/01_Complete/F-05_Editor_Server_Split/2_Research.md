# Research Result: [F-05] Editor Server Split

- 기존 root server.js에 editor API/정적 접근이 포함되어 있었음.
- Editor/editor.js가 /editor/api/*를 호출하고 있었음.
- 분리 시 root와 editor의 정적 루트/포트를 분리해야 충돌 없음.
