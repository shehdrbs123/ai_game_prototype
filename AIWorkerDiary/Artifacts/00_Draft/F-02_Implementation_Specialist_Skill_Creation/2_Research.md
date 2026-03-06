# Phase 2: Research - Implementation Specialist Skill Creation

## 1. Existing Skills Analysis (기존 스킬 분석)
- **Common Structure:**
    - **Frontmatter:** `name` (Kebab-case), `description` (Single-line, trigging info).
    - **Instructions:** High-level seniors persona definition.
    - **Section 1: Mandates/Rules:** Specific domain logic (DI, Tailwind, Canvas).
    - **Section 2: Documentation:** XML-style comments for methods/classes.
    - **Section 3: Workflow/Implementation:** Step-by-step procedure.
    - **Section 4: Reference Files:** Key project files.

## 2. Project Implementation Patterns (프로젝트 구현 패턴)
- **Tech Stack:** ES6 Modules (import/export), Vanilla JS.
- **Dependency Management:** `DIContainer`를 통한 싱글톤 매니저 패턴 (`this.c.get('ManagerName')`).
- **Utility usage:** `src/utils.js` 내 간단한 헬퍼 함수 활용.
- **Documentation:** 모든 함수/클래스에 `<summary>`, `<param>`, `<returns>` 태그를 포함한 XML 주석 필수.

## 3. Skill Design Considerations (스킬 설계 고려사항)
- **Role Identity:** "senior software engineer" 및 "implementation specialist"로서, 단순히 코드를 짜는 것을 넘어 '유지보수 가능한 코드'를 지향함.
- **SOLID Principles:** 특히 SRP(Single Responsibility Principle)를 강조하여 매니저 간의 역할 침범을 방지함.
- **Error Handling:** 예외 처리에 대한 명확한 가이드라인 제공 (e.g., UI feedback vs. Console error).
- **Refactoring Strategy:** 기존 로직을 수정할 때 사이드 이펙트를 최소화하기 위한 'Step-by-step execution' 지침.

## 4. Proposed Skill Content (제안된 스킬 내용)
- **Trigger:** "구현", "로직 추가", "리팩토링", "버그 수정" 키워드.
- **Reference Files:** `src/main.js`, `src/core/GameEngine.js`, `src/utils.js`.
