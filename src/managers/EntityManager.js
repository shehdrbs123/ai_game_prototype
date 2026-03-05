
import { Particle } from "../entities/Particle.js";

export class EntityManager {
    constructor(container) {
        this.container = container;
        this.player = null;
        this.enemies = []; this.items = []; this.interactables = [];
        this.projectiles = []; this.particles = [];
    }
    clear() { this.enemies = []; this.items = []; this.interactables = []; this.projectiles = []; this.particles = []; }
    createParticles(x, y, color, count) {
        for(let i=0; i<count; i++) this.particles.push(new Particle(x, y, color, 50));
    }
}
