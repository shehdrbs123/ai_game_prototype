
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
        let maxSlots = 6 + (this.meta ? (this.meta.upgrades.warehouse - 1) * 2 : 0);
        return {
            inventory: new Array(maxSlots).fill(null),
            quickSlots: new Array(8).fill(null),
            equipment: { weapon: null, head: null, chest: null, legs: null, boots: null },
            maxSlots: maxSlots
        };
    }
    resizeInventory() {
        let newMax = 6 + (this.meta.upgrades.warehouse - 1) * 2;
        if (newMax > this.run.maxSlots) {
            let diff = newMax - this.run.maxSlots;
            for(let i=0; i<diff; i++) this.run.inventory.push(null);
            this.run.maxSlots = newMax;
        }
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
    giveItem(itemData) {
        let emptyInv = this.run.inventory.findIndex(i => i === null);
        if(emptyInv !== -1) { this.run.inventory[emptyInv] = itemData; return true; }
        let emptyStash = this.meta.stash.findIndex(i => i === null);
        if(emptyStash !== -1) { this.meta.stash[emptyStash] = itemData; return true; }
        return false;
    }
    getDefense() {
        let def = 0;
        ['head', 'chest', 'legs', 'boots'].forEach(s => { if(this.run.equipment[s]) def += this.run.equipment[s].def; });
        return def;
    }
    getMaxHp() { return 100 + (this.meta.upgrades.workbench - 1) * 20; }
    getMaxSp() { return 100 + (this.meta.upgrades.workbench - 1) * 10; }
}
