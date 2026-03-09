import { BaseManager } from '../core/BaseManager.js';
import { randInt } from '../utils.js';

/**
 * MapManager: 월드 그리드 데이터 생성 및 3D 메쉬 시각화를 담당합니다.
 */
export class MapManager extends BaseManager {
    constructor(app) {
        super(app);
        
        this.grid = [];
        this.rooms = [];
        
        // 기본값 설정 (DataManager 실패 시 대비)
        this.ts = 100;
        this.cols = 50;
        this.rows = 50;
        
        this.mapGroup = null;
    }

    /**
     * 시스템 초기화 시점에 설정 로드
     */
    init() {
        const dm = this.get('DataManager');
        const settings = dm ? dm.getSettings() : null;
        
        if (settings) {
            this.ts = settings.tileSize || 100;
            this.cols = settings.mapCols || 50;
            this.rows = settings.mapRows || 50;
        }
        
        console.log(`MapManager initialized with tileSize: ${this.ts}`);
        super.init();
    }

    checkWall(x, y, radius = 0) {
        const startCol = Math.floor((x - radius) / this.ts);
        const endCol = Math.floor((x + radius) / this.ts);
        const startRow = Math.floor((y - radius) / this.ts);
        const endRow = Math.floor((y + radius) / this.ts);

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
                    if (this.grid[r][c] === 1) return true;
                } else {
                    return true; 
                }
            }
        }
        return false;
    }

    generateTown() {
        this.grid = Array.from({length: this.rows}, () => Array(this.cols).fill(1));
        const startX = 15, startY = 15, size = 20;
        
        for (let y = startY; y < startY + size; y++) {
            for (let x = startX; x < startX + size; x++) {
                this.grid[y][x] = 0; 
            }
        }
        
        this.update3DView();
        
        return { 
            cx: startX + 10, 
            cy: startY + 10, 
            objs: [
                { x: startX + 4, y: startY + 10, type: 'STASH_OBJ' },
                { x: startX + 16, y: startY + 10, type: 'WORKBENCH_OBJ' },
                { x: startX + 10, y: startY + 16, type: 'TOWNHALL_OBJ' },
                { x: startX + 10, y: startY + 4, type: 'GATE_OBJ' }
            ]
        };
    }

    generateDungeon(dungeonPlan = null) {
        this.grid = Array.from({length: this.rows}, () => Array(this.cols).fill(1));
        this.rooms = [];
        
        const dm = this.get('DataManager');
        const balance = dm ? dm.getGameplayBalance() : {};
        const profile = dungeonPlan?.generationProfile || null;
        
        const MAX_ROOMS = (profile?.maxRooms || 8) + (dungeonPlan?.riskLevel || 0);
        const MIN_SIZE = profile?.minRoomSize || 5;
        const MAX_SIZE = profile?.maxRoomSize || 10;

        for (let i = 0; i < MAX_ROOMS * 2 && this.rooms.length < MAX_ROOMS; i++) {
            let w = randInt(MIN_SIZE, MAX_SIZE);
            let h = randInt(MIN_SIZE, MAX_SIZE);
            let x = randInt(1, this.cols - w - 1);
            let y = randInt(1, this.rows - h - 1);
            let cx = Math.floor(x + w / 2), cy = Math.floor(y + h / 2);
            let newRoom = {x, y, w, h, cx, cy, type: 'NORMAL'};
            
            let failed = false;
            for (let other of this.rooms) {
                if (newRoom.x <= other.x + other.w && newRoom.x + newRoom.w >= other.x && 
                    newRoom.y <= other.y + other.h && newRoom.y + newRoom.h >= other.y) { 
                    failed = true; break; 
                }
            }
            if (!failed) this.rooms.push(newRoom);
        }

        this.rooms.forEach(room => { 
            for (let y = room.y; y < room.y + room.h; y++) 
                for (let x = room.x; x < room.x + room.w; x++) 
                    this.grid[y][x] = 0; 
        });

        for (let i = 1; i < this.rooms.length; i++) {
            let r1 = this.rooms[i - 1], r2 = this.rooms[i];
            for (let x = Math.min(r1.cx, r2.cx); x <= Math.max(r1.cx, r2.cx); x++) this.grid[r1.cy][x] = 0;
            for (let y = Math.min(r1.cy, r2.cy); y <= Math.max(r1.cy, r2.cy); y++) this.grid[y][r2.cx] = 0;
        }

        this.rooms[0].type = 'SPAWN'; 
        this.rooms[this.rooms.length - 1].type = 'EXIT';
        
        this.update3DView();
        
        return this.rooms;
    }

    update3DView() {
        const ge = this.get('GameEngine');
        if (!ge || !ge.scene) return;

        const scene = ge.scene;
        if (this.mapGroup) scene.remove(this.mapGroup);
        
        this.mapGroup = new window.THREE.Group();
        
        const wallHeight = this.ts * 2.5;
        const wallGeo = new window.THREE.BoxGeometry(this.ts, wallHeight, this.ts);
        const floorGeo = new window.THREE.PlaneGeometry(this.ts, this.ts);
        
        const wallMat = new window.THREE.MeshLambertMaterial({ color: 0x4a5568 });
        const floorMat = new window.THREE.MeshLambertMaterial({ color: 0x2d3748 });
        const floorMatAlt = new window.THREE.MeshLambertMaterial({ color: 0x1a202c });

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const x = c * this.ts + this.ts / 2;
                const z = r * this.ts + this.ts / 2;

                if (this.grid[r][c] === 1) {
                    const wall = new window.THREE.Mesh(wallGeo, wallMat);
                    wall.position.set(x, wallHeight / 2, z);
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    this.mapGroup.add(wall);
                } else {
                    const floor = new window.THREE.Mesh(floorGeo, (r + c) % 2 === 0 ? floorMat : floorMatAlt);
                    floor.rotation.x = -Math.PI / 2;
                    floor.position.set(x, 0, z);
                    floor.receiveShadow = true;
                    this.mapGroup.add(floor);
                }
            }
        }
        
        scene.add(this.mapGroup);
    }

    getTileAt(x, y) {
        const col = Math.floor(x / this.ts);
        const row = Math.floor(y / this.ts);
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return 1;
        return this.grid[row][col];
    }
}
