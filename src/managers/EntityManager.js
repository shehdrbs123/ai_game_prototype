import { BaseManager } from '../core/BaseManager.js';

/**
 * EntityManager: 모든 엔티티의 생명주기를 관리하고 3D 씬과 동기화합니다.
 */
export class EntityManager extends BaseManager {
    constructor(app) {
        super(app);
        this._player = null;
        this.enemies = [];
        this.items = [];
        this.interactables = [];
        this.projectiles = [];
        this.particles = [];
    }

    get player() { return this._player; }
    set player(val) {
        const ge = this.get('GameEngine');
        if (this._player && ge?.scene) ge.scene.remove(this._player.mesh);
        this._player = val;
        if (this._player && ge?.scene) ge.scene.add(this._player.mesh);
    }

    clear() {
        const ge = this.get('GameEngine');
        const all = [...this.enemies, ...this.items, ...this.interactables, ...this.projectiles, ...this.particles];
        if (ge?.scene) all.forEach(e => { if (e.mesh) ge.scene.remove(e.mesh); });
        this.enemies = []; this.items = []; this.interactables = []; this.projectiles = []; this.particles = [];
    }

    addEntity(list, entity) {
        list.push(entity);
        const ge = this.get('GameEngine');
        if (ge?.scene && entity.mesh) ge.scene.add(entity.mesh);
    }

    removeEntity(list, index) {
        const entity = list[index];
        const ge = this.get('GameEngine');
        if (ge?.scene && entity?.mesh) ge.scene.remove(entity.mesh);
        list.splice(index, 1);
    }

    update(deltaTime) {
        if (this._player) this._player.update(deltaTime);

        this.enemies.forEach((e, i) => e.update(deltaTime));
        
        // [BUG FIX] 상호작용 객체 업데이트 (애니메이션 등)
        this.interactables.forEach(obj => {
            if (typeof obj.update === 'function') obj.update(deltaTime);
        });

        // 파티클 등 기타 업데이트...
    }

    createParticles(x, y, color, count) {
        // 파티클 생성 로직 (필요시 구현)
    }
}
