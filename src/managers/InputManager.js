import { BaseManager } from '../core/BaseManager.js';

/**
 * InputManager: 키보드 및 마우스의 원시(Raw) 입력을 관리합니다.
 * 특정 단축키의 기능을 결정하지 않고, 발생한 이벤트를 알리는 역할만 수행합니다.
 */
export class InputManager extends BaseManager {
    constructor(app) {
        super(app);
        this.keys = {};
        this.mouse = { x: 0, y: 0, leftDown: false, rightDown: false, isDown: false };
        this.mouseDelta = { x: 0, y: 0 };
        this.isPointerLocked = false;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onPointerLockChange = this._onPointerLockChange.bind(this);
        this._onCanvasClick = this._onCanvasClick.bind(this);
    }

    init() {
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mouseup', this._onMouseUp);
        window.addEventListener('contextmenu', e => e.preventDefault());
        
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) canvas.addEventListener('click', this._onCanvasClick);

        super.init();
    }

    _onKeyDown(e) {
        // 시스템 공통 차단 키
        if (['Tab', 'AltLeft', 'AltRight', 'Escape'].includes(e.code)) {
            e.preventDefault();
        }
        this.keys[e.code] = true; 
        this.events.emit('KEYDOWN', e.code); // 시스템에 키 눌림 알림
    }

    _onKeyUp(e) { this.keys[e.code] = false; }

    _onMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        if (this.isPointerLocked) {
            this.mouseDelta.x += e.movementX || 0;
            this.mouseDelta.y += e.movementY || 0;
        }
    }

    _onMouseDown(e) {
        this.mouse.isDown = true;
        if (e.button === 0) this.mouse.leftDown = true;
        if (e.button === 2) this.mouse.rightDown = true;
    }

    _onMouseUp(e) {
        this.mouse.isDown = false;
        if (e.button === 0) this.mouse.leftDown = false;
        if (e.button === 2) this.mouse.rightDown = false;
    }

    _onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement !== null;
    }

    _onCanvasClick() {
        // UI가 열려있지 않을 때만 포인터 락 재요청
        const ui = this.get('UIManager');
        if (ui && !ui.isAnyUIOpen()) {
            document.getElementById('gameCanvas')?.requestPointerLock();
        }
    }

    isKeyPressed(code) { return !!this.keys[code]; }

    destroy() {
        // 리스너 해제 로직...
        super.destroy();
    }
}
