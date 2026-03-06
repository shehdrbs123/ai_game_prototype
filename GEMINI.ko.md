# Extraction Action Prototype - GEMINI Instructions (KO)

이 프로젝트는 순수 HTML, CSS, JavaScript로 제작된 2D 탑다운 익스트랙션 액션 게임 프로토타입입니다. 의존성 주입(Dependency Injection)과 매니저 기반의 모듈형 아키텍처를 따릅니다.

> **Note:** 영문 버전은 `GEMINI.md`를 참조하세요. 한 쪽을 수정할 때는 다른 쪽도 함께 업데이트하여 동기화를 유지해야 합니다.

## 🚀 프로젝트 개요

*   **장르:** 익스트랙션 RPG (던전 탐험, 루팅, 탈출, 마을 업그레이드).
*   **기술 스택:**
    *   **프론트엔드:** Vanilla JavaScript (ES6 Modules), HTML5 Canvas, Tailwind CSS (CDN).
    *   **백엔드:** Node.js (정적 파일 제공용 간단한 `http` 서버).
    *   **오디오:** Web Audio API, Magenta Music (`@magenta/music`), `html-midi-player`.
*   **아키텍처:**
    *   **의존성 주입:** 커스텀 `DIContainer` (`src/core/DIContainer.js`)가 서비스 생명주기를 관리합니다.
    *   **매니저 패턴:** 도메인별 로직은 매니저 클래스에 캡슐화되어 있습니다 (예: `InputManager`, `EntityManager`, `MapManager`).
    *   **데이터 중심 설계:** 게임 밸런스와 정의는 `src/data/gameData.js`에서 중앙 관리됩니다.

## 🛠️ 빌드 및 실행

### 사전 요구사항
*   Node.js 설치됨.

### 실행 명령
*   **서버 시작:** `start-server.bat` 실행 또는 `npx nodemon server.js` 입력.
*   **게임 접속:** 최신 웹 브라우저에서 `http://localhost:3000` 접속.
*   **디버깅:** `DIContainer` 인스턴스는 `window.gameApp`으로 전역 노출되어 있습니다.

## 📂 디렉토리 구조

*   `/`: 서버 및 설정 파일.
*   `/src/`: 핵심 게임 로직.
    *   `/core/`: `GameEngine` 및 `DIContainer`.
    *   `/managers/`: 입력, UI, 오디오, 맵, 엔티티 등을 위한 매니저 클래스.
    *   `/entities/`: `Player`, `Enemy`, `Projectile`, `Interactable` 등의 클래스.
    *   `/data/`: 중앙 집중식 게임 데이터 및 상수.
*   `/docs/`: API 및 구조 문서.
*   `/private_assets/`: 원본 오디오 및 스프라이트 에셋.

## 📜 개발 컨벤션

*   **매니저 패턴:** 새로운 글로벌 시스템을 추가할 때는 매니저 클래스를 생성하고 `src/main.js`에서 `DIContainer`를 통해 등록하세요.
*   **의존성 접근:** 전역 변수보다는 `DIContainer`에서 의존성을 가져오는 방식을 권장합니다.
*   **데이터 분리:** 아이템 정의, 제작법, 밸런스 상수는 `src/data/gameData.js`에 유지하세요.
*   **상태 관리:** `GameEngine`이 `GAME_STATE` (TOWN, PLAYING, RESULT)를 관리합니다.
*   **입력 처리:** 모든 입력(키보드, 마우스, 가상 게임패드)은 `InputManager`를 거쳐야 합니다.

## 🧪 테스트
*   현재 통합된 별도의 테스트 프레임워크는 없습니다.
*   브라우저에서의 직접 실행과 게임 내 치트 콘솔(게임 중 `/` 키)을 통한 수동 검증이 주요 테스트 방법입니다.
