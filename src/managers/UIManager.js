import { BaseManager } from '../core/BaseManager.js';
import { GAME_STATE } from "../data/gameData.js";
import { ItemDrop } from "../entities/ItemDrop.js";
import { rand } from "../utils.js";
import { InventoryView } from "../ui/InventoryView.js";
import { HUDView } from "../ui/HUDView.js";
import { CraftingView } from "../ui/CraftingView.js";
import { UpgradeView } from "../ui/UpgradeView.js";

/**
 * UIManager: 게임의 모든 UI 레이어, 팝업, HUD 및 사용자 입력을 통한 데이터 변경을 중계합니다.
 */
export class UIManager extends BaseManager {
    constructor(app) {
        super(app);
        
        this.draggedItemInfo = null;
        this.selectedMobileSlot = null;
        this.currentLootContainer = null;
        
        // 탐색 관련 상태
        this.lootingIdx = null;
        this.lootingTimer = null;
        this.isAutoSearching = true; // 기본값 자동 탐색 ON
        
        this.inventoryView = new InventoryView(this);
        this.hudView = new HUDView(this);
        this.craftingView = new CraftingView(this);
        this.upgradeView = new UpgradeView(this);
        this.toast = { el: document.getElementById('toastMsg') };
        
        this.setupEventListeners();
    }

    init() {
        super.init();
        this.bindDOMEvents();
        this.initialized = true;
    }

    setupEventListeners() {
        this.events.on('PLAYER_DATA_CHANGED', () => this.updateAllUI());
        this.events.on('PLAYER_INVENTORY_RESIZED', () => this.updateAllUI());
        this.events.on('ITEM_CRAFTED', (data) => {
            this.showToast(`제작 완료: ${data.recipeId}`);
            this.updateAllUI();
        });
        this.events.on('SHOW_TOAST', (data) => this.showToast(data.message));
        this.events.on('MAP_VIEW_UPDATED', () => this.updateAllUI());
    }

    bindDOMEvents() {
        window.addEventListener('dragover', e => e.preventDefault());
        window.addEventListener('drop', e => {
            e.preventDefault();
            this.handleDropOutside(e);
        });

        window.addEventListener('mousedown', (e) => {
            if (this.currentLootContainer && this.isAutoSearching && e.button === 0) {
                this.stopSearching(); 
            }
        });

        const closeButtons = {
            'btnCloseInv': () => this.closeInventory(),
            'btnCloseCrafting': () => this.closeCrafting(),
            'btnCloseUpgrade': () => this.closeUpgrade()
        };

        Object.entries(closeButtons).forEach(([id, fn]) => {
            this.setClick(id, fn);
        });

        this.setClick('btnDoCraft', () => this.doCraft());
        this.setClick('btnSellStash', () => this.sellStash());
        this.setClick('btnReturn', () => this.get('GameEngine').initTown());
        this.setClick('btnUpWH', () => this.upgradeFacility('warehouse'));
        this.setClick('btnUpWB', () => this.upgradeFacility('workbench'));
        this.setClick('btnToggleAutoSearch', () => this.toggleAutoSearch());

        // --- 설정 메뉴 (Pause Menu) ---
        this.setClick('btnPauseResume', () => {
            if (typeof window.togglePause === 'function') window.togglePause();
        });

        this.setClick('btnPauseSettings', () => {
            this.showToast("설정 기능은 준비 중입니다.");
        });

        this.setClick('btnPauseQuit', () => {
            if (confirm('정말 타이틀 화면으로 돌아가시겠습니까? 저장되지 않은 진행 상황은 잃게 됩니다.')) {
                location.reload();
            }
        });

        const volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.oninput = (e) => {
                const vol = e.target.value / 100;
                const audio = this.get('AudioSystem');
                if (audio) {
                    audio.setMasterVolume(vol);
                }

                // MIDI 플레이어 볼륨도 직접 조절
                const bgmPlayer = document.getElementById('bgmPlayer');
                if (bgmPlayer) bgmPlayer.volume = vol;
            };
        }
    }

    setClick(id, fn) {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    }

    isAnyUIOpen() {
        const isResultOpen = !document.getElementById('screenResult').classList.contains('hidden');
        const isPauseOpen = window.isGamePaused; // 일시정지 메뉴 체크 추가
        return isResultOpen || isPauseOpen ||
               (this.inventoryView.window && !this.inventoryView.window.classList.contains('hidden')) || 
               (this.craftingView.window && !this.craftingView.window.classList.contains('hidden')) || 
               (this.upgradeView.window && !this.upgradeView.window.classList.contains('hidden'));
    }

    openCraftingMenu() {
        document.exitPointerLock();
        this.craftingView.show();
        const cm = this.get('CraftingManager');
        if (cm) {
            this.craftingView.renderRecipeList(cm.getRecipes(), (idx) => this.selectRecipe(idx));
        }
        this.updateAllUI();
    }

    openUpgradeMenu() {
        document.exitPointerLock();
        this.upgradeView.show();
        this.updateUpgradeUI();
        this.updateAllUI();
    }

    openInventory(mode = 'inventory', container = null) {
        document.exitPointerLock();
        this.inventoryView.setMode(mode);
        this.inventoryView.show();
        this.currentLootContainer = container;
        this.updateAllUI();

        if (mode === 'loot' && this.isAutoSearching) {
            setTimeout(() => this.searchNextAvailableSlot(), 100);
        }
    }

    closeInventory() {
        this.inventoryView.hide();
        this.currentLootContainer = null;
        this.stopSearching();
        this.tryReacquirePointerLock();
    }

    closeCrafting() {
        this.craftingView.hide();
        this.tryReacquirePointerLock();
    }

    closeUpgrade() {
        this.upgradeView.hide();
        this.tryReacquirePointerLock();
    }

    closeAllUI() {
        this.inventoryView.hide();
        this.craftingView.hide();
        this.upgradeView.hide();
        this.currentLootContainer = null;
        this.stopSearching();

        // 일시정지 메뉴가 열려있다면 닫기
        if (window.isGamePaused && typeof window.togglePause === 'function') {
            window.togglePause();
        }

        this.tryReacquirePointerLock();
    }

    tryReacquirePointerLock() {
        const ge = this.get('GameEngine');
        const canvas = document.getElementById('gameCanvas');
        if (ge && (ge.currentState === GAME_STATE.TOWN || ge.currentState === GAME_STATE.PLAYING) && !this.isAnyUIOpen()) {
            try {
                canvas.requestPointerLock();
            } catch (e) {
                console.warn("Pointer lock request failed:", e);
            }
        }
    }

    showToast(msg) {
        if (!this.toast.el) return;
        this.toast.el.innerText = msg;
        this.toast.el.style.opacity = 1;
        setTimeout(() => this.toast.el.style.opacity = 0, 2000);
    }

    updateAllUI() {
        const session = this.get('PlayerSession');
        if (!session) return;

        this.hudView.renderQuickSlots(session.run.quickSlots);
        this.inventoryView.renderInventory(session.run.inventory, session.run.quickSlots, session.run.maxSlots);
        this.inventoryView.renderEquip(session.run.equipment);
        this.inventoryView.renderStash(session.meta.stash);
        this.inventoryView.renderLoot(this.currentLootContainer?.data?.items);

        const valuablesEl = document.getElementById('hudValuables');
        const materialsEl = document.getElementById('hudMaterials');
        if (valuablesEl) valuablesEl.innerText = session.meta.valuables;
        if (materialsEl) materialsEl.innerText = session.meta.materials;

        const cm = this.get('CraftingManager');
        if (cm && this.craftingView.isOpen()) {
            if (cm.selectedRecipeIdx !== null) this.selectRecipe(cm.selectedRecipeIdx);
        }
    }

    updateHUD(player) {
        if (!player) return;
        const session = this.get('PlayerSession');
        this.hudView.updateStatus(player.hp, player.baseMaxHp, player.sp, player.baseMaxSp, session ? session.getDefense() : 0);
        
        let channelText = "탈출 중...";
        if (player.channelTarget && player.channelTarget.type === 'GATE_OBJ') {
            channelText = "던전 진입 중...";
        }
        this.hudView.updateChanneling(player.channeling, channelText);
    }

    updateUpgradeUI() {
        const session = this.get('PlayerSession');
        if (!session) return;
        const stats = session.meta.upgrades;
        const costs = {
            warehouse: { val: 100 * stats.warehouse, mat: 50 * stats.warehouse },
            workbench: { val: 150 * stats.workbench, mat: 100 * stats.workbench }
        };
        this.upgradeView.render(stats, costs, session.meta.valuables, session.meta.materials);
    }

    doCraft() {
        const cm = this.get('CraftingManager');
        if (cm) {
            const result = cm.doCraft();
            this.showToast(result.msg);
        }
    }

    selectRecipe(idx) {
        const cm = this.get('CraftingManager');
        const data = cm ? cm.selectRecipe(idx) : null;
        if (data && this.craftingView) {
            this.craftingView.renderDetails(data.targetItem, data.ingredients, data.canCraft);
        }
    }

    upgradeFacility(type) {
        const session = this.get('PlayerSession');
        if (session) {
            const result = session.upgradeFacility(type);
            this.showToast(result.msg);
            if (result.success) {
                const audio = this.get('AudioSystem');
                if (audio) audio.play('success');
                this.updateUpgradeUI();
            }
        }
    }

    sellStash() {
        const session = this.get('PlayerSession');
        if (session) {
            const result = session.sellStashItems();
            this.showToast(result.msg);
            if (result.success) {
                const audio = this.get('AudioSystem');
                if (audio) audio.play('success');
            }
        }
    }

    handleDragStart(e, type, index) {
        this.draggedItemInfo = { type, index };
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    }

    handleRightClickAction(type, index) {
        this.useItem(type, index);
    }

    handleMobileSlotClick(e, type, index) {
        e.preventDefault();
        const items = this.getArrRef(type);
        if (!items) return;
        const itemObj = type === 'container' ? items[index]?.data : items[index];
        
        if (this.selectedMobileSlot && this.selectedMobileSlot.type === type && this.selectedMobileSlot.index === index) {
            this.useItem(type, index);
            this.selectedMobileSlot = null;
            this.clearItemInfo();
        } else {
            this.selectedMobileSlot = { type, index };
            if (itemObj) this.showItemInfo(itemObj); else this.clearItemInfo();
        }
        this.updateAllUI();
    }

    handleDrop(e, targetType, targetIndex) {
        if(e) { e.preventDefault(); e.stopPropagation(); }
        if (!this.draggedItemInfo) return;
        const session = this.get('PlayerSession');
        const sourceRef = this.getArrRef(this.draggedItemInfo.type);
        const targetRef = this.getArrRef(targetType);
        
        const result = session.swapItems(
            { type: this.draggedItemInfo.type, idx: this.draggedItemInfo.index, arr: sourceRef },
            { type: targetType, idx: targetIndex, arr: targetRef }
        );

        if (result.success) {
            const audio = this.get('AudioSystem');
            if (audio) audio.play(targetType === 'equip' ? 'equip' : 'inv_move');
            this.updateAllUI();
        } else if (result.msg) this.showToast(result.msg);
        this.draggedItemInfo = null;
    }

    useItem(type, index) {
        const session = this.get('PlayerSession');
        const items = this.getArrRef(type);
        if (!items) return;
        const item = type === 'equip' ? items[index] : (type === 'container' ? items[index]?.data : items[index]);
        if (!item) return;

        let result = { success: false };
        if (this.currentLootContainer) {
            if (type === 'container') result = session.moveToFirstEmpty({ type, idx: index, arr: items }, 'inv', session.run.inventory);
            else if (type === 'inv' || type === 'quick') result = session.moveToFirstEmpty({ type, idx: index, arr: items }, 'container', this.getArrRef('container'));
        } else if (this.inventoryView.stashSection && !this.inventoryView.stashSection.classList.contains('hidden')) {
            if (type === 'stash') result = session.moveToFirstEmpty({ type, idx: index, arr: items }, 'inv', session.run.inventory);
            else if (type === 'inv' || type === 'quick') result = session.moveToFirstEmpty({ type, idx: index, arr: items }, 'stash', session.meta.stash);
        } else if (type === 'equip') {
            if (session.giveItem(item)) { items[index] = null; result = { success: true, msg: `${item.name} 해제` }; }
            else result = { success: false, msg: "가방이 꽉 찼습니다." };
        } else if (item.type === 'equipment') {
            result = session.swapItems({ type, idx: index, arr: items }, { type: 'equip', idx: item.slot, arr: session.run.equipment });
        } else if (item.type === 'consumable') {
            this.showToast("아이템을 사용했습니다.");
            result = { success: true };
        }

        if (result.success) {
            const audio = this.get('AudioSystem');
            if (audio) audio.play('ui');
            this.updateAllUI();
        }
        if (result.msg) this.showToast(result.msg);
    }

    showItemInfo(itemObj) {
        const nameEl = document.getElementById('infoName');
        const descEl = document.getElementById('infoDesc');
        const infoPanel = document.getElementById('itemInfoPanel');
        if (nameEl) nameEl.innerText = itemObj.name;
        if (descEl) descEl.innerText = itemObj.desc || '';
        if (infoPanel) infoPanel.classList.remove('hidden');
    }

    clearItemInfo() {
        const infoPanel = document.getElementById('itemInfoPanel');
    }

    handleDropOutside(e) {
        if (!this.draggedItemInfo) return;
        const session = this.get('PlayerSession');
        const items = this.getArrRef(this.draggedItemInfo.type);
        const itemObj = session.dropItem(this.draggedItemInfo.type, this.draggedItemInfo.index, items);
        if (itemObj) {
            const audio = this.get('AudioSystem');
            if (audio) audio.play('drop');
            this.showToast(`${itemObj.name} 버림`); 
        }
        this.draggedItemInfo = null;
        this.updateAllUI();
    }

    // --- 탐색 로직 (Searching/Revealing) ---

    toggleAutoSearch() {
        this.isAutoSearching = !this.isAutoSearching;
        const btn = document.getElementById('btnToggleAutoSearch');
        if (btn) {
            btn.innerText = `자동 탐색 ${this.isAutoSearching ? 'ON' : 'OFF'}`;
            btn.classList.toggle('bg-blue-600', this.isAutoSearching);
            btn.classList.toggle('bg-gray-700', !this.isAutoSearching);
        }
        if (this.isAutoSearching) this.searchNextAvailableSlot(); else this.stopSearching();
    }

    searchNextAvailableSlot() {
        if (!this.currentLootContainer || !this.isAutoSearching) return;
        const items = this.getArrRef('container');
        if (!items) return;
        const nextIdx = items.findIndex(item => item && !item.revealed);
        if (nextIdx !== -1) this.startSearching(nextIdx);
    }

    revealImmediately(index) {
        // 즉시 공개 대신 해당 슬롯 탐색 시작 (요구사항 반영)
        this.startSearching(index);
    }

    startSearching(index) {
        if (!this.currentLootContainer) return;
        const items = this.getArrRef('container');
        if (!items || !items[index] || items[index].revealed) {
            if (this.isAutoSearching) this.searchNextAvailableSlot();
            return;
        }
        if (this.lootingIdx !== null && this.lootingIdx !== index) this.stopSearching();
        this.lootingIdx = index;
        if (!this.lootingTimer) this.lootingTimer = setInterval(() => this.updateSearching(), 33);
    }

    stopSearching() {
        if (this.lootingTimer) { clearInterval(this.lootingTimer); this.lootingTimer = null; }
        this.lootingIdx = null;
    }

    updateSearching() {
        if (this.lootingIdx === null || !this.currentLootContainer) { this.stopSearching(); return; }
        const items = this.getArrRef('container');
        const slot = items[this.lootingIdx];
        if (!slot || slot.revealed) {
            this.stopSearching();
            if (this.isAutoSearching) this.searchNextAvailableSlot();
            return;
        }
        slot.progress += 0.05;
        if (slot.progress >= 1.5) {
            slot.revealed = true;
            const audio = this.get('AudioSystem');
            if (audio) audio.play('success');
            this.stopSearching();
            if (this.isAutoSearching) this.searchNextAvailableSlot();
        }
        this.updateAllUI();
    }

    getArrRef(type) {
        const session = this.get('PlayerSession');
        if(type === 'inv') return session.run.inventory;
        if(type === 'quick') return session.run.quickSlots;
        if(type === 'stash') return session.meta.stash;
        if(type === 'equip') return session.run.equipment;
        if(type === 'container' && this.currentLootContainer?.data?.items) return this.currentLootContainer.data.items;
        return null;
    }
}
