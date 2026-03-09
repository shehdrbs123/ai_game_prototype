import { BaseManager } from '../core/BaseManager.js';

/**
 * 게임의 모든 정적 데이터(아이템, 레시피, 설정, 던전 등)를 관리하는 매니저
 * JSON 파일로부터 데이터를 비동기로 로드하며, DI 컨테이너를 통해 접근 가능합니다.
 */
export class DataManager extends BaseManager {
    constructor(app) {
        super(app);
        this.items = new Map();
        this.recipes = [];
        this.settings = null;
        this.dungeonOfferingSystem = null;
        this.gameplayBalance = null;
        this.isLoaded = false;
    }

    /**
     * 외부 JSON 파일을 비동기로 로드합니다.
     */
    async loadJson(path) {
        console.log(`DataManager: Loading JSON from ${path}...`);
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load '${path}' (HTTP ${response.status})`);
            }
            return await response.json();
        } catch (e) {
            console.error(`DataManager: Error loading ${path}:`, e);
            throw e;
        }
    }

    /**
     * 시스템 초기화 단계: 필요한 모든 JSON 데이터를 로드합니다.
     * GameEngine 시작 전 또는 main.js에서 명시적으로 호출됩니다.
     */
    async init() {
        if (this.isLoaded) {
            this.initialized = true;
            return;
        }

        try {
            // 서버 환경에 따라 절대 경로(/) 보다는 현재 위치 기준 상대 경로 사용 권장
            const [settings, items, armorTemplates, recipes, dungeonOfferingSystem, gameplayBalance] = await Promise.all([
                this.loadJson('src/data/json/settings.json'),
                this.loadJson('src/data/json/items.json'),
                this.loadJson('src/data/json/armorTemplates.json'),
                this.loadJson('src/data/json/recipes.json'),
                this.loadJson('src/data/json/dungeonOfferingSystem.json'),
                this.loadJson('src/data/json/gameplayBalance.json')
            ]);

            this.settings = settings;
            this.dungeonOfferingSystem = dungeonOfferingSystem || null;
            this.gameplayBalance = gameplayBalance || {};
            
            // 로드된 로우 데이터를 Map 및 내부 구조로 파싱
            this.loadData(items, armorTemplates, recipes);
            
            this.isLoaded = true;
            this.initialized = true;
            console.log("DataManager: All game data loaded and initialized.");
        } catch (error) {
            console.error("DataManager: Failed to load game data", error);
            throw error; // 초기화 실패는 치명적이므로 예외 전파
        }
    }

    /**
     * 로드된 데이터를 내부 구조로 변환하여 메모리에 저장합니다.
     */
    loadData(items, armorTemplates, recipes) {
        // 일반 아이템 등록
        items.forEach(i => this.items.set(i.id, i));
        
        // 방어구 템플릿을 실제 아이템 객체로 생성하여 등록
        armorTemplates.forEach(part => {
            for(let i = 0; i < 3; i++) {
                let idStr = `${part.slot}_${i+1}`;
                this.items.set(idStr, {
                    id: idStr, 
                    type: 'equipment', 
                    slot: part.slot, 
                    name: part.name[i], 
                    emoji: part.emoji[i], 
                    value: part.defs[i] * 10, 
                    desc: `장착 시 받는 피해량 -${part.defs[i]}`, 
                    def: part.defs[i]
                });
            }
        });
        
        this.recipes = recipes;
    }

    // --- 데이터 접근 헬퍼 메소드 ---

    getItem(id) { return this.items.get(id); }
    getRecipes() { return this.recipes; }
    getSettings() { return this.settings; }
    getGameplayBalance() { return this.gameplayBalance; }
    getDungeonOfferingSystem() { return this.dungeonOfferingSystem; }

    /**
     * 비취 아이템 ID를 기반으로 위험도를 반환합니다.
     */
    getRiskLevelByJade(jadeItemId) {
        const cfg = this.dungeonOfferingSystem;
        if (!cfg || !cfg.riskLevels || !jadeItemId) return 0;

        for (const [riskLevel, info] of Object.entries(cfg.riskLevels)) {
            if (info.jadeId === jadeItemId) return Number(riskLevel);
        }
        return 0;
    }

    /**
     * 공물(Offerings)과 비취를 기반으로 던전 생성 계획을 확정합니다.
     */
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

        let scoreSum = 0;
        const dungeonCount = new Map();
        const dungeonWeight = new Map();

        validOfferingMeta.forEach((entry) => {
            const dungeonId = entry.meta.targetDungeonId;
            const weight = entry.meta.gradeCoeff || 1;
            scoreSum += weight;
            dungeonCount.set(dungeonId, (dungeonCount.get(dungeonId) || 0) + 1);
            dungeonWeight.set(dungeonId, (dungeonWeight.get(dungeonId) || 0) + weight);
        });

        // 결정론적 시드 생성을 위한 페이로드 구성
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
        
        // 최종 결정된 던전 정보 반환
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

    /**
     * 최다 빈도 또는 가중치 기반 시드로 던전을 선택합니다.
     */
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

    /**
     * 문자열 기반 UInt32 해시 생성 (FNV-1a 변형)
     */
    hashToUInt32(input) {
        let hash = 2166136261;
        for (let i = 0; i < input.length; i++) {
            hash ^= input.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    /**
     * 무작위 드롭 아이템 ID를 결정합니다 (밸런스 데이터 기반).
     */
    getRandomDrop() {
        const dropTable = this.gameplayBalance?.dropTable || {};
        const relicChance = dropTable.relicChance ?? 0.1;
        const materialChance = dropTable.materialChance ?? 0.5;
        const goldChance = dropTable.goldChance ?? 0.2;
        const potionChance = dropTable.potionChance ?? 0.15;
        const materials = Array.isArray(dropTable.materials) && dropTable.materials.length
            ? dropTable.materials
            : ['herb', 'fabric', 'wood', 'leather', 'iron_ore', 'scrap', 'core'];

        let r = Math.random();
        if (r < relicChance) return 'relic';

        const materialThreshold = relicChance + materialChance;
        if (r < materialThreshold) {
            return materials[Math.floor(Math.random() * materials.length)];
        }

        const goldThreshold = materialThreshold + goldChance;
        if (r < goldThreshold) return 'gold';

        const potionThreshold = goldThreshold + potionChance;
        if (r < potionThreshold) return 'potion';

        // 기본 장비류 중 무작위 선택
        let equips = Array.from(this.items.values())
            .filter(i => i.type === 'equipment')
            .map(i => i.id);
        
        return equips.length > 0 
            ? equips[Math.floor(Math.random() * equips.length)]
            : 'herb'; // 폴백
    }
}
