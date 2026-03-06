
import { GAME_STATE } from "../data/gameData.js";
import { Projectile } from "./Projectile.js";
import { distance } from '../utils.js';
import { Animator } from "../core/Animator.js";
import { createPlayerAnimatorController } from "../data/animatorData.js";

export class Player {
    constructor(x, y, c) {
        this.c = c;
        this.x = x; this.y = y; this.radius = 16; this.speed = 200;
        let session = c.get('PlayerSession');
        this.baseMaxHp = session.getMaxHp(); this.hp = this.baseMaxHp;
        this.baseMaxSp = session.getMaxSp(); this.sp = this.baseMaxSp;
        this.dashSpeed = 600; this.dashTime = 0; this.dashDir = {x:0, y:0}; this.dashCooldown = 0;
        this.attackCooldown = 0; this.weaponCooldownMax = 0.5; this.isAttacking = false; this.attackAngle = 0; this.invulnerable = 0;
        this.channeling = 0; this.channelTarget = null; this.lastFacingAngle = 0; this.stepTimer = 0; 
        
        // Animator Setup
        this.animator = new Animator(createPlayerAnimatorController());

        // 3D Mesh Setup
        this.init3D();
    }

    init3D() {
        this.mesh = new THREE.Group();
        
        // Body (Capsule-like) - Hidden in 1st person
        const bodyGeo = new THREE.CapsuleGeometry(this.radius, this.radius, 4, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = this.radius;
        this.bodyMesh.castShadow = true;
        this.mesh.add(this.bodyMesh);

        // View Model (Weapon held in front)
        this.viewModel = new THREE.Group();
        this.mesh.add(this.viewModel);
        
        this.refreshWeaponModel();
        
        this.mesh.position.set(this.x, 0, this.y);
    }

    refreshWeaponModel() {
        while(this.viewModel.children.length > 0) this.viewModel.remove(this.viewModel.children[0]);
        const weapon = this.c.get('PlayerSession').run.equipment.weapon;
        const wId = weapon ? weapon.id : 'unarmed';

        if (wId === 'spear') {
            const handleGeo = new THREE.CylinderGeometry(1.5, 1.5, 100, 8);
            const handleMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
            const handle = new THREE.Mesh(handleGeo, handleMat);
            handle.rotation.x = Math.PI / 2;
            handle.position.set(15, -10, -30);
            
            const tipGeo = new THREE.ConeGeometry(4, 20, 8);
            const tipMat = new THREE.MeshPhongMaterial({ color: 0xcccccc, emissive: 0x222222 });
            const tip = new THREE.Mesh(tipGeo, tipMat);
            tip.rotation.x = -Math.PI / 2;
            tip.position.set(0, 50, 0); // At the end of cylinder
            handle.add(tip);
            this.viewModel.add(handle);
        } else if (wId === 'sword') {
            const bladeGeo = new THREE.BoxGeometry(4, 60, 2);
            const bladeMat = new THREE.MeshPhongMaterial({ color: 0xdddddd });
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.position.set(20, -10, -30);
            blade.rotation.x = -Math.PI / 4;
            this.viewModel.add(blade);
        }
    }

    update(dt) {
        if (this.dashTime > 0) this.dashTime -= dt; if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt; if (this.invulnerable > 0) this.invulnerable -= dt;
        if (this.dashTime <= 0 && this.sp < this.baseMaxSp) this.sp = Math.min(this.baseMaxSp, this.sp + 20 * dt);
        
        let ge = this.c.get('GameEngine');
        if (ge.currentState === GAME_STATE.TOWN && this.hp < this.baseMaxHp) this.hp = Math.min(this.baseMaxHp, this.hp + 5 * dt);

        let input = this.c.get('InputManager');
        let dx = 0, dy = 0;

        if (this.channeling <= 0) {
            const moveX = (input.keys['KeyD'] ? 1 : 0) - (input.keys['KeyA'] ? 1 : 0);
            const moveZ = (input.keys['KeyS'] ? 1 : 0) - (input.keys['KeyW'] ? 1 : 0);
            const yaw = ge.yaw;
            dx = moveX * Math.cos(yaw) + moveZ * Math.sin(yaw);
            dy = moveX * -Math.sin(yaw) + moveZ * Math.cos(yaw);
        }

        if (this.channeling > 0 && (dx !== 0 || dy !== 0 || input.mouse.leftDown || input.isMobileAttacking)) this.cancelChannel();
        
        let currentSpeed = 0;
        if (dx !== 0 || dy !== 0) { 
            let len = Math.sqrt(dx*dx + dy*dy); dx /= len; dy /= len; 
            currentSpeed = 1.0;
            if (this.dashTime <= 0) {
                this.stepTimer += dt;
                if (this.stepTimer >= 0.35) { this.c.get('AudioSystem').play('step'); this.stepTimer = 0; }
            }
        } else {
            this.stepTimer = 0.35; currentSpeed = 0;
        }

        this.animator.setFloat('speed', currentSpeed);
        this.animator.setBool('isDashing', this.dashTime > 0);
        this.animator.setBool('isHurt', this.invulnerable > 0);
        this.animator.update(dt);

        if (input.keys['Space'] && this.dashCooldown <= 0 && this.sp >= 30 && this.channeling <= 0) {
            if (dx === 0 && dy === 0) { dx = Math.sin(ge.yaw); dy = Math.cos(ge.yaw); }
            this.dashTime = 0.2; this.dashCooldown = 1.0; this.sp -= 30; this.dashDir = {x: dx, y: dy}; this.invulnerable = 0.2;
            this.c.get('AudioSystem').play('dash'); this.c.get('EntityManager').createParticles(this.x, this.y, '#fff', 5);
        }

        let actualMoveX = this.dashTime > 0 ? this.dashDir.x * this.dashSpeed * dt : dx * this.speed * dt;
        let actualMoveY = this.dashTime > 0 ? this.dashDir.y * this.dashSpeed * dt : dy * this.speed * dt;

        let mm = this.c.get('MapManager');
        if (!mm.checkWall(this.x + actualMoveX, this.y, this.radius)) this.x += actualMoveX;
        if (!mm.checkWall(this.x, this.y + actualMoveY, this.radius)) this.y += actualMoveY;

        // Sync 3D Mesh & View Model
        if (this.mesh) {
            this.mesh.position.set(this.x, 0, this.y);
            this.viewModel.rotation.set(ge.pitch, ge.yaw, 0, 'YXZ');
            this.viewModel.position.set(this.x, 30, this.y); // At camera height

            // View Model Bobbing
            if (currentSpeed > 0 && this.dashTime <= 0) {
                const bob = Math.sin(Date.now() * 0.01);
                this.viewModel.translateY(bob * 0.5);
                this.viewModel.translateX(Math.cos(Date.now() * 0.005) * 0.5);
            }

            // Attack Animation (Thrust)
            if (this.isAttacking) {
                const attackProgress = 1 - (this.attackCooldown / this.weaponCooldownMax);
                const thrust = Math.sin(attackProgress * Math.PI) * 40;
                this.viewModel.translateZ(-thrust);
            }
        }

        let ui = this.c.get('UIManager');
        if ((input.mouse.leftDown || input.isMobileAttacking) && this.attackCooldown <= 0 && this.channeling <= 0 && !ui.isAnyUIOpen()) {
            this.isAttacking = true; 
            this.animator.setTrigger('isAttacking');
            const weapon = this.c.get('PlayerSession').run.equipment.weapon;
            let wId = weapon ? weapon.id : 'unarmed';
            this.c.get('AudioSystem').play(wId === 'unarmed' ? 'sword' : wId);
            this.attackAngle = -ge.yaw - Math.PI/2; 

            let em = this.c.get('EntityManager');
            if (wId === 'bow') {
                this.attackCooldown = 0.8; this.weaponCooldownMax = 0.8;
                setTimeout(() => this.isAttacking = false, 150);
                em.addEntity(em.projectiles, new Projectile(this.x, this.y, this.attackAngle, 500, 25, true, this.c));
            } else {
                let attackRange = 40, hitArc = Math.PI / 2, dmg = 15;
                if (wId === 'sword') { this.attackCooldown = 0.6; this.weaponCooldownMax = 0.6; attackRange = 70; hitArc = Math.PI / 1.5; dmg = 35; }
                else if (wId === 'spear') { this.attackCooldown = 0.7; this.weaponCooldownMax = 0.7; attackRange = 110; hitArc = Math.PI / 6; dmg = 30; }
                else { this.attackCooldown = 0.5; this.weaponCooldownMax = 0.5; }

                setTimeout(() => this.isAttacking = false, 300);
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
        if (this.hp <= 0) { this.animator.setBool('isDead', true); this.c.get('GameEngine').endRun(false); }
    }
    heal(amt) { this.hp = Math.min(this.baseMaxHp, this.hp + amt); this.c.get('EntityManager').createParticles(this.x, this.y, '#0f0', 10); }
    cancelChannel() { if (this.channeling > 0) { this.channeling = 0; this.channelTarget = null; document.getElementById('channelingUI').classList.add('hidden'); } }
    draw(ctx) { /* No-op for 3D */ }
}
