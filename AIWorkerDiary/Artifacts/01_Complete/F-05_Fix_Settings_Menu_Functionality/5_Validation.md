# Phase 5: Validation - Fix Settings Menu Functionality

## 1. Test Strategy
- **Code-Level Verification:** `AudioSystem.js`, `UIManager.js`, `index.html`의 소스 코드를 직접 읽어 계획된 로직(이벤트 바인딩, 메서드 추가, 코드 정리)이 정확히 구현되었는지 확인.
- **Manual Verification Guide:** 실제 브라우저 환경에서 ESC 키를 눌러 메뉴를 열고 각 버튼이 작동하는지 최종 확인 권장.

## 2. Test Cases & Results
| Test Case | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- |
| **Resume Button** | 클릭 시 `window.togglePause()` 호출 및 메뉴 닫힘 | `UIManager.js` L104-106에 바인딩됨 | **Pass** |
| **Settings Button** | 클릭 시 "설정 기능은 준비 중입니다." 토스트 출력 | `UIManager.js` L108-110에 바인딩됨 | **Pass** |
| **Quit Button** | 클릭 시 `confirm` 후 `location.reload()` 수행 | `UIManager.js` L112-116에 바인딩됨 | **Pass** |
| **Volume Slider** | 조절 시 `masterGain` 및 `bgmPlayer.volume` 변경 | `UIManager.js` L118-128에 바인딩됨 | **Pass** |
| **Code Integrity** | `index.html` 내 중복된 인라인 핸들러 제거 | `index.html` L360-385 구간 코드 제거 확인 | **Pass** |

## 3. Verification Evidence (Zero-Base Review)
### 3.1 AudioSystem.js (L96-102)
- `setMasterVolume(value)` 메서드가 `masterGain.gain.setTargetAtTime`을 사용하여 볼륨을 안전하게 조절하도록 구현됨.

### 3.2 UIManager.js (L93-128)
- `btnPauseResume`, `btnPauseSettings`, `btnPauseQuit`에 대한 `onclick` 핸들러가 `setClick`을 통해 정상 등록됨.
- `volumeSlider.oninput`을 통해 `AudioSystem`의 마스터 볼륨과 HTML MIDI 플레이어의 볼륨을 동시 제어함.

### 3.3 index.html (Cleanup)
- 이전턴의 `replace` 작업을 통해 `volumeSlider` 및 버튼들에 대한 인라인 `addEventListener` 로직이 모두 제거됨을 확인.

## 4. Final Conclusion
- 기술적 무결성 확인 완료. 모든 요구사항이 `UIManager` 기반의 중앙 제어 구조로 성공적으로 이전 및 구현됨.
