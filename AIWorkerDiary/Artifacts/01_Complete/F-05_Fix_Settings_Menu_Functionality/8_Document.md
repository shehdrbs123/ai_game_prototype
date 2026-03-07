# Artifact: Fix Settings Menu Functionality - Documentation & Knowledge Strategy

## 1. Documentation Persistence Assessment
- **Persistency Required**: Yes
- **Target Documents**: `Docs/Structure_API/AudioSystem.md`, `Docs/Structure_API/UIManager.md`
- **Reasoning**: `AudioSystem`에 `setMasterVolume` 메서드가 추가되었으며, `UIManager`가 이제 일시정지 메뉴의 이벤트를 중앙 집중식으로 관리하게 되었으므로 이를 API 문서에 반영해야 함.

## 2. Knowledge Integration Results
- **Permanent Updates**: 
  - `AudioSystem.md`: `setMasterVolume(value)` 메서드 설명 추가.
  - `UIManager.md`: 일시정지 메뉴 버튼(`btnPauseResume`, `btnPauseSettings`, `btnPauseQuit`) 및 `volumeSlider` 이벤트 관리 책임 명시.

## 3. Architecture & API Reference
- **AudioSystem Interface**:
  - `setMasterVolume(value)`: 0.0 ~ 1.0 사이의 값을 받아 `masterGain` 노드를 통해 전체 볼륨을 제어함.
- **UI Event Management**:
  - 인라인 HTML 핸들러를 지양하고, `UIManager.bindDOMEvents()`에서 모든 전역 UI 요소를 바인딩하는 컨벤션을 확립함.
