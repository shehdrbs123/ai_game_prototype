import { BaseManager } from '../core/BaseManager.js';

/**
 * 플레이어의 현재 세션 상태(골드, 인벤토리, 장비, 진행도 등)를 관리합니다.
 */
export class PlayerSession extends BaseManager {
    constructor(app) {
        super(app);
        this.gold = 1000;
        this.inventory = [];
        this.equipment = { weapon: null, head: null, body: null, legs: null };
        this.stats = { level: 1, exp: 0, hp: 100, maxHp: 100, atk: 10, def: 0 };
        this.dungeonHistory = [];
        
        // 에디터/시스템용 활성 데이터
        this.activeDungeonPlan = null;
    }

    init() {
        console.log("PlayerSession: Initializing...");
        super.init();
    }

    // --- 인벤토리 & 경제 시스템 ---

    addGold(amount) {
        this.gold += amount;
        this.events.emit('GOLD_CHANGED', this.gold);
    }

    addItem(itemId, amount = 1) {
        const itemData = this.get('DataManager').getItem(itemId);
        if (!itemData) return false;

        const existing = this.inventory.find(i => i.id === itemId);
        if (existing) {
            existing.amount += amount;
        } else {
            this.inventory.push({ id: itemId, amount });
        }
        this.events.emit('INVENTORY_CHANGED', this.inventory);
        return true;
    }

    removeItem(itemId, amount = 1) {
        const index = this.inventory.findIndex(i => i.id === itemId);
        if (index === -1) return false;

        if (this.inventory[index].amount > amount) {
            this.inventory[index].amount -= amount;
        } else {
            this.inventory.splice(index, 1);
        }
        this.events.emit('INVENTORY_CHANGED', this.inventory);
        return true;
    }

    hasItem(itemId, amount = 1) {
        const item = this.inventory.find(i => i.id === itemId);
        return item && item.amount >= amount;
    }

    // --- 장비 시스템 ---

    equip(itemId) {
        const item = this.get('DataManager').getItem(itemId);
        if (!item || item.type !== 'equipment') return false;

        const slot = item.slot;
        if (this.equipment[slot]) {
            this.addItem(this.equipment[slot]); // 기존 장비 해제
        }
        
        this.equipment[slot] = itemId;
        this.removeItem(itemId, 1);
        this.updateStats();
        this.events.emit('EQUIPMENT_CHANGED', this.equipment);
        return true;
    }

    updateStats() {
        let extraAtk = 0;
        let extraDef = 0;

        Object.values(this.equipment).forEach(itemId => {
            if (!itemId) return;
            const item = this.get('DataManager').getItem(itemId);
            if (item) {
                if (item.atk) extraAtk += item.atk;
                if (item.def) extraDef += item.def;
            }
        });

        this.stats.atk = 10 + extraAtk;
        this.stats.def = extraDef;
        this.events.emit('STATS_CHANGED', this.stats);
    }

    // --- 던전 진행 로직 (원격 브랜치 통합) ---

    setActiveDungeonPlan(plan) {
        this.activeDungeonPlan = plan;
        console.log("PlayerSession: Active dungeon plan set", plan);
    }

    getActiveDungeonPlan() {
        return this.activeDungeonPlan;
    }

    recordDungeonResult(result) {
        this.dungeonHistory.push({
            timestamp: Date.now(),
            ...result
        });
        this.events.emit('DUNGEON_FINISHED', result);
    }
}
