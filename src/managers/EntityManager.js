
import { Particle } from "../entities/Particle.js";

export class EntityManager {
    constructor(container) {
        this.container = container;
        this._player = null;
        this.enemies = []; this.items = []; this.interactables = [];
        this.projectiles = []; this.particles = [];
    }
    
    get player() { return this._player; }
    set player(val) {
        const scene = this.container.get('GameEngine').scene;
        if (this._player) {
            if (this._player.mesh) scene.remove(this._player.mesh);
            if (this._player.viewModel) scene.remove(this._player.viewModel);
        }
        this._player = val;
        if (this._player) {
            if (this._player.mesh) scene.add(this._player.mesh);
            if (this._player.viewModel) scene.add(this._player.viewModel);
        }
    }

    clear() {
        const scene = this.container.get('GameEngine').scene;
        [...this.enemies, ...this.items, ...this.interactables, ...this.projectiles, ...this.particles].forEach(e => {
            if (e.mesh) scene.remove(e.mesh);
        });
        this.enemies = []; this.items = []; this.interactables = []; this.projectiles = []; this.particles = []; 
    }
    
    createParticles(x, y, color, count) {
        for(let i=0; i<count; i++) {
            const p = new Particle(x, y, color, 50);
            this.particles.push(p);
            const scene = this.container.get('GameEngine').scene;
            if (p.mesh) scene.add(p.mesh);
        }
    }

    addEntity(list, entity) {
        list.push(entity);
        const scene = this.container.get('GameEngine').scene;
        if (entity.mesh) scene.add(entity.mesh);
    }

    removeEntity(list, index) {
        const entity = list[index];
        const scene = this.container.get('GameEngine').scene;
        if (entity && entity.mesh) scene.remove(entity.mesh);
        list.splice(index, 1);
    }
}
