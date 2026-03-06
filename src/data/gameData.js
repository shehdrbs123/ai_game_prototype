
export const GAME_STATE = { TOWN: 0, PLAYING: 1, RESULT: 2 };

export const RAW_DATA = {
    settings: {
        tileSize: 64,
        mapCols: 50,
        mapRows: 50,
        baseHp: 100,
        baseSp: 100,
        baseSpRegen: 20
    },
    items: [
        { id: 'gold', type: 'valuable', name: '금화', emoji: '💰', value: 10, desc: '기본적인 재화입니다.' },
        { id: 'relic', type: 'valuable', name: '고대 유물', emoji: '🏺', value: 50, desc: '값비싼 유물입니다.' },
        { id: 'potion', type: 'consumable', name: '회복약', emoji: '🧪', value: 0, desc: '사용 시 체력을 40 회복합니다.', heal: 40 },
        { id: 'herb', type: 'material', name: '약초', emoji: '🌿', value: 2, desc: '회복약 제작에 쓰입니다.' },
        { id: 'fabric', type: 'material', name: '옷감', emoji: '🧵', value: 3, desc: '천 방어구 제작에 쓰입니다.' },
        { id: 'wood', type: 'material', name: '튼튼한 나무', emoji: '🪵', value: 4, desc: '무기 제작에 쓰입니다.' },
        { id: 'leather', type: 'material', name: '동물 가죽', emoji: '🟤', value: 8, desc: '가죽 방어구 제작에 쓰입니다.' },
        { id: 'iron_ore', type: 'material', name: '철광석', emoji: '🪨', value: 15, desc: '철 방어구/무기 제작에 쓰입니다.' },
        { id: 'scrap', type: 'material', name: '고철', emoji: '⚙️', value: 5, desc: '마을 시설 업그레이드용.' },
        { id: 'core', type: 'material', name: '에너지 코어', emoji: '🔋', value: 20, desc: '고급 업그레이드용.' },
        { id: 'jade_risk_1', type: 'special', name: '위험도 1 옥', emoji: '🟢', value: 30, desc: '출정 위험도를 1로 지정하는 옥.' },
        { id: 'jade_risk_2', type: 'special', name: '위험도 2 옥', emoji: '🔵', value: 60, desc: '출정 위험도를 2로 지정하는 옥.' },
        { id: 'jade_risk_3', type: 'special', name: '위험도 3 옥', emoji: '🟣', value: 90, desc: '출정 위험도를 3으로 지정하는 옥.' },
        
        { id: 'sword', type: 'equipment', slot: 'weapon', name: '낡은 검', emoji: '🗡️', value: 20, desc: '부채꼴 범위 공격 (피해 35, 사거리 70)', dmg: 35, range: 70, cd: 0.6 },
        { id: 'spear', type: 'equipment', slot: 'weapon', name: '사냥용 창', emoji: '🔱', value: 30, desc: '직선 찌르기 (피해 30, 사거리 110)', dmg: 30, range: 110, cd: 0.7 },
        { id: 'bow', type: 'equipment', slot: 'weapon', name: '단궁', emoji: '🏹', value: 40, desc: '원거리 투사체 (피해 25, 안전한 거리)', dmg: 25, range: 500, cd: 0.8, isRanged: true }
    ],
    // 방어구 동적 생성용 템플릿
    armorTemplates: [
        { slot: 'head', name: ['천 두건', '가죽 투구', '철 투구'], emoji: ['🪖', '🪖', '⛑️'], defs: [2, 4, 7] },
        { slot: 'chest', name: ['천 옷', '가죽 갑옷', '철 갑옷'], emoji: ['👕', '🦺', '🛡️'], defs: [3, 6, 10] },
        { slot: 'legs', name: ['천 바지', '가죽 바지', '철 바지'], emoji: ['👖', '👖', '👖'], defs: [2, 4, 7] },
        { slot: 'boots', name: ['짚신', '가죽 부츠', '철 부츠'], emoji: ['🩴', '👢', '🥾'], defs: [1, 3, 5] }
    ],
    recipes: [
        { targetId: 'potion', ingredients: [{id: 'herb', qty: 2}] },
        { targetId: 'sword', ingredients: [{id: 'wood', qty: 2}, {id: 'iron_ore', qty: 1}] },
        { targetId: 'spear', ingredients: [{id: 'wood', qty: 3}, {id: 'iron_ore', qty: 2}] },
        { targetId: 'bow', ingredients: [{id: 'wood', qty: 4}, {id: 'leather', qty: 1}] },
        { targetId: 'head_1', ingredients: [{id: 'fabric', qty: 2}] },
        { targetId: 'chest_1', ingredients: [{id: 'fabric', qty: 4}] },
        { targetId: 'legs_1', ingredients: [{id: 'fabric', qty: 3}] },
        { targetId: 'boots_1', ingredients: [{id: 'fabric', qty: 2}] },
        { targetId: 'head_2', ingredients: [{id: 'leather', qty: 2}] },
        { targetId: 'chest_2', ingredients: [{id: 'leather', qty: 4}] },
        { targetId: 'legs_2', ingredients: [{id: 'leather', qty: 3}] },
        { targetId: 'boots_2', ingredients: [{id: 'leather', qty: 2}] },
        { targetId: 'head_3', ingredients: [{id: 'iron_ore', qty: 2}, {id: 'leather', qty: 1}] },
        { targetId: 'chest_3', ingredients: [{id: 'iron_ore', qty: 4}, {id: 'leather', qty: 2}] },
        { targetId: 'legs_3', ingredients: [{id: 'iron_ore', qty: 3}, {id: 'leather', qty: 1}] },
        { targetId: 'boots_3', ingredients: [{id: 'iron_ore', qty: 2}, {id: 'leather', qty: 1}] },
        { targetId: 'jade_risk_1', ingredients: [{id: 'core', qty: 1}, {id: 'scrap', qty: 2}] },
        { targetId: 'jade_risk_2', ingredients: [{id: 'core', qty: 2}, {id: 'iron_ore', qty: 2}] },
        { targetId: 'jade_risk_3', ingredients: [{id: 'core', qty: 3}, {id: 'relic', qty: 1}] }
    ],
    dungeonOfferingSystem: {
        slots: {
            offeringSlotCount: 3,
            jadeSlotCount: 1
        },
        riskLevels: {
            0: { name: '위험도 0', jadeId: null },
            1: { name: '위험도 1', jadeId: 'jade_risk_1' },
            2: { name: '위험도 2', jadeId: 'jade_risk_2' },
            3: { name: '위험도 3', jadeId: 'jade_risk_3' }
        },
        offerings: {
            herb: { grade: 'common', gradeCoeff: 1, targetDungeonId: 'forest_cave' },
            fabric: { grade: 'common', gradeCoeff: 1, targetDungeonId: 'forest_cave' },
            wood: { grade: 'common', gradeCoeff: 1, targetDungeonId: 'forest_cave' },
            leather: { grade: 'uncommon', gradeCoeff: 2, targetDungeonId: 'abandoned_mine' },
            iron_ore: { grade: 'uncommon', gradeCoeff: 2, targetDungeonId: 'abandoned_mine' },
            scrap: { grade: 'rare', gradeCoeff: 3, targetDungeonId: 'ancient_lab' },
            core: { grade: 'epic', gradeCoeff: 5, targetDungeonId: 'ancient_lab' },
            relic: { grade: 'epic', gradeCoeff: 5, targetDungeonId: 'ancient_lab' }
        },
        dungeons: {
            forest_cave: { name: '숲 동굴', profileId: 'profile_forest' },
            abandoned_mine: { name: '폐광', profileId: 'profile_mine' },
            ancient_lab: { name: '고대 실험실', profileId: 'profile_lab' }
        },
        generationProfiles: {
            profile_forest: { maxRooms: 8, minRoomSize: 5, maxRoomSize: 9 },
            profile_mine: { maxRooms: 10, minRoomSize: 5, maxRoomSize: 10 },
            profile_lab: { maxRooms: 12, minRoomSize: 4, maxRoomSize: 10 }
        },
        consumePolicy: {
            offerings: 'consume_all',
            jade: 'consume_all'
        },
        tieBreakPolicy: {
            mode: 'seed_weighted_random'
        },
        eventOverrides: {
            enabled: false,
            forceDungeonId: null
        }
    }
};
