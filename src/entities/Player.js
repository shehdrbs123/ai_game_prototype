export class Player {
    constructor(app) {
        this.app = app;
        this.x = 25;
        this.y = 25;
        this.speed = 5;
    }

    update(deltaTime) {
        const input = this.app.get('InputManager');
        const map = this.app.get('MapManager');

        let nextX = this.x;
        let nextY = this.y;

        if (input.isKeyPressed('ArrowLeft')) nextX -= this.speed * deltaTime;
        if (input.isKeyPressed('ArrowRight')) nextX += this.speed * deltaTime;
        if (input.isKeyPressed('ArrowUp')) nextY -= this.speed * deltaTime;
        if (input.isKeyPressed('ArrowDown')) nextY += this.speed * deltaTime;

        // 벽 충돌 체크
        if (map.getTileAt(Math.floor(nextX), Math.floor(nextY)) === 0) {
            this.x = nextX;
            this.y = nextY;
        }
    }
}
