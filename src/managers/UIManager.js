import { BaseManager } from '../core/BaseManager.js';

/**
 * 게임의 모든 UI 레이어와 뷰를 관리합니다.
 */
export class UIManager extends BaseManager {
    constructor(app) {
        super(app);
        this.currentView = null;
        this.views = new Map();
        
        // UI 요소 참조
        this.elements = {
            hud: document.getElementById('hud'),
            inventory: document.getElementById('inventory-overlay'),
            crafting: document.getElementById('crafting-overlay'),
            settings: document.getElementById('settings-overlay')
        };
    }

    init() {
        console.log("UIManager: Initializing...");
        this._setupEventListeners();
        this.showView('HUD');
        super.init();
    }

    _setupEventListeners() {
        // 설정 메뉴 버튼 이벤트 연결 (HEAD의 변경사항)
        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) {
            resumeBtn.onclick = () => {
                this.hideSettings();
                this.get('GameEngine').resume();
            };
        }

        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.onclick = () => {
                console.log("Settings menu opened");
            };
        }

        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) {
            quitBtn.onclick = () => {
                if (confirm("정말로 종료하시겠습니까?")) {
                    window.location.reload();
                }
            };
        }
    }

    // --- 뷰 관리 로직 ---

    showView(viewName) {
        console.log(`UIManager: Showing view ${viewName}`);
        // 뷰 전환 로직...
    }

    showSettings() {
        if (this.elements.settings) {
            this.elements.settings.classList.remove('hidden');
            this.get('GameEngine').pause();
        }
    }

    hideSettings() {
        if (this.elements.settings) {
            this.elements.settings.classList.add('hidden');
        }
    }

    // --- 던전 및 에디터 관련 UI (원격 브랜치 통합) ---

    updateDungeonInfo(plan) {
        if (!plan) return;
        console.log("UIManager: Updating dungeon info UI", plan);
        // 던전 계획 정보를 화면에 표시하는 로직
    }
}
