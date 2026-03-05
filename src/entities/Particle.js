
export class Particle {
    constructor(x, y, color, speed) {
        this.x = x; this.y = y; let angle = Math.random() * Math.PI * 2; let s = Math.random() * speed;
        this.vx = Math.cos(angle) * s; this.vy = Math.sin(angle) * s; this.color = color; this.life = 1.0; this.size = Math.random() * 3 + 1;
    }
    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.life -= dt * 2; }
    draw(ctx) { ctx.globalAlpha = Math.max(0, this.life); ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.size, this.size); ctx.globalAlpha = 1.0; }
}
