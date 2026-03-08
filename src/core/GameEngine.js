import { BaseManager } from './BaseManager.js';

/**
 * 게임의 메인 루프와 상태(실행, 일시정지)를 제어합니다.
 */
export class GameEngine extends BaseManager {
    constructor(app) {
        super(app);
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        
        this._loop = this._loop.bind(this);
    }

    init() {
        console.log("GameEngine: Initializing...");
        super.init();
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this._loop);
        console.log("GameEngine: Started.");
    }

    pause() {
        if (!this.isRunning || this.isPaused) return;
        this.isPaused = true;
        this.events.emit('GAME_PAUSED');
        console.log("GameEngine: Paused.");
    }

    resume() {
        if (!this.isRunning || !this.isPaused) return;
        this.isPaused = false;
        this.lastTime = performance.now(); // 시간 보정
        this.events.emit('GAME_RESUMED');
        console.log("GameEngine: Resumed.");
    }

    _loop(timestamp) {
        if (!this.isRunning) return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        if (!this.isPaused) {
            this.update(deltaTime);
        }

        requestAnimationFrame(this._loop);
    }

    update(deltaTime) {
        // 모든 매니저의 업데이트 로직 호출 (UIManager, EntityManager 등)
        // super.update()가 호출되면 하위 매니저들의 update를 DI를 통해 호출할 수도 있음
        this.get('EntityManager').update(deltaTime);
    }
}
