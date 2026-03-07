import { BaseManager } from '../core/BaseManager.js';
import { RAW_DATA } from '../data/gameData.js';

export class DataManager extends BaseManager {
    constructor(app) {
        super(app);
        this.items = new Map();
        this.recipes = [];
        this.settings = RAW_DATA.settings;
        this.dungeonOfferingSystem = RAW_DATA.dungeonOfferingSystem || null;
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
    getDungeonOfferingSystem() { return this.dungeonOfferingSystem; }

    getRiskLevelByJade(jadeItemId) {
        const cfg = this.dungeonOfferingSystem;
        if (!cfg || !cfg.riskLevels) return 0;
        if (!jadeItemId) return 0;

        for (const [riskLevel, info] of Object.entries(cfg.riskLevels)) {
            if (info.jadeId === jadeItemId) return Number(riskLevel);
        }
        return 0;
    }

    resolveDungeonPlan(offerings = [], jadeItemId = null, options = {}) {
        const cfg = this.dungeonOfferingSystem;
        if (!cfg) return null;

        const normalizedOfferings = Array.isArray(offerings)
            ? offerings.filter(Boolean).slice(0, cfg.slots.offeringSlotCount)
            : [];

        const riskLevel = this.getRiskLevelByJade(jadeItemId);
        const validOfferingMeta = normalizedOfferings
            .map((itemId) => ({ itemId, meta: cfg.offerings[itemId] }))
            .filter((entry) => entry.meta);

        const dungeonCount = new Map();
        const dungeonWeight = new Map();
        let scoreSum = 0;

        validOfferingMeta.forEach((entry) => {
            const dungeonId = entry.meta.targetDungeonId;
            const weight = entry.meta.gradeCoeff || 1;
            scoreSum += weight;
            dungeonCount.set(dungeonId, (dungeonCount.get(dungeonId) || 0) + 1);
            dungeonWeight.set(dungeonId, (dungeonWeight.get(dungeonId) || 0) + weight);
        });

        const stablePayload = [
            `risk:${riskLevel}`,
            `offerings:${normalizedOfferings.sort().join(',')}`,
            `score:${scoreSum}`
        ].join('|');

        const seed = this.hashToUInt32(stablePayload);
        const forcedDungeonId = options.forceDungeonId || (cfg.eventOverrides?.enabled ? cfg.eventOverrides.forceDungeonId : null);

        let selectedDungeonId = forcedDungeonId;
        if (!selectedDungeonId) {
            selectedDungeonId = this.pickDungeonByCountThenSeed(dungeonCount, dungeonWeight, seed, cfg);
        }
        if (!selectedDungeonId) {
            selectedDungeonId = Object.keys(cfg.dungeons || {})[0] || null;
        }

        const dungeonDef = selectedDungeonId ? cfg.dungeons[selectedDungeonId] : null;
        const generationProfile = dungeonDef ? cfg.generationProfiles[dungeonDef.profileId] : null;

        return {
            offerings: normalizedOfferings,
            jadeItemId: jadeItemId || null,
            riskLevel,
            score: scoreSum,
            seed,
            dungeonId: selectedDungeonId,
            profileId: dungeonDef ? dungeonDef.profileId : null,
            generationProfile: generationProfile || null,
            consumePolicy: cfg.consumePolicy || { offerings: 'consume_all', jade: 'consume_all' }
        };
    }

    pickDungeonByCountThenSeed(dungeonCount, dungeonWeight, seed, cfg) {
        if (!dungeonCount.size) return null;

        let maxCount = 0;
        for (const count of dungeonCount.values()) {
            if (count > maxCount) maxCount = count;
        }
        const tiedDungeons = Array.from(dungeonCount.entries())
            .filter((entry) => entry[1] === maxCount)
            .map((entry) => entry[0]);

        if (tiedDungeons.length === 1) return tiedDungeons[0];

        const tieMode = cfg.tieBreakPolicy?.mode || 'seed_weighted_random';
        if (tieMode !== 'seed_weighted_random') {
            return tiedDungeons[seed % tiedDungeons.length];
        }

        const totalWeight = tiedDungeons.reduce((sum, dungeonId) => sum + (dungeonWeight.get(dungeonId) || 1), 0);
        let cursor = seed % totalWeight;
        for (const dungeonId of tiedDungeons) {
            cursor -= (dungeonWeight.get(dungeonId) || 1);
            if (cursor < 0) return dungeonId;
        }
        return tiedDungeons[0];
    }

    hashToUInt32(input) {
        let hash = 2166136261;
        for (let i = 0; i < input.length; i++) {
            hash ^= input.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

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
