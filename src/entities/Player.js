import { GAME_STATE } from "../data/gameState.js";
import { Projectile } from "./Projectile.js";
import { distance } from '../utils.js';
import { Animator } from "../core/Animator.js";
import { createPlayerAnimatorController } from "../data/animatorData.js";

/**
 * Player: 플레이어 캐릭터 엔티티. 1인칭 시점 제어 및 전투 로직을 담당합니다.
 */
export class Player {
    constructor(x, y, app) {
        this.app = app;
        this.x = x; 
        this.y = y; 
        this.radius = 16; 
        this.speed = 250; 

        const session = this.app.get('PlayerSession');
        this.baseMaxHp = session.getMaxHp(); 
        this.hp = this.baseMaxHp;
        this.baseMaxSp = session.getMaxSp(); 
        this.sp = this.baseMaxSp;
        
        this.dashSpeed = 800; 
        this.dashTime = 0; 
        this.dashDir = {x: 0, y: 0}; 
        this.dashCooldown = 0;
        
        this.attackCooldown = 0; 
        this.isAttacking = false; 
        this.invulnerable = 0;
        this.hitFlashTime = 0; // 피격 점멸
        this.channeling = 0; 
        this.channelTarget = null; 
        
        this.animator = new Animator(createPlayerAnimatorController());
        this.init3D();
    }

    init3D() {
        const THREE = window.THREE;
        if (!THREE) return;
        this.mesh = new THREE.Group();
        
        const bodyGeo = new THREE.CapsuleGeometry(this.radius, this.radius, 4, 8);
        this.bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMaterial);
        this.bodyMesh.position.y = this.radius;
        this.mesh.add(this.bodyMesh);

        this.viewModel = new THREE.Group();
        this.mesh.add(this.viewModel);
        this.refreshWeaponModel();
        
        this.mesh.position.set(this.x, 0, this.y);
    }

    refreshWeaponModel() {
        const THREE = window.THREE;
        if (!THREE || !this.viewModel) return;
        while(this.viewModel.children.length > 0) this.viewModel.remove(this.viewModel.children[0]);
        
        const weapon = this.app.get('PlayerSession').run.equipment.weapon;
        const wId = weapon ? weapon.id : 'unarmed';
        
        // 무기 메쉬 생성 시 머티리얼 참조 보관 (점멸용)
        this.weaponMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd });
        
        if (wId === 'spear') {
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 100, 8), this.weaponMaterial);
            handle.rotation.x = Math.PI / 2;
            handle.position.set(15, -10, -30);
            this.viewModel.add(handle);
        } else {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(4, 60, 2), this.weaponMaterial);
            blade.position.set(20, -10, -30);
            blade.rotation.x = -Math.PI / 4;
            this.viewModel.add(blade);
        }
    }

    update(dt) {
        if (this.dashTime > 0) this.dashTime -= dt; 
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt; 
        if (this.invulnerable > 0) this.invulnerable -= dt;
        
        // 피격 점멸 업데이트
        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= dt;
            if (this.hitFlashTime <= 0) {
                if (this.bodyMaterial) this.bodyMaterial.emissive.set(0x000000);
                if (this.weaponMaterial) this.weaponMaterial.emissive.set(0x000000);
            }
        }

        if (this.dashTime <= 0 && this.sp < this.baseMaxSp) this.sp = Math.min(this.baseMaxSp, this.sp + 25 * dt);
        
        const ge = this.app.get('GameEngine');
        const input = this.app.get('InputManager');
        const mm = this.app.get('MapManager');
        const audio = this.app.get('AudioSystem');

        if (ge.currentState === GAME_STATE.TOWN && this.hp < this.baseMaxHp) this.hp = Math.min(this.baseMaxHp, this.hp + 10 * dt);

        let moveVec = { x: 0, y: 0 };
        if (this.channeling <= 0 && this.dashTime <= 0) {
            const forward = (input.isKeyPressed('KeyW') ? 1 : 0) - (input.isKeyPressed('KeyS') ? 1 : 0);
            const right = (input.isKeyPressed('KeyD') ? 1 : 0) - (input.isKeyPressed('KeyA') ? 1 : 0);
            if (forward !== 0 || right !== 0) {
                const yaw = ge.yaw || 0;
                moveVec.x = right * Math.cos(yaw) - forward * Math.sin(yaw);
                moveVec.y = right * -Math.sin(yaw) - forward * Math.cos(yaw);
                const len = Math.sqrt(moveVec.x * moveVec.x + moveVec.y * moveVec.y);
                moveVec.x /= len; moveVec.y /= len;
            }
        }

        let actualMove = { x: 0, y: 0 };
        if (this.dashTime > 0) {
            actualMove.x = this.dashDir.x * this.dashSpeed * dt;
            actualMove.y = this.dashDir.y * this.dashSpeed * dt;
        } else {
            actualMove.x = moveVec.x * this.speed * dt;
            actualMove.y = moveVec.y * this.speed * dt;
        }

        if (actualMove.x !== 0 || actualMove.y !== 0) {
            if (!mm.checkWall(this.x + actualMove.x, this.y, this.radius)) this.x += actualMove.x;
            if (!mm.checkWall(this.x, this.y + actualMove.y, this.radius)) this.y += actualMove.y;
            this.cancelChannel();
        }

        if (this.mesh) this.mesh.position.set(this.x, 0, this.y);
        this.handleAttack(dt);
    }

    handleAttack(dt) {
        const input = this.app.get('InputManager');
        const ui = this.app.get('UIManager');
        const ge = this.app.get('GameEngine');
        const em = this.app.get('EntityManager');

        if ((input.mouse.leftDown || input.isMobileAttacking) && this.attackCooldown <= 0 && this.channeling <= 0 && !ui.isAnyUIOpen()) {
            this.isAttacking = true; 
            const session = this.app.get('PlayerSession');
            const weapon = session.run.equipment.weapon;
            const wId = weapon ? weapon.id : 'unarmed';
            
            this.attackAngle = -(ge.yaw || 0) - Math.PI/2; 
            let attackRange = 70, dmg = 20;
            
            if (wId === 'sword') { this.attackCooldown = 0.5; attackRange = 90; dmg = 40; }
            else if (wId === 'spear') { this.attackCooldown = 0.6; attackRange = 130; dmg = 35; }
            else this.attackCooldown = 0.4;

            setTimeout(() => this.isAttacking = false, 300);
            
            em.enemies.forEach(e => {
                if (distance(this.x, this.y, e.x, e.y) < attackRange) {
                    e.takeDamage(dmg);
                }
            });
        }
    }

    takeDamage(amt) {
        const ge = this.app.get('GameEngine');
        if (this.invulnerable > 0 || ge.currentState !== GAME_STATE.PLAYING) return;
        
        const session = this.app.get('PlayerSession');
        const audio = this.app.get('AudioSystem');
        if (audio) audio.play('hit', 1.0);
        
        const def = session.getDefense();
        this.hp -= Math.max(1, amt - def); 
        this.invulnerable = 0.6; 
        
        // [BUG FIX] 피격 시 시각적 효과 (점멸)
        if (this.bodyMaterial) this.bodyMaterial.emissive.set(0xff0000);
        if (this.weaponMaterial) this.weaponMaterial.emissive.set(0xff0000);
        this.hitFlashTime = 0.15;

        this.cancelChannel();
        if (this.hp <= 0) ge.endRun(false);
    }

    cancelChannel() { 
        if (this.channeling > 0) { 
            this.channeling = 0; 
            this.channelTarget = null; 
        } 
    }
}
