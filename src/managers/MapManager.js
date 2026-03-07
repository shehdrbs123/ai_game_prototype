import { BaseManager } from '../core/BaseManager.js';
import { RAW_DATA } from '../data/gameData.js';
import { randInt } from '../utils.js';

/**
 * MapManager: 월드 그리드 데이터 생성, 충돌 체크, 3D 맵 시각화를 담당합니다.
 * C# Porting: Unity의 Tilemap, NavMesh, 또는 절차적 맵 생성 스크립트로 대응됩니다.
 */
export class MapManager extends BaseManager {
    /**
     * @param {DIContainer} app 
     */
    constructor(app) {
        super(app);
        
        /** @type {Array<Array<number>>} 0: Floor, 1: Wall */
        this.grid = [];
        this.rooms = [];
        
        // 설정값 로드
        const settings = RAW_DATA.settings;
        this.ts = settings.tileSize;
        this.cols = settings.mapCols;
        this.rows = settings.mapRows;
        
        /** @private @type {any} Three.js Group */
        this.mapGroup = null;
    }

    init() {
        super.init();
        console.log('MapManager initialized.');
    }

    /**
     * 특정 좌표에 벽이 있는지 확인합니다.
     */
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

    /**
     * 마을(Town) 맵을 생성합니다.
     */
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

    /**
     * 던전(Dungeon) 맵을 생성합니다.
     * main의 시드 기반 생성 로직 통합
     */
    generateDungeon(dungeonPlan = null) {
        this.grid = Array.from({length: this.rows}, () => Array(this.cols).fill(1));
        this.rooms = [];
        
        const profile = dungeonPlan?.generationProfile || null;
        const riskLevel = dungeonPlan?.riskLevel || 0;
        const MAX_ROOMS = (profile?.maxRooms || 8) + riskLevel;
        const MIN_SIZE = profile?.minRoomSize || 5;
        const MAX_SIZE = profile?.maxRoomSize || 10;
        const seededInt = this.createSeededIntGenerator(dungeonPlan?.seed);

        for (let i = 0; i < MAX_ROOMS * 2 && this.rooms.length < MAX_ROOMS; i++) {
            let w = seededInt ? seededInt(MIN_SIZE, MAX_SIZE) : randInt(MIN_SIZE, MAX_SIZE);
            let h = seededInt ? seededInt(MIN_SIZE, MAX_SIZE) : randInt(MIN_SIZE, MAX_SIZE);
            let x = seededInt ? seededInt(1, this.cols - w - 1) : randInt(1, this.cols - w - 1);
            let y = seededInt ? seededInt(1, this.rows - h - 1) : randInt(1, this.rows - h - 1);
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

    /**
     * 시드 기반 난수 생성기
     */
    createSeededIntGenerator(seed) {
        if (!Number.isInteger(seed)) return null;
        let s = seed >>> 0;
        return (min, max) => {
            s = (Math.imul(1664525, s) + 1013904223) >>> 0;
            const n = s / 4294967296;
            return Math.floor(n * (max - min + 1)) + min;
        };
    }

    /**
     * 그리드 데이터를 기반으로 3D 메쉬를 갱신합니다.
     */
    update3DView() {
        const ge = this.get('GameEngine');
        if (!ge || !ge.scene) return;

        const scene = ge.scene;
        if (this.mapGroup) scene.remove(this.mapGroup);
        
        this.mapGroup = new window.THREE.Group();
        
        const wallHeight = this.ts * 3;
        const wallGeo = new window.THREE.BoxGeometry(this.ts, wallHeight, this.ts);
        const floorGeo = new window.THREE.PlaneGeometry(this.ts, this.ts);
        
        const wallMat = new window.THREE.MeshLambertMaterial({ color: 0x4a5568 });
        const floorMat = new window.THREE.MeshLambertMaterial({ color: 0x2d3748 });
        const floorMatAlt = new window.THREE.MeshLambertMaterial({ color: 0x1a202c });
        const ceilingMat = new window.THREE.MeshLambertMaterial({ color: 0x111827 });

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

                    const ceiling = new window.THREE.Mesh(floorGeo, ceilingMat);
                    ceiling.rotation.x = Math.PI / 2;
                    ceiling.position.set(x, wallHeight, z);
                    this.mapGroup.add(ceiling);
                }
            }
        }
        
        scene.add(this.mapGroup);
        this.events.emit('MAP_VIEW_UPDATED');
    }

    destroy() {
        const ge = this.get('GameEngine');
        if (ge && ge.scene && this.mapGroup) {
            ge.scene.remove(this.mapGroup);
        }
        super.destroy();
    }
}
