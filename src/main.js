
import { DIContainer } from './core/DIContainer.js';
import { DataManager } from './managers/DataManager.js';
import { PlayerSession } from './managers/PlayerSession.js';
import { AudioSystem } from './managers/AudioSystem.js';
import { InputManager } from './managers/InputManager.js';
import { MapManager } from './managers/MapManager.js';
import { EntityManager } from './managers/EntityManager.js';
import { UIManager } from './managers/UIManager.js';
import { CraftingManager } from './managers/CraftingManager.js';
import { CheatManager } from './managers/CheatManager.js';
import { GameEngine } from './core/GameEngine.js';

const app = new DIContainer();
app.register('DataManager', new DataManager());
app.register('PlayerSession', new PlayerSession());
app.register('AudioSystem', new AudioSystem());
app.register('InputManager', new InputManager(app));
app.register('MapManager', new MapManager(app));
app.register('EntityManager', new EntityManager(app));
app.register('CraftingManager', new CraftingManager(app));
app.register('UIManager', new UIManager(app));
app.register('CheatManager', new CheatManager(app));
app.register('GameEngine', new GameEngine(app));

// 디버깅 및 외부 제어를 위해 전역 노출
window.gameApp = app;

// 초기 클릭 시 오디오 권한 획득 후 엔진 시작
window.addEventListener('click', function firstClick() {
    try {
        app.get('AudioSystem').init();
    } catch (e) {
        console.warn('AudioSystem init failed, but game will continue:', e);
        // 오디오 시스템 실패해도 게임은 진행
    }
    window.removeEventListener('click', firstClick);
}, { once: true });

const gameEngine = app.get('GameEngine');

// GameEngine의 update 메서드를 래핑하여 일시정지 기능 구현
// (GameEngine 내부 코드를 수정하지 않고 로직을 제어)
const originalUpdate = gameEngine.update;
if (typeof originalUpdate === 'function') {
    gameEngine.update = function(deltaTime) {
        if (window.isGamePaused) return; // 일시정지 상태면 업데이트 건너뜀
        originalUpdate.call(this, deltaTime);
    };
}

gameEngine.start();
