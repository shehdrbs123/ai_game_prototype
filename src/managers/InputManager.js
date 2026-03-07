import { BaseManager } from '../core/BaseManager.js';
import { GAME_STATE } from "../data/gameData.js";

/**
 * InputManager: 키보드 및 마우스 입력을 관리하고 추상화합니다.
 * C# Porting: Unity의 Input System 또는 Legacy Input 대응.
 */
export class InputManager extends BaseManager {
    constructor(app) {
        super(app);
        this.keys = {};
        this.mouse = { x: 0, y: 0, worldX: 0, worldY: 0, leftDown: false, rightDown: false };
        this.mouseDelta = { x: 0, y: 0 };
        this.isPointerLocked = false;
        
        // 모바일 대응
        this.isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints > 0);
        this.moveJx = 0; this.moveJy = 0; 
        this.aimJx = 0; this.aimJy = 0;
        this.isAiming = false; this.isMobileAttacking = false;
    }

    init() {
        super.init();
        console.log('InputManager initialized.');
    }

    /**
     * 브라우저 이벤트 바인딩
     */
    bindEvents() {
        const canvas = document.getElementById('gameCanvas');

        // 키다운 이벤트
        window.addEventListener('keydown', e => {
            // 치트 매니저 연결 (에러 방지: 메소드 존재 여부 확인)
            const cheatManager = this.get('CheatManager');
            if (cheatManager && cheatManager.isOpen && e.code !== 'Slash') return; // 콘솔 열려있을 땐 입력 차단

            this.keys[e.code] = true;
            
            const ge = this.get('GameEngine');
            const ui = this.get('UIManager');

            // 치트 콘솔 토글 (Slash 키)
            if (e.code === 'Slash' || e.key === '/') {
                if (cheatManager) {
                    e.preventDefault();
                    cheatManager.toggleConsole();
                }
                return;
            }

            // 인게임 단축키 처리 (마을 또는 던전)
            if (ge && (ge.currentState === GAME_STATE.PLAYING || ge.currentState === GAME_STATE.TOWN)) {
                if (e.code === 'Tab' || e.code === 'KeyI' || e.code === 'Escape') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    
                    if (e.code === 'Escape') {
                        if (ui && ui.isAnyUIOpen()) {
                            ui.closeAllUI();
                        } else {
                            if (typeof window.togglePause === 'function') {
                                window.togglePause();
                            }
                        }
                        return;
                    }

                    // 인벤토리 토글
                    if (ui) {
                        if (ui.inventoryView.isOpen()) {
                            ui.closeInventory();
                        } else {
                            ui.openInventory();
                        }
                    }
                }
            }
        });

        window.addEventListener('keyup', e => {
            this.keys[e.code] = false;
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
            
            const ge = this.get('GameEngine');
            const ui = this.get('UIManager');
            const startScreen = document.getElementById('startScreen');
            const isStartScreenVisible = startScreen && startScreen.style.display !== 'none';

            // 게임 중이고 UI가 닫혀있으면 포인터 락 요청
            if (ge && (ge.currentState === GAME_STATE.PLAYING || ge.currentState === GAME_STATE.TOWN) && 
                !ui.isAnyUIOpen() && !isStartScreenVisible && !window.isGamePaused) {
                canvas.requestPointerLock();
            }
        });

        window.addEventListener('mouseup', e => { 
            if(e.button === 0) this.mouse.leftDown = false; 
            if(e.button === 2) this.mouse.rightDown = false; 
        });

        canvas.addEventListener('contextmenu', e => e.preventDefault());
        
        if (this.isTouchDevice) {
            this.initMobileControls();
        }
    }

    resetMouse() { 
        this.mouse.leftDown = false; 
        this.mouse.rightDown = false; 
        this.mouseDelta = { x: 0, y: 0 };
    }

    // (모바일 컨트롤 로직은 이전과 동일하게 유지...)
    initMobileControls() {
        const mobileContainer = document.getElementById('mobileControls');
        if (mobileContainer) mobileContainer.classList.remove('hidden');
        // ... (필요 시 세부 구현 추가)
    }
}
