export class Enemy {
    constructor(app, type = 'goblin', x = 0, y = 0) {
        this.app = app;
        this.type = type;
        this.x = x;
        this.y = y;
        this.hp = 30;
        this.atk = 5;
        this.speed = 2;
    }

    update(deltaTime) {
        const player = this.app.get('PlayerSession').stats;
        // 간단한 AI: 플레이어 추적 또는 배회 로직...
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        console.log(`${this.type} defeated!`);
        // 드롭 아이템 생성 로직 등
        const dropId = this.app.get('DataManager').getRandomDrop();
        this.app.get('PlayerSession').addItem(dropId, 1);
    }
}
