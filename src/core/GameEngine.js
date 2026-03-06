
import { GAME_STATE } from "../data/gameData.js";
import { distance, rand, randInt } from "../utils.js";
import { Player } from "../entities/Player.js";
import { Enemy } from "../entities/Enemy.js";
import { Interactable } from "../entities/Interactable.js";
import { ItemDrop } from "../entities/ItemDrop.js";

export class GameEngine {
    constructor(container) {
        this.c = container;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = 0;
        this.currentState = GAME_STATE.TOWN;
        this.camera = { x: 0, y: 0 };
        this.width = 0;
        this.height = 0;
        this.interactTargets = [];
        this.interactTargetIdx = 0;
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
        this.canvas.width = this.width; 
        this.canvas.height = this.height; 
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
        townData.objs.forEach(o => em.interactables.push(new Interactable(o.x * mm.ts, o.y * mm.ts, o.type, null, this.c)));
        
        this.c.get('AudioSystem').startBGM('town');
    }

    startRun() {
        this.currentState = GAME_STATE.PLAYING;
        document.getElementById('channelingUI').classList.add('hidden');
        let ui = this.c.get('UIManager');
        ui.closeInventory(); ui.closeCrafting(); ui.closeUpgrade();
        
        this.c.get('AudioSystem').startBGM('dungeon'); 
        
        let session = this.c.get('PlayerSession');
        if (!session.meta.receivedFreeWeapon) {
            let wps = [this.c.get('DataManager').getItem('sword'), this.c.get('DataManager').getItem('spear'), this.c.get('DataManager').getItem('bow')]; 
            session.run.equipment.weapon = wps[randInt(0, wps.length)]; session.meta.receivedFreeWeapon = true;
            setTimeout(() => ui.showToast("테스트용 랜덤 무기 자동 장착!"), 500);
        }
        
        ui.updateAllUI(); 
        let mm = this.c.get('MapManager');
        let rooms = mm.generateDungeon(); 
        let em = this.c.get('EntityManager');
        em.clear();
        em.player = new Player(rooms[0].cx * mm.ts, rooms[0].cy * mm.ts, this.c);
        
        for (let i = 1; i < rooms.length - 1; i++) {
            let typeRand = Math.random();
            if (typeRand < 0.5) rooms[i].type = 'COMBAT'; else if (typeRand < 0.8) rooms[i].type = 'LOOT';
            if (rooms[i].type === 'COMBAT' || rooms[i].type === 'NORMAL') {
                let count = randInt(1, 4);
                for(let j=0; j<count; j++) em.enemies.push(new Enemy((rooms[i].x + rand(1, rooms[i].w - 1)) * mm.ts, (rooms[i].y + rand(1, rooms[i].h - 1)) * mm.ts, Math.random() < 0.3, this.c));
            }
            if (rooms[i].type === 'LOOT' || Math.random() < 0.3) {
                let chestItems = new Array(6).fill(null);
                let count = randInt(1, 4);
                for(let j=0; j<count; j++) {
                    let id = this.c.get('DataManager').getRandomDrop();
                    let emptyIdx = chestItems.findIndex(x => x === null);
                    if(emptyIdx !== -1) chestItems[emptyIdx] = { data: this.c.get('DataManager').getItem(id), revealed: false, progress: 0 };
                }
                em.interactables.push(new Interactable((rooms[i].cx + rand(-1, 1)) * mm.ts, (rooms[i].cy + rand(-1, 1)) * mm.ts, 'CHEST', { items: chestItems, isOpened: false }, this.c));
            }
        }
        em.interactables.push(new Interactable(rooms[rooms.length-1].cx * mm.ts, rooms[rooms.length-1].cy * mm.ts, 'EXIT', null, this.c));
        if (session.meta.lastDeathCorpse) {
            em.interactables.push(new Interactable((rooms[0].cx + 1) * mm.ts, rooms[0].cy * mm.ts, 'CORPSE', session.meta.lastDeathCorpse, this.c));
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
        let allItems = [...session.run.inventory, ...session.run.quickSlots, session.run.equipment.head, session.run.equipment.chest, session.run.equipment.legs, session.run.equipment.boots, session.run.equipment.weapon].filter(i => i !== null);

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
            session.run.inventory.fill(null); session.run.quickSlots.fill(null); session.run.equipment = { weapon: null, head: null, chest: null, legs: null, boots: null };
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
        
        input.mouse.worldX = input.mouse.x + this.camera.x; 
        input.mouse.worldY = input.mouse.y + this.camera.y;
        
        if (em.player) em.player.update(dt);
        if (this.currentState === GAME_STATE.PLAYING) {
            em.enemies.forEach((e, index) => { e.update(dt); if (e.hp <= 0) em.enemies.splice(index, 1); });
        }
        em.projectiles.forEach((p, index) => { p.update(dt); if (p.life <= 0) em.projectiles.splice(index, 1); });
        em.items.forEach(i => i.update(dt)); em.particles.forEach((p, index) => { p.update(dt); if (p.life <= 0) em.particles.splice(index, 1); });
        
        this.handleInteractions();
        
        // UI 요소 참조 시 안전성 검사 강화
        if (ui && ui.currentLootContainer?.data?.items && ui.wInv && !ui.wInv.classList.contains('hidden')) {
            if (distance(em.player.x, em.player.y, ui.currentLootContainer.x, ui.currentLootContainer.y) > 80) ui.closeInventory();
            else {
                const items = ui.currentLootContainer.data.items;
                let targetSlotIdx = items.findIndex(slot => slot !== null && !slot.revealed);
                if (targetSlotIdx !== -1) {
                    let targetSlot = items[targetSlotIdx];
                    let prevProgress = targetSlot.progress;
                    targetSlot.progress += dt;
                    if (Math.floor(prevProgress * 8) !== Math.floor(targetSlot.progress * 8)) this.c.get('AudioSystem').play('loot');
                    if (targetSlot.progress >= 1.5) { targetSlot.revealed = true; targetSlot.progress = 1.5; ui.notify(); }
                    else { let pBar = document.getElementById(`loot-slot-${targetSlotIdx}`)?.querySelector('.search-bar'); if (pBar) pBar.style.width = `${(targetSlot.progress / 1.5) * 100}%`; }
                }
            }
        }

        ui.updateHUD(em.player);
        if (em.player) {
            this.camera.x += (em.player.x - this.width / 2 - this.camera.x) * 5 * dt; 
            this.camera.y += (em.player.y - this.height / 2 - this.camera.y) * 5 * dt;
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
        this.ctx.fillStyle = this.currentState === GAME_STATE.TOWN ? '#1a1a1a' : '#0a0a0a'; 
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        let em = this.c.get('EntityManager');
        let mm = this.c.get('MapManager');
        
        this.ctx.save(); this.ctx.translate(-this.camera.x, -this.camera.y);
        let startCol = Math.max(0, Math.floor(this.camera.x / mm.ts)), endCol = Math.min(mm.cols, Math.floor((this.camera.x + this.width) / mm.ts) + 1);
        let startRow = Math.max(0, Math.floor(this.camera.y / mm.ts)), endRow = Math.min(mm.rows, Math.floor((this.camera.y + this.height) / mm.ts) + 1);

        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                if (mm.grid[r][c] === 1) { 
                    this.ctx.fillStyle = this.currentState === GAME_STATE.TOWN ? '#2d3748' : '#1f2937'; 
                    this.ctx.fillRect(c * mm.ts, r * mm.ts, mm.ts + 1, mm.ts + 1); 
                    this.ctx.strokeStyle = '#111827'; this.ctx.strokeRect(c * mm.ts, r * mm.ts, mm.ts, mm.ts); 
                } 
                else { 
                    this.ctx.fillStyle = this.currentState === GAME_STATE.TOWN ? '#4a5568' : '#374151'; 
                    this.ctx.fillRect(c * mm.ts, r * mm.ts, mm.ts + 1, mm.ts + 1); 
                    if ((r+c)%2===0) { this.ctx.fillStyle = 'rgba(0,0,0,0.1)'; this.ctx.fillRect(c * mm.ts, r * mm.ts, mm.ts, mm.ts); } 
                }
            }
        }

        em.interactables.forEach(i => i.draw(this.ctx)); em.items.forEach(i => i.draw(this.ctx)); em.enemies.forEach(e => e.draw(this.ctx));
        if(em.player) em.player.draw(this.ctx); 
        em.projectiles.forEach(p => p.draw(this.ctx)); em.particles.forEach(p => p.draw(this.ctx));
        
        let exitObj = em.interactables.find(i => i.type === 'EXIT');
        if (exitObj && this.currentState === GAME_STATE.PLAYING && em.player) {
            let dx = exitObj.x - em.player.x, dy = exitObj.y - em.player.y, dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 300) {
                let angle = Math.atan2(dy, dx);
                this.ctx.save(); this.ctx.translate(em.player.x + Math.cos(angle) * 120, em.player.y + Math.sin(angle) * 120); this.ctx.rotate(angle);
                this.ctx.fillStyle = 'rgba(34, 197, 94, 0.8)'; this.ctx.beginPath(); this.ctx.moveTo(15, 0); this.ctx.lineTo(-10, -10); this.ctx.lineTo(-5, 0); this.ctx.lineTo(-10, 10); this.ctx.fill(); this.ctx.restore();
            }
        }
        this.ctx.restore();

        if (this.currentState === GAME_STATE.PLAYING) {
            this.ctx.globalCompositeOperation = 'destination-in';
            let visionGradient = this.ctx.createRadialGradient(this.width/2, this.height/2, 50, this.width/2, this.height/2, 350);
            visionGradient.addColorStop(0, 'rgba(0, 0, 0, 1)'); visionGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)'); visionGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            this.ctx.fillStyle = visionGradient; this.ctx.fillRect(0, 0, this.width, this.height); this.ctx.globalCompositeOperation = 'source-over';
        } else if (this.currentState === GAME_STATE.TOWN) {
            let campGradient = this.ctx.createRadialGradient(this.width/2, this.height/2, 200, this.width/2, this.height/2, this.width);
            campGradient.addColorStop(0, 'rgba(0, 0, 0, 0)'); campGradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
            this.ctx.fillStyle = campGradient; this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}
