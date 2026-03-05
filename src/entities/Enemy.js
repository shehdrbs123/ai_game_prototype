
import { distance } from "../utils.js";
import { Projectile } from "./Projectile.js";
import { Interactable } from "./Interactable.js";

export class Enemy {
    constructor(x, y, isRanged, c) {
        this.c = c;
        this.x = x; this.y = y; this.isRanged = isRanged; this.radius = 14;
        this.maxHp = isRanged ? 40 : 60; this.hp = this.maxHp;
        this.speed = isRanged ? 70 : 120; this.aggroRange = 350; this.attackRange = isRanged ? 250 : 30;
        this.attackCooldown = 0; this.state = 'IDLE'; this.stepTimer = Math.random() * 0.4; 
    }
    update(dt) {
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        let p = this.c.get('EntityManager').player;
        if (!p) return;
        let dist = distance(this.x, this.y, p.x, p.y);
        this.state = dist < this.aggroRange ? 'CHASE' : 'IDLE';
        if (this.state === 'CHASE') {
            let vol = Math.max(0, 1 - (dist / 400)); 
            if (dist > this.attackRange) {
                let angle = Math.atan2(p.y - this.y, p.x - this.x);
                let moveX = Math.cos(angle) * this.speed * dt, moveY = Math.sin(angle) * this.speed * dt;
                let mm = this.c.get('MapManager');
                if (!mm.checkWall(this.x + moveX, this.y, this.radius)) this.x += moveX;
                if (!mm.checkWall(this.x, this.y + moveY, this.radius)) this.y += moveY;
                
                this.stepTimer += dt;
                if (this.stepTimer > 0.4) {
                    if (vol > 0) this.c.get('AudioSystem').play('step', vol * 0.6);
                    this.stepTimer = 0;
                }
            } else {
                this.stepTimer = 0.4;
                if (this.attackCooldown <= 0) {
                    if (this.isRanged) { 
                        this.attackCooldown = 2.0; this.c.get('AudioSystem').play('enemy_ranged', vol); 
                        this.c.get('EntityManager').projectiles.push(new Projectile(this.x, this.y, Math.atan2(p.y - this.y, p.x - this.x), 200, 15, false, this.c)); 
                    } else { 
                        this.attackCooldown = 1.0; this.c.get('AudioSystem').play('enemy_melee', vol); p.takeDamage(15); 
                    }
                }
            }
        }
    }
    takeDamage(amt) {
        this.c.get('AudioSystem').play('hit');
        this.hp -= amt; this.state = 'CHASE';
        if (this.hp <= 0 && Math.random() < 0.6) {
            const id = this.c.get('DataManager').getRandomDrop();
            if (!id) return;
            const itemData = this.c.get('DataManager').getItem(id);
            const loot = new Array(6).fill(null);
            loot[0] = { data: itemData, revealed: false, progress: 0 };
            const corpse = new Interactable(this.x, this.y, 'ENEMY_CORPSE', { items: loot, isOpened: false }, this.c);
            this.c.get('EntityManager').interactables.push(corpse);
        }
    }
    draw(ctx) {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = this.isRanged ? '#9333ea' : '#ef4444'; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
        if (this.hp < this.maxHp) { ctx.fillStyle = 'black'; ctx.fillRect(this.x - 15, this.y - 25, 30, 4); ctx.fillStyle = 'red'; ctx.fillRect(this.x - 15, this.y - 25, 30 * (this.hp / this.maxHp), 4); }
    }
}
