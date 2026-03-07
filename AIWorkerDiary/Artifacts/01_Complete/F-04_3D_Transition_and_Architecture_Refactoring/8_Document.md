# Artifact: F-04 3D Transition and Architecture Refactoring - Documentation & Knowledge Strategy

## 1. Documentation Persistence Assessment
- **Persistency Required**: Yes
- **Target Documents**: `Docs/Structure_API/Architecture_Overview.md`, `Docs/Structure_API/Entities_and_Data.md`
- **Reasoning**: 2D에서 3D(Three.js)로의 전환은 프로젝트의 근간이 되는 변화이며, 새로 도입된 자동 탐색(Auto-Reveal) 및 마우스 락 로직은 향후 기능 확장 및 버그 수정 시 반드시 참조해야 할 핵심 규칙임.

## 2. Knowledge Integration Results
- **Permanent Updates**: 
    - `Architecture_Overview.md`: 3D 렌더링 시스템(Three.js), 애니메이션 시스템(Animator.js), 3D 기반 메인 루프 설명 추가.
    - `Architecture_Overview.md`: Unity/C# 포팅 가이드에 3D 씬 및 애니메이터 대응 관계 추가.
    - `Entities_and_Data.md`: 3D 기반 엔티티 구조 및 자동 탐색(Auto-Reveal) 시스템의 동작 규칙(중단 조건, 제어 방식) 명시.

## 3. Architecture & API Reference
- **Rendering Engine**: Three.js WebGLRenderer 기반.
- **Animation**: `src/core/Animator.js`를 통한 Bone 기반 애니메이션 관리.
- **Interaction**: `UIManager`와 `SlotRenderer` 간의 `isAutoSearching` 상태 동기화 및 포인터 락(Pointer Lock) 제어 로직 표준화.
