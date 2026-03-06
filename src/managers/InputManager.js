
import { GAME_STATE } from "../data/gameData.js";

export class InputManager {
    constructor(c) {
        this.c = c;
        this.keys = {};
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, leftDown: false, rightDown: false };
        this.mouseDelta = { x: 0, y: 0 };
        this.isPointerLocked = false;
        this.moveJx = 0; this.moveJy = 0; 
        this.aimJx = 0; this.aimJy = 0;
        this.isAiming = false; this.isMobileAttacking = false;
        this.isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
    bindEvents() {
        const canvas = document.getElementById('gameCanvas');

        window.addEventListener('keydown', e => {
            const cheatManager = this.c.get('CheatManager');
            // ... (기존 코드 유지)
            this.keys[e.code] = true;

            // ... (기본 처리 유지)
            
            let ge = this.c.get('GameEngine');
            if (ge && (ge.currentState === GAME_STATE.PLAYING || ge.currentState === GAME_STATE.TOWN)) {
                // ... (숫자키 처리 등)
                
                if (e.code === 'Tab' || e.code === 'KeyI' || e.code === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    
                    let ui = this.c.get('UIManager');
                    
                    if (e.code === 'Escape') {
                        if (ui && ui.isAnyUIOpen()) {
                            ui.closeAllUI();
                            // 여기서 즉시 requestPointerLock을 호출하지 않습니다 (브라우저가 차단함)
                        } else {
                            if (typeof window.togglePause === 'function') {
                                window.togglePause();
                            }
                        }
                        return;
                    }

                    // Tab/KeyI는 즉시 처리
                    if (ui && ui.initialized && ui.wInv && ui.wInv.classList.contains('hidden')) {
                        ui.openInventory();
                        document.exitPointerLock();
                    } else if (ui && ui.wInv) {
                        ui.closeAllUI();
                        canvas.requestPointerLock();
                    }
                }
            }
        });

        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;

            // ESC 키를 뗄 때, UI가 모두 닫혀있다면 마우스 락 재요청
            if (e.code === 'Escape') {
                let ui = this.c.get('UIManager');
                let ge = this.c.get('GameEngine');
                if (ui && !ui.isAnyUIOpen() && ge && (ge.currentState === GAME_STATE.PLAYING || ge.currentState === GAME_STATE.TOWN)) {
                    // 일시정지 메뉴도 닫혀있어야 함
                    const pauseMenu = document.getElementById('pauseMenu');
                    if (pauseMenu && pauseMenu.classList.contains('hidden')) {
                        canvas.requestPointerLock();
                    }
                }
            }
        });
        
        window.addEventListener('mousemove', e => { 
            this.mouse.x = e.clientX; 
            this.mouse.y = e.clientY; 
            if (document.pointerLockElement === canvas) {
                this.mouseDelta.x = e.movementX || 0;
                this.mouseDelta.y = e.movementY || 0;
            }
        });

        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === canvas;
        });

        window.addEventListener('mousedown', e => { 
            if(e.button === 0) this.mouse.leftDown = true; 
            if(e.button === 2) this.mouse.rightDown = true; 
            this.c.get('AudioSystem').init();

            // Request pointer lock on click if in game
            let ge = this.c.get('GameEngine');
            let ui = this.c.get('UIManager');
            const startScreen = document.getElementById('startScreen');
            const isStartScreenVisible = startScreen && startScreen.style.display !== 'none';

            if (ge && (ge.currentState === GAME_STATE.PLAYING || ge.currentState === GAME_STATE.TOWN) && 
                !ui.isAnyUIOpen() && !isStartScreenVisible) {
                canvas.requestPointerLock();
            }
        });
        window.addEventListener('mouseup', e => { 
            if(e.button === 0) this.mouse.leftDown = false; 
            if(e.button === 2) this.mouse.rightDown = false; 
        });
        document.getElementById('gameCanvas').addEventListener('contextmenu', e => e.preventDefault());
        
        if (this.isTouchDevice) {
            this.initMobileControls();
        }
    }
    resetMouse() { this.mouse.leftDown = false; this.mouse.rightDown = false; }

    initMobileControls() {
        document.getElementById('mobileControls').classList.remove('hidden');

        const setupJoystick = (zoneId, knobId, isLeft) => {
            const jZone = document.getElementById(zoneId);
            const jKnob = document.getElementById(knobId);
            let touchId = null, jCenterX = 0, jCenterY = 0;

            jZone.addEventListener('touchstart', e => {
                e.preventDefault(); this.c.get('AudioSystem').init();
                for(let i=0; i<e.changedTouches.length; i++) {
                    if (touchId === null) {
                        const touch = e.changedTouches[i];
                        touchId = touch.identifier;
                        const rect = jZone.getBoundingClientRect();
                        jCenterX = rect.left + rect.width / 2;
                        jCenterY = rect.top + rect.height / 2;
                        this.updateJoystick(touch.clientX, touch.clientY, jCenterX, jCenterY, jKnob, isLeft);
                        if(!isLeft) this.isAiming = true;
                    }
                }
            }, {passive: false});

            jZone.addEventListener('touchmove', e => {
                e.preventDefault();
                for(let i=0; i<e.changedTouches.length; i++) {
                    if(e.changedTouches[i].identifier === touchId) this.updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY, jCenterX, jCenterY, jKnob, isLeft);
                }
            }, {passive: false});

            jZone.addEventListener('touchend', e => {
                e.preventDefault();
                for(let i=0; i<e.changedTouches.length; i++) {
                    if(e.changedTouches[i].identifier === touchId) {
                        touchId = null; 
                        if(isLeft) { this.moveJx = 0; this.moveJy = 0; }
                        else { this.aimJx = 0; this.aimJy = 0; this.isAiming = false; }
                        jKnob.style.transform = `translate(-50%, -50%)`;
                    }
                }
            }, {passive: false});
        };

        setupJoystick('joystickZoneLeft', 'joystickKnobLeft', true);
        setupJoystick('joystickZoneRight', 'joystickKnobRight', false);

        const btnAtk = document.getElementById('vBtnAttack');
        btnAtk.addEventListener('touchstart', e => { e.preventDefault(); this.isMobileAttacking = true; this.c.get('AudioSystem').init(); }, {passive: false});
        btnAtk.addEventListener('touchend', e => { e.preventDefault(); this.isMobileAttacking = false; }, {passive: false});

        const btnDash = document.getElementById('vBtnDash');
        btnDash.addEventListener('touchstart', e => { e.preventDefault(); this.keys['Space'] = true; }, {passive: false});
        btnDash.addEventListener('touchend', e => { e.preventDefault(); this.keys['Space'] = false; }, {passive: false});

        const btnInt = document.getElementById('vBtnInteract');
        btnInt.addEventListener('touchstart', e => { e.preventDefault(); this.keys['KeyE'] = true; }, {passive: false});
        btnInt.addEventListener('touchend', e => { e.preventDefault(); setTimeout(()=> this.keys['KeyE'] = false, 100); }, {passive: false});

        const btnInv = document.getElementById('vBtnInv');
        btnInv.addEventListener('touchstart', e => {
            e.preventDefault();
            let ui = this.c.get('UIManager');
            if (ui && ui.wInv) {
                if (ui.wInv.classList.contains('hidden')) ui.openInventory();
                else ui.closeInventory();
            }
        }, {passive: false});
    }

    updateJoystick(x, y, jCenterX, jCenterY, jKnob, isLeft) {
        let dx = x - jCenterX; let dy = y - jCenterY;
        let dist = Math.sqrt(dx*dx + dy*dy);
        let maxDist = 36;
        if (dist > maxDist) { dx = (dx/dist)*maxDist; dy = (dy/dist)*maxDist; }
        jKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        let nx = dx / maxDist, ny = dy / maxDist;
        if(isLeft) { this.moveJx = nx; this.moveJy = ny; }
        else { this.aimJx = nx; this.aimJy = ny; }
    }
}
