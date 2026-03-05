# `InputManager`

**파일 경로**: `src/managers/InputManager.js`

## 역할
키보드, 마우스, 터치(가상 조이스틱) 등 모든 사용자 입력을 수신하고 상태를 관리합니다.

## 주요 속성
*   `keys`: 현재 눌린 키를 저장하는 객체 (예: `keys['KeyW']`)
*   `mouse`: 마우스 좌표 및 버튼 상태 저장
*   `moveJx`, `moveJy`, `aimJx`, `aimJy`: 가상 조이스틱 축 값

## 주요 API
*   `bindEvents()`: 전역 이벤트 리스너를 등록합니다.
