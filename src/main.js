import { DIContainer } from './core/DIContainer.js';
import { EventBus } from './core/EventBus.js';
import { DataManager } from './managers/DataManager.js';
import { AssetManager } from './managers/AssetManager.js';
import { PlayerSession } from './managers/PlayerSession.js';
import { AudioSystem } from './managers/AudioSystem.js';
import { InputManager } from './managers/InputManager.js';
import { MapManager } from './managers/MapManager.js';
import { EntityManager } from './managers/EntityManager.js';
import { UIManager } from './managers/UIManager.js';
import { CraftingManager } from './managers/CraftingManager.js';
import { CheatManager } from './managers/CheatManager.js';
import { GameEngine } from './core/GameEngine.js';

/**
 * Game Bootstrap
 */
async function bootstrap() {
    const app = new DIContainer();

    // 1. 인프라 등록 (Foundations)
    app.register('EventBus', new EventBus());
    app.register('DataManager', new DataManager(app));
    app.register('AssetManager', new AssetManager(app));
    app.register('InputManager', new InputManager(app));

    // 2. 핵심 서비스 등록 (Engine Services)
    app.register('AudioSystem', new AudioSystem(app));
    app.register('MapManager', new MapManager(app));
    app.register('EntityManager', new EntityManager(app));

    // 3. 게임 로직 등록 (Game Logic)
    app.register('PlayerSession', new PlayerSession(app));
    app.register('CraftingManager', new CraftingManager(app));
    app.register('CheatManager', new CheatManager(app));

    // 4. 최상위 레이어 등록 (UI & Infrastructure)
    app.register('UIManager', new UIManager(app));
    app.register('GameEngine', new GameEngine(app));

    // 전역 참조 (디버그용)
    window.gameApp = app;

    /**
     * 모든 매니저 초기화 시퀀스 실행
     * DataManager.init()이 비동기(async)이므로 순차적 await 처리
     */
    const managerOrder = [
        'DataManager', 'AssetManager', 'InputManager',
        'AudioSystem', 'MapManager', 'EntityManager',
        'PlayerSession', 'CraftingManager', 'CheatManager',
        'UIManager', 'GameEngine'
    ];

    console.log("Bootstrap: Initializing managers...");
    
    for (const key of managerOrder) {
        console.log(`Bootstrap: Initializing ${key}...`);
        const manager = app.get(key);
        if (manager && typeof manager.init === 'function') {
            try {
                await manager.init(); // 비동기 초기화 지원
                console.log(`Bootstrap: ${key} initialized successfully.`);
            } catch (e) {
                console.error(`Bootstrap: Failed to initialize ${key}:`, e);
                throw e; // 하나라도 실패하면 중단
            }
        } else {
            console.warn(`Bootstrap: Manager ${key} not found or has no init()`);
        }
    }

    // 오디오 컨텍스트 재개를 위한 첫 클릭 리스너
    window.addEventListener('click', function firstClick() {
        const audio = app.get('AudioSystem');
        if (audio) audio.init(); 
        window.removeEventListener('click', firstClick);
    }, { once: true });

    // 게임 엔진 시작
    console.log("Bootstrap: Starting GameEngine...");
    const gameEngine = app.get('GameEngine');
    gameEngine.start();
}

// 부트스트랩 실행
bootstrap().catch(err => {
    console.error("Bootstrap: Failed to start application", err);
});
