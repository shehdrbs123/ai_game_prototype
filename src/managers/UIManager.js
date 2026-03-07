import { GAME_STATE } from "../data/gameState.js";
import { ItemDrop } from "../entities/ItemDrop.js";
import { rand } from "../utils.js";
import { InventoryView } from "../ui/InventoryView.js";
import { HUDView } from "../ui/HUDView.js";
import { CraftingView } from "../ui/CraftingView.js";
import { UpgradeView } from "../ui/UpgradeView.js";

export class UIManager {
    constructor(container) {
        this.container = container;
        this.initialized = false; // 초기화 시작

        this.session = container.get('PlayerSession');
        this.audio = container.get('AudioSystem');
        
        // View 초기화
        this.inventoryView = new InventoryView(this);
        this.hudView = new HUDView(this);
        this.craftingView = new CraftingView(this);
        this.upgradeView = new UpgradeView(this);
        this.toast = { el: document.getElementById('toastMsg') };
        
        this.draggedItemInfo = null;
        this.selectedMobileSlot = null;
        this.currentLootContainer = null;

        this.bindEvents();
        this.initialized = true; // 모든 View와 이벤트 바인딩 완료
    }
    
    // InputManager 등 외부에서 인벤토리 창 엘리먼트에 접근하기 위한 Getter
    get wInv() { return this.inventoryView?.window; }

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

        // View의 window 요소를 사용하여 이벤트 바인딩
        document.getElementById('btnCloseInv').onclick = () => this.closeInventory();
        document.getElementById('btnCloseCrafting').onclick = () => this.closeCrafting();
        document.getElementById('btnCloseUpgrade').onclick = () => this.closeUpgrade();

        if (this.inventoryView.window) {
            this.inventoryView.window.onclick = () => this.closeInventory();
            this.inventoryView.window.querySelector('.window-content').onclick = e => e.stopPropagation();
        }

        if (this.craftingView.window) {
            this.craftingView.window.onclick = () => this.closeCrafting();
            this.craftingView.window.querySelector('.window-content').onclick = e => e.stopPropagation();
        }

        if (this.upgradeView.window) {
            this.upgradeView.window.onclick = () => this.closeUpgrade();
            this.upgradeView.window.querySelector('.window-content').onclick = e => e.stopPropagation();
        }

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

        document.getElementById('btnDoCraft').onclick = () => this.doCraft();
        document.getElementById('btnSellStash').onclick = () => this.sellStash();
        document.getElementById('btnReturn').onclick = () => this.container.get('GameEngine').initTown();
        document.getElementById('btnUpWH').onclick = () => this.upgradeFacility('warehouse');
        document.getElementById('btnUpWB').onclick = () => this.upgradeFacility('workbench');
    }

    isAnyUIOpen() {
        return (this.inventoryView.window && !this.inventoryView.window.classList.contains('hidden')) || 
               (this.craftingView.window && !this.craftingView.window.classList.contains('hidden')) || 
               (this.upgradeView.window && !this.upgradeView.window.classList.contains('hidden'));
    }

    /**
     * GameEngine 등에서 호출하는 제작 메뉴 오픈 메서드
     */
    openCraftingMenu() {
        if (this.craftingView) {
            document.exitPointerLock();
            this.craftingView.show();
            const cm = this.container.get('CraftingManager');
            if (cm) {
                this.craftingView.renderRecipeList(cm.getRecipes(), (idx) => this.selectRecipe(idx));
            } else {
                console.error("CraftingManager not found in DI Container");
                this.showToast("제작 시스템을 불러올 수 없습니다.");
            }
        }
        this.updateAllUI();
    }

    openUpgradeMenu() {
        if (this.upgradeView) {
            document.exitPointerLock();
            this.upgradeView.show();
            this.updateUpgradeUI();
        }
        this.updateAllUI();
    }

    /**
     * 인벤토리를 엽니다. 루팅 시에는 대상 컨테이너 하나만 받습니다.
     */
    openInventory(mode = 'inventory', container = null) {
        document.exitPointerLock();
        this.inventoryView.setMode(mode);
        this.inventoryView.show();
        this.currentLootContainer = container;
        this.updateAllUI();
    }

    closeInventory() {
        this.inventoryView.hide();
        this.currentLootContainer = null; this.draggedItemInfo = null; this.selectedMobileSlot = null; 
        this.clearItemInfo();
        document.getElementById('btnMobileDrop').classList.add('hidden');
        this.container.get('InputManager').resetMouse();
        this.tryReacquirePointerLock();
    }

    closeCrafting() {
        this.craftingView.hide();
        this.container.get('InputManager').resetMouse();
        this.tryReacquirePointerLock();
    }

    closeUpgrade() {
        this.upgradeView.hide();
        this.container.get('InputManager').resetMouse();
        this.tryReacquirePointerLock();
    }

    /**
     * 모든 UI를 한꺼번에 닫고 포인터 락을 한 번만 요청합니다.
     */
    closeAllUI() {
        this.inventoryView.hide();
        this.craftingView.hide();
        this.upgradeView.hide();
        
        this.currentLootContainer = null; 
        this.draggedItemInfo = null; 
        this.selectedMobileSlot = null; 
        this.clearItemInfo();
        document.getElementById('btnMobileDrop').classList.add('hidden');
        this.container.get('InputManager').resetMouse();
        
        this.tryReacquirePointerLock();
    }

    tryReacquirePointerLock() {
        const ge = this.container.get('GameEngine');
        const canvas = document.getElementById('gameCanvas');
        if (ge && (ge.currentState === GAME_STATE.TOWN || ge.currentState === GAME_STATE.PLAYING) && !this.isAnyUIOpen()) {
            canvas.requestPointerLock();
        }
    }

    showToast(msg) {
        this.toast.el.innerText = msg; this.toast.el.style.opacity = 1;
        setTimeout(() => this.toast.el.style.opacity = 0, 2000);
    }

    getArrRef(type) {
        if(type === 'inv') return this.session.run.inventory;
        if(type === 'quick') return this.session.run.quickSlots;
        if(type === 'stash') return this.session.meta.stash;
        if(type === 'equip') return this.session.run.equipment;
        if(type === 'container' && this.currentLootContainer?.data?.items) return this.currentLootContainer.data.items;
        return null;
    }

    handleDrop(e, targetType, targetIndex) {
        if(e) { e.preventDefault(); e.stopPropagation(); }
        if (!this.draggedItemInfo) return;

        const sourceRef = this.getArrRef(this.draggedItemInfo.type);
        const targetRef = this.getArrRef(targetType);
        
        const result = this.session.swapItems(
            { type: this.draggedItemInfo.type, idx: this.draggedItemInfo.index, arr: sourceRef },
            { type: targetType, idx: targetIndex, arr: targetRef }
        );

        if (result.success) {
            this.audio.play(targetType === 'equip' ? 'equip' : 'inv_move');
            this.updateAllUI();
        } else if (result.msg) {
            this.showToast(result.msg);
        }
        this.draggedItemInfo = null;
    }

    handleDragStart(e, type, index) {
        this.draggedItemInfo = { type, index };
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            // 드래그 이미지 커스텀이 필요하다면 여기서 설정 가능
        }
    }

    handleRightClickAction(type, index) {
        this.useItem(type, index);
    }

    handleMobileSlotClick(e, type, index) {
        e.preventDefault();
        const itemObj = type === 'container' ? this.getArrRef('container')[index]?.data : this.getArrRef(type)[index];
        
        if (this.selectedMobileSlot && this.selectedMobileSlot.type === type && this.selectedMobileSlot.index === index) {
            // 동일 슬롯 두 번 클릭 시 사용/장착 (더블 탭 효과)
            this.useItem(type, index);
            this.selectedMobileSlot = null;
            this.clearItemInfo();
            document.getElementById('btnMobileDrop').classList.add('hidden');
        } else {
            // 첫 클릭 시 선택 및 정보 표시
            this.selectedMobileSlot = { type, index };
            if (itemObj) {
                this.showItemInfo(itemObj);
                document.getElementById('btnMobileDrop').classList.remove('hidden');
            } else {
                this.clearItemInfo();
                document.getElementById('btnMobileDrop').classList.add('hidden');
            }
        }
        this.updateAllUI();
    }

    useItem(type, index) {
        const items = this.getArrRef(type);
        if (!items) return;

        const item = type === 'equip' ? items[index] : (type === 'container' ? items[index]?.data : items[index]);
        if (!item) return;

        let result = { success: false };

        // 1. 루팅 중일 때의 특수 동작: 인벤토리 <-> 상자 간 이동
        if (this.currentLootContainer) {
            if (type === 'container') {
                result = this.session.moveToFirstEmpty({ type, idx: index, arr: items }, 'inv', this.session.run.inventory);
            } else if (type === 'inv' || type === 'quick') {
                result = this.session.moveToFirstEmpty({ type, idx: index, arr: items }, 'container', this.getArrRef('container'));
            }
            if (result.success) this.audio.play('inv_move');
        }
        // 2. 창고 이용 중일 때
        else if (!this.inventoryView.stashSection.classList.contains('hidden')) {
            if (type === 'stash') {
                result = this.session.moveToFirstEmpty({ type, idx: index, arr: items }, 'inv', this.session.run.inventory);
            } else if (type === 'inv' || type === 'quick') {
                result = this.session.moveToFirstEmpty({ type, idx: index, arr: items }, 'stash', this.session.meta.stash);
            }
            if (result.success) this.audio.play('inv_move');
        }
        // 3. 일반 상황: 장착/해제/사용
        else if (type === 'equip') {
            if (this.session.giveItem(item)) {
                items[index] = null;
                result = { success: true, msg: `${item.name} 해제` };
                this.audio.play('inv_move');
            } else result = { success: false, msg: "인벤토리에 공간이 없습니다." };
        } else if (item.type === 'equipment') {
            result = this.session.equipItem({ type, idx: index, arr: items }, item);
            this.audio.play('equip');
        } else if (item.type === 'consumable') {
            const player = this.container.get('EntityManager').player;
            result = this.session.useItem(type, index, player) || { success: false };
            if (result.success) this.audio.play('ui');
        } else result = { success: false, msg: "사용할 수 없는 아이템입니다." };
        
        if (result.msg) this.showToast(result.msg);
        this.updateAllUI(); // 상태 변경 후 View 갱신
    }

    showItemInfo(itemObj) {
        // 버그 수정: index.html의 ID와 일치하도록 수정
        const infoBox = document.getElementById('itemInfoPanel');
        if (!infoBox || !itemObj) return;
        
        const nameEl = document.getElementById('infoName');
        const descEl = document.getElementById('infoDesc');
        if (nameEl) nameEl.innerText = itemObj.name;
        if (descEl) descEl.innerText = itemObj.desc || '';
        
        infoBox.classList.remove('hidden');
    }

    handleDropOutside(e) {
        if(e) e.preventDefault();
        if (!this.draggedItemInfo) return;

        const items = this.getArrRef(this.draggedItemInfo.type);
        const itemObj = this.session.dropItem(this.draggedItemInfo.type, this.draggedItemInfo.index, items);

        if (itemObj) {
            this.audio.play('drop');
            if (this.container.get('GameEngine').currentState === GAME_STATE.PLAYING) { 
                let p = this.container.get('EntityManager').player;
                this.container.get('EntityManager').items.push(new ItemDrop(p.x + rand(-20, 20), p.y + rand(-20, 20), itemObj)); 
                this.showToast(`${itemObj.name} 버림`); 
            } else { this.showToast(`[파기됨] ${itemObj.name}`); } 
        }
        this.draggedItemInfo = null; this.updateAllUI();
    }

    refreshInventory() {
        this.updateAllUI();
    }

    /**
     * MVVM 패턴의 ViewModel 역할을 수행하기 위한 알림 메서드입니다.
     * 데이터(Model)가 변경되었을 때 호출하여 모든 View를 동기화합니다.
     */
    notify() {
        this.updateAllUI();
    }

    // 하위 호환성 및 GameEngine의 특정 호출을 위한 별칭
    updateLootUI() {
        this.notify();
    }

    updateAllUI() {
        this.hudView.renderQuickSlots(this.session.run.quickSlots);
        this.inventoryView.renderInventory(this.session.run.inventory, this.session.run.quickSlots, this.session.run.maxSlots);
        this.inventoryView.renderEquip(this.session.run.equipment);
        this.inventoryView.renderStash(this.session.meta.stash);
        this.inventoryView.renderLoot(this.currentLootContainer?.data?.items);

        document.getElementById('hudValuables').innerText = this.session.meta.valuables;
        document.getElementById('hudMaterials').innerText = this.session.meta.materials;

        // 제작창이 열려있다면 상세 정보(재료 현황 등) 갱신
        const cm = this.container.get('CraftingManager');
        if (cm && this.craftingView.window && !this.craftingView.window.classList.contains('hidden')) {
            if (cm.selectedRecipeId !== null) this.selectRecipe(cm.selectedRecipeId);
        }
    }

    updateHUD(player) {
        if(!player) return;
        this.hudView.updateStatus(player.hp, player.baseMaxHp, player.sp, player.baseMaxSp, this.session.getDefense());
        this.hudView.updateChanneling(player.channeling);
    }

    updateUpgradeUI() {
        const stats = this.session.meta.upgrades;
        const warehouseCfg = this.session.upgradeCfg?.warehouse || {};
        const workbenchCfg = this.session.upgradeCfg?.workbench || {};
        const costs = {
            warehouse: {
                val: (warehouseCfg.baseValuableCost ?? 100) * stats.warehouse,
                mat: (warehouseCfg.baseMaterialCost ?? 50) * stats.warehouse
            },
            workbench: {
                val: (workbenchCfg.baseValuableCost ?? 150) * stats.workbench,
                mat: (workbenchCfg.baseMaterialCost ?? 100) * stats.workbench
            }
        };
        this.upgradeView.render(stats, costs, this.session.meta.valuables, this.session.meta.materials);
    }

    upgradeFacility(type) {
        const result = this.session.upgradeFacility(type);
        if (result.success) {
            this.audio.play('success');
            this.updateAllUI();
            this.updateUpgradeUI();
        }
        if (result.msg) this.showToast(result.msg);
    }

    clearItemInfo() {
        const infoBox = document.getElementById('itemInfo');
        if (infoBox) {
            infoBox.classList.add('hidden');
        }
        // 모바일 선택 상태도 함께 해제
        this.selectedMobileSlot = null;
    }

    doCraft() {
        const cm = this.container.get('CraftingManager');
        if (!cm) return;

        const result = cm.doCraft();
        if (result) {
            this.showToast(result.msg);
            if (result.success) {
                this.updateAllUI();
                this.selectRecipe(cm.selectedRecipeId);
            }
        }
    }

    /**
     * 창고에 있는 가치 있는 아이템들을 자동으로 판매합니다.
     */
    sellStash() {
        const result = this.session.sellStashItems();
        if (result.success) {
            this.audio.play('success');
            this.updateAllUI();
        }
        if (result.msg) this.showToast(result.msg);
    }

    selectRecipe(idx) {
        const cm = this.container.get('CraftingManager');
        if (!cm) return;
        const data = cm.selectRecipe(idx);
        if (data && this.craftingView) {
            this.craftingView.renderDetails(data.targetItem, data.ingredients, data.canCraft);
        }
    }
}
