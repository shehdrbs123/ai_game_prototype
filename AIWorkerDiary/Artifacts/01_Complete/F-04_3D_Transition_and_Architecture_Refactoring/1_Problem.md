# Problem Definition: F-04 3D Transition and Architecture Refactoring

## 1. Background
- 기존 2D 타일맵 기반 게임을 Three.js를 활용한 3D 환경으로 전환하고, 확장성 및 유지보수성을 위해 아키텍처를 전면 개편함.

## 2. Infrastructure Reference (Stateless 기초)
- **Project Root**: `./`

## 3. Resource Mapping (Explicit Paths)
- [ ] `index.html`: 3D 엔진(Three.js) 라이브러리 추가 및 레이아웃 수정
- [ ] `src/main.js`: DIContainer 기반 매니저 초기화 로직 개편
- [ ] `src/core/GameEngine.js`: 3D 렌더러, 카메라, 조명 및 메인 루프 구현
- [ ] `src/core/DIContainer.js`: 의존성 주입 시스템
- [ ] `src/managers/AssetManager.js`: 3D 모델 및 리소스 로딩 관리
- [ ] `docs/Structure_API/Architecture_Dependency_Map.md`: 새로운 시스템 의존성 설계

## 4. Requirements & Standard Mode
- **Mode:** Standard (10-Phase Pipeline)
- 2D Canvas 렌더링을 WebGL(Three.js) 렌더링으로 전환
- 계층형 아키텍처(Layered Architecture) 및 의존성 주입(DI) 도입
- 3D 공간에서의 상호작용 및 카메라 제어 구현

## 5. Constraints & Assumptions
- 기존의 게임 데이터(`gameData.js`) 및 기본 로직(전투, 인벤토리)은 유지함.
- 브라우저 WebGL 호환성 전제.

## 6. Open Questions
- 3D 모델(FBX) 리소스 확보 및 애니메이션 통합 방식 (완료됨)

## 7. Internal Reflection
- **Mistakes**: 초기 2D 좌표계와 3D 좌표계 간의 혼선이 있었음.
- **Improvements**: 아키텍처 의존성 맵을 미리 작성하여 순환 참조를 방지함.

## 🏁 Phase Exit Checklist
- [x] **Transition Guarantee**: Phase 2로 이동 완료.
- [x] **Step Integrity**: 1단계 지침 준수.
- [x] **GLOBAL_GUIDELINES Compliance**: 4.2항 준수.
- [x] **Requirement Clarity**: 요구사항 명확화 완료.
