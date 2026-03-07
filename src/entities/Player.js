import { GAME_STATE } from "../data/gameData.js";
import { Projectile } from "./Projectile.js";
import { distance } from '../utils.js';
import { Animator } from "../core/Animator.js";
import { createPlayerAnimatorController } from "../data/animatorData.js";

/**
 * Player: 플레이어 캐릭터 엔티티. 1인칭 시점 제어 및 전투 로직을 담당합니다.
 * C# Porting: Unity의 PlayerController, CharacterController 대응.
 */
export class Player {
    /**
     * @param {number} x 초기 X 좌표
     * @param {number} y 초기 Y 좌표
     * @param {DIContainer} app DI 컨테이너
     */
    constructor(x, y, app) {
        this.app = app;
        this.x = x; 
        this.y = y; 
        this.radius = 16; 
        this.speed = 250; // 이동 속도 상향 조정

        // 시스템 참조 단축 (BaseManager와 유사한 패턴)
        const session = this.app.get('PlayerSession');
        
        // 스탯 초기화
        this.baseMaxHp = session.getMaxHp(); 
        this.hp = this.baseMaxHp;
        this.baseMaxSp = session.getMaxSp(); 
        this.sp = this.baseMaxSp;
        
        // 이동 및 대시 상태
        this.dashSpeed = 800; 
        this.dashTime = 0; 
        this.dashDir = {x: 0, y: 0}; 
        this.dashCooldown = 0;
        
        // 전투 상태
        this.attackCooldown = 0; 
        this.weaponCooldownMax = 0.5; 
        this.isAttacking = false; 
        this.attackAngle = 0; 
        this.invulnerable = 0;
        this.channeling = 0; 
        this.channelTarget = null; 
        
        // 애니메이터 설정
        this.animator = new Animator(createPlayerAnimatorController());

        // 3D 메쉬 설정
        this.init3D();
    }

    /**
     * Three.js 메쉬 및 뷰 모델 초기화
     */
    init3D() {
        const THREE = window.THREE;
        this.mesh = new THREE.Group();
        
        // 실제 몸체 (1인칭에서는 보이지 않음)
        const bodyGeo = new THREE.CapsuleGeometry(this.radius, this.radius, 4, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = this.radius;
        this.bodyMesh.castShadow = true;
        this.mesh.add(this.bodyMesh);

        // 뷰 모델 (플레이어 화면에 보이는 무기/손)
        this.viewModel = new THREE.Group();
        this.mesh.add(this.viewModel);
        
        this.refreshWeaponModel();
        
        this.mesh.position.set(this.x, 0, this.y);
    }

    /**
     * 현재 장착 중인 무기에 맞춰 뷰 모델 갱신
     */
    refreshWeaponModel() {
        const THREE = window.THREE;
        while(this.viewModel.children.length > 0) {
            this.viewModel.remove(this.viewModel.children[0]);
        }
        
        const weapon = this.app.get('PlayerSession').run.equipment.weapon;
        const wId = weapon ? weapon.id : 'unarmed';

        // 간단한 절차적 무기 메쉬 생성 (임시)
        if (wId === 'spear') {
            const handleGeo = new THREE.CylinderGeometry(1.5, 1.5, 100, 8);
            const handleMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
            const handle = new THREE.Mesh(handleGeo, handleMat);
            handle.rotation.x = Math.PI / 2;
            handle.position.set(15, -10, -30);
            this.viewModel.add(handle);
        } else if (wId === 'sword' || wId === 'unarmed') {
            const bladeGeo = new THREE.BoxGeometry(4, 60, 2);
            const bladeMat = new THREE.MeshPhongMaterial({ color: 0xdddddd });
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.position.set(20, -10, -30);
            blade.rotation.x = -Math.PI / 4;
            this.viewModel.add(blade);
        }
    }

    /**
     * 프레임별 업데이트
     */
    update(dt) {
        // 타이머 업데이트
        if (this.dashTime > 0) this.dashTime -= dt; 
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.attackCooldown > 0) this.attackCooldown -= dt; 
        if (this.invulnerable > 0) this.invulnerable -= dt;
        
        // 스태미나 회복 (대시 중 아닐 때)
        if (this.dashTime <= 0 && this.sp < this.baseMaxSp) {
            this.sp = Math.min(this.baseMaxSp, this.sp + 25 * dt);
        }
        
        const ge = this.app.get('GameEngine');
        const input = this.app.get('InputManager');
        const mm = this.app.get('MapManager');
        const audio = this.app.get('AudioSystem');

        // 마을에서는 체력 서서히 회복
        if (ge.currentState === GAME_STATE.TOWN && this.hp < this.baseMaxHp) {
            this.hp = Math.min(this.baseMaxHp, this.hp + 10 * dt);
        }

        // 1. 이동 처리 (FPS 시점 기반)
        let moveVec = { x: 0, y: 0 };
        if (this.channeling <= 0 && this.dashTime <= 0) {
            const forward = (input.keys['KeyW'] ? 1 : 0) - (input.keys['KeyS'] ? 1 : 0);
            const right = (input.keys['KeyD'] ? 1 : 0) - (input.keys['KeyA'] ? 1 : 0);
            
            if (forward !== 0 || right !== 0) {
                const yaw = ge.yaw || 0;
                // 카메라 방향 기반 이동 벡터 계산 (W 입력 시 전진하도록 - 부호 적용)
                // Forward (W) -> -sin(yaw), -cos(yaw)
                // Right (D) -> cos(yaw), -sin(yaw)
                moveVec.x = right * Math.cos(yaw) - forward * Math.sin(yaw);
                moveVec.y = right * -Math.sin(yaw) - forward * Math.cos(yaw);
                
                // 벡터 정규화
                const len = Math.sqrt(moveVec.x * moveVec.x + moveVec.y * moveVec.y);
                moveVec.x /= len;
                moveVec.y /= len;
                
                // 발소리
                this.stepTimer = (this.stepTimer || 0) + dt;
                if (this.stepTimer >= 0.35) {
                    if (audio) audio.play('step', 0.5);
                    this.stepTimer = 0;
                }
            } else {
                this.stepTimer = 0.35;
            }
        }

        // 2. 대시 실행
        if (input.keys['Space'] && this.dashCooldown <= 0 && this.sp >= 30 && this.channeling <= 0) {
            const yaw = ge.yaw || 0;
            // 이동 중이면 이동 방향으로, 아니면 정면으로 대시
            if (moveVec.x === 0 && moveVec.y === 0) {
                this.dashDir = { x: Math.sin(yaw), y: Math.cos(yaw) };
            } else {
                this.dashDir = { ...moveVec };
            }
            
            this.dashTime = 0.2; 
            this.dashCooldown = 0.8; 
            this.sp -= 30; 
            this.invulnerable = 0.2;
            
            if (audio) audio.play('dash');
            this.app.get('EntityManager').createParticles(this.x, this.y, '#ffffff', 5);
        }

        // 3. 실제 위치 업데이트 (충돌 판정 포함)
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

        // 4. 애니메이터 업데이트
        const currentSpeed = (moveVec.x !== 0 || moveVec.y !== 0) ? 1.0 : 0;
        this.animator.setFloat('speed', currentSpeed);
        this.animator.setBool('isDashing', this.dashTime > 0);
        this.animator.update(dt);

        // 5. 3D 메쉬 동기화
        if (this.mesh) {
            this.mesh.position.set(this.x, 0, this.y);
            // 뷰 모델은 항상 카메라(GameEngine) 위치와 회전에 동기화됨 (GameEngine.loop에서 처리)
        }

        // 6. 공격 처리
        this.handleAttack(dt);
    }

    /**
     * 공격 로직 처리
     */
    handleAttack(dt) {
        const input = this.app.get('InputManager');
        const ui = this.app.get('UIManager');
        const ge = this.app.get('GameEngine');
        const audio = this.app.get('AudioSystem');
        const em = this.app.get('EntityManager');
        const session = this.app.get('PlayerSession');

        if ((input.mouse.leftDown || input.isMobileAttacking) && 
            this.attackCooldown <= 0 && this.channeling <= 0 && !ui.isAnyUIOpen()) {
            
            this.isAttacking = true; 
            this.animator.setTrigger('isAttacking');
            
            const weapon = session.run.equipment.weapon;
            const wId = weapon ? weapon.id : 'unarmed';
            
            if (audio) audio.play(wId === 'unarmed' ? 'sword' : wId);
            
            this.attackAngle = -(ge.yaw || 0) - Math.PI/2; 

            if (wId === 'bow') {
                this.attackCooldown = 0.8; 
                this.weaponCooldownMax = 0.8;
                setTimeout(() => this.isAttacking = false, 150);
                em.addEntity(em.projectiles, new Projectile(this.x, this.y, this.attackAngle, 500, 25, true, this.app));
            } else {
                let attackRange = 50, hitArc = Math.PI / 2, dmg = 20;
                if (wId === 'sword') { 
                    this.attackCooldown = 0.5; attackRange = 80; hitArc = Math.PI / 1.5; dmg = 40; 
                } else if (wId === 'spear') { 
                    this.attackCooldown = 0.6; attackRange = 120; hitArc = Math.PI / 6; dmg = 35; 
                } else { 
                    this.attackCooldown = 0.4; 
                }
                this.weaponCooldownMax = this.attackCooldown;

                setTimeout(() => this.isAttacking = false, 300);
                
                // 범위 내 적 데미지 판정
                em.enemies.forEach(e => {
                    if (distance(this.x, this.y, e.x, e.y) < attackRange) {
                        let angleDiff = Math.abs(Math.atan2(e.y - this.y, e.x - this.x) - this.attackAngle);
                        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
                        if (angleDiff < hitArc / 2) { 
                            e.takeDamage(dmg); 
                            em.createParticles(e.x, e.y, '#ff0000', 5); 
                        }
                    }
                });
            }
        }
    }

    takeDamage(amt) {
        const ge = this.app.get('GameEngine');
        if (this.invulnerable > 0 || ge.currentState !== GAME_STATE.PLAYING) return;
        
        const audio = this.app.get('AudioSystem');
        const session = this.app.get('PlayerSession');
        
        if (audio) audio.play('hit');
        
        const def = session.getDefense();
        this.hp -= Math.max(1, amt - def); 
        this.invulnerable = 0.5; 
        this.cancelChannel();
        
        this.app.get('EntityManager').createParticles(this.x, this.y, '#ff0000', 10); 
        
        if (this.hp <= 0) { 
            this.animator.setBool('isDead', true); 
            ge.endRun(false); 
        }
    }

    heal(amt) { 
        this.hp = Math.min(this.baseMaxHp, this.hp + amt); 
        this.app.get('EntityManager').createParticles(this.x, this.y, '#00ff00', 10); 
    }

    cancelChannel() { 
        if (this.channeling > 0) { 
            this.channeling = 0; 
            this.channelTarget = null; 
            document.getElementById('channelingUI').classList.add('hidden'); 
        } 
    }
}
