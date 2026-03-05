
import { distance } from "../utils.js";

export class Projectile {
    constructor(x, y, angle, speed, damage, isPlayerOwned, c) {
        this.c = c; this.x = x; this.y = y; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.damage = damage; this.isPlayerOwned = isPlayerOwned; this.radius = 4; this.life = 2.0;
    }
    update(dt) {
        this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt;
        if (this.c.get('MapManager').checkWall(this.x, this.y, this.radius)) this.life = 0;
        let em = this.c.get('EntityManager');
        if (!this.isPlayerOwned) { if (distance(this.x, this.y, em.player.x, em.player.y) < em.player.radius + this.radius) { em.player.takeDamage(this.damage); this.life = 0; } } 
        else { em.enemies.forEach(e => { if (distance(this.x, this.y, e.x, e.y) < e.radius + this.radius) { e.takeDamage(this.damage); em.createParticles(e.x, e.y, '#f00', 5); this.life = 0; } }); }
    }
    draw(ctx) { ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = '#ff0'; ctx.fill(); }
}
