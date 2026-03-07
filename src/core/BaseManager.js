/**
 * 모든 매니저 클래스의 기본이 되는 추상 클래스
 * 모든 시스템은 이 클래스를 상속받아 통일된 인터페이스(init, update 등)를 구현합니다.
 */
export class BaseManager {
    /**
     * @param {DIContainer} app DI 컨테이너
     */
    constructor(app) {
        /** @type {DIContainer} */
        this.app = app;
        
        /** @type {EventBus} */
        this.events = app.get('EventBus');
        
        // 초기 상태
        this.initialized = false;
        this.enabled = true;
    }

    /**
     * 시스템 초기화 단계 (의존성 로딩 후 실행)
     * 서브클래스에서 구현하여 상호 참조 로직을 작성합니다.
     */
    init() {
        this.initialized = true;
    }

    /**
     * 프레임별 업데이트 로직
     * @param {number} deltaTime 프레임 간격
     */
    update(deltaTime) {
        if (!this.enabled) return;
        // 서브클래스에서 구체적인 로직 구현
    }

    /**
     * 시스템 활성화/비활성화
     */
    setEnabled(value) {
        this.enabled = value;
    }

    /**
     * 시스템 제거 시 정리 작업
     */
    destroy() {
        // 이벤트 구독 해제 등 정리 로직
    }

    /**
     * 필요한 다른 매니저를 DI 컨테이너에서 가져옵니다 (단축 메소드)
     */
    get(managerName) {
        return this.app.get(managerName);
    }
}
