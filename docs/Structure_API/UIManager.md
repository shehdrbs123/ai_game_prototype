# `UIManager`

**파일 경로**: `src/managers/UIManager.js`

## 역할
MVVM(Model-View-ViewModel) 아키텍처 패턴을 기반으로 게임의 모든 UI 시스템(HUD, 인벤토리, 제작, 시설 강화 등)을 총괄합니다.
`PlayerSession`과 `DataManager`의 데이터를 기반으로 View(HTML)를 갱신하고, 사용자 입력을 처리하여 상태를 변경합니다.

### MVVM 구조에서의 역할
*   **Model:** `PlayerSession` (게임 내 플레이어의 영속적/세션 데이터), `DataManager` (아이템 및 레시피 정보)
*   **View:** `index.html` 내의 UI 레이아웃 및 `style.css`의 디자인.
*   **ViewModel (UIManager):** Model의 데이터를 View가 이해할 수 있는 형태(DOM)로 변환하고, View에서 발생하는 이벤트를 가공하여 Model을 업데이트하는 중계자 역할을 수행합니다.

## 주요 기능 및 API

### 1. 창 제어 (Window Management)
*   `openInventory(mode)`: 인벤토리를 엽니다. `mode`('inventory', 'stash', 'loot')에 따라 UI 레이아웃이 동적으로 변경됩니다.
*   `closeInventory()`, `closeCrafting()`, `closeUpgrade()`: 각 UI 창을 닫고 마우스 입력을 초기화합니다.
*   `isAnyUIOpen()`: 현재 화면에 활성화된 UI 창이 있는지 여부를 반환합니다.

### 2. 일시정지 및 설정 메뉴 (Pause & Settings Menu)
*   `bindDOMEvents()` 내부에서 `btnPauseResume`, `btnPauseSettings`, `btnPauseQuit` 및 `volumeSlider` 이벤트를 바인딩하여 관리합니다.
*   `volumeSlider` 조절 시 `AudioSystem.setMasterVolume`과 연동하여 전체 볼륨을 실시간으로 반영합니다.

### 3. 데이터 바인딩 및 렌더링 (Data Binding & Rendering)
*   `updateAllUI()`: `PlayerSession`의 전체 데이터(인벤토리, 장비, 창고, 재화 등)를 현재 View에 동기화합니다.
*   `updateHUD(player)`: 플레이어의 HP, SP, 방어력, 채널링(상자 열기 등) 상태를 실시간으로 HUD에 반영합니다.
*   `createSlotHTML(type, index, slotData, label, isHUD)`: 아이템 슬롯 DOM을 동적으로 생성하며, 해당 슬롯에 필요한 드래그 앤 드롭 및 터치 이벤트를 자동으로 바인딩합니다.
*   `updateLootUI()`: 현재 상호작용 중인 전리품 상자(`currentLootContainer`)의 내용을 UI에 표시합니다.

### 3. 상호작용 및 명령 처리 (Interaction & Commands)
*   `handleDrop(e, targetType, targetIndex)`: 아이템 드래그 앤 드롭을 통한 위치 이동, 장착, 보관 로직을 처리합니다.
*   `handleRightClickMove(type, index)`: 아이템 우클릭 시 인벤토리와 상자 간의 빠른 이동을 처리합니다.
*   `useItem(type, index)`: 아이템을 사용(소모품)하거나 장착(장비)합니다.
*   `handleMobileSlotClick(e, type, index)`: 모바일/터치 환경을 위한 슬롯 선택 및 '더블 탭' 액션을 관리합니다.
*   `sendToStash(type, index)`: 인벤토리/장비창의 아이템을 창고로 즉시 이동시킵니다.

### 4. 시설 및 경제 (Content & Economy)
*   `openCraftingMenu()`, `selectRecipe(idx)`, `doCraft()`: 제작법 목록을 표시하고 아이템 제작 로직을 실행합니다.
*   `upgradeFacility(type, costV, costM)`: 마을의 창고(인벤토리 확장)나 작업대(플레이어 스탯 강화) 시설을 강화합니다.
*   `sellStash()`: 창고에 보관된 귀중품 및 재료 아이템을 일괄 판매하여 재화로 변환합니다.
*   `showToast(msg)`: 사용자에게 짧은 알림 메시지를 표시합니다.

## 주요 특징
*   **터치 친화적 디자인:** 터치 디바이스를 감지하여 드래그 앤 드롭 대신 탭 기반의 UI 상호작용 방식으로 자동 전환됩니다.
*   **동적 슬롯 생성:** 모든 아이템 슬롯은 데이터의 상태(탐색됨, 비어있음, 아이템 존재 등)에 따라 실시간으로 생성 및 갱신됩니다.
