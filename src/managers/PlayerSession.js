
export class PlayerSession {
    constructor() {
        this.meta = {
            valuables: 0, materials: 0,
            upgrades: { warehouse: 1, workbench: 1 },
            lastDeathCorpse: null, receivedFreeWeapon: false,
            stash: new Array(500).fill(null)
        };
        this.run = this.getEmptyRunData();
    }
    getEmptyRunData() {
        let maxSlots = Math.min(20, 6 + (this.meta ? (this.meta.upgrades.warehouse - 1) * 4 : 0));
        return {
            inventory: new Array(maxSlots).fill(null),
            quickSlots: new Array(8).fill(null),
            equipment: { weapon: null, head: null, chest: null, legs: null, boots: null },
            maxSlots: maxSlots
        };
    }
    resizeInventory() {
        let newMax = Math.min(20, 6 + (this.meta.upgrades.warehouse - 1) * 4);
        if (newMax > this.run.inventory.length) {
            let diff = newMax - this.run.inventory.length;
            for(let i=0; i<diff; i++) this.run.inventory.push(null);
        }
        this.run.maxSlots = this.run.inventory.length;
    }
    getTotalItemCount(itemId) {
        let count = 0;
        this.run.inventory.forEach(i => { if(i && i.id === itemId) count++; });
        this.meta.stash.forEach(i => { if(i && i.id === itemId) count++; });
        return count;
    }
    consumeItems(itemId, qty) {
        let remaining = qty;
        for(let i=0; i<this.run.inventory.length && remaining>0; i++) {
            if(this.run.inventory[i] && this.run.inventory[i].id === itemId) { this.run.inventory[i] = null; remaining--; }
        }
        for(let i=0; i<this.meta.stash.length && remaining>0; i++) {
            if(this.meta.stash[i] && this.meta.stash[i].id === itemId) { this.meta.stash[i] = null; remaining--; }
        }
    }
    /**
     * 두 슬롯 간의 아이템을 교환하거나 이동시킵니다.
     * @returns {Object} { success: boolean, msg: string }
     */
    swapItems(source, target) {
        const sourceArr = source.arr;
        const targetArr = target.arr;
        
        let sourceItem = source.type === 'container' ? sourceArr[source.idx]?.data : sourceArr[source.idx];
        let targetItem = target.type === 'container' ? targetArr[target.idx]?.data : targetArr[target.idx];

        if (!sourceItem && !targetItem) return { success: false };

        // 장비 장착 제한 검증
        if (target.type === 'equip' && sourceItem && (sourceItem.type !== 'equipment' || sourceItem.slot !== target.idx)) {
            return { success: false, msg: "장착할 수 없는 아이템입니다." };
        }
        if (source.type === 'equip' && targetItem && (targetItem.type !== 'equipment' || targetItem.slot !== source.idx)) {
            return { success: false, msg: "해당 슬롯에 장착할 수 없는 아이템입니다." };
        }

        // 실제 데이터 교체
        const setVal = (info, item) => {
            if (info.type === 'container') info.arr[info.idx] = item ? { data: item, revealed: true, progress: 2.0 } : null;
            else info.arr[info.idx] = item;
        };

        setVal(target, sourceItem);
        setVal(source, targetItem);

        return { success: true };
    }

    /**
     * 아이템을 대상 배열의 첫 번째 빈 공간으로 이동시킵니다.
     */
    moveToFirstEmpty(source, targetType, targetArr) {
        // null 또는 undefined인 첫 번째 슬롯을 찾음
        const emptyIdx = targetArr.findIndex(slot => !slot);
        if (emptyIdx === -1) return { success: false, msg: "공간이 부족합니다." };

        return this.swapItems(source, { type: targetType, idx: emptyIdx, arr: targetArr });
    }

    /**
     * 아이템을 적절한 장비 슬롯에 장착합니다.
     */
    equipItem(source, item) {
        const slot = item.slot; // 'weapon', 'head' 등
        const currentEquip = this.run.equipment[slot];

        // 데이터 교체 (swapItems의 로직 활용)
        this.run.equipment[slot] = item;
        if (source.type === 'container') {
            source.arr[source.idx] = currentEquip ? { data: currentEquip, revealed: true, progress: 2.0 } : null;
        } else {
            source.arr[source.idx] = currentEquip;
        }

        return { success: true, msg: `${item.name} 장착` };
    }

    dropItem(type, index, arr) {
        let item = type === 'container' ? arr[index]?.data : arr[index];
        if (!item) return null;
        arr[index] = null;
        return item;
    }

    upgradeFacility(type) {
        const stats = {
            warehouse: this.meta.upgrades.warehouse || 1,
            workbench: this.meta.upgrades.workbench || 1
        };
        const costVal = type === 'warehouse' ? 100 * stats.warehouse : 150 * stats.workbench;
        const costMat = type === 'warehouse' ? 50 * stats.warehouse : 100 * stats.workbench;

        if (this.meta.valuables >= costVal && this.meta.materials >= costMat) {
            this.meta.valuables -= costVal;
            this.meta.materials -= costMat;
            
            if (type === 'warehouse') {
                this.meta.upgrades.warehouse = stats.warehouse + 1;
                this.resizeInventory();
            } else {
                this.meta.upgrades.workbench = stats.workbench + 1;
            }
            return { success: true, msg: "업그레이드 완료!" };
        }
        return { success: false, msg: "자원이 부족합니다." };
    }

    sellStashItems() {
        let soldVal = 0;
        let soldMat = 0;
        this.meta.stash.forEach((item, i) => {
            if (!item) return;
            if (item.type === 'valuable' || item.id === 'gold') {
                soldVal += (item.value || 10);
                this.meta.stash[i] = null;
            } else if (['herb', 'fabric', 'wood', 'leather', 'iron_ore', 'scrap', 'core'].includes(item.id)) {
                soldMat += (item.value || 5);
                this.meta.stash[i] = null;
            }
        });

        if (soldVal > 0 || soldMat > 0) {
            this.meta.valuables += soldVal;
            this.meta.materials += soldMat;
            return { success: true, msg: `창고 정리 완료: +${soldVal}G, +${soldMat} 재료` };
        }
        return { success: false, msg: "판매할 아이템이 창고에 없습니다." };
    }

    giveItem(itemData) {
        // 실제 아이템이 없는(falsy) 슬롯을 찾음 (중간에 비어있는 칸 포함)
        // maxSlots 범위 내에서만 확인하여 유효성 보장
        let emptyInv = this.run.inventory.findIndex((slot, idx) => !slot && idx < this.run.maxSlots);
        if(emptyInv !== -1) { this.run.inventory[emptyInv] = itemData; return true; }
        
        // 마을에 있을 때만 창고로 자동 전송 (던전에서는 불가)
        // GameEngine의 상태를 체크하거나, 호출부(UIManager)에서 제어하는 것이 안전함
        // 여기서는 기본적으로 false를 리턴하여 가방이 꽉 찼음을 알림
        return false;
    }
    getDefense() {
        let def = 0;
        ['head', 'chest', 'legs', 'boots'].forEach(s => { if(this.run.equipment[s]) def += this.run.equipment[s].def; });
        return def;
    }
    getMaxHp() { return 100 + (this.meta.upgrades.workbench - 1) * 20; }
    getMaxSp() { return 100 + (this.meta.upgrades.workbench - 1) * 10; }

    useItem(type, index, player) {
        const items = type === 'inv' ? this.run.inventory : (type === 'quick' ? this.run.quickSlots : this.meta.stash);
        const item = items[index];
        if (!item || item.type !== 'consumable') return null;

        let msg = `${item.name} 사용`;
        
        // 소모품 효과 적용 (예: 체력 회복)
        if (item.heal && player) {
            const maxHp = this.getMaxHp();
            const actualHeal = Math.min(item.heal, maxHp - player.hp);
            player.hp += actualHeal;
            msg = `${item.name} 사용: HP +${Math.round(actualHeal)}`;
        }

        items[index] = null;
        return { success: true, msg };
    }
}
