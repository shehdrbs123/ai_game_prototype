# High-Resolution Implementation Plan: F-01 Custom Skills Creation

## 1. Context Synchronization (Stateless Check)
- **Problem Context**: 프로젝트의 Manager-DI 아키텍처와 Data-Driven 설계를 전문적으로 보조할 수 있는 커스텀 스킬 3종을 생성하여 개발 효율성을 극대화함.
- **Research Evidence**: `.gemini/skills/` 디렉토리가 부재하며, DIContainer와 RAW_DATA 구조가 확인됨. 모든 수정은 DI 접근 방식과 데이터 포맷을 준수해야 함.

## 2. Alternative Strategy Comparison
- **Option A**: 프로젝트의 모든 측면을 다루는 하나의 거대한 'Project-Expert' 스킬 생성. (컨텍스트 오염 가능성 높음)
- **Option B**: 전문 분야별(Architect, Data, Visual) 3개의 독립적인 스킬 생성. (정교한 타겟팅 가능, 권장됨)
- **Option C**: 별도의 스크립트 도구만 추가하고 지침은 일반 AI에게 맡김. (일관성 유지 어려움)
- **Winner Strategy**: **Option B** - 각 도메인별로 명확한 활성화 조건(`description`)과 특화된 지침을 제공하여 가장 높은 품질의 결과물 도출 가능.

## 3. Resource Mapping & Impact Analysis
- **Target Folders**:
  - `.gemini/skills/`: 신규 생성될 프로젝트 전용 스킬 저장소.
  - `.gemini/skills/manager-architect/`: 아키텍처 전문가 스킬 폴더.
  - `.gemini/skills/game-data-expert/`: 데이터 전문가 스킬 폴더.
  - `.gemini/skills/visual-asset-designer/`: 시각 효과 전문가 스킬 폴더.
- **Target Files**:
  - `SKILL.md`: 각 폴더 내에 생성될 핵심 지침 파일.
- **Dependency Impact**: 프로젝트 코드 자체에는 영향을 주지 않으나, 이후의 AI 에이전트 작업 방식에 결정적인 가이드라인을 제공함.

## 4. Atomic Step-by-Step Implementation Guide (Min. 100 lines)

### Phase A: Environment Setup
1. [ ] **Step A-1: [Root] 디렉토리 생성**
   - **Logic**: `powershell.exe -Command "New-Item -ItemType Directory -Path .gemini/skills"`
   - **Validation**: `Test-Path .gemini/skills/` 결과 확인.
2. [ ] **Step A-2: 개별 스킬 폴더 생성**
   - **Logic**: `manager-architect`, `game-data-expert`, `visual-asset-designer` 폴더 각각 생성.

### Phase B: Manager-Architect Skill Implementation
1. [ ] **Step B-1: `.gemini/skills/manager-architect/SKILL.md` 작성**
   - **Logic**: YAML 프론트매터 설정 (`name: manager-architect`, `description: Expertise in Manager pattern and DI Container...`)
   - **Core Instruction**:
     - 새로운 시스템 추가 시 반드시 `Manager` 클래스로 구현할 것.
     - 모든 `Manager`는 생성자에서 `c` (DIContainer)를 주입받아야 함.
     - 의존성 접근 시 `this.c.get('ServiceName')` 패턴 고수.
     - `src/main.js`에 서비스 등록 로직을 자동으로 추가하는 절차 포함.
   - **Validation**: 파일 내용 내 DI 패턴 명시 여부 확인.

### Phase C: Game-Data-Expert Skill Implementation
1. [ ] **Step C-1: `.gemini/skills/game-data-expert/SKILL.md` 작성**
   - **Logic**: YAML 프론트매터 설정 (`name: game-data-expert`, `description: Expertise in game balance and RAW_DATA structure...`)
   - **Core Instruction**:
     - `src/data/gameData.js` 내의 `RAW_DATA` 구조를 최우선으로 참조.
     - 아이템 추가 시 `id`, `type`, `name`, `emoji`, `value`, `desc` 필수 필드 준수.
     - 레시피 추가 시 `ingredients` 배열 내 `id`와 `qty` 매칭 확인.
     - 밸런싱 수정 시 기존 수치와의 상대적 비율 계산 보고 의무화.
   - **Validation**: `RAW_DATA` 필드명 오타 방지 지침 포함 여부 확인.

### Phase D: Visual-Asset-Designer Skill Implementation
1. [ ] **Step D-1: `.gemini/skills/visual-asset-designer/SKILL.md` 작성**
   - **Logic**: YAML 프론트매터 설정 (`name: visual-asset-designer`, `description: Expertise in CSS styling and HTML5 Canvas visuals...`)
   - **Core Instruction**:
     - Tailwind CSS(CDN)를 활용한 유틸리티 클래스 우선 사용.
     - Canvas 연출 시 `requestAnimationFrame` 최적화 및 파티클 시스템 지침.
     - `Particle.js` 엔티티와의 연동 로직 표준화.
     - `style.css`와의 충돌 방지를 위한 독립적 클래스 명명 규칙.
   - **Validation**: Canvas 드로잉 컨벤션 포함 여부 확인.

### Phase E: Verification & Activation
1. [ ] **Step E-1: 스킬 리스트 확인**
   - **Logic**: `gemini skills list` 또는 `/skills list` 명령어로 인식 여부 확인.
2. [ ] **Step E-2: 테스트 활성화 시도**
   - **Logic**: 각 스킬의 `description`에 명시된 키워드를 포함한 요청을 보내 `activate_skill` 도구 호출 여부 확인.

## 5. Unit & Integration Test Scenarios
- [ ] **Test Case 1**: `manager-architect` 폴더 내 `SKILL.md`가 존재하고 `name`이 폴더명과 일치하는가?
- [ ] **Test Case 2**: `game-data-expert` 지침에 따라 가상의 아이템 추가 계획을 세웠을 때 `RAW_DATA` 구조를 정확히 따르는가?
- [ ] **Test Case 3**: `visual-asset-designer`가 Canvas 관련 요청 시 자동으로 호출되는가?

## 6. Internal Reflection
- **Mistakes**: 스킬 지침 내용이 너무 일반적이면 일반 AI와 차별화되지 않음. 프로젝트 코드베이스의 구체적인 변수명과 파일 경로를 지침에 직접 포함시켜야 함.
- **Improvements**: 각 스킬 폴더에 `references/` 폴더를 만들고, 해당 분야의 핵심 코드 스니펫을 파일로 저장해두면 AI가 더욱 정확하게 동작할 수 있음.
