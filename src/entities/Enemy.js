import { distance } from "../utils.js";
import { Interactable } from "./Interactable.js";

/**
 * Enemy: 적 엔티티. 플레이어 추적 및 근접 공격을 수행합니다.
 */
export class Enemy {
    constructor(app, type = 'goblin', x = 0, y = 0) {
        this.app = app;
        this.type = type;
        this.x = x;
        this.y = y;
        this.radius = 20;
        
        this.hp = 30;
        this.maxHp = 30;
        this.atk = 5;
        this.speed = 2;
        
        // 전투 상태
        this.attackCooldown = 0;
        this.hitFlashTime = 0; // 피격 시 점멸 타이머
        
        const THREE = window.THREE;
        const geometry = new THREE.BoxGeometry(40, 40, 40);
        this.material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.set(x, 20, y);
        this.mesh.castShadow = true;
        
        const ge = this.app.get('GameEngine');
        if (ge?.scene) ge.scene.add(this.mesh);
    }

    update(deltaTime) {
        if (this.hp <= 0) return;

        // 타이머 업데이트
        if (this.attackCooldown > 0) this.attackCooldown -= deltaTime;
        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= deltaTime;
            if (this.hitFlashTime <= 0) this.material.emissive.set(0x000000); // 점멸 종료
        }

        const em = this.app.get('EntityManager');
        const mm = this.app.get('MapManager');
        const player = em.player;
        if (!player) return;

        const dist = distance(this.x, this.y, player.x, player.y);
        
        // 1. 공격 거리 체크 (근접)
        if (dist < 60 && this.attackCooldown <= 0) {
            this._performAttack(player);
        } 
        // 2. 추적 로직
        else if (dist < 600 && dist > 40) {
            const dx = (player.x - this.x) / dist;
            const dy = (player.y - this.y) / dist;
            const moveX = dx * this.speed * deltaTime * 60;
            const moveY = dy * this.speed * deltaTime * 60;

            if (!mm.checkWall(this.x + moveX, this.y, this.radius)) this.x += moveX;
            if (!mm.checkWall(this.x, this.y + moveY, this.radius)) this.y += moveY;
            
            if (this.mesh) {
                this.mesh.position.set(this.x, 20, this.y);
                this.mesh.rotation.y = Math.atan2(dx, dy);
            }
        }
    }

    /**
     * 플레이어에게 데미지를 입힙니다.
     * @private
     */
    _performAttack(player) {
        console.log(`Enemy ${this.type} attacks player!`);
        player.takeDamage(this.atk);
        this.attackCooldown = 1.5; // 공격 쿨타임
        
        // 시각적 피드백 (플레이어 방향으로 살짝 점프 등 추가 가능)
        const audio = this.app.get('AudioSystem');
        if (audio) audio.play('sword', 0.5); 
    }

    /**
     * 피격 처리
     */
    takeDamage(amount) {
        this.hp -= amount;
        
        // 시각적 피드백: 하얗게 점멸
        this.material.emissive.set(0xffffff);
        this.hitFlashTime = 0.1;
        
        // 사운드 피드백
        const audio = this.app.get('AudioSystem');
        if (audio) audio.play('hit', 0.7);

        if (this.hp <= 0) this.die();
    }

    die() {
        const ge = this.app.get('GameEngine');
        const em = this.app.get('EntityManager');
        const dm = this.app.get('DataManager');

        if (ge?.scene && this.mesh) ge.scene.remove(this.mesh);
        
        const dropId = dm.getRandomDrop();
        const dropItem = dm.getItem(dropId);
        
        if (dropItem) {
            const corpseItems = new Array(6).fill(null);
            corpseItems[0] = { data: dropItem, revealed: false, progress: 0 };
            const corpse = new Interactable(this.x, this.y, 'ENEMY_CORPSE', { items: corpseItems, isOpened: false }, this.app);
            em.addEntity(em.interactables, corpse);
        }
    }
}
