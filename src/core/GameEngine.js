import { BaseManager } from './BaseManager.js';
import { GAME_STATE } from "../data/gameState.js";
import { distance, rand, randInt } from "../utils.js";
import { Player } from "../entities/Player.js";
import { Enemy } from "../entities/Enemy.js";
import { Interactable } from "../entities/Interactable.js";

/**
 * GameEngine: 게임의 메인 업데이트 루프와 씬 전환, 그리고 입력 명령의 해석을 담당합니다.
 */
export class GameEngine extends BaseManager {
    constructor(app) {
        super(app);
        this.canvas = document.getElementById('gameCanvas');
        this.lastTime = 0;
        this.currentState = GAME_STATE.TOWN;
        this.pitch = 0;
        this.yaw = 0;

        const THREE = window.THREE;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;

        this._initLights();
    }

    init() {
        this._setupInputBindings();
        window.addEventListener('resize', () => this._onWindowResize());
        this.initTown();
        super.init();
    }

    /**
     * 설계 원칙에 따른 입력 바인딩: InputManager 이벤트를 해석하여 각 매니저의 API 호출
     * @private
     */
    _setupInputBindings() {
        this.app.get('EventBus').on('KEYDOWN', (code) => {
            const ui = this.get('UIManager');
            if (code === 'Tab') ui.toggleInventory();
            else if (code === 'Escape') {
                if (ui.isAnyUIOpen()) ui.closeAllUI();
                else this.togglePause();
            }
        });
    }

    togglePause() {
        if (window.isGamePaused) this.resume();
        else this.pause();
    }

    pause() {
        window.isGamePaused = true;
        document.getElementById('pauseMenu')?.classList.remove('hidden');
        document.exitPointerLock?.();
        this.get('AudioSystem').pauseBGM();
    }

    resume() {
        window.isGamePaused = false;
        document.getElementById('pauseMenu')?.classList.add('hidden');
        this.lastTime = performance.now();
        this.get('AudioSystem').resumeBGM();
    }

    initTown() {
        console.log("GameEngine: Initializing Town...");
        this.currentState = GAME_STATE.TOWN;
        const em = this.get('EntityManager');
        const mm = this.get('MapManager');
        const ui = this.get('UIManager');

        if (ui) ui.closeAllUI();
        this.get('AudioSystem').startBGM('town');

        em.clear();
        const townData = mm.generateTown(); 
        const ts = mm.ts || 100;

        em.player = new Player(townData.cx * ts, townData.cy * ts, this.app);
        townData.objs.forEach(o => {
            em.addEntity(em.interactables, new Interactable(o.x * ts, o.y * ts, o.type, null, this.app));
        });
        
        console.log("GameEngine: Town initialized.");
    }

    startRun(runPlan = null) {
        console.log("GameEngine: Attempting to start dungeon run...");
        this.currentState = GAME_STATE.PLAYING;
        const em = this.get('EntityManager');
        const mm = this.get('MapManager');
        const dm = this.get('DataManager');
        const ui = this.get('UIManager');

        if (ui) ui.closeAllUI();
        this.get('AudioSystem').startBGM('dungeon'); 

        // 1. 던전 계획 확정
        let selectedRunPlan = runPlan || this.nextDungeonPlan || dm.resolveDungeonPlan([], null);
        if (!selectedRunPlan) {
            console.error("GameEngine: Failed to resolve dungeon plan. Using default.");
            selectedRunPlan = { offerings: [], riskLevel: 0, dungeonId: 'default' };
        }
        this.activeDungeonPlan = selectedRunPlan;
        this.nextDungeonPlan = null;

        // 2. 맵 데이터 생성
        try {
            const rooms = mm.generateDungeon(selectedRunPlan); 
            if (!rooms || rooms.length === 0) throw new Error("Dungeon generation failed: No rooms");

            em.clear();
            const ts = mm.ts || 100;
            const startX = rooms[0].cx * ts;
            const startY = rooms[0].cy * ts;

            // 3. 플레이어 및 콘텐츠 배치
            em.player = new Player(startX, startY, this.app);
            this._spawnDungeonContents(rooms, ts);

            console.log("GameEngine: Dungeon initialized successfully.");
            this.events.emit('SCENE_CHANGED', { state: GAME_STATE.PLAYING });
        } catch (err) {
            console.error("GameEngine: Dungeon entry error:", err);
            this.initTown(); // 복구
        }
    }

    _spawnDungeonContents(rooms, ts) {
        const em = this.get('EntityManager');
        const dm = this.get('DataManager');

        for (let i = 1; i < rooms.length - 1; i++) {
            const room = rooms[i];
            if (Math.random() < 0.6) {
                const count = randInt(1, 4);
                for(let j=0; j<count; j++) {
                    em.addEntity(em.enemies, new Enemy(this.app, 'goblin', (room.x + rand(1, room.w-1)) * ts, (room.y + rand(1, room.h-1)) * ts));
                }
            }
            if (Math.random() < 0.4) {
                const chestItems = new Array(6).fill(null);
                const itemCount = randInt(1, 4);
                for(let k=0; k<itemCount; k++) {
                    const id = dm.getRandomDrop();
                    chestItems[k] = { data: dm.getItem(id), revealed: false, progress: 0 };
                }
                em.addEntity(em.interactables, new Interactable(room.cx * ts, room.cy * ts, 'CHEST', { items: chestItems, isOpened: false }, this.app));
            }
        }

        const lastRoom = rooms[rooms.length - 1];
        em.addEntity(em.interactables, new Interactable(lastRoom.cx * ts, lastRoom.cy * ts, 'EXIT', null, this.app));
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this._loop(t));
    }

    _loop(timestamp) {
        requestAnimationFrame((t) => this._loop(t));
        if (this.currentState === GAME_STATE.RESULT || window.isGamePaused) return;
        
        let dt = (timestamp - this.lastTime) / 1000; 
        if (dt > 0.1) dt = 0.1;
        this.lastTime = timestamp;
        
        const em = this.get('EntityManager');
        const input = this.get('InputManager');
        const ui = this.get('UIManager');

        // FPS 시점 업데이트
        if (input.isPointerLocked && !ui.isAnyUIOpen()) {
            const sensitivity = 0.002;
            this.yaw -= input.mouseDelta.x * sensitivity;
            this.pitch -= input.mouseDelta.y * sensitivity;
            this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
            this.camera.quaternion.setFromEuler(new window.THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
            input.mouseDelta.x = 0;
            input.mouseDelta.y = 0;
        }

        em.update(dt);
        this._handleInteractions(dt);
        
        if (em.player) {
            this.camera.position.set(em.player.x, 40, em.player.y);
            if (em.player.viewModel) {
                em.player.viewModel.position.copy(this.camera.position);
                em.player.viewModel.quaternion.copy(this.camera.quaternion);
            }
        }

        if (ui) ui.updateHUD(em.player);
        this.renderer.render(this.scene, this.camera);
    }

    _handleInteractions(dt) {
        const em = this.get('EntityManager');
        const input = this.get('InputManager');
        if (!em.player) return;

        let target = null;
        for (const obj of em.interactables) {
            if (distance(em.player.x, em.player.y, obj.x, obj.y) < 100) {
                target = obj;
                break;
            }
        }

        const prompt = document.getElementById('interactPrompt');
        if (target) {
            prompt?.classList.remove('hidden');
            const text = document.getElementById('interactText');
            if (text) text.innerText = `[E] ${this._getInteractName(target.type)}`;
            if (input.isKeyPressed('KeyE')) {
                input.keys['KeyE'] = false;
                this._executeInteraction(target);
            }
        } else prompt?.classList.add('hidden');

        if (em.player.channeling > 0) {
            em.player.channeling -= dt;
            if (em.player.channeling <= 0) {
                const ct = em.player.channelTarget;
                if (ct?.type === 'EXIT') this.endRun(true);
                else if (ct?.type === 'GATE_OBJ') this.startRun();
            }
        }
    }

    _getInteractName(type) {
        const names = { 'CHEST': '상자 열기', 'EXIT': '탈출하기', 'GATE_OBJ': '던전 진입', 'STASH_OBJ': '창고 열기', 'WORKBENCH_OBJ': '제작대', 'TOWNHALL_OBJ': '마을회관', 'ENEMY_CORPSE': '시체 루팅' };
        return names[type] || type;
    }

    _executeInteraction(target) {
        const ui = this.get('UIManager');
        if (target.type === 'CHEST' || target.type === 'ENEMY_CORPSE') ui.openInventory('loot', target);
        else if (target.type === 'STASH_OBJ') ui.openInventory('stash');
        else if (target.type === 'WORKBENCH_OBJ') ui.openCraftingMenu();
        else if (target.type === 'TOWNHALL_OBJ') ui.openUpgradeMenu();
        else if (target.type === 'EXIT' || target.type === 'GATE_OBJ') {
            this.get('EntityManager').player.channeling = 2.0;
            this.get('EntityManager').player.channelTarget = target;
        }
    }

    _initLights() {
        const THREE = window.THREE;
        this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(100, 500, 100);
        sun.castShadow = true;
        this.scene.add(sun);
    }

    _onWindowResize() { 
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    endRun(success) {
        this.currentState = GAME_STATE.RESULT;
        document.exitPointerLock?.();
        document.getElementById('screenHUD')?.classList.add('hidden');
        document.getElementById('screenResult')?.classList.remove('hidden');
        this.get('AudioSystem').stopBGM();
        this.events.emit('RUN_ENDED', { success });
    }
}
