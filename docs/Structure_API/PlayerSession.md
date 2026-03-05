# `PlayerSession`

**파일 경로**: `src/managers/PlayerSession.js`

## 역할
플레이어의 영구 데이터(`meta`)와 현재 탐험 데이터(`run`)를 분리하여 관리합니다.

## 주요 속성
*   `meta`: 재화, 업그레이드 레벨, 창고(`stash`) 등 영구 데이터
*   `run`: 현재 인벤토리, 장비 등 임시 데이터

## 주요 API
*   `giveItem(itemData)`: 인벤토리 또는 창고에 아이템을 추가합니다.
*   `consumeItems(itemId, qty)`: 지정된 아이템을 재료로 소모합니다.
*   `getDefense()`, `getMaxHp()`: 장비 및 업그레이드에 따른 스탯을 계산합니다.
