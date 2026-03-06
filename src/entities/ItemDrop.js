
export class ItemDrop {
    constructor(x, y, itemData) { 
        this.x = x; this.y = y; this.data = itemData; this.time = Math.random() * 100; 
        this.init3D();
    }

    init3D() {
        this.mesh = new THREE.Group();
        
        const geo = new THREE.OctahedronGeometry(8, 0);
        const mat = new THREE.MeshPhongMaterial({ color: 0xffd700, emissive: 0x444400 });
        this.itemMesh = new THREE.Mesh(geo, mat);
        this.itemMesh.position.y = 15;
        this.itemMesh.castShadow = true;
        this.mesh.add(this.itemMesh);
        
        this.mesh.position.set(this.x, 0, this.y);
    }

    update(dt) { 
        this.time += dt * 3; 
        if (this.mesh) {
            this.mesh.position.set(this.x, 0, this.y);
            this.itemMesh.position.y = 15 + Math.sin(this.time) * 5;
            this.itemMesh.rotation.y += dt * 2;
        }
    }
    
    draw(ctx) {
        // No-op for 3D
    }
}
