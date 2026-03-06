# Phase 3: Plan - Implementation Specialist Skill Creation

## 1. Action Strategy (실행 전략)
- **Tool Selection:** `skill-creator`에서 제공하는 `init_skill.cjs`, `package_skill.cjs` 스크립트를 최우선으로 사용함.
- **Pathing:** 신규 스킬은 `.gemini/skills/implementation-specialist/` 경로에 생성함.
- **Verification:** 패키징 전 `validate_skill.cjs`를 통해 YAML과 TODO 존재 여부를 사전에 검증함.

## 2. Implementation Plan (구현 계획)
- **Step 1: Skill Initialization**
    - `node <path-to-skill-creator>/scripts/init_skill.cjs implementation-specialist --path .gemini/skills/` 실행.
- **Step 2: Define SKILL.md Content**
    - **Frontmatter:** 
        - name: `implementation-specialist`
        - description: `Senior software engineer expertise in implementing complex game logic, refactoring, and enforcing technical standards like XML comments, SOLID, and DI patterns.`
    - **Sections:**
        - **1. Core Implementation Mandates:** SOLID (SRP), ES6+ Syntax, Clean Code.
        - **2. Dependency Management:** DIContainer usage (`this.c.get`).
        - **3. Technical Documentation (XML):** Detailed template for methods/classes.
        - **4. Testing & Validation:** Manual verification strategy and CheatManager usage.
- **Step 3: Resource Management**
    - 불필요한 예외 파일(`scripts/`, `assets/` 등의 예시 파일) 제거.
- **Step 4: Packaging & Distribution**
    - `node <path-to-skill-creator>/scripts/package_skill.cjs .gemini/skills/implementation-specialist/` 실행.
- **Step 5: Installation Guidance**
    - `gemini skills install ... --scope workspace` 제안 및 `/skills reload` 안내.

## 3. Alternative Strategy (대안 전략)
- **Alt A (Manual Creation):** 스크립트 실패 시 수동으로 폴더 구조 생성 및 `SKILL.md` 작성.
- **Alt B (Expansion of manager-architect):** 구현 지침을 기존 매니저 스킬에 통합 (비권장: SRP 위배 및 컨텍스트 비대화).
- **Alt C (Reference only):** 스킬 대신 `.ai` 전역 지침에만 추가 (비권장: 프로젝트 특화 구현 지능 확보 불가).

## 4. Verification Plan (검증 계획)
- **Static Analysis:** `validate_skill.cjs` 결과 성공 확인.
- **Structural Check:** `.skill` 파일 생성 여부 확인.
- **User Confirmation:** 설치 제안 및 리로드 안내 후 종료.
