
export class ItemDrop {
    constructor(x, y, itemData) { this.x = x; this.y = y; this.data = itemData; this.floatY = 0; this.time = Math.random() * 100; }
    update(dt) { this.time += dt * 5; this.floatY = Math.sin(this.time) * 5; }
    draw(ctx) { ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.data.emoji, this.x, this.y + this.floatY); }
}
