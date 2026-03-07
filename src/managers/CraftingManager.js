import { BaseManager } from '../core/BaseManager.js';

/**
 * CraftingManager: 아이템 제작 레시피 검증 및 제작 실행을 담당합니다.
 * C# Porting: Unity의 Crafting System 또는 Recipe Database로 대응됩니다.
 */
export class CraftingManager extends BaseManager {
    /**
     * @param {DIContainer} app 
     */
    constructor(app) {
        super(app);
        
        /** @private */
        this.selectedRecipeIdx = null;
    }

    init() {
        super.init();
        console.log('CraftingManager initialized.');
    }

    /**
     * 사용 가능한 모든 레시피를 가져옵니다.
     */
    getRecipes() {
        const data = this.get('DataManager');
        return data ? data.getRecipes() : [];
    }

    /**
     * 특정 레시피를 선택하고 필요한 재료 현황을 반환합니다.
     */
    selectRecipe(idx) {
        this.selectedRecipeIdx = idx;
        const recipes = this.getRecipes();
        const recipe = recipes[idx];
        if (!recipe) return null;

        const data = this.get('DataManager');
        const session = this.get('PlayerSession');

        const ingredients = recipe.ingredients.map(ing => ({
            item: data.getItem(ing.id),
            required: ing.qty,
            owned: session.getTotalItemCount(ing.id)
        }));
        
        const canCraft = ingredients.every(ing => ing.owned >= ing.required);
        
        return { 
            recipe, 
            targetItem: data.getItem(recipe.targetId), 
            ingredients, 
            canCraft 
        };
    }

    /**
     * 제작을 실행합니다.
     */
    doCraft() {
        if (this.selectedRecipeIdx === null) {
            return { success: false, msg: "레시피를 선택하세요." };
        }
        
        const recipes = this.getRecipes();
        const recipe = recipes[this.selectedRecipeIdx];
        const session = this.get('PlayerSession');
        const data = this.get('DataManager');
        const audio = this.get('AudioSystem');

        // 1. 재료 확인
        const canCraft = recipe.ingredients.every(ing => 
            session.getTotalItemCount(ing.id) >= ing.qty
        );
        
        if (!canCraft) return { success: false, msg: "재료가 부족합니다." };
        
        // 2. 공간 확인
        const hasSpace = session.run.inventory.some(slot => slot === null) || 
                         session.meta.stash.some(slot => slot === null);
        if (!hasSpace) return { success: false, msg: "공간이 부족합니다." };

        // 3. 실행 (재료 소모 및 아이템 지급)
        recipe.ingredients.forEach(ing => session.consumeItems(ing.id, ing.qty));
        session.giveItem(data.getItem(recipe.targetId));
        
        if (audio) audio.play('success');
        
        // 이벤트 발송 (UI 갱신용)
        this.events.emit('ITEM_CRAFTED', { recipeId: recipe.targetId });
        
        return { success: true, msg: "제작 완료!" };
    }
}
