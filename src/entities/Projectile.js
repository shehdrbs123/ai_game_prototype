
import { distance } from "../utils.js";

export class Projectile {
    constructor(x, y, angle, speed, damage, isPlayerOwned, c) {
        this.c = c; this.x = x; this.y = y; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.damage = damage; this.isPlayerOwned = isPlayerOwned; this.radius = 4; this.life = 2.0;
        
        this.init3D();
    }

    init3D() {
        this.mesh = new THREE.Group();
        
        const geo = new THREE.SphereGeometry(this.radius, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: this.isPlayerOwned ? 0xffff00 : 0x9333ea });
        const sphere = new THREE.Mesh(geo, mat);
        sphere.position.y = 20; // Float height
        this.mesh.add(sphere);
        
        this.mesh.position.set(this.x, 0, this.y);
    }

    update(dt) {
        this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt;
        
        if (this.mesh) {
            this.mesh.position.set(this.x, 0, this.y);
        }

        if (this.c.get('MapManager').checkWall(this.x, this.y, this.radius)) this.life = 0;
        let em = this.c.get('EntityManager');
        if (!this.isPlayerOwned) { if (distance(this.x, this.y, em.player.x, em.player.y) < em.player.radius + this.radius) { em.player.takeDamage(this.damage); this.life = 0; } } 
        else { em.enemies.forEach(e => { if (distance(this.x, this.y, e.x, e.y) < e.radius + this.radius) { e.takeDamage(this.damage); em.createParticles(e.x, e.y, '#f00', 5); this.life = 0; } }); }
    }
    draw(ctx) {
        // No-op for 3D
    }
}
