
export class Interactable {
    constructor(x, y, type, data = null, c) { this.c = c; this.x = x; this.y = y; this.type = type; this.active = true; this.data = data; }
    draw(ctx) {
        if (!this.active) return;
        ctx.save(); ctx.translate(this.x, this.y);
        let ts = this.c.get('MapManager').ts;
        if (this.type === 'CHEST') { ctx.fillStyle = '#8B4513'; ctx.fillRect(-16, -16, 32, 32); ctx.fillStyle = '#D2691E'; ctx.fillRect(-14, -14, 28, 28); if (!this.data || !this.data.isOpened) { ctx.fillStyle = '#DAA520'; ctx.fillRect(-4, -2, 8, 4); } } 
        else if (this.type === 'EXIT') { ctx.fillStyle = 'rgba(34, 197, 94, 0.4)'; ctx.fillRect(-ts/2, -ts/2, ts, ts); ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.strokeRect(-ts/2, -ts/2, ts, ts); ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill(); } 
        else if (this.type === 'CORPSE') { ctx.fillStyle = '#666'; ctx.beginPath(); ctx.roundRect(-12, -20, 24, 32, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.fillText('RIP', 0, -5); }
        else if (this.type === 'ENEMY_CORPSE') { ctx.fillStyle = '#666'; ctx.beginPath(); ctx.roundRect(-12, -20, 24, 32, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '10px Arial'; ctx.textAlign = 'center'; ctx.fillText('RIP', 0, -5); }
        else if (this.type === 'STASH_OBJ') { ctx.fillStyle = '#4A3728'; ctx.fillRect(-24, -24, 48, 48); ctx.fillStyle = '#70543E'; ctx.fillRect(-20, -20, 40, 40); ctx.fillStyle = 'gold'; ctx.fillRect(-6, -4, 12, 8); ctx.fillStyle = 'white'; ctx.font = '12px Arial'; ctx.textAlign='center'; ctx.fillText('📦', 0, 4); }
        else if (this.type === 'WORKBENCH_OBJ') { ctx.fillStyle = '#555'; ctx.fillRect(-24, -16, 48, 32); ctx.fillStyle = '#777'; ctx.fillRect(-20, -12, 40, 24); ctx.fillStyle = 'white'; ctx.font = '12px Arial'; ctx.textAlign='center'; ctx.fillText('🔨', 0, 4); }
        else if (this.type === 'TOWNHALL_OBJ') { ctx.fillStyle = '#8B0000'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(-24, 0); ctx.lineTo(24, 0); ctx.fill(); ctx.fillStyle = '#CCC'; ctx.fillRect(-20, 0, 40, 24); ctx.fillStyle = 'white'; ctx.font = '12px Arial'; ctx.textAlign='center'; ctx.fillText('🏗️', 0, 16); }
        else if (this.type === 'GATE_OBJ') { ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'; ctx.fillRect(-ts/2, -ts/2, ts, ts); ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.strokeRect(-ts/2, -ts/2, ts, ts); ctx.fillStyle = '#3b82f6'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill(); }
        ctx.restore();
    }
}
