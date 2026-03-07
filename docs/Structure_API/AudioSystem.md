# `AudioSystem`

**파일 경로**: `src/managers/AudioSystem.js`

## 역할
게임의 모든 소리(효과음, 배경음악)를 절차적으로 생성하고 재생합니다.

## 주요 API
*   `setMasterVolume(value)`: 0.0 ~ 1.0 사이의 값을 받아 전체(Master) 볼륨을 설정합니다.
*   `play(type, vol)`: 지정된 `type`의 효과음을 재생합니다. (예: `ui`, `sword`, `hit`)
*   `startBGM(type)`: 'town' 또는 'dungeon' 배경음악을 재생합니다.
*   `stopBGM()`: 현재 배경음악을 중지합니다.
