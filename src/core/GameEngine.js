
import { GAME_STATE } from "../data/gameState.js";
import { distance, rand, randInt } from "../utils.js";
import { Player } from "../entities/Player.js";
import { Enemy } from "../entities/Enemy.js";
import { Interactable } from "../entities/Interactable.js";
import { ItemDrop } from "../entities/ItemDrop.js";

export class GameEngine {
    constructor(container) {
        this.c = container;
        this.canvas = document.getElementById('gameCanvas');
        this.lastTime = 0;
        this.currentState = GAME_STATE.TOWN;
        this.width = 0;
        this.height = 0;
        this.interactTargets = [];
        this.interactTargetIdx = 0;
        this.nextDungeonPlan = null;
        this.activeDungeonPlan = null;

        // Three.js Core Components
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.shadowMap.enabled = true;
        
        // Raycaster for Mouse interaction
        this.raycaster = new THREE.Raycaster();
        this.mouseVec = new THREE.Vector2();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        // Camera Setup for 1st Person
        this.camera.position.set(0, 30, 0); // Head height
        this.pitch = 0;
        this.yaw = 0;

        // Lighting
        this.initLights();
    }

    initLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // Flashlight-like light attached to camera
        this.spotLight = new THREE.SpotLight(0xffffff, 1.0, 500, Math.PI / 4, 0.5);
        this.spotLight.castShadow = true;
        this.scene.add(this.spotLight);
        this.scene.add(this.spotLight.target);
    }

    start() {
        this.c.get('InputManager').bindEvents();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
        this.initTown();

        // 마우스 휠로 상호작용 대상 전환
        window.addEventListener('wheel', (e) => {
            if (this.interactTargets.length > 1) {
                this.interactTargetIdx = (this.interactTargetIdx + (e.deltaY > 0 ? 1 : -1) + this.interactTargets.length) % this.interactTargets.length;
            }
        }, { passive: true });

        requestAnimationFrame((t) => this.loop(t));
    }

    resizeCanvas() { 
        this.width = window.innerWidth; 
        this.height = window.innerHeight; 
        this.renderer.setSize(this.width, this.height);
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
    }

    initTown() {
        this.currentState = GAME_STATE.TOWN;
        document.getElementById('screenHUD').classList.remove('hidden');
        document.getElementById('screenResult').classList.add('hidden'); 
        document.getElementById('channelingUI').classList.add('hidden');
        
        let ui = this.c.get('UIManager');
        ui.closeInventory(); 
        ui.closeCrafting();
        ui.closeUpgrade();
        this.c.get('PlayerSession').resizeInventory(); 
        
        ui.updateAllUI();
        
        let mm = this.c.get('MapManager');
        let townData = mm.generateTown();
        let em = this.c.get('EntityManager');
        em.clear();
        
        em.player = new Player(townData.cx * mm.ts, townData.cy * mm.ts, this.c);
        townData.objs.forEach(o => em.addEntity(em.interactables, new Interactable(o.x * mm.ts, o.y * mm.ts, o.type, null, this.c)));
        
        this.c.get('AudioSystem').startBGM('town');
    }

    prepareNextDungeonRun(offerings = [], jadeItemId = null, options = {}) {
        const dm = this.c.get('DataManager');
        this.nextDungeonPlan = dm.resolveDungeonPlan(offerings, jadeItemId, options);
        return this.nextDungeonPlan;
    }

    startRun(runPlan = null) {
        this.currentState = GAME_STATE.PLAYING;
        document.getElementById('channelingUI').classList.add('hidden');
        let ui = this.c.get('UIManager');
        ui.closeInventory(); ui.closeCrafting(); ui.closeUpgrade();
        
        this.c.get('AudioSystem').startBGM('dungeon'); 
        
        let session = this.c.get('PlayerSession');
        const gameplayBalance = this.c.get('DataManager').getGameplayBalance() || {};
        const runCfg = gameplayBalance.runGeneration || {};
        if (!session.meta.receivedFreeWeapon) {
            const freeWeaponIds = Array.isArray(runCfg.freeWeaponIds) && runCfg.freeWeaponIds.length
                ? runCfg.freeWeaponIds
                : ['sword', 'spear', 'bow'];
            let wps = freeWeaponIds.map((id) => this.c.get('DataManager').getItem(id)).filter(Boolean);
            if (wps.length === 0) {
                wps = [this.c.get('DataManager').getItem('sword'), this.c.get('DataManager').getItem('spear'), this.c.get('DataManager').getItem('bow')].filter(Boolean);
            }
            session.run.equipment.weapon = wps[randInt(0, wps.length)]; session.meta.receivedFreeWeapon = true;
            setTimeout(() => ui.showToast("테스트용 랜덤 무기 자동 장착!"), 500);
        }
        
        ui.updateAllUI(); 
        let mm = this.c.get('MapManager');
        const dm = this.c.get('DataManager');
        const selectedRunPlan = runPlan || this.nextDungeonPlan || dm.resolveDungeonPlan([], null);
        this.activeDungeonPlan = selectedRunPlan;
        this.nextDungeonPlan = null;

        let rooms = mm.generateDungeon(selectedRunPlan); 
        let em = this.c.get('EntityManager');
        em.clear();
        em.player = new Player(rooms[0].cx * mm.ts, rooms[0].cy * mm.ts, this.c);

        const roomTypeCfg = runCfg.roomType || {};
        const enemySpawnCfg = runCfg.enemySpawn || {};
        const chestSpawnCfg = runCfg.chestSpawn || {};
        const combatChance = roomTypeCfg.combatChance ?? 0.5;
        const lootChance = roomTypeCfg.lootChance ?? 0.3;
        const enemySpawnMin = enemySpawnCfg.minPerRoom ?? 1;
        const enemySpawnMax = enemySpawnCfg.maxPerRoom ?? 4;
        const rangedEnemyChance = enemySpawnCfg.rangedChance ?? 0.3;
        const chestSlots = chestSpawnCfg.slotCount ?? 6;
        const chestMinItems = chestSpawnCfg.minItems ?? 1;
        const chestMaxItems = chestSpawnCfg.maxItems ?? 4;
        const chestChanceLootRoom = chestSpawnCfg.chanceInLootRoom ?? 1;
        const chestChanceNormalRoom = chestSpawnCfg.chanceInNormalRoom ?? 0.3;
        
        for (let i = 1; i < rooms.length - 1; i++) {
            let typeRand = Math.random();
            if (typeRand < combatChance) rooms[i].type = 'COMBAT'; else if (typeRand < combatChance + lootChance) rooms[i].type = 'LOOT';
            if (rooms[i].type === 'COMBAT' || rooms[i].type === 'NORMAL') {
                let count = randInt(enemySpawnMin, enemySpawnMax);
                for(let j=0; j<count; j++) em.addEntity(em.enemies, new Enemy((rooms[i].x + rand(1, rooms[i].w - 1)) * mm.ts, (rooms[i].y + rand(1, rooms[i].h - 1)) * mm.ts, Math.random() < rangedEnemyChance, this.c));
            }
            const chestSpawnChance = rooms[i].type === 'LOOT' ? chestChanceLootRoom : chestChanceNormalRoom;
            if (Math.random() < chestSpawnChance) {
                let chestItems = new Array(chestSlots).fill(null);
                let count = randInt(chestMinItems, chestMaxItems);
                for(let j=0; j<count; j++) {
                    let id = this.c.get('DataManager').getRandomDrop();
                    let emptyIdx = chestItems.findIndex(x => x === null);
                    if(emptyIdx !== -1) chestItems[emptyIdx] = { data: this.c.get('DataManager').getItem(id), revealed: false, progress: 0 };
                }
                em.addEntity(em.interactables, new Interactable((rooms[i].cx + rand(-1, 1)) * mm.ts, (rooms[i].cy + rand(-1, 1)) * mm.ts, 'CHEST', { items: chestItems, isOpened: false }, this.c));
            }
        }
        em.addEntity(em.interactables, new Interactable(rooms[rooms.length-1].cx * mm.ts, rooms[rooms.length-1].cy * mm.ts, 'EXIT', null, this.c));
        if (session.meta.lastDeathCorpse) {
            em.addEntity(em.interactables, new Interactable((rooms[0].cx + 1) * mm.ts, rooms[0].cy * mm.ts, 'CORPSE', session.meta.lastDeathCorpse, this.c));
            session.meta.lastDeathCorpse = null;
        }
    }

    endRun(success) {
        this.currentState = GAME_STATE.RESULT;
        document.getElementById('screenHUD').classList.add('hidden'); document.getElementById('screenResult').classList.remove('hidden'); document.getElementById('interactPrompt').classList.add('hidden');
        let em = this.c.get('EntityManager');
        if (em.player) em.player.cancelChannel(); 
        this.c.get('UIManager').closeInventory();

        let audio = this.c.get('AudioSystem');
        audio.stopBGM(); 
        if (success) audio.play('success'); else audio.play('fail');

        const title = document.getElementById('resultTitle'), sub = document.getElementById('resultSub'), list = document.getElementById('resultList');
        list.innerHTML = '';
        let session = this.c.get('PlayerSession');
        const equippedItems = session.equipmentSlots.map((slot) => session.run.equipment[slot]);
        let allItems = [...session.run.inventory, ...session.run.quickSlots, ...equippedItems].filter(i => i !== null);

        if (success) {
            title.innerText = "탈출 성공!"; title.className = "text-4xl md:text-6xl font-black mb-4 text-center text-green-500";
            sub.innerText = "수집한 아이템을 무사히 마을로 가져왔습니다.";
            if (allItems.length === 0) list.innerHTML = '<li class="text-gray-500 text-center py-4">가방에 아이템이 없습니다.</li>';
            else {
                allItems.forEach(item => {
                    let li = document.createElement('li'); li.className = "flex justify-between items-center bg-gray-900 p-2 rounded";
                    li.innerHTML = `<span><span class="text-lg">${item.emoji}</span> ${item.name}</span> <span class="text-gray-400 text-xs">${item.type === 'equipment' ? '장비' : item.type}</span>`; list.appendChild(li);
                });
            }
            session.meta.lastDeathCorpse = null; 
        } else {
            session.run.inventory.fill(null);
            session.run.quickSlots.fill(null);
            const resetEquipment = {};
            session.equipmentSlots.forEach((slot) => { resetEquipment[slot] = null; });
            session.run.equipment = resetEquipment;
            title.innerText = "KIA (사망)"; title.className = "text-4xl md:text-6xl font-black mb-4 text-center text-red-600";
            sub.innerText = "모든 물품을 잃고 구조되었습니다."; list.innerHTML = '<li class="text-red-400 text-center py-4 font-bold">인벤토리/장착 중인 모든 항목 손실</li>';
            allItems.forEach(item => { let li = document.createElement('li'); li.className = "flex justify-between items-center bg-red-900 bg-opacity-30 p-2 rounded text-gray-500 line-through"; li.innerHTML = `<span><span class="text-lg">${item.emoji}</span> ${item.name}</span>`; list.appendChild(li); });
            if (allItems.length > 0) {
                session.meta.lastDeathCorpse = { items: allItems };
                let info = document.createElement('p'); info.className = "text-yellow-500 text-xs md:text-sm mt-4 text-center font-bold"; info.innerText = "※ 다음 출정 시 스폰 지점 근처에서 유실물을 회수할 수 있습니다."; list.appendChild(info);
            }
        }
    }

    loop(timestamp) {
        requestAnimationFrame((t) => this.loop(t));
        if(this.currentState === GAME_STATE.RESULT) return;
        let dt = (timestamp - this.lastTime) / 1000; if (dt > 0.1) dt = 0.1; this.lastTime = timestamp;
        
        let input = this.c.get('InputManager');
        let em = this.c.get('EntityManager');
        let ui = this.c.get('UIManager');
        
        // FPS Camera Rotation - Only if no UI is open
        if (input.isPointerLocked && !ui.isAnyUIOpen()) {
            const sensitivity = 0.002;
            this.yaw -= input.mouseDelta.x * sensitivity;
            this.pitch -= input.mouseDelta.y * sensitivity;
            this.pitch = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.pitch));
            
            this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
            
            input.mouseDelta.x = 0;
            input.mouseDelta.y = 0;
        }

        // Project Mouse/Reticle to World for Aiming
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        const aimDistance = 100;
        input.mouse.worldX = this.camera.position.x + forward.x * aimDistance;
        input.mouse.worldY = this.camera.position.z + forward.z * aimDistance;
        
        if (em.player) em.player.update(dt);
        if (this.currentState === GAME_STATE.PLAYING) {
            for (let i = em.enemies.length - 1; i >= 0; i--) {
                em.enemies[i].update(dt);
                if (em.enemies[i].hp <= 0) em.removeEntity(em.enemies, i);
            }
        }
        for (let i = em.projectiles.length - 1; i >= 0; i--) {
            em.projectiles[i].update(dt);
            if (em.projectiles[i].life <= 0) em.removeEntity(em.projectiles, i);
        }
        em.items.forEach(i => i.update(dt));
        for (let i = em.particles.length - 1; i >= 0; i--) {
            em.particles[i].update(dt);
            if (em.particles[i].life <= 0) em.removeEntity(em.particles, i);
        }
        
        this.handleInteractions();
        
        // UI Interaction
        if (ui && ui.currentLootContainer?.data?.items && ui.wInv && !ui.wInv.classList.contains('hidden')) {
            if (distance(em.player.x, em.player.y, ui.currentLootContainer.x, ui.currentLootContainer.y) > 80) ui.closeInventory();
            else {
                const items = ui.currentLootContainer.data.items;
                let targetSlotIdx = items.findIndex(slot => slot !== null && !slot.revealed);
                if (targetSlotIdx !== -1) {
                    let targetSlot = items[targetSlotIdx];
                    targetSlot.progress += dt;
                    
                    // Update Progress Bar UI
                    let pBar = document.getElementById(`loot-slot-${targetSlotIdx}`)?.querySelector('.search-bar'); 
                    if (pBar) pBar.style.width = `${(targetSlot.progress / 1.5) * 100}%`;

                    if (targetSlot.progress >= 1.5) { targetSlot.revealed = true; ui.notify(); }
                }
            }
        }

        ui.updateHUD(em.player);
        
        // Sync Camera to Player
        if (em.player) {
            this.camera.position.set(em.player.x, 30, em.player.y);
            
            // Sync SpotLight to Camera
            this.spotLight.position.copy(this.camera.position);
            const targetPos = this.camera.position.clone().add(forward.multiplyScalar(10));
            this.spotLight.target.position.copy(targetPos);
            
            // Hide player body in 1st person
            if (em.player.mesh) em.player.mesh.visible = false;
        }
        
        this.render();
    }

    handleInteractions() {
        let em = this.c.get('EntityManager'); let ui = this.c.get('UIManager'); let input = this.c.get('InputManager');

        // 범위 내 모든 상호작용 대상 수집
        let newTargets = [];
        em.items.forEach(item => { if (distance(em.player.x, em.player.y, item.x, item.y) < 50) newTargets.push({ type: 'ITEM', obj: item }); });
        em.interactables.forEach(obj => { 
            if (obj.active && distance(em.player.x, em.player.y, obj.x, obj.y) < 70) newTargets.push({ type: 'OBJ', obj: obj }); 
        });

        // 대상 목록이 바뀌었는지 확인 (참조 비교)
        const isSameList = newTargets.length === this.interactTargets.length && 
                           newTargets.every((t, i) => t.obj === this.interactTargets[i]?.obj);
        
        if (!isSameList) {
            this.interactTargets = newTargets;
            this.interactTargetIdx = 0;
        }

        const prompt = document.getElementById('interactPrompt');
        const text = document.getElementById('interactText');
        const countUI = document.getElementById('interactCount');

        if (this.interactTargets.length > 0) {
            const closest = this.interactTargets[this.interactTargetIdx];
            prompt.classList.remove('hidden');
            
            // 다중 대상 알림 UI
            if (this.interactTargets.length > 1) {
                countUI.classList.remove('hidden');
                countUI.innerText = `휠 스크롤로 대상 변경 (${this.interactTargetIdx + 1}/${this.interactTargets.length})`;
            } else {
                countUI.classList.add('hidden');
            }

            if (closest.type === 'ITEM') text.innerText = `줍기: ${closest.obj.data.name}`;
            if (closest.type === 'OBJ') {
                if (closest.obj.type === 'CHEST') text.innerText = "상자 열기";
                if (closest.obj.type === 'ENEMY_CORPSE') text.innerText = "시체 뒤지기";
                if (closest.obj.type === 'EXIT') text.innerText = "탈출 (3초)";
                if (closest.obj.type === 'CORPSE') text.innerText = "유실물 회수";
                if (closest.obj.type === 'STASH_OBJ') text.innerText = "창고 열기";
                if (closest.obj.type === 'WORKBENCH_OBJ') text.innerText = "제작대 사용";
                if (closest.obj.type === 'TOWNHALL_OBJ') text.innerText = "시설 관리";
                if (closest.obj.type === 'GATE_OBJ') text.innerText = "던전 출정 (3초)";
            }
            if (input.keys['KeyE']) {
                input.keys['KeyE'] = false;
                if (closest.type === 'ITEM') { if (ui.tryPickupItem(closest.obj)) em.items = em.items.filter(i => i !== closest.obj); } 
                else if (closest.type === 'OBJ') {
                    if (closest.obj.type === 'CHEST' || closest.obj.type === 'ENEMY_CORPSE') {
                        closest.obj.data.isOpened = true;
                        ui.openInventory('loot', closest.obj);
                    } else if (closest.obj.type === 'EXIT' || closest.obj.type === 'GATE_OBJ') {
                        if (em.player.channeling <= 0) { 
                            em.player.channeling = 3.0; em.player.channelTarget = closest.obj; 
                            document.getElementById('channelText').innerText = closest.obj.type === 'EXIT' ? "탈출 중..." : "출정 준비 중...";
                            document.getElementById('channelingUI').classList.remove('hidden'); 
                        }
                    } else if (closest.obj.type === 'CORPSE') {
                        closest.obj.active = false; em.createParticles(closest.obj.x, closest.obj.y, '#999', 15);
                        closest.obj.data.items.forEach(itemData => em.items.push(new ItemDrop(closest.obj.x + rand(-20,20), closest.obj.y + rand(-20,20), itemData))); ui.showToast("유실물 발견!");
                    } else if (closest.obj.type === 'STASH_OBJ') {
                        ui.openInventory('stash');
                    } else if (closest.obj.type === 'WORKBENCH_OBJ') {
                        ui.openCraftingMenu();
                    } else if (closest.obj.type === 'TOWNHALL_OBJ') {
                        ui.openUpgradeMenu();
                    }
                }
            }
        } else prompt.classList.add('hidden');

        if (em.player && em.player.channeling > 0) { 
            em.player.channeling -= 1/60; 
            if (em.player.channeling <= 0) {
                if (em.player.channelTarget.type === 'EXIT') this.endRun(true);
                else if (em.player.channelTarget.type === 'GATE_OBJ') this.startRun();
            } 
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
