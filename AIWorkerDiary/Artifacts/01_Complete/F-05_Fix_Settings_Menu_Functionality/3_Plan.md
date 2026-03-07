# Phase 3: Plan - Fix Settings Menu Functionality

## 1. Goal
- 일시정지 메뉴 내의 모든 상호작용 요소(재개, 설정, 나가기, 볼륨 슬라이더)에 기능을 부여함.
- `UIManager`를 통해 중앙 집중식으로 이벤트를 관리하여 코드 일관성을 유지함.

## 2. Implementation Strategy
### 2.1 AudioSystem.js 수정
- `setMasterVolume(value)` 메서드 추가: `masterGain.gain.setTargetAtTime`을 사용하여 전체 볼륨 제어.

### 2.2 UIManager.js 수정
- `bindDOMEvents`에서 설정 메뉴의 버튼 및 슬라이더 이벤트 바인딩 추가.
- `btnPauseResume`: `window.togglePause()` 호출.
- `btnPauseSettings`: "설정 기능은 준비 중입니다." 토스트 메시지 출력.
- `btnPauseQuit`: "정말 타이틀로 나가시겠습니까?" 확인 후 `location.reload()`.
- `volumeSlider`: `AudioSystem.setMasterVolume()` 및 MIDI 플레이어 볼륨 조절 호출.

### 2.3 index.html 수정
- `<script>` 태그 내부에 하드코딩된 `volumeSlider` 및 버튼 이벤트 핸들러 제거 (중복 방지).

## 3. Detailed Logic
- **Volume Logic:**
  - 슬라이더 값(0~100)을 0.0~1.0 범위로 변환.
  - `AudioSystem.masterGain.gain`에 적용 (SFX와 BGM 모두 영향).
  - MIDI 플레이어(`bgmPlayer`)의 `volume` 속성에도 적용.

## 4. Validation Plan
- **Resume:** ESC 키 또는 재개 버튼 클릭 시 메뉴가 닫히고 게임이 계속되는지 확인.
- **Settings:** 설정 버튼 클릭 시 토스트 메시지가 나타나는지 확인.
- **Quit:** 나가기 버튼 클릭 시 확인 팝업이 뜨고, 확인 시 페이지가 새로고침되는지 확인.
- **Volume:** 슬라이더 조절 시 효과음(ui 사운드 등)과 배경음의 크기가 동시에 변하는지 확인.
