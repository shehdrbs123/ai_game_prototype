
import { GAME_STATE } from "../data/gameData.js";
import { ItemDrop } from "../entities/ItemDrop.js";
import { rand } from "../utils.js";

export class UIManager {
    constructor(container) {
        this.container = container;
        this.session = container.get('PlayerSession');
        this.audio = container.get('AudioSystem');
        
        this.wInv = document.getElementById('inventoryWindow');
        this.wCraft = document.getElementById('craftingWindow');
        this.wUpg = document.getElementById('upgradeWindow');
        
        this.draggedItemInfo = null;
        this.selectedMobileSlot = null;
        this.currentLootContainer = null;
        this.selectedRecipeId = null;

        this.bindEvents();
    }
    
    bindEvents() {
        window.addEventListener('dragover', e => e.preventDefault());
        window.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDropOutside(e);
        });

        window.addEventListener('pointerdown', (e) => {
            this.audio.init();
            if(e.target.closest('button') || e.target.closest('.recipe-item')) this.audio.play('ui');
        });

        document.getElementById('btnCloseInv').addEventListener('click', (e) => { e.stopPropagation(); this.closeInventory(); });
        document.getElementById('btnCloseCrafting').addEventListener('click', (e) => { e.stopPropagation(); this.closeCrafting(); });
        document.getElementById('btnCloseUpgrade').addEventListener('click', (e) => { e.stopPropagation(); this.closeUpgrade(); });

        this.wInv.addEventListener('click', () => this.closeInventory());
        this.wInv.querySelector('.window-content').addEventListener('click', e => e.stopPropagation());
        this.wInv.addEventListener('drop', e => { e.preventDefault(); e.stopPropagation(); }); 

        this.wCraft.addEventListener('click', () => this.closeCrafting());
        this.wCraft.querySelector('.window-content').addEventListener('click', e => e.stopPropagation());

        this.wUpg.addEventListener('click', () => this.closeUpgrade());
        this.wUpg.querySelector('.window-content').addEventListener('click', e => e.stopPropagation());

        document.getElementById('btnMobileDrop').addEventListener('click', (e) => {
            e.preventDefault();
            if (this.selectedMobileSlot) {
                this.draggedItemInfo = { type: this.selectedMobileSlot.type, index: this.selectedMobileSlot.index };
                this.handleDropOutside(null);
                this.selectedMobileSlot = null;
                document.getElementById('btnMobileDrop').classList.add('hidden');
                this.clearItemInfo();
            }
        });

        document.getElementById('btnDoCraft').addEventListener('click', () => this.doCraft());
        document.getElementById('btnSellStash').addEventListener('click', () => this.sellStash());
        document.getElementById('btnReturn').addEventListener('click', () => this.container.get('GameEngine').initTown());
        document.getElementById('btnUpWH').addEventListener('click', () => this.upgradeFacility('warehouse', 100, 50));
        document.getElementById('btnUpWB').addEventListener('click', () => this.upgradeFacility('workbench', 150, 100));
    }

    isAnyUIOpen() {
        return !this.wInv.classList.contains('hidden') || !this.wCraft.classList.contains('hidden') || !this.wUpg.classList.contains('hidden');
    }

    openInventory(mode = 'inventory') {
        document.getElementById('dropOutsideHint').innerHTML = "창 바깥으로 드래그하면 바닥에 버립니다.";
        this.wInv.classList.remove('hidden');
        document.getElementById('stashSection').classList.add('hidden');
        document.getElementById('lootSection').classList.add('hidden');
        document.getElementById('dropOutsideHint').classList.remove('hidden');
        
        if(mode === 'stash') {
            document.getElementById('invWindowTitle').innerText = "창고 및 장비 관리";
            document.getElementById('stashSection').classList.remove('hidden');
            document.getElementById('dropOutsideHint').innerHTML = "창 바깥으로 드래그하면 <strong>영구히 파기</strong>됩니다.";
        } else if (mode === 'loot') {
            document.getElementById('invWindowTitle').innerText = "상자 탐색 중";
            document.getElementById('lootSection').classList.remove('hidden');
            document.getElementById('dropOutsideHint').classList.add('hidden');
        } else {
            document.getElementById('invWindowTitle').innerText = "내 소지품";
        }
        this.updateAllUI();
    }

    closeInventory() {
        this.wInv.classList.add('hidden');
        this.currentLootContainer = null; this.draggedItemInfo = null; this.selectedMobileSlot = null; 
        this.clearItemInfo();
        document.getElementById('btnMobileDrop').classList.add('hidden');
        this.container.get('InputManager').resetMouse();
    }

    closeCrafting() {
        this.wCraft.classList.add('hidden');
        this.container.get('InputManager').resetMouse();
    }

    closeUpgrade() {
        this.wUpg.classList.add('hidden');
        this.container.get('InputManager').resetMouse();
    }

    showToast(msg) {
        const toast = document.getElementById('toastMsg');
        toast.innerText = msg; toast.style.opacity = 1;
        setTimeout(() => toast.style.opacity = 0, 2000);
    }

    getArrRef(type) {
        if(type === 'inv') return this.session.run.inventory;
        if(type === 'quick') return this.session.run.quickSlots;
        if(type === 'stash') return this.session.meta.stash;
        if(type === 'container' && this.currentLootContainer) return this.currentLootContainer.data.items;
        return null;
    }

    handleDrop(e, targetType, targetIndex) {
        if(e) { e.preventDefault(); e.stopPropagation(); }
        if (!this.draggedItemInfo) return;

        let sourceItemObj = this.draggedItemInfo.type === 'equip' ? this.session.run.equipment[this.draggedItemInfo.index] : (this.draggedItemInfo.type === 'container' ? this.getArrRef('container')[this.draggedItemInfo.index]?.data : this.getArrRef(this.draggedItemInfo.type)[this.draggedItemInfo.index]);
        let targetItemObj = targetType === 'equip' ? this.session.run.equipment[targetIndex] : (targetType === 'container' ? this.getArrRef('container')[targetIndex]?.data : this.getArrRef(targetType)[targetIndex]);

        if (targetType === 'container' && this.getArrRef('container')[targetIndex] && !this.getArrRef('container')[targetIndex].revealed) { this.showToast("아직 탐색되지 않은 슬롯입니다."); return; }
        if (targetType === 'equip' && sourceItemObj && (sourceItemObj.type !== 'equipment' || sourceItemObj.slot !== targetIndex)) { this.showToast("장착할 수 없는 아이템입니다."); return; }
        if (this.draggedItemInfo.type === 'equip' && targetItemObj && (targetItemObj.type !== 'equipment' || targetItemObj.slot !== this.draggedItemInfo.index)) { this.showToast("장착할 수 없는 아이템입니다."); return; }

        if (targetType === 'equip') this.session.run.equipment[targetIndex] = sourceItemObj;
        else if (targetType === 'container') this.getArrRef('container')[targetIndex] = sourceItemObj ? { data: sourceItemObj, revealed: true, progress: 2.0 } : null;
        else this.getArrRef(targetType)[targetIndex] = sourceItemObj;

        if (this.draggedItemInfo.type === 'equip') this.session.run.equipment[this.draggedItemInfo.index] = targetItemObj;
        else if (this.draggedItemInfo.type === 'container') this.getArrRef('container')[this.draggedItemInfo.index] = targetItemObj ? { data: targetItemObj, revealed: true, progress: 2.0 } : null;
        else this.getArrRef(this.draggedItemInfo.type)[this.draggedItemInfo.index] = targetItemObj;

        if (targetType === 'equip' || this.draggedItemInfo.type === 'equip') this.audio.play('equip');
        else this.audio.play('inv_move');

        this.draggedItemInfo = null; this.updateAllUI(); 
    }

    handleRightClickMove(type, index) {
        const isLooting = !document.getElementById('lootSection').classList.contains('hidden');
        if (!isLooting) return false; // Indicate we didn't handle it.
    
        let sourceArr, destArr, itemToMove, isDestContainer = false;
    
        if (type === 'container') {
            // Move from loot container to inventory
            sourceArr = this.getArrRef('container');
            destArr = this.getArrRef('inv');
            if (!sourceArr || !destArr) return true;
    
            const sourceSlot = sourceArr[index];
            if (!sourceSlot || !sourceSlot.data) return true;
            itemToMove = sourceSlot.data;
        } else if (type === 'inv' || type === 'quick') {
            // Move from inventory/quick to loot container
            sourceArr = this.getArrRef(type);
            destArr = this.getArrRef('container');
            if (!sourceArr || !destArr) return true;
    
            itemToMove = sourceArr[index];
            if (!itemToMove) return true;
            isDestContainer = true;
        } else {
            return false; // Not a loot/inv/quick slot
        }
    
        const emptyIndex = destArr.findIndex(i => i === null);
        if (emptyIndex === -1) {
            this.showToast(isDestContainer ? "상자가 가득 찼습니다." : "가방이 가득 찼습니다.");
            return true;
        }
    
        // Perform the move
        if (isDestContainer) {
            destArr[emptyIndex] = { data: itemToMove, revealed: true, progress: 2.0 };
        } else {
            destArr[emptyIndex] = itemToMove;
        }
    
        sourceArr[index] = null;
    
        this.audio.play('inv_move');
        this.updateAllUI();
        this.clearItemInfo();
        return true; // Indicate we handled it.
    }

    handleDropOutside(e) {
        if(e) e.preventDefault();
        if (!this.draggedItemInfo) return;
        let itemObj = this.draggedItemInfo.type === 'equip' ? this.session.run.equipment[this.draggedItemInfo.index] : (this.draggedItemInfo.type === 'container' ? this.getArrRef('container')[this.draggedItemInfo.index]?.data : this.getArrRef(this.draggedItemInfo.type)[this.draggedItemInfo.index]);
        
        if (itemObj) {
            if(this.draggedItemInfo.type === 'equip') this.session.run.equipment[this.draggedItemInfo.index] = null;
            else if(this.draggedItemInfo.type === 'container') this.getArrRef('container')[this.draggedItemInfo.index] = null;
            else this.getArrRef(this.draggedItemInfo.type)[this.draggedItemInfo.index] = null;
            
            this.audio.play('drop');
            if (this.container.get('GameEngine').currentState === GAME_STATE.PLAYING) { 
                let p = this.container.get('EntityManager').player;
                this.container.get('EntityManager').items.push(new ItemDrop(p.x + rand(-20, 20), p.y + rand(-20, 20), itemObj)); 
                this.showToast(`${itemObj.name} 버림`); 
            } 
            else { this.showToast(`[파기됨] ${itemObj.name}`); } 
        }
        this.draggedItemInfo = null; this.updateAllUI();
    }

    handleDragStart(e, type, index) {
        this.draggedItemInfo = { type, index };
        e.dataTransfer.setData('text/plain', '');
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
    }

    sendToStash(type, index) {
        if (document.getElementById('stashSection').classList.contains('hidden')) return;

        let sourceItem = null;
        if (type === 'equip') {
            sourceItem = this.session.run.equipment[index];
        } else {
            sourceItem = this.getArrRef(type)?.[index];
        }
        if (!sourceItem) return;

        const emptyStashIndex = this.session.meta.stash.findIndex(i => i === null);
        if (emptyStashIndex === -1) {
            this.showToast("창고가 가득 찼습니다.");
            return;
        }

        this.session.meta.stash[emptyStashIndex] = sourceItem;

        if (type === 'equip') {
            this.session.run.equipment[index] = null;
        } else {
            this.getArrRef(type)[index] = null;
        }

        this.audio.play('inv_move');
        this.updateAllUI();
    }

    tryPickupItem(itemObj) {
        let emptyIdx = this.session.run.inventory.findIndex(i => i === null);
        if (emptyIdx !== -1) { 
            this.session.run.inventory[emptyIdx] = itemObj.data; 
            this.updateAllUI(); 
            this.container.get('EntityManager').createParticles(itemObj.x, itemObj.y, '#fff', 5); 
            this.audio.play('pick');
            return true; 
        }
        this.showToast("가방이 가득 찼습니다!"); return false;
    }

    useItem(type, index) {
        let p = this.container.get('EntityManager').player;
        if (type === 'equip') {
            let itemObj = this.session.run.equipment[index]; if (!itemObj) return;
            let emptyIdx = this.session.run.inventory.findIndex(i => i === null);
            if (emptyIdx !== -1) { 
                this.session.run.inventory[emptyIdx] = itemObj; this.session.run.equipment[index] = null; 
                this.audio.play('equip'); this.updateAllUI();
            } 
            else this.showToast("가방에 빈 공간이 없습니다.");
            return;
        }
        let arr = this.getArrRef(type); if(!arr) return;
        let itemObj = type === 'container' ? arr[index]?.data : arr[index];

        if (itemObj && itemObj.type === 'equipment') {
            let currentEquip = this.session.run.equipment[itemObj.slot];
            this.session.run.equipment[itemObj.slot] = itemObj;
            if(type === 'container') arr[index] = currentEquip ? { data: currentEquip, revealed: true, progress: 2.0 } : null;
            else arr[index] = currentEquip;
            this.audio.play('equip'); this.updateAllUI(); return;
        }
        if (itemObj && itemObj.type === 'consumable' && p && p.hp < p.baseMaxHp) {
            p.heal(itemObj.heal); arr[index] = null; this.updateAllUI();
            this.audio.play('ui'); 
        } else if (itemObj && itemObj.type !== 'consumable') { this.showToast("소비할 수 없습니다."); }
    }

    handleMobileSlotClick(e, type, index) {
        if(e) e.preventDefault();
        let arr = this.getArrRef(type);
        let itemObj = null;

        if (type === 'equip') itemObj = this.session.run.equipment[index];
        else if (type === 'container') itemObj = arr[index]?.revealed ? arr[index].data : null;
        else itemObj = arr[index];

        if (type === 'container' && arr[index] && !arr[index].revealed) return;

        if (!this.selectedMobileSlot) {
            if (itemObj) {
                this.selectedMobileSlot = { type, index };
                this.updateAllUI();
                this.showItemInfo(itemObj);
                document.getElementById('btnMobileDrop').classList.remove('hidden');
            }
        } else {
            if (this.selectedMobileSlot.type === type && this.selectedMobileSlot.index === index) {
                // Stash check for double-tap
                if (!document.getElementById('stashSection').classList.contains('hidden')) {
                    this.sendToStash(type, index);
                } else {
                    this.useItem(type, index);
                }
                this.selectedMobileSlot = null;
                this.clearItemInfo();
                document.getElementById('btnMobileDrop').classList.add('hidden');
            } else {
                this.draggedItemInfo = { type: this.selectedMobileSlot.type, index: this.selectedMobileSlot.index };
                this.handleDrop(null, type, index);
                this.selectedMobileSlot = null;
                document.getElementById('btnMobileDrop').classList.add('hidden');
                this.clearItemInfo();
            }
            this.updateAllUI();
        }
    }

    showItemInfo(itemObj) {
        if (!itemObj) { this.clearItemInfo(); return; }
        document.getElementById('infoName').innerText = `${itemObj.emoji} ${itemObj.name}`;
        document.getElementById('infoDesc').innerText = itemObj.desc || "정보 없음";
    }
    clearItemInfo() { 
        document.getElementById('infoName').innerText = '아이템을 선택하세요'; 
        document.getElementById('infoDesc').innerText = this.container.get('InputManager').isTouchDevice ? '한 번 터치: 선택 / 두 번 터치: 창고로 이동/사용' : '우클릭으로 창고 이동/사용, 드래그 앤 드롭으로 이동'; 
    }

    createSlotHTML(type, index, slotData, label, isHUD = false) {
        let slot = document.createElement('div');
        if (type === 'container') slot.id = `loot-slot-${index}`;
        let baseClass = type === 'quick' ? 'w-10 h-10 md:w-12 md:h-12 text-xl md:text-2xl' : type === 'stash' ? 'w-8 h-8 md:w-10 md:h-10 text-lg md:text-xl' : 'w-12 h-12 md:w-14 md:h-14 text-2xl md:text-3xl';
        let itemObj = type === 'container' ? (slotData?.revealed ? slotData.data : null) : slotData;

        if (type === 'container' && slotData && !slotData.revealed) {
            slot.className = `inv-slot bg-gray-800 shadow-inner flex items-center justify-center relative overflow-hidden ${baseClass}`;
            slot.innerHTML = `<span class="text-gray-500 font-bold text-lg animate-pulse">?</span>`;
            let pBar = document.createElement('div'); pBar.className = "search-bar absolute bottom-0 left-0 h-1 bg-yellow-500 transition-none"; pBar.style.width = `${(slotData.progress / 1.5) * 100}%`; slot.appendChild(pBar);
            return slot;
        }

        let isTouch = this.container.get('InputManager').isTouchDevice;

        if (itemObj) {
            slot.className = `inv-slot bg-gray-700 shadow-inner cursor-pointer hover:bg-gray-500 transition flex items-center justify-center relative ${baseClass}`;
            slot.draggable = true; slot.innerHTML = `<span>${itemObj.emoji}</span>`;
            
            if (isHUD) {
                slot.addEventListener('touchstart', e => { e.preventDefault(); this.useItem(type, index); }, {passive: false});
                slot.addEventListener('mousedown', e => { e.preventDefault(); this.useItem(type, index); });
            } else {
                slot.addEventListener('dblclick', e => {
                    e.preventDefault();
                    if (!document.getElementById('stashSection').classList.contains('hidden')) {
                        this.sendToStash(type, index);
                    }
                });

                if (isTouch) {
                    slot.addEventListener('touchstart', (e) => this.handleMobileSlotClick(e, type, index), {passive: false});
                } else {
                    slot.oncontextmenu = (e) => { 
                        e.preventDefault();
                        if (this.handleRightClickMove(type, index)) {
                            return;
                        }
                        if (!document.getElementById('stashSection').classList.contains('hidden') && type !== 'stash' && type !== 'equip') {
                            this.sendToStash(type, index);
                        } else {
                            this.useItem(type, index);
                        }
                    };
                    slot.addEventListener('dragstart', (e) => this.handleDragStart(e, type, index));
                    slot.onmouseenter = () => this.showItemInfo(itemObj); 
                    slot.onmouseleave = () => { if(!this.selectedMobileSlot) this.clearItemInfo(); };
                }
            }
        } else {
            slot.className = `inv-slot empty flex items-center justify-center relative ${baseClass}`;
            if (!isHUD) {
                if (isTouch) {
                    slot.addEventListener('touchstart', (e) => this.handleMobileSlotClick(e, type, index), {passive: false});
                }
                else slot.onmouseenter = () => { if(!this.selectedMobileSlot) this.clearItemInfo(); };
            }
        }
        
        if (this.selectedMobileSlot && this.selectedMobileSlot.type === type && this.selectedMobileSlot.index === index) {
            slot.classList.add('border-blue-500', 'border-4'); slot.classList.remove('border-2', 'border-[#555]');
        }

        if (label) {
            let lbl = document.createElement('span'); lbl.className = 'absolute top-0 left-1 text-[9px] md:text-[11px] text-yellow-400 font-bold drop-shadow pointer-events-none';
            lbl.innerText = label; slot.appendChild(lbl);
        }
        
        if (!isHUD && !isTouch) {
            slot.addEventListener('dragover', e=>e.preventDefault()); slot.addEventListener('drop', (e) => this.handleDrop(e, type, index));
        }
        return slot;
    }

    updateAllUI() {
        const quickHUD = document.getElementById('quickSlotHUDContainer');
        if (quickHUD) { quickHUD.innerHTML = ''; for(let i=0; i<8; i++) quickHUD.appendChild(this.createSlotHTML('quick', i, this.session.run.quickSlots[i], i+1, true)); }
        
        const equipGrid = document.getElementById('equipGrid');
        if (equipGrid) {
            equipGrid.innerHTML = ''; const sNames = { head: '머리', chest: '가슴', legs: '하의', boots: '신발', weapon: '무기' };
            ['head', 'chest', 'legs', 'boots', 'weapon'].forEach(k => equipGrid.appendChild(this.createSlotHTML('equip', k, this.session.run.equipment[k], sNames[k])));
        }

        const invGrid = document.getElementById('invGrid'), quickGrid = document.getElementById('quickSlotGrid');
        if (invGrid && quickGrid) {
            invGrid.innerHTML = ''; for(let i=0; i<this.session.run.maxSlots; i++) invGrid.appendChild(this.createSlotHTML('inv', i, this.session.run.inventory[i], null));
            quickGrid.innerHTML = ''; for(let i=0; i<8; i++) quickGrid.appendChild(this.createSlotHTML('quick', i, this.session.run.quickSlots[i], i+1));
        }

        const stashGrid = document.getElementById('stashGrid');
        if (stashGrid && !document.getElementById('stashSection').classList.contains('hidden')) {
            stashGrid.innerHTML = ''; for(let i=0; i<this.session.meta.stash.length; i++) stashGrid.appendChild(this.createSlotHTML('stash', i, this.session.meta.stash[i], null));
        }
        
        document.getElementById('hudValuables').innerText = this.session.meta.valuables;
        document.getElementById('hudMaterials').innerText = this.session.meta.materials;
        document.getElementById('upgValuables').innerText = this.session.meta.valuables;
        document.getElementById('upgMaterials').innerText = this.session.meta.materials;
        
        this.updateLootUI();
    }

    updateLootUI() {
        const lootGrid = document.getElementById('lootGrid');
        if (lootGrid && this.currentLootContainer) { lootGrid.innerHTML = ''; for(let i=0; i<6; i++) lootGrid.appendChild(this.createSlotHTML('container', i, this.currentLootContainer.data.items[i], null)); }
    }

    updateHUD(player) {
        if(!player) return;
        document.getElementById('hpBar').style.width = `${(player.hp / player.baseMaxHp) * 100}%`; 
        document.getElementById('hpText').innerText = `${Math.floor(player.hp)}/${player.baseMaxHp}`;
        document.getElementById('spBar').style.width = `${(player.sp / player.baseMaxSp) * 100}%`; 
        document.getElementById('defText').innerText = `DEF ${this.session.getDefense()}`;
        
        const ui = document.getElementById('channelingUI');
        if (player.channeling > 0) { ui.classList.remove('hidden'); document.getElementById('channelBar').style.width = `${((3.0 - player.channeling) / 3.0) * 100}%`; } 
        else ui.classList.add('hidden');
    }

    sellStash() {
        let soldVal = 0, soldMat = 0;
        for(let i=0; i<this.session.meta.stash.length; i++){
            let item = this.session.meta.stash[i];
            if(item && (item.id === 'scrap' || item.id === 'core')) { soldMat += item.value; this.session.meta.stash[i] = null; }
            else if(item && item.type === 'valuable') { soldVal += item.value; this.session.meta.stash[i] = null; }
        }
        if(soldVal > 0 || soldMat > 0) {
            this.session.meta.valuables += soldVal; this.session.meta.materials += soldMat;
            this.showToast(`판매 완료! 귀중품 +${soldVal}, 재료 +${soldMat}`); this.updateAllUI(); 
        } else this.showToast("창고에 환전할 재화가 없습니다.");
    }

    upgradeFacility(type, costV, costM) {
        if (this.session.meta.valuables >= costV && this.session.meta.materials >= costM) { 
            this.session.meta.valuables -= costV; this.session.meta.materials -= costM; 
            this.session.meta.upgrades[type]++; 
            this.audio.play('equip'); this.showToast("시설이 강화되었습니다!"); 
            
            document.getElementById('whLevel').innerText = this.session.meta.upgrades.warehouse; 
            document.getElementById('whCostVal').innerText = this.session.meta.upgrades.warehouse * 100; 
            document.getElementById('whCostMat').innerText = this.session.meta.upgrades.warehouse * 50;
            
            document.getElementById('wbLevel').innerText = this.session.meta.upgrades.workbench; 
            document.getElementById('wbCostVal').innerText = this.session.meta.upgrades.workbench * 150; 
            document.getElementById('wbCostMat').innerText = this.session.meta.upgrades.workbench * 100;
            
            if(type === 'warehouse') this.session.resizeInventory();
            else {
                let p = this.container.get('EntityManager').player;
                if(p) { p.baseMaxHp = this.session.getMaxHp(); p.baseMaxSp = this.session.getMaxSp(); p.heal(0); }
            }
            this.updateAllUI();
        } else this.showToast("자원이 부족합니다!");
    }

    openCraftingMenu() {
        this.wCraft.classList.remove('hidden');
        const listEl = document.getElementById('recipeList'); listEl.innerHTML = '';
        
        this.container.get('DataManager').getRecipes().forEach((recipe, idx) => {
            const itemData = this.container.get('DataManager').getItem(recipe.targetId);
            let li = document.createElement('li');
            li.className = "recipe-item p-2 md:p-3 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:bg-gray-700 transition flex items-center gap-3";
            li.innerHTML = `<span class="text-xl md:text-2xl">${itemData.emoji}</span> <div><div class="text-sm md:text-base font-bold text-white">${itemData.name}</div><div class="text-[10px] md:text-xs text-gray-400">${itemData.type === 'equipment' ? '장비' : '소모품'}</div></div>`;
            li.onclick = () => { document.querySelectorAll('.recipe-item').forEach(el => el.classList.remove('selected')); li.classList.add('selected'); this.selectRecipe(idx); };
            listEl.appendChild(li);
        });
        document.getElementById('craftEmpty').classList.remove('hidden'); document.getElementById('craftDetails').classList.add('hidden'); document.getElementById('btnDoCraft').classList.add('hidden');
        this.selectedRecipeId = null;
    }

    selectRecipe(idx) {
        this.selectedRecipeId = idx;
        const recipe = this.container.get('DataManager').getRecipes()[idx];
        const targetItem = this.container.get('DataManager').getItem(recipe.targetId);
        
        document.getElementById('craftEmpty').classList.add('hidden'); document.getElementById('craftDetails').classList.remove('hidden'); document.getElementById('btnDoCraft').classList.remove('hidden');
        document.getElementById('cIcon').innerText = targetItem.emoji; document.getElementById('cName').innerText = targetItem.name;
        document.getElementById('cType').innerText = targetItem.type === 'equipment' ? '장비' : '소모품'; document.getElementById('cDesc').innerText = targetItem.desc || '설명 없음';
        
        const ingEl = document.getElementById('cIngredients'); ingEl.innerHTML = '';
        let canCraft = true;
        recipe.ingredients.forEach(ing => {
            const mat = this.container.get('DataManager').getItem(ing.id);
            const owned = this.session.getTotalItemCount(ing.id);
            const isEnough = owned >= ing.qty; if(!isEnough) canCraft = false;
            let li = document.createElement('li');
            li.className = `flex justify-between items-center bg-gray-800 p-2 rounded border ${isEnough ? 'border-green-800' : 'border-red-800'}`;
            li.innerHTML = `<div class="flex items-center gap-2"><span class="text-lg">${mat.emoji}</span> <span class="text-xs md:text-sm">${mat.name}</span></div> <span class="text-xs md:text-sm font-bold ${isEnough ? 'text-green-400' : 'text-red-400'}">${owned} / ${ing.qty}</span>`;
            ingEl.appendChild(li);
        });
        document.getElementById('btnDoCraft').disabled = !canCraft;
    }

    doCraft() {
        if(this.selectedRecipeId === null) return;
        const recipe = this.container.get('DataManager').getRecipes()[this.selectedRecipeId];
        let canCraft = true;
        recipe.ingredients.forEach(ing => { if(this.session.getTotalItemCount(ing.id) < ing.qty) canCraft = false; });
        if(canCraft) {
            if(this.session.run.inventory.findIndex(i=>i===null) === -1 && this.session.meta.stash.findIndex(i=>i===null) === -1) { this.showToast("빈 공간이 없습니다."); return; }
            recipe.ingredients.forEach(ing => this.session.consumeItems(ing.id, ing.qty));
            this.session.giveItem(this.container.get('DataManager').getItem(recipe.targetId));
            this.audio.play('success'); this.showToast("제작 완료!");
            this.selectRecipe(this.selectedRecipeId);
        }
    }
}
