# Phase 1: Problem - Fix Settings Menu Functionality

## 1. Problem Description
- 일시정지 메뉴(ESC 키로 노출되는 `screenPause`) 내의 버튼들(게임 재개, 설정, 타이틀로 나가기)이 현재 아무런 기능과 연결되어 있지 않음.
- 사용자가 게임을 재개하거나 마을(또는 타이틀)로 돌아가고 싶을 때 버튼이 작동하지 않아 불편을 겪음.

## 2. Requirements
- **btnPauseResume (게임 재개):** 일시정지 메뉴를 닫고 게임을 재개해야 함. (Pointer Lock 재획득 포함)
- **btnPauseSettings (설정):** 현재는 기능이 정의되어 있지 않으나, 최소한 토스트 메시지로 "준비 중"임을 알리거나 향후 확장성을 고려해야 함.
- **btnPauseQuit (타이틀로 나가기):** 현재 상태를 저장(필요시)하고 마을(Town) 또는 타이틀 화면으로 돌아가야 함.
- **volumeSlider (볼륨 조절):** 마스터 볼륨 조절 기능이 있다면 AudioSystem과 연동해야 함.

## 3. Infrastructure Reference
- **Root:** `C:\Github\ai_game_prototype`
- **Guidelines:** `C:\Users\shehd\.ai\GLOBAL_GUIDELINES.md`
- **Pipeline:** `C:\Users\shehd\.ai\Workflow\Pipeline.md`
