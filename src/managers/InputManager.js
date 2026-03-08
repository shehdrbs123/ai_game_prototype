import { BaseManager } from '../core/BaseManager.js';

export class InputManager extends BaseManager {
    constructor(app) {
        super(app);
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false };
        
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
    }

    init() {
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mouseup', this._onMouseUp);
        super.init();
    }

    _onKeyDown(e) { this.keys[e.code] = true; }
    _onKeyUp(e) { this.keys[e.code] = false; }
    _onMouseMove(e) { this.mouse.x = e.clientX; this.mouse.y = e.clientY; }
    _onMouseDown() { this.mouse.isDown = true; }
    _onMouseUp() { this.mouse.isDown = false; }

    isKeyPressed(code) { return !!this.keys[code]; }

    destroy() {
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mouseup', this._onMouseUp);
    }
}
