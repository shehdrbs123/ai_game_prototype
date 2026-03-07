import { distance } from "../utils.js";
import { Projectile } from "./Projectile.js";
import { Interactable } from "./Interactable.js";
import { Animator } from "../core/Animator.js";
import { createEnemyAnimatorController } from "../data/animatorData.js";

/**
 * Enemy: 적 캐릭터 엔티티. 플레이어 추적 및 공격을 담당합니다.
 */
export class Enemy {
    /**
     * @param {number} x 
     * @param {number} y 
     * @param {boolean} isRanged 
     * @param {DIContainer} app 
     */
    constructor(x, y, isRanged, app) {
        this.app = app;
        this.x = x; 
        this.y = y; 
        this.isRanged = isRanged; 
        this.radius = 14;
        
        // 스탯 설정
        this.maxHp = isRanged ? 40 : 60; 
        this.hp = this.maxHp;
        this.speed = isRanged ? 80 : 130; 
        this.aggroRange = 400; 
        this.attackRange = isRanged ? 250 : 40;
        this.attackCooldown = 0; 
        
        this.state = 'IDLE'; 
        this.stepTimer = Math.random() * 0.4; 
        
        // 애니메이터 설정
        this.animator = new Animator(createEnemyAnimatorController());

        // 3D 메쉬 설정
        this.init3D();
    }

    init3D() {
        const THREE = window.THREE;
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
        
        const em = this.app.get('EntityManager');
        const p = em.player;
        if (!p) return;

        const dist = distance(this.x, this.y, p.x, p.y);
        
        // 상태 전이
        if (dist < this.aggroRange) {
            this.state = 'CHASE';
        } else {
            this.state = 'IDLE';
        }
        
        let currentSpeed = 0;
        if (this.state === 'CHASE') {
            const vol = Math.max(0, 1 - (dist / 500)); 
            
            if (dist > this.attackRange) {
                // 추적
                currentSpeed = 1.0;
                const angle = Math.atan2(p.y - this.y, p.x - this.x);
                const moveX = Math.cos(angle) * this.speed * dt;
                const moveY = Math.sin(angle) * this.speed * dt;
                
                const mm = this.app.get('MapManager');
                if (!mm.checkWall(this.x + moveX, this.y, this.radius)) this.x += moveX;
                if (!mm.checkWall(this.x, this.y + moveY, this.radius)) this.y += moveY;
                
                // 발소리 (플레이어와의 거리에 비례한 볼륨)
                this.stepTimer += dt;
                if (this.stepTimer > 0.4) {
                    if (vol > 0.1) this.app.get('AudioSystem').play('step', vol * 0.4);
                    this.stepTimer = 0;
                }
            } else {
                // 공격
                currentSpeed = 0;
                if (this.attackCooldown <= 0) {
                    this.executeAttack(p, vol);
                }
            }
        }

        this.animator.setFloat('speed', currentSpeed);
        this.animator.update(dt);

        // 3D 메쉬 동기화
        if (this.mesh) {
            this.mesh.position.set(this.x, 0, this.y);
            // 플레이어 바라보기
            const lookAngle = Math.atan2(p.x - this.x, p.y - this.y);
            this.mesh.rotation.y = lookAngle;

            // 간단한 애니메이션 효과
            if (currentSpeed > 0) {
                this.bodyMesh.position.y = this.radius + Math.abs(Math.sin(Date.now() * 0.01)) * 4;
            } else {
                this.bodyMesh.position.y = this.radius;
            }
        }
    }

    executeAttack(player, vol) {
        this.animator.setTrigger('isAttacking');
        const audio = this.app.get('AudioSystem');
        const em = this.app.get('EntityManager');

        if (this.isRanged) { 
            this.attackCooldown = 2.0; 
            if (audio) audio.play('enemy_ranged', vol); 
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            em.addEntity(em.projectiles, new Projectile(this.x, this.y, angle, 250, 15, false, this.app)); 
        } else { 
            this.attackCooldown = 1.2; 
            if (audio) audio.play('hit', vol); 
            player.takeDamage(15); 
        }
    }

    takeDamage(amt) {
        const audio = this.app.get('AudioSystem');
        if (audio) audio.play('hit');
        
        this.hp -= amt; 
        this.state = 'CHASE'; // 공격받으면 즉시 추적

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.animator.setBool('isDead', true);
        const data = this.app.get('DataManager');
        const em = this.app.get('EntityManager');

        // 일정 확률로 전리품 생성
        if (Math.random() < 0.7) {
            const itemId = data.getRandomDrop();
            const itemData = data.getItem(itemId);
            
            if (itemData) {
                const loot = new Array(6).fill(null);
                loot[0] = { data: itemData, revealed: false, progress: 0 };
                
                const corpse = new Interactable(this.x, this.y, 'ENEMY_CORPSE', { items: loot, isOpened: false }, this.app);
                em.addEntity(em.interactables, corpse);
            }
        }
        
        // EntityManager.update()에서 리스트로부터 제거될 예정
    }
}
