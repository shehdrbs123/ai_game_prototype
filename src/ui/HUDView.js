import { SlotRenderer } from "./components/SlotRenderer.js";

/**
 * [View] 상시 노출되는 체력, 마나, 퀵슬롯 HUD를 관리합니다.
 */
export class HUDView {
    constructor(uiManager) {
        this.ui = uiManager;
        this.hpBar = document.getElementById('hpBar');
        this.hpText = document.getElementById('hpText');
        this.spBar = document.getElementById('spBar');
        this.defText = document.getElementById('defText');
        this.quickHUD = document.getElementById('quickSlotHUDContainer');
        this.channelingUI = document.getElementById('channelingUI');
        this.channelBar = document.getElementById('channelBar');
    }

    updateStatus(hp, maxHp, sp, maxSp, defense) {
        this.hpBar.style.width = `${(hp / maxHp) * 100}%`;
        this.hpText.innerText = `${Math.floor(hp)}/${maxHp}`;
        this.spBar.style.width = `${(sp / maxSp) * 100}%`;
        this.defText.innerText = `DEF ${defense}`;
    }

    updateChanneling(progress) {
        if (progress > 0) {
            this.channelingUI.classList.remove('hidden');
            this.channelBar.style.width = `${((3.0 - progress) / 3.0) * 100}%`;
        } else {
            this.channelingUI.classList.add('hidden');
        }
    }

    renderQuickSlots(quickSlots) {
        this.quickHUD.innerHTML = '';
        for(let i=0; i<8; i++) {
            this.quickHUD.appendChild(SlotRenderer.create('quick', i, quickSlots[i], i+1, true, this.ui));
        }
    }
}