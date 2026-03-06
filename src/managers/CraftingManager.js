export class CraftingManager {
    constructor(container) {
        this.container = container;
        this.session = container.get('PlayerSession');
        this.data = container.get('DataManager');
        this.audio = container.get('AudioSystem');
        this.selectedRecipeId = null;
    }

    getRecipes() {
        return this.data.getRecipes();
    }

    selectRecipe(idx) {
        this.selectedRecipeId = idx;
        const recipe = this.getRecipes()[idx];
        const ingredients = recipe.ingredients.map(ing => ({
            item: this.data.getItem(ing.id),
            required: ing.qty,
            owned: this.session.getTotalItemCount(ing.id)
        }));
        
        const canCraft = ingredients.every(ing => ing.owned >= ing.required);
        return { recipe, targetItem: this.data.getItem(recipe.targetId), ingredients, canCraft };
    }

    doCraft() {
        if (this.selectedRecipeId === null) return { success: false, msg: "레시피를 선택하세요." };
        
        const recipe = this.getRecipes()[this.selectedRecipeId];
        const canCraft = recipe.ingredients.every(ing => this.session.getTotalItemCount(ing.id) >= ing.qty);
        
        if (!canCraft) return { success: false, msg: "재료가 부족합니다." };
        
        // 가방이나 창고 중 하나라도 빈 공간이 있는지 확인
        const hasSpace = this.session.run.inventory.some(slot => slot === null) || this.session.meta.stash.some(slot => slot === null);
        if (!hasSpace) return { success: false, msg: "빈 공간이 없습니다." };

        recipe.ingredients.forEach(ing => this.session.consumeItems(ing.id, ing.qty));
        this.session.giveItem(this.data.getItem(recipe.targetId));
        this.audio.play('success');
        
        return { success: true, msg: "제작 완료!" };
    }
}