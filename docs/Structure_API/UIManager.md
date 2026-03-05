# `UIManager`

**파일 경로**: `src/managers/UIManager.js`

## 역할
HUD, 인벤토리, 제작 등 모든 UI의 렌더링과 상호작용 로직을 총괄합니다.

## 주요 API
*   `openInventory(mode)`, `closeInventory()`: 인벤토리 창을 제어합니다.
*   `updateAllUI()`: 모든 UI를 현재 데이터에 맞게 새로고침합니다.
*   `showToast(msg)`: 화면에 짧은 알림 메시지를 표시합니다.
*   `createSlotHTML(...)`: 아이템 슬롯 DOM을 동적으로 생성합니다.
*   `doCraft()`: 현재 선택된 레시피로 아이템을 제작합니다.
*   `updateHUD(player)`: 플레이어의 실시간 상태(HP, SP)를 HUD에 반영합니다.
