
import { GAME_STATE } from "../data/gameData.js";

export class InputManager {
    constructor(c) {
        this.c = c;
        this.keys = {};
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, leftDown: false, rightDown: false };
        this.moveJx = 0; this.moveJy = 0; 
        this.aimJx = 0; this.aimJy = 0;
        this.isAiming = false; this.isMobileAttacking = false;
        this.isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
    bindEvents() {
        window.addEventListener('keydown', e => {
            const cheatManager = this.c.get('CheatManager');
            if (cheatManager && cheatManager.isOpen) {
                // Allow input only for the cheat console when it's open
                if (e.code !== 'Backquote' && e.target.id !== 'cheatInput') {
                    e.preventDefault();
                    e.stopPropagation();
                }
                 if (e.code === 'Backquote') {
                    e.preventDefault();
                    cheatManager.toggleConsole();
                }
                // Don't process other game inputs
                return;
            }

            this.keys[e.code] = true;

            if (e.code === 'Backquote') {
                e.preventDefault();
                if (cheatManager) {
                    cheatManager.toggleConsole();
                }
            }
            
            let ge = this.c.get('GameEngine');
            if (ge && (ge.currentState === GAME_STATE.PLAYING || ge.currentState === GAME_STATE.TOWN)) {
                if (e.code.startsWith('Digit') && e.code.length === 6) {
                    let num = parseInt(e.code[5]);
                    const ui = this.c.get('UIManager');
                    if (ui && ui.initialized && num >= 1 && num <= 8) {
                        ui.useItem('quick', num - 1);
                    }
                }
                if (e.code === 'Tab' || e.code === 'KeyI' || e.code === 'Escape') {
                    e.preventDefault();
                    let ui = this.c.get('UIManager');
                    // ui.initialized 플래그와 wInv 존재 여부를 모두 확인
                    if (ui && ui.initialized && ui.wInv && ui.wInv.classList.contains('hidden') && e.code !== 'Escape') {
                        ui.openInventory();
                    } else if (ui && ui.wInv) {
                        ui.closeInventory();
                        ui.closeCrafting();
                        ui.closeUpgrade();
                    }
                }
            }
        });
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        window.addEventListener('mousemove', e => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; });
        window.addEventListener('mousedown', e => { 
            if(e.button === 0) this.mouse.leftDown = true; 
            if(e.button === 2) this.mouse.rightDown = true; 
            this.c.get('AudioSystem').init();
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
