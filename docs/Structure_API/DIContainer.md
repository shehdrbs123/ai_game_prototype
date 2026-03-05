# `DIContainer`

**파일 경로**: `src/core/DIContainer.js`

## 역할
의존성 주입 컨테이너. 각종 관리자(Manager) 모듈의 인스턴스를 중앙에서 생성하고 관리하여 모듈 간의 결합도를 낮춥니다.

## 주요 API
*   `register(name, instance)`: `name`(문자열)으로 `instance`(객체)를 컨테이너에 등록합니다.
*   `get(name)`: 등록된 인스턴스를 `name`으로 찾아 반환합니다.
