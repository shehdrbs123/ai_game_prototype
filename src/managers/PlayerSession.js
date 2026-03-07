import { BaseManager } from '../core/BaseManager.js';

/**
 * PlayerSession: 플레이어의 영구적 성장(Meta)과 현재 탐험 상태(Run) 데이터를 관리합니다.
 * C# Porting: Unity의 ScriptableObject(Data Container) 또는 SaveSystem으로 대응됩니다.
 */
export class PlayerSession extends BaseManager {
    /**
     * @param {DIContainer} app 
     */
    constructor(app) {
        super(app);
        
        // 영구 성장 데이터 (Persistent Data)
        this.meta = {
            valuables: 0, 
            materials: 0,
            upgrades: { warehouse: 1, workbench: 1 },
            lastDeathCorpse: null, 
            receivedFreeWeapon: false,
            stash: new Array(500).fill(null)
        };
        
        // 현재 세션 데이터 (Run-time Data)
        this.run = this.getEmptyRunData();
    }

    init() {
        super.init();
        console.log('PlayerSession initialized.');
    }

    /**
     * 초기 탐험 데이터 생성
     */
    getEmptyRunData() {
        // 창고 업그레이드에 따른 슬롯 수 계산
        const warehouseLevel = this.meta ? this.meta.upgrades.warehouse : 1;
        const maxSlots = Math.min(20, 6 + (warehouseLevel - 1) * 4);
        
        return {
            inventory: new Array(maxSlots).fill(null),
            quickSlots: new Array(8).fill(null),
            equipment: { weapon: null, head: null, chest: null, legs: null, boots: null },
            maxSlots: maxSlots
        };
    }

    /**
     * 인벤토리 크기 재계산 (업그레이드 시 호출)
     */
    resizeInventory() {
        const newMax = Math.min(20, 6 + (this.meta.upgrades.warehouse - 1) * 4);
        if (newMax > this.run.inventory.length) {
            const diff = newMax - this.run.inventory.length;
            for (let i = 0; i < diff; i++) this.run.inventory.push(null);
        }
        this.run.maxSlots = this.run.inventory.length;
        
        this.events.emit('PLAYER_INVENTORY_RESIZED', { maxSlots: this.run.maxSlots });
    }

    /**
     * 특정 아이템의 전체 개수(인벤토리 + 창고)를 반환합니다.
     */
    getTotalItemCount(itemId) {
        let count = 0;
        const check = (item) => { if (item && item.id === itemId) count++; };
        this.run.inventory.forEach(check);
        this.meta.stash.forEach(check);
        return count;
    }

    /**
     * 아이템을 특정 수량만큼 소모합니다. (제작 등)
     */
    consumeItems(itemId, qty) {
        let remaining = qty;
        
        // 1. 인벤토리에서 소모
        for (let i = 0; i < this.run.inventory.length && remaining > 0; i++) {
            if (this.run.inventory[i] && this.run.inventory[i].id === itemId) {
                this.run.inventory[i] = null;
                remaining--;
            }
        }
        
        // 2. 창고에서 소모
        for (let i = 0; i < this.meta.stash.length && remaining > 0; i++) {
            if (this.meta.stash[i] && this.meta.stash[i].id === itemId) {
                this.meta.stash[i] = null;
                remaining--;
            }
        }
        
        this.events.emit('PLAYER_DATA_CHANGED');
    }

    /**
     * 슬롯 간 아이템 교환 (가장 핵심적인 로직)
     */
    swapItems(source, target) {
        const sourceArr = source.arr;
        const targetArr = target.arr;
        
        let sourceItem = source.type === 'container' ? sourceArr[source.idx]?.data : sourceArr[source.idx];
        let targetItem = target.type === 'container' ? targetArr[target.idx]?.data : targetArr[target.idx];

        if (!sourceItem && !targetItem) return { success: false };

        // 장비 슬롯 검증 (Type Check)
        if (target.type === 'equip' && sourceItem && (sourceItem.type !== 'equipment' || sourceItem.slot !== target.idx)) {
            return { success: false, msg: "장착할 수 없는 부위입니다." };
        }
        if (source.type === 'equip' && targetItem && (targetItem.type !== 'equipment' || targetItem.slot !== source.idx)) {
            return { success: false, msg: "해당 슬롯에 장착할 수 없는 아이템입니다." };
        }

        // 데이터 반영
        const setVal = (info, item) => {
            if (info.type === 'container') {
                info.arr[info.idx] = item ? { data: item, revealed: true, progress: 2.0 } : null;
            } else {
                info.arr[info.idx] = item;
            }
        };

        setVal(target, sourceItem);
        setVal(source, targetItem);

        this.events.emit('PLAYER_DATA_CHANGED');
        return { success: true };
    }

    /**
     * 첫 번째 빈 슬롯으로 아이템 이동
     */
    moveToFirstEmpty(source, targetType, targetArr) {
        const emptyIdx = targetArr.findIndex(slot => !slot);
        if (emptyIdx === -1) return { success: false, msg: "공간이 부족합니다." };

        return this.swapItems(source, { type: targetType, idx: emptyIdx, arr: targetArr });
    }

    /**
     * 시설(건물) 업그레이드
     */
    upgradeFacility(type) {
        const stats = this.meta.upgrades;
        const currentLevel = stats[type] || 1;
        
        // 기획 데이터 기반 비용 계산 (추후 DataManager로 분리 가능)
        const costVal = type === 'warehouse' ? 100 * currentLevel : 150 * currentLevel;
        const costMat = type === 'warehouse' ? 50 * currentLevel : 100 * currentLevel;

        if (this.meta.valuables >= costVal && this.meta.materials >= costMat) {
            this.meta.valuables -= costVal;
            this.meta.materials -= costMat;
            
            stats[type] = currentLevel + 1;
            
            if (type === 'warehouse') this.resizeInventory();
            
            this.events.emit('PLAYER_UPGRADED', { type, level: stats[type] });
            this.events.emit('PLAYER_DATA_CHANGED');
            
            return { success: true, msg: `${type === 'warehouse' ? '창고' : '작업대'} 업그레이드 완료!` };
        }
        return { success: false, msg: "자원이 부족합니다." };
    }

    /**
     * 아이템 획득 (가방 우선, 꽉 차면 실패)
     */
    giveItem(itemData) {
        let emptyInv = this.run.inventory.findIndex((slot, idx) => !slot && idx < this.run.maxSlots);
        if (emptyInv !== -1) {
            this.run.inventory[emptyInv] = itemData;
            this.events.emit('PLAYER_DATA_CHANGED');
            return true;
        }
        return false;
    }

    // --- 통계(Stats) Getter ---
    getDefense() {
        let def = 0;
        const equip = this.run.equipment;
        ['head', 'chest', 'legs', 'boots'].forEach(s => { 
            if (equip[s]) def += equip[s].def || 0; 
        });
        return def;
    }

    getMaxHp() { 
        return 100 + (this.meta.upgrades.workbench - 1) * 20; 
    }

    getMaxSp() { 
        return 100 + (this.meta.upgrades.workbench - 1) * 10; 
    }
}
