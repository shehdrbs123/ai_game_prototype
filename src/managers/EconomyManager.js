export class EconomyManager {
    constructor(container) {
        this.container = container;
        this.session = container.get('PlayerSession');
    }

    sellStash() {
        let soldVal = 0, soldMat = 0;
        this.session.meta.stash.forEach((item, i) => {
            if (!item) return;
            if (item.id === 'scrap' || item.id === 'core') {
                soldMat += item.value;
                this.session.meta.stash[i] = null;
            } else if (item.type === 'valuable') {
                soldVal += item.value;
                this.session.meta.stash[i] = null;
            }
        });
        
        if (soldVal > 0 || soldMat > 0) {
            this.session.meta.valuables += soldVal;
            this.session.meta.materials += soldMat;
            return { soldVal, soldMat };
        }
        return null;
    }

    canAfford(v, m) {
        return this.session.meta.valuables >= v && this.session.meta.materials >= m;
    }
}