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
 * C# Porting: Unity의 UI Canvas, EventSystem, UI Manager로 대응됩니다.
 */
export class UIManager extends BaseManager {
    /**
     * @param {DIContainer} app 
     */
    constructor(app) {
        super(app);
        
        // 상태값
        this.draggedItemInfo = null;
        this.selectedMobileSlot = null;
        this.currentLootContainer = null;
        
        // View 초기화 (Unity의 UI Prefab 인스턴스와 유사)
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
        console.log('UIManager initialized and subscribed to EventBus.');
    }

    /**
     * EventBus를 통한 데이터 변경 감지 설정
     * C# Porting: Action/Delegate 구독 또는 UnityEvent 연결로 대응됩니다.
     */
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

    /**
     * 브라우저 DOM 이벤트 바인딩
     */
    bindDOMEvents() {
        window.addEventListener('dragover', e => e.preventDefault());
        window.addEventListener('drop', e => {
            e.preventDefault();
            this.handleDropOutside(e);
        });

        window.addEventListener('pointerdown', () => {
            const audio = this.get('AudioSystem');
            if (audio) audio.init();
        });

        // 상단 닫기 버튼들
        const closeButtons = {
            'btnCloseInv': () => this.closeInventory(),
            'btnCloseCrafting': () => this.closeCrafting(),
            'btnCloseUpgrade': () => this.closeUpgrade()
        };

        Object.entries(closeButtons).forEach(([id, fn]) => {
            const el = document.getElementById(id);
            if (el) el.onclick = fn;
        });

        // 기타 고정 버튼들
        this.setClick('btnDoCraft', () => this.doCraft());
        this.setClick('btnSellStash', () => this.sellStash());
        this.setClick('btnReturn', () => this.get('GameEngine').initTown());
        this.setClick('btnUpWH', () => this.upgradeFacility('warehouse'));
        this.setClick('btnUpWB', () => this.upgradeFacility('workbench'));
    }

    setClick(id, fn) {
        const el = document.getElementById(id);
        if (el) el.onclick = fn;
    }

    // --- UI 창 제어 (C# Porting: SetActive(true/false)) ---

    isAnyUIOpen() {
        return (this.inventoryView.window && !this.inventoryView.window.classList.contains('hidden')) || 
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
    }

    closeInventory() {
        this.inventoryView.hide();
        this.currentLootContainer = null;
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
        this.tryReacquirePointerLock();
    }

    tryReacquirePointerLock() {
        const ge = this.get('GameEngine');
        const canvas = document.getElementById('gameCanvas');
        if (ge && (ge.currentState === GAME_STATE.TOWN || ge.currentState === GAME_STATE.PLAYING) && !this.isAnyUIOpen()) {
            canvas.requestPointerLock();
        }
    }

    // --- 화면 갱신 로직 (View Rendering) ---

    showToast(msg) {
        if (!this.toast.el) return;
        this.toast.el.innerText = msg;
        this.toast.el.style.opacity = 1;
        setTimeout(() => this.toast.el.style.opacity = 0, 2000);
    }

    updateAllUI() {
        const session = this.get('PlayerSession');
        if (!session) return;

        // 각 서브 뷰 렌더링
        this.hudView.renderQuickSlots(session.run.quickSlots);
        this.inventoryView.renderInventory(session.run.inventory, session.run.quickSlots, session.run.maxSlots);
        this.inventoryView.renderEquip(session.run.equipment);
        this.inventoryView.renderStash(session.meta.stash);
        this.inventoryView.renderLoot(this.currentLootContainer?.data?.items);

        // 상단 재화 정보
        const valuablesEl = document.getElementById('hudValuables');
        const materialsEl = document.getElementById('hudMaterials');
        if (valuablesEl) valuablesEl.innerText = session.meta.valuables;
        if (materialsEl) materialsEl.innerText = session.meta.materials;

        // 제작창 상세 정보 갱신
        const cm = this.get('CraftingManager');
        if (cm && this.craftingView.isOpen()) {
            if (cm.selectedRecipeIdx !== null) this.selectRecipe(cm.selectedRecipeIdx);
        }
    }

    updateHUD(player) {
        if (!player) return;
        const session = this.get('PlayerSession');
        this.hudView.updateStatus(player.hp, player.baseMaxHp, player.sp, player.baseMaxSp, session ? session.getDefense() : 0);
        this.hudView.updateChanneling(player.channeling);
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

    // --- 상호작용 및 명령 (Controller/ViewModel) ---

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

    // --- 슬롯 상호작용 핸들러 ---

    handleDragStart(e, type, index) {
        this.draggedItemInfo = { type, index };
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
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
            if (itemObj) this.showItemInfo(itemObj);
            else this.clearItemInfo();
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
        } else if (result.msg) {
            this.showToast(result.msg);
        }
        this.draggedItemInfo = null;
    }

    useItem(type, index) {
        const session = this.get('PlayerSession');
        const items = this.getArrRef(type);
        if (!items) return;

        const item = type === 'equip' ? items[index] : (type === 'container' ? items[index]?.data : items[index]);
        if (!item) return;

        let result = { success: false };

        // 1. 루팅 중일 때: 인벤토리 <-> 상자
        if (this.currentLootContainer) {
            if (type === 'container') {
                result = session.moveToFirstEmpty({ type, idx: index, arr: items }, 'inv', session.run.inventory);
            } else if (type === 'inv' || type === 'quick') {
                result = session.moveToFirstEmpty({ type, idx: index, arr: items }, 'container', this.getArrRef('container'));
            }
        }
        // 2. 창고 이용 중일 때
        else if (this.inventoryView.stashSection && !this.inventoryView.stashSection.classList.contains('hidden')) {
            if (type === 'stash') {
                result = session.moveToFirstEmpty({ type, idx: index, arr: items }, 'inv', session.run.inventory);
            } else if (type === 'inv' || type === 'quick') {
                result = session.moveToFirstEmpty({ type, idx: index, arr: items }, 'stash', session.meta.stash);
            }
        }
        // 3. 일반 상황: 장착/해제/사용
        else if (type === 'equip') {
            if (session.giveItem(item)) {
                items[index] = null;
                result = { success: true, msg: `${item.name} 해제` };
            } else result = { success: false, msg: "가방이 꽉 찼습니다." };
        } else if (item.type === 'equipment') {
            result = session.swapItems(
                { type, idx: index, arr: items }, 
                { type: 'equip', idx: item.slot, arr: session.run.equipment }
            );
        } else if (item.type === 'consumable') {
            const player = this.get('EntityManager').player;
            // useItem 로직은 PlayerSession에 구현되어 있어야 함 (기존 로직 참조)
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
        // if (infoPanel) infoPanel.classList.add('hidden'); // 항상 보이게 두거나 숨길 수 있음
    }

    handleDropOutside(e) {
        if (!this.draggedItemInfo) return;
        const session = this.get('PlayerSession');
        const ge = this.get('GameEngine');
        const em = this.get('EntityManager');

        const items = this.getArrRef(this.draggedItemInfo.type);
        const itemObj = session.dropItem(this.draggedItemInfo.type, this.draggedItemInfo.index, items);

        if (itemObj) {
            const audio = this.get('AudioSystem');
            if (audio) audio.play('drop');
            
            if (ge.currentState === GAME_STATE.PLAYING) { 
                const p = em.player;
                em.items.push(new ItemDrop(p.x + rand(-20, 20), p.y + rand(-20, 20), itemObj)); 
                this.showToast(`${itemObj.name} 버림`); 
            } else { 
                this.showToast(`[파기됨] ${itemObj.name}`); 
            } 
        }
        this.draggedItemInfo = null;
        this.updateAllUI();
    }

    // 보조 함수 (기존 구조 유지)
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
