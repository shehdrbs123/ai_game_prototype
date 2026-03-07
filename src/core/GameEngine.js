import { BaseManager } from '../core/BaseManager.js';
import { GAME_STATE } from "../data/gameData.js";
import { distance, rand, randInt } from "../utils.js";
import { Player } from "../entities/Player.js";
import { Enemy } from "../entities/Enemy.js";
import { Interactable } from "../entities/Interactable.js";
import { ItemDrop } from "../entities/ItemDrop.js";

/**
 * GameEngine: 게임의 메인 루프, 3D 렌더링 컨텍스트, 씬 전환 및 전역 상태를 관리합니다.
 * C# Porting: Unity의 GameManager, Main Loop, SceneManager로 대응됩니다.
 */
export class GameEngine extends BaseManager {
    /**
     * @param {DIContainer} app 
     */
    constructor(app) {
        super(app);
        
        this.canvas = document.getElementById('gameCanvas');
        this.lastTime = 0;
        this.currentState = GAME_STATE.TOWN;
        
        // 상호작용 및 던전 계획 상태
        this.interactTargets = [];
        this.interactTargetIdx = 0;
        this.nextDungeonPlan = null;
        this.activeDungeonPlan = null;

        // Three.js Core
        this.scene = new window.THREE.Scene();
        this.camera = new window.THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.renderer = new window.THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.shadowMap.enabled = true;
        
        this.pitch = 0;
        this.yaw = 0;

        this.initLights();
    }

    /**
     * 조명 초기화
     */
    initLights() {
        const ambientLight = new window.THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        this.spotLight = new window.THREE.SpotLight(0xffffff, 1.0, 500, Math.PI / 4, 0.5);
        this.spotLight.castShadow = true;
        this.scene.add(this.spotLight);
        this.scene.add(this.spotLight.target);
    }

    /**
     * 게임 시작 및 루프 진입
     */
    start() {
        this.get('InputManager').bindEvents();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
        
        window.addEventListener('wheel', (e) => {
            if (this.interactTargets.length > 1) {
                this.interactTargetIdx = (this.interactTargetIdx + (e.deltaY > 0 ? 1 : -1) + this.interactTargets.length) % this.interactTargets.length;
            }
        }, { passive: true });

        this.initTown();
        requestAnimationFrame((t) => this.loop(t));
    }

    resizeCanvas() { 
        const width = window.innerWidth; 
        const height = window.innerHeight; 
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    // --- 씬 전환 (Scene Management) ---

    initTown() {
        this.currentState = GAME_STATE.TOWN;

        const ui = this.get('UIManager');
        ui.closeAllUI();

        // 결과 화면 숨김 추가
        document.getElementById('screenResult').classList.add('hidden');
        document.getElementById('screenHUD').classList.remove('hidden');

        this.get('PlayerSession').resizeInventory();
        this.get('AudioSystem').startBGM('town');
        const mm = this.get('MapManager');
        const townData = mm.generateTown();
        const em = this.get('EntityManager');
        em.clear();
        
        em.player = new Player(townData.cx * mm.ts, townData.cy * mm.ts, this.app);
        townData.objs.forEach(o => {
            em.addEntity(em.interactables, new Interactable(o.x * mm.ts, o.y * mm.ts, o.type, null, this.app));
        });
        
        this.events.emit('SCENE_CHANGED', { state: GAME_STATE.TOWN });
    }

    /**
     * 다음 던전 탐험 계획 수립 (main 기능 통합)
     */
    prepareNextDungeonRun(offerings = [], jadeItemId = null, options = {}) {
        const dm = this.get('DataManager');
        this.nextDungeonPlan = dm.resolveDungeonPlan(offerings, jadeItemId, options);
        return this.nextDungeonPlan;
    }

    /**
     * 던전 탐험 시작
     * main의 runPlan 로직 병합
     */
    startRun(runPlan = null) {
        this.currentState = GAME_STATE.PLAYING;
        const ui = this.get('UIManager');
        ui.closeAllUI();
        
        this.get('AudioSystem').startBGM('dungeon'); 
        
        const session = this.get('PlayerSession');
        const data = this.get('DataManager');
        const mm = this.get('MapManager');
        const em = this.get('EntityManager');

        // 초기 무기 지급
        if (!session.meta.receivedFreeWeapon) {
            const wps = [data.getItem('sword'), data.getItem('spear'), data.getItem('bow')]; 
            session.run.equipment.weapon = wps[randInt(0, wps.length)]; 
            session.meta.receivedFreeWeapon = true;
            ui.showToast("무기가 자동 장착되었습니다.");
        }
        
        // 던전 계획 결정 및 생성
        ui.updateAllUI(); 
        const selectedRunPlan = runPlan || this.nextDungeonPlan || data.resolveDungeonPlan([], null);
        this.activeDungeonPlan = selectedRunPlan;
        this.nextDungeonPlan = null;

        const rooms = mm.generateDungeon(selectedRunPlan); 
        em.clear();
        em.player = new Player(rooms[0].cx * mm.ts, rooms[0].cy * mm.ts, this.app);
        // 채널링 초기화
        em.player.channeling = 0;
        em.player.channelTarget = null;
        
        // 방별 오브젝트/적 스폰
        for (let i = 1; i < rooms.length - 1; i++) {
            const room = rooms[i];
            const typeRand = Math.random();
            if (typeRand < 0.5) room.type = 'COMBAT'; else if (typeRand < 0.8) room.type = 'LOOT';

            if (room.type === 'COMBAT' || room.type === 'NORMAL') {
                const count = randInt(1, 4);
                for(let j=0; j<count; j++) {
                    em.addEntity(em.enemies, new Enemy((room.x + rand(1, room.w - 1)) * mm.ts, (room.y + rand(1, room.h - 1)) * mm.ts, Math.random() < 0.3, this.app));
                }
            }
            if (room.type === 'LOOT' || Math.random() < 0.3) {
                const chestItems = new Array(6).fill(null);
                const count = randInt(1, 4);
                for(let j=0; j<count; j++) {
                    const id = data.getRandomDrop();
                    const emptyIdx = chestItems.findIndex(x => x === null);
                    if(emptyIdx !== -1) chestItems[emptyIdx] = { data: data.getItem(id), revealed: false, progress: 0 };
                }
                em.addEntity(em.interactables, new Interactable((room.cx + rand(-1, 1)) * mm.ts, (room.cy + rand(-1, 1)) * mm.ts, 'CHEST', { items: chestItems, isOpened: false }, this.app));
            }
        }

        em.addEntity(em.interactables, new Interactable(rooms[rooms.length-1].cx * mm.ts, rooms[rooms.length-1].cy * mm.ts, 'EXIT', null, this.app));
        if (session.meta.lastDeathCorpse) {
            em.addEntity(em.interactables, new Interactable((rooms[0].cx + 1) * mm.ts, rooms[0].cy * mm.ts, 'CORPSE', session.meta.lastDeathCorpse, this.app));
            session.meta.lastDeathCorpse = null;
        }

        this.events.emit('SCENE_CHANGED', { state: GAME_STATE.PLAYING });
    }

    /**
     * 메인 루프
     */
    loop(timestamp) {
        requestAnimationFrame((t) => this.loop(t));
        
        if (this.currentState === GAME_STATE.RESULT || window.isGamePaused) return;
        
        let dt = (timestamp - this.lastTime) / 1000; 
        if (dt > 0.1) dt = 0.1;
        this.lastTime = timestamp;
        
        const input = this.get('InputManager');
        const em = this.get('EntityManager');
        const ui = this.get('UIManager');
        
        if (input.isPointerLocked && !ui.isAnyUIOpen()) {
            const sensitivity = 0.002;
            this.yaw -= input.mouseDelta.x * sensitivity;
            this.pitch -= input.mouseDelta.y * sensitivity;
            this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
            this.camera.quaternion.setFromEuler(new window.THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
            input.mouseDelta.x = 0;
            input.mouseDelta.y = 0;
        }

        const forward = new window.THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        input.mouse.worldX = this.camera.position.x + forward.x * 100;
        input.mouse.worldY = this.camera.position.z + forward.z * 100;
        
        em.update(dt);
        this.handleInteractions(dt);
        
        if (em.player) {
            this.camera.position.set(em.player.x, 30, em.player.y);
            this.spotLight.position.copy(this.camera.position);
            const targetPos = this.camera.position.clone().add(forward.multiplyScalar(10));
            this.spotLight.target.position.copy(targetPos);
            
            if (em.player.mesh) em.player.mesh.visible = false;
        }

        ui.updateHUD(em.player);
        this.render();
    }

    handleInteractions(dt) {
        const em = this.get('EntityManager');
        const ui = this.get('UIManager');
        const input = this.get('InputManager');
        if (!em.player) return;

        let newTargets = [];
        em.items.forEach(item => { if (distance(em.player.x, em.player.y, item.x, item.y) < 50) newTargets.push({ type: 'ITEM', obj: item }); });
        em.interactables.forEach(obj => { if (obj.active && distance(em.player.x, em.player.y, obj.x, obj.y) < 70) newTargets.push({ type: 'OBJ', obj: obj }); });

        if (newTargets.length === 0) {
            this.interactTargets = [];
            document.getElementById('interactPrompt').classList.add('hidden');
            return;
        }

        this.interactTargets = newTargets;
        const target = this.interactTargets[this.interactTargetIdx % this.interactTargets.length];
        
        this.updateInteractUI(target);

        if (input.keys['KeyE']) {
            input.keys['KeyE'] = false;
            this.executeInteraction(target);
        }

        if (em.player.channeling > 0) {
            em.player.channeling -= dt;
            if (em.player.channeling <= 0) {
                if (em.player.channelTarget.type === 'EXIT') this.endRun(true);
                else if (em.player.channelTarget.type === 'GATE_OBJ') this.startRun();
            }
        }
    }

    updateInteractUI(target) {
        const prompt = document.getElementById('interactPrompt');
        const text = document.getElementById('interactText');
        prompt.classList.remove('hidden');
        if (target.type === 'ITEM') text.innerText = `줍기: ${target.obj.data.name}`;
        else text.innerText = `상호작용: ${target.obj.type}`;
    }

    executeInteraction(target) {
        const ui = this.get('UIManager');
        const em = this.get('EntityManager');

        if (target.type === 'ITEM') {
            if (ui.get('PlayerSession').giveItem(target.obj.data)) {
                em.items = em.items.filter(i => i !== target.obj);
                if (target.obj.mesh) this.scene.remove(target.obj.mesh);
            }
        } else {
            const obj = target.obj;
            if (obj.type === 'CHEST' || obj.type === 'CORPSE' || obj.type === 'ENEMY_CORPSE') {
                ui.openInventory('loot', obj);
            } else if (obj.type === 'STASH_OBJ') ui.openInventory('stash');
            else if (obj.type === 'WORKBENCH_OBJ') ui.openCraftingMenu();
            else if (obj.type === 'TOWNHALL_OBJ') ui.openUpgradeMenu();
            else if (obj.type === 'EXIT' || obj.type === 'GATE_OBJ') {
                em.player.channeling = 3.0;
                em.player.channelTarget = obj;
            }
        }
    }
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    endRun(success) {
        this.currentState = GAME_STATE.RESULT;

        // 마우스 락 해제
        document.exitPointerLock();

        document.getElementById('screenHUD').classList.add('hidden');   
        document.getElementById('screenResult').classList.remove('hidden');
 
        document.getElementById('interactPrompt').classList.add('hidden');
        
        const em = this.get('EntityManager');
        if (em.player) em.player.cancelChannel(); 
        this.get('UIManager').closeAllUI();

        const audio = this.get('AudioSystem');
        audio.stopBGM(); 
        if (success) audio.play('success'); else audio.play('fail');

        const title = document.getElementById('resultTitle');
        const sub = document.getElementById('resultSub');
        const list = document.getElementById('resultList');
        list.innerHTML = '';
        
        const session = this.get('PlayerSession');
        const allItems = [
            ...session.run.inventory, 
            ...session.run.quickSlots, 
            session.run.equipment.head, 
            session.run.equipment.chest, 
            session.run.equipment.legs, 
            session.run.equipment.boots, 
            session.run.equipment.weapon
        ].filter(i => i !== null);

        if (success) {
            title.innerText = "탈출 성공!"; 
            title.className = "text-4xl md:text-6xl font-black mb-4 text-center text-green-500";
            sub.innerText = "수집한 아이템을 무사히 마을로 가져왔습니다.";
            
            if (allItems.length === 0) {
                list.innerHTML = '<li class="text-gray-500 text-center py-4">가방에 아이템이 없습니다.</li>';
            } else {
                allItems.forEach(item => {
                    const li = document.createElement('li'); 
                    li.className = "flex justify-between items-center bg-gray-900 p-2 rounded";
                    li.innerHTML = `<span><span class="text-lg">${item.emoji}</span> ${item.name}</span> <span class="text-gray-400 text-xs">${item.type === 'equipment' ? '장비' : '재료'}</span>`; 
                    list.appendChild(li);
                });
            }
            session.meta.lastDeathCorpse = null; 
        } else {
            session.run.inventory.fill(null); 
            session.run.quickSlots.fill(null); 
            session.run.equipment = { weapon: null, head: null, chest: null, legs: null, boots: null };
            
            title.innerText = "KIA (사망)"; 
            title.className = "text-4xl md:text-6xl font-black mb-4 text-center text-red-600";
            sub.innerText = "모든 물품을 잃고 구조되었습니다."; 
            list.innerHTML = '<li class="text-red-400 text-center py-4 font-bold">인벤토리/장착 중인 모든 항목 손실</li>';
            
            allItems.forEach(item => { 
                const li = document.createElement('li'); 
                li.className = "flex justify-between items-center bg-red-900 bg-opacity-30 p-2 rounded text-gray-500 line-through"; 
                li.innerHTML = `<span><span class="text-lg">${item.emoji}</span> ${item.name}</span>`; 
                list.appendChild(li); 
            });

            if (allItems.length > 0) {
                session.meta.lastDeathCorpse = { items: allItems };
                const info = document.createElement('p'); 
                info.className = "text-yellow-500 text-xs md:text-sm mt-4 text-center font-bold"; 
                info.innerText = "※ 다음 출정 시 스폰 지점 근처에서 유실물을 회수할 수 있습니다."; 
                list.appendChild(info);
            }
        }
        
        this.events.emit('RUN_ENDED', { success });
    }
}
