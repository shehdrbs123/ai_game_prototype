# Phase 2: Research - Fix Settings Menu Functionality

## 1. Current Implementation Analysis
### 1.1 Pause Logic
- `InputManager.js`: ESC 키 입력 시 `window.togglePause()` 호출 및 `ui.closeAllUI()` 수행.
- `index.html`: `window.togglePause`가 정의되어 있으며 `window.isGamePaused` 플래그를 토글하고 `screenPause` UI를 표시함.
- `GameEngine.js`: `loop` 메서드에서 `window.isGamePaused`가 true이면 업데이트를 중단함.

### 1.2 Button Bindings
- **btnPauseResume:** `index.html`에서 `window.togglePause`와 연결됨.
- **btnPauseSettings:** 연결 없음.
- **btnPauseQuit:** `index.html`에서 `location.reload()`와 연결됨.
- **volumeSlider:** `index.html`에서 `bgmPlayer` (MIDI 플레이어)의 볼륨만 조절함. `AudioSystem`의 마스터 볼륨과는 무관함.

## 2. Dependencies & Available Systems
- **AudioSystem:** `masterGain` 노드를 통해 전체 볼륨 제어 가능. `setBGMVolume`, `setSFXVolume` 메서드 존재.
- **UIManager:** `showToast` 메서드를 통해 알림 표시 가능.
- **GameEngine:** `initTown()` 메서드를 통해 마을로 즉시 이동 가능.

## 3. Findings
- `index.html`에 하드코딩된 이벤트 핸들러들이 `UIManager`의 관리 범위를 벗어나 있음.
- `AudioSystem`의 초기화 시점과 `volumeSlider`의 연동 타이밍을 맞출 필요가 있음.
- "타이틀로 나가기" 기능은 단순히 새로고침보다 게임의 상태를 초기화하고 초기 화면으로 돌리는 것이 사용자 경험에 더 좋음.
