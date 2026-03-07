/**
 * 중앙 이벤트 버스 시스템 (Pub/Sub)
 * 시스템 간의 직접적인 참조를 줄이고 데이터 변경이나 상태 전환을 전파합니다.
 */
export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * 특정 이벤트를 구독합니다.
     * @param {string} eventName 이벤트 이름
     * @param {Function} callback 실행할 콜백 함수
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName).push(callback);
    }

    /**
     * 특정 이벤트를 한 번만 구독합니다.
     */
    once(eventName, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(eventName, wrapper);
        };
        this.on(eventName, wrapper);
    }

    /**
     * 이벤트를 발생시켜 모든 구독자에게 알립니다.
     * @param {string} eventName 이벤트 이름
     * @param {any} data 전달할 데이터
     */
    emit(eventName, data) {
        if (!this.listeners.has(eventName)) return;
        this.listeners.get(eventName).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in EventBus listener for ${eventName}:`, error);
            }
        });
    }

    /**
     * 구독을 해제합니다.
     */
    off(eventName, callback) {
        if (!this.listeners.has(eventName)) return;
        const callbacks = this.listeners.get(eventName);
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
            callbacks.splice(index, 1);
        }
    }
}
