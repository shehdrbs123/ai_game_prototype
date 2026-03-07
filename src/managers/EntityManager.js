import { BaseManager } from '../core/BaseManager.js';
import { Particle } from "../entities/Particle.js";

/**
 * EntityManager: 게임 내 모든 동적 객체(플레이어, 적, 아이템, 파티클 등)의 생명주기를 관리합니다.
 * C# Porting: Unity의 GameObject 관리, Object Pooling, Particle System 제어로 대응됩니다.
 */
export class EntityManager extends BaseManager {
    /**
     * @param {DIContainer} app 
     */
    constructor(app) {
        super(app);
        
        /** @private */
        this._player = null;
        
        // 엔티티 타입별 리스트 (Unity의 Tag 또는 Layer 기반 검색과 유사)
        this.enemies = [];
        this.items = [];
        this.interactables = [];
        this.projectiles = [];
        this.particles = [];
    }

    /**
     * 플레이어 엔티티 설정 및 씬 등록
     */
    get player() { return this._player; }
    set player(val) {
        const scene = this.get('GameEngine').scene;
        if (!scene) return;

        if (this._player) {
            if (this._player.mesh) scene.remove(this._player.mesh);
            if (this._player.viewModel) scene.remove(this._player.viewModel);
        }
        
        this._player = val;
        
        if (this._player) {
            if (this._player.mesh) scene.add(this._player.mesh);
            if (this._player.viewModel) scene.add(this._player.viewModel);
        }
    }

    /**
     * 모든 엔티티를 제거하고 씬을 청소합니다. (씬 전환 시 호출)
     */
    clear() {
        const scene = this.get('GameEngine').scene;
        if (!scene) return;

        const allEntities = [
            ...this.enemies, 
            ...this.items, 
            ...this.interactables, 
            ...this.projectiles, 
            ...this.particles
        ];

        allEntities.forEach(e => {
            if (e.mesh) scene.remove(e.mesh);
        });

        this.enemies = [];
        this.items = [];
        this.interactables = [];
        this.projectiles = [];
        this.particles = [];
        
        this.events.emit('ENTITIES_CLEARED');
    }
    
    /**
     * 파티클 효과를 생성합니다.
     * C# Porting: ParticleSystem.Emit() 또는 Pooling된 Particle 활성화에 대응됩니다.
     */
    createParticles(x, y, color, count) {
        const scene = this.get('GameEngine').scene;
        if (!scene) return;

        for (let i = 0; i < count; i++) {
            const p = new Particle(x, y, color, 50);
            this.particles.push(p);
            if (p.mesh) scene.add(p.mesh);
        }
    }

    /**
     * 일반 엔티티 추가
     */
    addEntity(list, entity) {
        list.push(entity);
        const scene = this.get('GameEngine').scene;
        if (scene && entity.mesh) {
            scene.add(entity.mesh);
        }
    }

    /**
     * 일반 엔티티 제거
     */
    removeEntity(list, index) {
        const entity = list[index];
        const scene = this.get('GameEngine').scene;
        if (scene && entity && entity.mesh) {
            scene.remove(entity.mesh);
        }
        list.splice(index, 1);
    }

    /**
     * 모든 엔티티 업데이트 (프레임별)
     * C# Porting: 각 GameObject의 Update() 호출을 중앙에서 관리하는 구조입니다.
     */
    update(deltaTime) {
        if (!this.enabled) return;

        // 플레이어 업데이트
        if (this._player) this._player.update(deltaTime);

        // 적 업데이트 및 사망 처리
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(deltaTime);
            if (e.hp <= 0) {
                this.removeEntity(this.enemies, i);
                this.events.emit('ENEMY_KILLED', { enemy: e });
            }
        }

        // 투사체 업데이트
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.update(deltaTime);
            if (p.life <= 0) {
                this.removeEntity(this.projectiles, i);
            }
        }

        // 파티클 업데이트 (수명이 다한 파티클 제거 포함)
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(deltaTime);
            if (p.life <= 0) {
                this.removeEntity(this.particles, i);
            }
        }
    }
}
