import { BaseManager } from '../core/BaseManager.js';

/**
 * PlayerSession: 플레이어의 경제 상태, 영구 소지품, 그리고 현재 탐험(Run) 상태를 관리합니다.
 */
export class PlayerSession extends BaseManager {
    constructor(app) {
        super(app);
        
        this.meta = {
            valuables: 1000,
            materials: 50,
            receivedFreeWeapon: false,
            lastDeathCorpse: null,
            stash: new Array(40).fill(null),
            upgrades: { warehouse: 1, workbench: 1 }
        };
        
        this.run = {
            inventory: new Array(20).fill(null),
            quickSlots: new Array(8).fill(null),
            equipment: { head: null, chest: null, legs: null, boots: null, weapon: null },
            maxSlots: 20
        };

        this.stats = { level: 1, exp: 0, baseHp: 100, baseSp: 100 };
        this.equipmentSlots = ['head', 'chest', 'legs', 'boots', 'weapon'];
    }

    init() {
        console.log("PlayerSession initialized.");
        super.init();
    }

    getMaxHp() { return this.stats.baseHp || 100; }
    getMaxSp() { return this.stats.baseSp || 100; }
    getDefense() {
        let def = 0;
        Object.values(this.run.equipment).forEach(item => {
            if (item && item.def) def += item.def;
        });
        return def;
    }

    /**
     * 슬롯 타입에 따라 아이템 데이터를 언래핑(Unwrap)하거나 래핑(Wrap)하여 가져옵니다.
     * @private
     */
    _getItemFromSlot(type, slotContent) {
        if (!slotContent) return null;
        // container(상자/시체) 타입이면 .data 안에 실제 아이템 정보가 있음
        return type === 'container' ? slotContent.data : slotContent;
    }

    /**
     * 대상 슬롯 타입에 맞게 아이템을 가공합니다.
     * @private
     */
    _prepareItemForSlot(type, item) {
        if (!item) return null;
        // container 타입으로 들어갈 때는 탐색 완료 상태로 래핑하여 저장
        if (type === 'container') {
            return { data: item, revealed: true, progress: 1.5 };
        }
        return item;
    }

    /**
     * 두 슬롯 간의 아이템 교체 (구조 차이 해결 버전)
     */
    swapItems(source, target) {
        if (!source || !target) return { success: false };
        
        const sourceSlotContent = source.arr[source.idx];
        const targetSlotContent = target.arr[target.idx];

        // 실제 아이템 데이터 추출
        const sourceItem = this._getItemFromSlot(source.type, sourceSlotContent);
        const targetItem = this._getItemFromSlot(target.type, targetSlotContent);

        // 장비 슬롯 제약 체크
        if (target.type === 'equip') {
            if (sourceItem && sourceItem.type !== 'equipment') return { success: false, msg: "장비만 장착 가능합니다." };
            if (sourceItem && sourceItem.slot !== target.idx) return { success: false, msg: "올바른 부위가 아닙니다." };
        }

        // 대상 타입에 맞춰서 데이터 가공 후 저장
        target.arr[target.idx] = this._prepareItemForSlot(target.type, sourceItem);
        source.arr[source.idx] = this._prepareItemForSlot(source.type, targetItem);

        this.events.emit('PLAYER_DATA_CHANGED');
        return { success: true };
    }

    /**
     * 첫 번째 빈 공간으로 아이템 이동 (구조 차이 해결 버전)
     */
    moveToFirstEmpty(source, targetType, targetArr) {
        const sourceSlotContent = source.arr[source.idx];
        const item = this._getItemFromSlot(source.type, sourceSlotContent);
        
        if (!item) return { success: false };

        const emptyIdx = targetArr.findIndex(slot => slot === null);
        if (emptyIdx === -1) return { success: false, msg: "빈 공간이 없습니다." };

        targetArr[emptyIdx] = this._prepareItemForSlot(targetType, item);
        source.arr[source.idx] = null;

        this.events.emit('PLAYER_DATA_CHANGED');
        return { success: true };
    }

    addItem(itemData, amount = 1) {
        if (!itemData) return false;
        const emptyIdx = this.run.inventory.findIndex(s => s === null);
        if (emptyIdx !== -1) {
            this.run.inventory[emptyIdx] = { ...itemData, amount };
            this.events.emit('PLAYER_DATA_CHANGED');
            return true;
        }
        return false;
    }

    dropItem(type, index, arr) {
        const slotContent = arr[index];
        const item = this._getItemFromSlot(type, slotContent);
        if (!item) return null;
        arr[index] = null;
        this.events.emit('PLAYER_DATA_CHANGED');
        return item;
    }

    upgradeFacility(type) {
        const stats = this.meta.upgrades;
        const cost = type === 'warehouse' ? 100 * stats.warehouse : 150 * stats.workbench;
        const matCost = type === 'warehouse' ? 50 * stats.warehouse : 100 * stats.workbench;
        if (this.meta.valuables >= cost && this.meta.materials >= matCost) {
            this.meta.valuables -= cost;
            this.meta.materials -= matCost;
            stats[type]++;
            if (type === 'warehouse') this.meta.stash.push(...new Array(10).fill(null));
            this.events.emit('PLAYER_DATA_CHANGED');
            return { success: true, msg: "업그레이드 완료!" };
        }
        return { success: false, msg: "자원이 부족합니다." };
    }

    sellStashItems() {
        let totalValue = 0;
        this.meta.stash.forEach((item, idx) => {
            if (item) {
                totalValue += (item.value || 10) * (item.amount || 1);
                this.meta.stash[idx] = null;
            }
        });
        if (totalValue > 0) {
            this.meta.valuables += totalValue;
            this.events.emit('PLAYER_DATA_CHANGED');
            return { success: true, msg: `${totalValue} 골드를 획득했습니다.` };
        }
        return { success: false, msg: "판매할 아이템이 없습니다." };
    }
}
