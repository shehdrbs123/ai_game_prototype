
import { distance } from "../utils.js";
import { Projectile } from "./Projectile.js";
import { Interactable } from "./Interactable.js";
import { Animator } from "../core/Animator.js";
import { createEnemyAnimatorController } from "../data/animatorData.js";

export class Enemy {
    constructor(x, y, isRanged, c) {
        this.c = c;
        this.x = x; this.y = y; this.isRanged = isRanged; this.radius = 14;
        this.maxHp = isRanged ? 40 : 60; this.hp = this.maxHp;
        this.speed = isRanged ? 70 : 120; this.aggroRange = 350; this.attackRange = isRanged ? 250 : 30;
        this.attackCooldown = 0; this.state = 'IDLE'; this.stepTimer = Math.random() * 0.4; 
        
        // Animator Setup
        this.animator = new Animator(createEnemyAnimatorController());

        // 3D Mesh Setup
        this.init3D();
    }

    init3D() {
        this.mesh = new THREE.Group();
        
        const bodyGeo = new THREE.BoxGeometry(this.radius * 2, this.radius * 2, this.radius * 2);
        const bodyMat = new THREE.MeshLambertMaterial({ color: this.isRanged ? 0x9333ea : 0xef4444 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = this.radius;
        this.bodyMesh.castShadow = true;
        this.bodyMesh.receiveShadow = true;
        this.mesh.add(this.bodyMesh);

        this.mesh.position.set(this.x, 0, this.y);
    }

    update(dt) {
        if (this.attackCooldown > 0) this.attackCooldown -= dt;
        let p = this.c.get('EntityManager').player;
        if (!p) return;
        let dist = distance(this.x, this.y, p.x, p.y);
        this.state = dist < this.aggroRange ? 'CHASE' : 'IDLE';
        
        let currentSpeed = 0;
        if (this.state === 'CHASE') {
            let vol = Math.max(0, 1 - (dist / 400)); 
            if (dist > this.attackRange) {
                currentSpeed = 1.0;
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
                currentSpeed = 0;
                this.stepTimer = 0.4;
                if (this.attackCooldown <= 0) {
                    this.animator.setTrigger('isAttacking');
                    if (this.isRanged) { 
                        this.attackCooldown = 2.0; this.c.get('AudioSystem').play('enemy_ranged', vol); 
                        const em = this.c.get('EntityManager');
                        em.addEntity(em.projectiles, new Projectile(this.x, this.y, Math.atan2(p.y - this.y, p.x - this.x), 200, 15, false, this.c)); 
                    } else { 
                        this.attackCooldown = 1.0; this.c.get('AudioSystem').play('enemy_melee', vol); p.takeDamage(15); 
                    }
                }
            }
        } else {
            currentSpeed = 0;
        }

        this.animator.setFloat('speed', currentSpeed);
        this.animator.update(dt);

        // Sync 3D Mesh
        if (this.mesh) {
            this.mesh.position.set(this.x, 0, this.y);
            
            // Look at player
            const angle = Math.atan2(p.x - this.x, p.y - this.y);
            this.mesh.rotation.y = angle;

            // Procedural Animation
            let currentState = this.animator.currentState.name;
            if (currentState === 'Move') {
                this.bodyMesh.position.y = this.radius + Math.abs(Math.sin(this.animator.timeInState * 10)) * 5;
            } else if (currentState === 'Attack') {
                this.bodyMesh.scale.set(1.2, 1.2, 1.2);
            } else {
                this.bodyMesh.position.y = this.radius;
                this.bodyMesh.scale.set(1, 1, 1);
            }
        }
    }
    takeDamage(amt) {
        this.c.get('AudioSystem').play('hit');
        this.hp -= amt; this.state = 'CHASE';
        if (this.hp <= 0) {
            this.animator.setBool('isDead', true);
            if (Math.random() < 0.6) {
                const id = this.c.get('DataManager').getRandomDrop();
                if (!id) return;
                const itemData = this.c.get('DataManager').getItem(id);
                const loot = new Array(6).fill(null);
                loot[0] = { data: itemData, revealed: false, progress: 0 };
                const corpse = new Interactable(this.x, this.y, 'ENEMY_CORPSE', { items: loot, isOpened: false }, this.c);
                const em = this.c.get('EntityManager');
                em.addEntity(em.interactables, corpse);
            }
        }
    }
    draw(ctx) {
        let currentState = this.animator.currentState.name;
        let visualScale = 1.0;
        let visualY = this.y;

        if (currentState === 'Attack') {
            // Squish and stretch during attack
            visualScale = 1.2;
        } else if (currentState === 'Move') {
            visualY -= Math.abs(Math.sin(this.animator.timeInState * 10)) * 3;
        }

        ctx.save();
        ctx.translate(this.x, visualY);
        ctx.scale(visualScale, visualScale);

        ctx.beginPath(); 
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2); 
        ctx.fillStyle = this.isRanged ? '#9333ea' : '#ef4444'; 
        ctx.fill(); 
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
        
        ctx.restore();

        if (this.hp < this.maxHp) { 
            ctx.fillStyle = 'black'; ctx.fillRect(this.x - 15, this.y - 25, 30, 4); 
            ctx.fillStyle = 'red'; ctx.fillRect(this.x - 15, this.y - 25, 30 * (this.hp / this.maxHp), 4); 
        }
    }
}
