/**
 * [View] 제작 메뉴의 리스트와 상세 정보를 관리합니다.
 */
export class CraftingView {
    constructor(uiManager) {
        this.ui = uiManager;
        this.window = document.getElementById('craftingWindow');
        this.listEl = document.getElementById('recipeList');
        this.details = document.getElementById('craftDetails');
        this.emptyHint = document.getElementById('craftEmpty');
        this.btnDo = document.getElementById('btnDoCraft');
        
        this.icon = document.getElementById('cIcon');
        this.name = document.getElementById('cName');
        this.desc = document.getElementById('cDesc');
        this.ingredients = document.getElementById('cIngredients');
    }

    show() { this.window.classList.remove('hidden'); }
    hide() { this.window.classList.add('hidden'); }

    renderRecipeList(recipes, onSelect) {
        this.listEl.innerHTML = '';
        recipes.forEach((recipe, idx) => {
            const item = this.ui.container.get('DataManager').getItem(recipe.targetId);
            const li = document.createElement('li');
            li.className = "recipe-item p-2 md:p-3 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:bg-gray-700 transition flex items-center gap-3";
            li.innerHTML = `<span class="text-xl md:text-2xl">${item.emoji}</span> <div><div class="text-sm md:text-base font-bold text-white">${item.name}</div></div>`;
            li.onclick = () => {
                this.listEl.querySelectorAll('.recipe-item').forEach(el => el.classList.remove('selected'));
                li.classList.add('selected');
                onSelect(idx);
            };
            this.listEl.appendChild(li);
        });
    }

    renderDetails(targetItem, ingredients, canCraft) {
        this.emptyHint.classList.add('hidden');
        this.details.classList.remove('hidden');
        this.btnDo.classList.remove('hidden');
        this.btnDo.disabled = !canCraft;

        this.icon.innerText = targetItem.emoji;
        this.name.innerText = targetItem.name;
        this.desc.innerText = targetItem.desc || '';
        
        this.ingredients.innerHTML = ingredients.map(ing => `
            <li class="flex justify-between items-center bg-gray-800 p-2 rounded border ${ing.owned >= ing.required ? 'border-green-800' : 'border-red-800'}">
                <span>${ing.item.emoji} ${ing.item.name}</span> <span class="${ing.owned >= ing.required ? 'text-green-400' : 'text-red-400'}">${ing.owned}/${ing.required}</span>
            </li>`).join('');
    }
}