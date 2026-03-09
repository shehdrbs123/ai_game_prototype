/**
 * Interactable: 상자, 시체, 제작대, 게이트 등 플레이어와 상호작용 가능한 모든 객체를 관리합니다.
 */
export class Interactable {
    constructor(x, y, type, data, app) {
        this.app = app;
        this.x = x;
        this.y = y;
        this.type = type; // 'CHEST', 'GATE_OBJ', 'ENEMY_CORPSE', etc.
        this.data = data || {};
        
        const THREE = window.THREE;
        this.mesh = new THREE.Group();
        this._initMesh(type);
        this.mesh.position.set(x, 0, y);
    }

    /**
     * 타입에 따른 3D 메쉬 외형 설정
     * @private
     */
    _initMesh(type) {
        const THREE = window.THREE;
        let geometry, material;

        switch (type) {
            case 'GATE_OBJ': // 던전 입구: 커다란 파란색 고리 또는 기둥
                geometry = new THREE.TorusGeometry(40, 5, 16, 32);
                material = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8 });
                const gate = new THREE.Mesh(geometry, material);
                gate.position.y = 50;
                this.mesh.add(gate);
                break;

            case 'CHEST': // 상자: 갈색 상자
                geometry = new THREE.BoxGeometry(30, 30, 30);
                material = new THREE.MeshStandardMaterial({ color: 0x92400e });
                const chest = new THREE.Mesh(geometry, material);
                chest.position.y = 15;
                this.mesh.add(chest);
                break;

            case 'ENEMY_CORPSE': // 적 시체: 바닥에 누운 빨간색 판
                geometry = new THREE.BoxGeometry(40, 5, 40);
                material = new THREE.MeshStandardMaterial({ color: 0xef4444, transparent: true, opacity: 0.7 });
                const corpse = new THREE.Mesh(geometry, material);
                corpse.position.y = 2.5;
                this.mesh.add(corpse);
                break;

            default: // 기타 마을 오브젝트 (제작대 등)
                geometry = new THREE.CylinderGeometry(20, 20, 40, 8);
                material = new THREE.MeshStandardMaterial({ color: 0x6b7280 });
                const obj = new THREE.Mesh(geometry, material);
                obj.position.y = 20;
                this.mesh.add(obj);
                break;
        }
    }

    update(dt) {
        // 애니메이션 효과 (게이트 회전 등)
        if (this.type === 'GATE_OBJ') {
            this.mesh.rotation.y += dt;
        }
    }
}
