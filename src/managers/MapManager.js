
import { RAW_DATA } from '../data/gameData.js';
import { randInt } from '../utils.js';

export class MapManager {
    constructor(container) {
        this.container = container;
        this.grid = [];
        this.rooms = [];
        this.ts = RAW_DATA.settings.tileSize;
        this.cols = RAW_DATA.settings.mapCols;
        this.rows = RAW_DATA.settings.mapRows;
    }
    checkWall(x, y, radius) {
        let startCol = Math.floor((x - radius) / this.ts), endCol = Math.floor((x + radius) / this.ts);
        let startRow = Math.floor((y - radius) / this.ts), endRow = Math.floor((y + radius) / this.ts);
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) { if (this.grid[r][c] === 1) return true; } else return true;
            }
        }
        return false;
    }
    generateTown() {
        this.grid = Array.from({length: this.rows}, () => Array(this.cols).fill(1));
        let startX = 15, startY = 15, size = 20;
        for (let y = startY; y < startY + size; y++) {
            for (let x = startX; x < startX + size; x++) this.grid[y][x] = 0; 
        }
        
        this.create3DMap();
        
        return { cx: startX + 10, cy: startY + 10, objs: [
            { x: startX + 4, y: startY + 10, type: 'STASH_OBJ' },
            { x: startX + 16, y: startY + 10, type: 'WORKBENCH_OBJ' },
            { x: startX + 10, y: startY + 16, type: 'TOWNHALL_OBJ' },
            { x: startX + 10, y: startY + 4, type: 'GATE_OBJ' }
        ]};
    }
    generateDungeon() {
        this.grid = Array.from({length: this.rows}, () => Array(this.cols).fill(1));
        this.rooms = [];
        const MAX_ROOMS = 8, MIN_SIZE = 5, MAX_SIZE = 10;
        for (let i = 0; i < MAX_ROOMS * 2 && this.rooms.length < MAX_ROOMS; i++) {
            let w = randInt(MIN_SIZE, MAX_SIZE), h = randInt(MIN_SIZE, MAX_SIZE);
            let x = randInt(1, this.cols - w - 1), y = randInt(1, this.rows - h - 1);
            let cx = Math.floor(x + w / 2), cy = Math.floor(y + h / 2);
            let newRoom = {x, y, w, h, cx, cy, type: 'NORMAL'};
            let failed = false;
            for (let other of this.rooms) {
                if (newRoom.x <= other.x + other.w && newRoom.x + newRoom.w >= other.x && newRoom.y <= other.y + other.h && newRoom.y + newRoom.h >= other.y) { failed = true; break; }
            }
            if (!failed) this.rooms.push(newRoom);
        }
        this.rooms.forEach(room => { for (let y = room.y; y < room.y + room.h; y++) for (let x = room.x; x < room.x + room.w; x++) this.grid[y][x] = 0; });
        for (let i = 1; i < this.rooms.length; i++) {
            let r1 = this.rooms[i - 1], r2 = this.rooms[i];
            for (let x = Math.min(r1.cx, r2.cx); x <= Math.max(r1.cx, r2.cx); x++) this.grid[r1.cy][x] = 0;
            for (let y = Math.min(r1.cy, r2.cy); y <= Math.max(r1.cy, r2.cy); y++) this.grid[y][r2.cx] = 0;
        }
        this.rooms[0].type = 'SPAWN'; this.rooms[this.rooms.length - 1].type = 'EXIT';
        
        this.create3DMap();
        
        return this.rooms;
    }

    create3DMap() {
        const ge = this.container.get('GameEngine');
        const scene = ge.scene;
        
        if (this.mapGroup) scene.remove(this.mapGroup);
        this.mapGroup = new THREE.Group();
        
        const wallHeight = this.ts * 3;
        const wallGeo = new THREE.BoxGeometry(this.ts, wallHeight, this.ts);
        const floorGeo = new THREE.PlaneGeometry(this.ts, this.ts);
        
        const wallMat = new THREE.MeshLambertMaterial({ color: 0x4a5568 });
        const floorMat = new THREE.MeshLambertMaterial({ color: 0x2d3748 });
        const floorMatAlt = new THREE.MeshLambertMaterial({ color: 0x1a202c });
        const ceilingMat = new THREE.MeshLambertMaterial({ color: 0x111827 });

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * this.ts + this.ts / 2;
                const z = r * this.ts + this.ts / 2;

                if (this.grid[r][c] === 1) {
                    const wall = new THREE.Mesh(wallGeo, wallMat);
                    wall.position.set(x, wallHeight / 2, z);
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    this.mapGroup.add(wall);
                } else {
                    // Floor
                    const floor = new THREE.Mesh(floorGeo, (r + c) % 2 === 0 ? floorMat : floorMatAlt);
                    floor.rotation.x = -Math.PI / 2;
                    floor.position.set(x, 0, z);
                    floor.receiveShadow = true;
                    this.mapGroup.add(floor);

                    // Ceiling
                    const ceiling = new THREE.Mesh(floorGeo, ceilingMat);
                    ceiling.rotation.x = Math.PI / 2;
                    ceiling.position.set(x, wallHeight, z);
                    this.mapGroup.add(ceiling);
                }
            }
        }
        
        scene.add(this.mapGroup);
    }
}
