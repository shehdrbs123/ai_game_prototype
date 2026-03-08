# Plan: [F-05] Editor Server Split

1. root server.js를 게임 전용으로 축소하고 /Editor, /editor 차단.
2. Editor/server.js를 신설하고 /api/* CRUD를 이관.
3. Editor/editor.js API prefix를 /api/*로 변경.
4. README 및 npm scripts 갱신.
5. 문법/참조 검증 후 기록 업데이트.
