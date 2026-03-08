import { BaseManager } from '../core/BaseManager.js';

export class MapManager extends BaseManager {
    constructor(app) {
        super(app);
        this.width = 50;
        this.height = 50;
        this.tiles = [];
    }

    init() {
        this.generateMap();
        super.init();
    }

    generateMap() {
        // 임시 맵 생성 로직 (3D 전환 시 3D 환경 구축 로직으로 대체 가능)
        this.tiles = [];
        for (let y = 0; y < this.height; y++) {
            let row = [];
            for (let x = 0; x < this.width; x++) {
                row.push((x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) ? 1 : 0);
            }
            this.tiles.push(row);
        }
    }

    getTileAt(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 1;
        return this.tiles[y][x];
    }
}
