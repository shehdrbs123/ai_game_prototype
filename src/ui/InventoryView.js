import { SlotRenderer } from "./components/SlotRenderer.js";

/**
 * [View] 인벤토리 UI의 렌더링만 담당합니다.
 */
export class InventoryView {
    constructor(uiManager) {
        this.ui = uiManager;
        this.window = document.getElementById('inventoryWindow');
        this.grid = document.getElementById('invGrid');
        this.quickGrid = document.getElementById('quickSlotGrid');
        this.stashGrid = document.getElementById('stashGrid');
        this.lootGrid = document.getElementById('lootGrid');
        this.equipGrid = document.getElementById('equipGrid');
        this.title = document.getElementById('invWindowTitle');
        this.hint = document.getElementById('dropOutsideHint');
        this.stashSection = document.getElementById('stashSection');
        this.lootSection = document.getElementById('lootSection');
    }

    show() { this.window.classList.remove('hidden'); }
    hide() { this.window.classList.add('hidden'); }

    setMode(mode) {
        this.stashSection.classList.add('hidden');
        this.lootSection.classList.add('hidden');
        this.hint.classList.remove('hidden');

        if (mode === 'stash') {
            this.title.innerText = "창고 및 장비 관리";
            this.stashSection.classList.remove('hidden');
            this.hint.innerHTML = "창 바깥으로 드래그하면 <strong>영구히 파기</strong>됩니다.";
        } else if (mode === 'loot') {
            this.title.innerText = "상자 탐색 중";
            this.lootSection.classList.remove('hidden');
            this.hint.classList.add('hidden');
        } else {
            this.title.innerText = "내 소지품";
            this.hint.innerHTML = "창 바깥으로 드래그하면 바닥에 버립니다.";
        }
    }

    renderInventory(invData, quickData, maxSlots) {
        this.grid.innerHTML = '';
        for(let i=0; i<maxSlots; i++) this.grid.appendChild(SlotRenderer.create('inv', i, invData[i], null, false, this.ui));
        
        this.quickGrid.innerHTML = '';
        for(let i=0; i<8; i++) this.quickGrid.appendChild(SlotRenderer.create('quick', i, quickData[i], i+1, false, this.ui));
    }

    renderEquip(equipment) {
        this.equipGrid.innerHTML = '';
        const sNames = { head: '머리', chest: '가슴', legs: '하의', boots: '신발', weapon: '무기' };
        ['head', 'chest', 'legs', 'boots', 'weapon'].forEach(k => 
            this.equipGrid.appendChild(SlotRenderer.create('equip', k, equipment[k], sNames[k], false, this.ui))
        );
    }

    renderStash(stashData) {
        if (this.stashSection.classList.contains('hidden')) return;
        this.stashGrid.innerHTML = '';
        stashData.forEach((item, i) => this.stashGrid.appendChild(SlotRenderer.create('stash', i, item, null, false, this.ui)));
    }

    renderLoot(lootItems) {
        this.lootGrid.innerHTML = '';
        if (this.lootSection.classList.contains('hidden')) return;
        
        // lootItems가 없더라도 빈 슬롯 6개를 기본으로 생성하여 UI 구조 유지
        for(let i=0; i<6; i++) {
            const slotData = lootItems ? lootItems[i] : null;
            this.lootGrid.appendChild(SlotRenderer.create('container', i, slotData, null, false, this.ui));
        }
    }
}
