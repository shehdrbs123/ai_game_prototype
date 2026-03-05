# 엔티티 (Entities) 및 데이터 (Data)

## `src/entities/*.js`
`Player`, `Enemy`, `Projectile` 등 게임 세계에 존재하는 개별 객체들의 클래스가 정의되어 있습니다. 각 엔티티는 보통 `update(dt)`와 `draw(ctx)` 메서드를 가집니다.

## `src/data/gameData.js`
아이템, 레시피, 게임 설정 등 모든 원시 데이터가 `RAW_DATA` 객체 안에 정의되어 있습니다. 이 데이터는 `DataManager`가 불러와 사용합니다.
