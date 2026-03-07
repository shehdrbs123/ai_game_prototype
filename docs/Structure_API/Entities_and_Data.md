# 엔티티 (Entities) 및 데이터 (Data)

## `src/entities/*.js`
`Player`, `Enemy`, `Projectile` 등 게임 세계에 존재하는 개별 객체들의 클래스가 정의되어 있습니다. 
- **3D 기반:** 모든 엔티티는 Three.js의 `Object3D`를 상속하거나 포함하며, `Animator` 컴포넌트를 통해 본 애니메이션을 수행합니다.
- **주요 메서드:** `update(dt)`를 통해 로직과 애니메이션 프레임을 갱신합니다.

## 상호작용 시스템 (Interaction Systems)
- **Auto-Reveal (자동 탐색):** 상자나 전리품 컨테이너를 열었을 때 아이템을 자동으로 하나씩 탐색하는 시스템입니다.
    - **제어:** `UIManager`에서 `isAutoSearching` 상태로 관리하며, UI 내 버튼으로 ON/OFF 가능합니다.
    - **중단 조건:** 사용자가 화면을 클릭(`mousedown`)하면 자동 탐색이 중단됩니다. 마우스 호버나 단순 이동으로는 중단되지 않습니다.
    - **수동 탐색:** 자동 탐색이 OFF일 때, 아이템 슬롯을 좌클릭 유지(Hold)하거나 우클릭하여 탐색을 진행할 수 있습니다.

## `src/data/gameData.js`
아이템, 레시피, 게임 설정 등 모든 원시 데이터가 `RAW_DATA` 객체 안에 정의되어 있습니다. 이 데이터는 `DataManager`가 불러와 사용합니다.
