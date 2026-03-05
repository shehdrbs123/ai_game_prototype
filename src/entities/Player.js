
import { GAME_STATE } from "../data/gameData.js";
import { Projectile } from "./Projectile.js";
import { distance } from '../utils.js';

export class Player {
    constructor(x, y, c) {
        this.c = c;
        this.x = x; this.y = y; this.radius = 16; this.speed = 200;
        let session = c.get('PlayerSession');
        this.baseMaxHp = session.getMaxHp(); this.hp = this.baseMaxHp;
        this.baseMaxSp = session.getMaxSp(); this.sp = this.baseMaxSp;
        this.dashSpeed = 600; this.dashTime = 0; this.dashDir = {x:0, y:0}; this.dashCooldown = 0;
        this.attackCooldown = 0; this.isAttacking = false; this.attackAngle = 0; this.invulnerable = 0;
        this.channeling = 0; this.channelTarget = null; this.lastFacingAngle = 0; this.stepTimer = 0; 
    }
    update(dt) {
        if (this.dashTime > 0) this.dashTime -= dt; if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt; if (this.invulnerable > 0) this.invulnerable -= dt;
        if (this.dashTime <= 0 && this.sp < this.baseMaxSp) this.sp = Math.min(this.baseMaxSp, this.sp + 20 * dt);
        
        let ge = this.c.get('GameEngine');
        if (ge.currentState === GAME_STATE.TOWN && this.hp < this.baseMaxHp) this.hp = Math.min(this.baseMaxHp, this.hp + 5 * dt);

        let input = this.c.get('InputManager');
        let dx = input.moveJx !== 0 ? input.moveJx : 0; 
        let dy = input.moveJy !== 0 ? input.moveJy : 0;

        if (this.channeling <= 0) {
            if (input.keys['KeyW']) dy -= 1; if (input.keys['KeyS']) dy += 1;
            if (input.keys['KeyA']) dx -= 1; if (input.keys['KeyD']) dx += 1;
        }

        if (this.channeling > 0 && (dx !== 0 || dy !== 0 || input.mouse.leftDown || input.isMobileAttacking)) this.cancelChannel();
        if (dx !== 0 || dy !== 0) { 
            let len = Math.sqrt(dx*dx + dy*dy); dx /= len; dy /= len; 
            if (this.dashTime <= 0) {
                this.stepTimer += dt;
                if (this.stepTimer >= 0.35) { this.c.get('AudioSystem').play('step'); this.stepTimer = 0; }
            }
        } else this.stepTimer = 0.35; 

        if (input.isAiming && (input.aimJx !== 0 || input.aimJy !== 0)) { this.lastFacingAngle = Math.atan2(input.aimJy, input.aimJx); }

        if (input.keys['Space'] && this.dashCooldown <= 0 && this.sp >= 30 && this.channeling <= 0) {
            if (dx === 0 && dy === 0) { dx = Math.cos(this.lastFacingAngle); dy = Math.sin(this.lastFacingAngle); }
            this.dashTime = 0.2; this.dashCooldown = 1.0; this.sp -= 30; this.dashDir = {x: dx, y: dy}; this.invulnerable = 0.2;
            this.c.get('AudioSystem').play('dash'); this.c.get('EntityManager').createParticles(this.x, this.y, '#fff', 5);
        }

        let moveX = this.dashTime > 0 ? this.dashDir.x * this.dashSpeed * dt : dx * this.speed * dt;
        let moveY = this.dashTime > 0 ? this.dashDir.y * this.dashSpeed * dt : dy * this.speed * dt;

        let mm = this.c.get('MapManager');
        if (!mm.checkWall(this.x + moveX, this.y, this.radius)) this.x += moveX;
        if (!mm.checkWall(this.x, this.y + moveY, this.radius)) this.y += moveY;

        let ui = this.c.get('UIManager');
        if ((input.mouse.leftDown || input.isMobileAttacking) && this.attackCooldown <= 0 && this.channeling <= 0 && !ui.isAnyUIOpen()) {
            this.isAttacking = true; 
            let wId = this.c.get('PlayerSession').run.equipment.weapon ? this.c.get('PlayerSession').run.equipment.weapon.id : 'unarmed';
            
            this.c.get('AudioSystem').play(wId === 'unarmed' ? 'sword' : wId);
            if (input.isTouchDevice) this.attackAngle = this.lastFacingAngle; 
            else this.attackAngle = Math.atan2(input.mouse.worldY - this.y, input.mouse.worldX - this.x);

            let em = this.c.get('EntityManager');
            if (wId === 'bow') {
                this.attackCooldown = 0.8; setTimeout(() => this.isAttacking = false, 150);
                em.projectiles.push(new Projectile(this.x, this.y, this.attackAngle, 500, 25, true, this.c));
            } else {
                let attackRange = 40, hitArc = Math.PI / 2, dmg = 15;
                if (wId === 'sword') { this.attackCooldown = 0.6; attackRange = 70; hitArc = Math.PI / 1.5; dmg = 35; }
                else if (wId === 'spear') { this.attackCooldown = 0.7; attackRange = 110; hitArc = Math.PI / 6; dmg = 30; }
                else { this.attackCooldown = 0.5; }

                setTimeout(() => this.isAttacking = false, 150);
                em.enemies.forEach(e => {
                    if (distance(this.x, this.y, e.x, e.y) < attackRange) {
                        let angleDiff = Math.abs(Math.atan2(e.y - this.y, e.x - this.x) - this.attackAngle);
                        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                        if (angleDiff < hitArc / 2) { e.takeDamage(dmg); em.createParticles(e.x, e.y, '#f00', 5); }
                    }
                });
            }
        }
    }
    takeDamage(amt) {
        if (this.invulnerable > 0 || this.c.get('GameEngine').currentState !== GAME_STATE.PLAYING) return;
        this.c.get('AudioSystem').play('hit');
        this.hp -= Math.max(1, amt - this.c.get('PlayerSession').getDefense()); this.invulnerable = 0.5; this.cancelChannel();
        this.c.get('EntityManager').createParticles(this.x, this.y, '#f00', 10); 
        if (this.hp <= 0) this.c.get('GameEngine').endRun(false);
    }
    heal(amt) { this.hp = Math.min(this.baseMaxHp, this.hp + amt); this.c.get('EntityManager').createParticles(this.x, this.y, '#0f0', 10); }
    cancelChannel() { if (this.channeling > 0) { this.channeling = 0; this.channelTarget = null; document.getElementById('channelingUI').classList.add('hidden'); } }
    draw(ctx) {
        if (this.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;
        let input = this.c.get('InputManager');
        let aimAngle = input.isTouchDevice ? this.lastFacingAngle : Math.atan2(input.mouse.worldY - this.y, input.mouse.worldX - this.x); 
        if (this.isAttacking) {
            let wId = this.c.get('PlayerSession').run.equipment.weapon ? this.c.get('PlayerSession').run.equipment.weapon.id : 'unarmed';
            ctx.beginPath();
            if (wId === 'spear') { ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + Math.cos(this.attackAngle) * 110, this.y + Math.sin(this.attackAngle) * 110); ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; ctx.lineWidth = 4; ctx.stroke(); } 
            else if (wId !== 'bow') { let r = wId === 'sword' ? 70 : 40, arc = wId === 'sword' ? Math.PI/1.5 : Math.PI/2; ctx.arc(this.x, this.y, r, this.attackAngle - arc/2, this.attackAngle + arc/2); ctx.lineTo(this.x, this.y); ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.fill(); }
        }
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fillStyle = '#3b82f6'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + Math.cos(aimAngle) * this.radius * 1.5, this.y + Math.sin(aimAngle) * this.radius * 1.5); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    }
}
