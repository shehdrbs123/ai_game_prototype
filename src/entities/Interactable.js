
export class Interactable {
    constructor(x, y, type, data = null, c) { 
        this.c = c; this.x = x; this.y = y; this.type = type; this.active = true; this.data = data; 
        this.init3D();
    }

    init3D() {
        this.mesh = new THREE.Group();
        let ts = this.c.get('MapManager').ts;
        let geo, mat;

        if (this.type === 'CHEST') {
            geo = new THREE.BoxGeometry(32, 24, 24);
            mat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const chest = new THREE.Mesh(geo, mat);
            chest.position.y = 12;
            chest.castShadow = true;
            chest.receiveShadow = true;
            this.mesh.add(chest);
        } else if (this.type === 'EXIT' || this.type === 'GATE_OBJ') {
            const color = this.type === 'EXIT' ? 0x22c55e : 0x3b82f6;
            geo = new THREE.CylinderGeometry(ts / 3, ts / 3, ts, 16);
            mat = new THREE.MeshLambertMaterial({ color: color, transparent: true, opacity: 0.6 });
            const portal = new THREE.Mesh(geo, mat);
            portal.position.y = ts / 2;
            this.mesh.add(portal);
        } else if (this.type === 'CORPSE' || this.type === 'ENEMY_CORPSE') {
            geo = new THREE.BoxGeometry(24, 32, 8);
            mat = new THREE.MeshLambertMaterial({ color: 0x666666 });
            const tomb = new THREE.Mesh(geo, mat);
            tomb.position.y = 16;
            tomb.castShadow = true;
            this.mesh.add(tomb);
        } else {
            // Default for stash, workbench, townhall
            geo = new THREE.BoxGeometry(40, 40, 40);
            mat = new THREE.MeshLambertMaterial({ color: 0x718096 });
            const box = new THREE.Mesh(geo, mat);
            box.position.y = 20;
            box.castShadow = true;
            this.mesh.add(box);
        }

        this.mesh.position.set(this.x, 0, this.y);
    }

    draw(ctx) {
        // No-op for 3D
    }
}
