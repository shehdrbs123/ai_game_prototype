/**
 * [View] 마을 시설 업그레이드 UI를 관리합니다.
 */
export class UpgradeView {
    constructor(uiManager) {
        this.ui = uiManager;
        this.window = document.getElementById('upgradeWindow');
        this.whLevel = document.getElementById('whLevel');
        this.wbLevel = document.getElementById('wbLevel');
        this.whCostVal = document.getElementById('whCostVal');
        this.whCostMat = document.getElementById('whCostMat');
        this.wbCostVal = document.getElementById('wbCostVal');
        this.wbCostMat = document.getElementById('wbCostMat');
        this.upgValuables = document.getElementById('upgValuables');
        this.upgMaterials = document.getElementById('upgMaterials');
    }

    show() { this.window.classList.remove('hidden'); }
    hide() { this.window.classList.add('hidden'); }
    isOpen() { return !this.window.classList.contains('hidden'); }

    render(stats, costs, currentVal, currentMat) {
        if (!this.window) return;
        if (this.whLevel) this.whLevel.innerText = stats.warehouse;
        if (this.wbLevel) this.wbLevel.innerText = stats.workbench;
        if (this.whCostVal) this.whCostVal.innerText = costs.warehouse.val;
        if (this.whCostMat) this.whCostMat.innerText = costs.warehouse.mat;
        if (this.wbCostVal) this.wbCostVal.innerText = costs.workbench.val;
        if (this.wbCostMat) this.wbCostMat.innerText = costs.workbench.mat;
        if (this.upgValuables) this.upgValuables.innerText = currentVal;
        if (this.upgMaterials) this.upgMaterials.innerText = currentMat;
    }
}