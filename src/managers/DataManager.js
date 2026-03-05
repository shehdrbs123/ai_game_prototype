
import { RAW_DATA } from '../data/gameData.js';

export class DataManager {
    constructor() {
        this.items = new Map();
        this.recipes = [];
        this.settings = RAW_DATA.settings;
        this.loadData();
    }
    loadData() {
        RAW_DATA.items.forEach(i => this.items.set(i.id, i));
        RAW_DATA.armorTemplates.forEach(part => {
            for(let i=0; i<3; i++) {
                let idStr = `${part.slot}_${i+1}`;
                this.items.set(idStr, {
                    id: idStr, type: 'equipment', slot: part.slot, 
                    name: part.name[i], emoji: part.emoji[i], 
                    value: part.defs[i] * 10, desc: `장착 시 받는 피해량 -${part.defs[i]}`, def: part.defs[i]
                });
            }
        });
        this.recipes = RAW_DATA.recipes;
    }
    getItem(id) { return this.items.get(id); }
    getRecipes() { return this.recipes; }
    getRandomDrop() {
        let r = Math.random();
        if(r < 0.1) return 'relic';
        if(r < 0.6) {
            let mats = ['herb', 'fabric', 'wood', 'leather', 'iron_ore', 'scrap', 'core'];
            return mats[Math.floor(Math.random() * mats.length)];
        }
        if(r < 0.8) return 'gold';
        if(r < 0.95) return 'potion';
        let equips = Array.from(this.items.values()).filter(i => i.type === 'equipment').map(i => i.id);
        return equips[Math.floor(Math.random() * equips.length)];
    }
}
