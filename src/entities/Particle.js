
export class Particle {
    constructor(x, y, color, speed) {
        this.x = x; this.y = y; let angle = Math.random() * Math.PI * 2; let s = Math.random() * speed;
        this.vx = Math.cos(angle) * s; this.vy = Math.sin(angle) * s; 
        this.vz = (Math.random() - 0.5) * speed; // Random vertical speed
        this.color = color; this.life = 1.0; this.size = Math.random() * 3 + 1;
        
        this.init3D();
    }

    init3D() {
        const geo = new THREE.BoxGeometry(this.size, this.size, this.size);
        const mat = new THREE.MeshBasicMaterial({ 
            color: this.color, 
            transparent: true, 
            opacity: 1.0 
        });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.set(this.x, 20, this.y);
    }

    update(dt) { 
        this.x += this.vx * dt; 
        this.y += this.vy * dt;
        this.mesh.position.y += this.vz * dt;
        this.life -= dt * 2; 
        
        if (this.mesh) {
            this.mesh.position.set(this.x, this.mesh.position.y, this.y);
            this.mesh.material.opacity = Math.max(0, this.life);
        }
    }
    
    draw(ctx) {
        // No-op for 3D
    }
}
