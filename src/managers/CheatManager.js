import { BaseManager } from '../core/BaseManager.js';

/**
 * CheatManager: 개발 및 테스트를 위한 치트 명령어를 처리합니다.
 * C# Porting: Unity의 Debug Console 또는 In-game Cheat System으로 대응됩니다.
 */
export class CheatManager extends BaseManager {
    /**
     * @param {DIContainer} app 
     */
    constructor(app) {
        super(app);
        
        // UI 요소 참조
        this.consoleElement = document.getElementById('cheatConsole');
        this.consoleOutput = document.getElementById('cheatOutput');
        this.consoleInput = document.getElementById('cheatInput');
        this.commandPredictions = document.getElementById('commandPredictions');
        
        this.isOpen = false;

        // 명령어 정의 (C# Dictionary/Map 대응)
        this.commands = {
            'additem': 'additem <itemId> [quantity] - 아이템을 인벤토리에 추가합니다.',
            'godmode': 'godmode - 플레이어 무적 모드를 토글합니다.',
            'help': 'help - 사용 가능한 모든 명령어를 표시합니다.',
            'gold': 'gold <amount> - 골드를 추가합니다.'
        };

        this.setupEventListeners();
    }

    init() {
        super.init();
        console.log('CheatManager initialized.');
    }

    /**
     * DOM 이벤트 리스너 설정
     */
    setupEventListeners() {
        if (!this.consoleInput) return;

        this.consoleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleCommand(this.consoleInput.value);
                this.consoleInput.value = '';
                this.updatePredictions();
                e.stopPropagation();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                const predictions = this.getPredictions(this.consoleInput.value);
                if (predictions.length > 0) {
                    this.consoleInput.value = predictions[0];
                }
                this.updatePredictions();
            }
        });
        
        this.consoleInput.addEventListener('input', () => {
            this.updatePredictions();
        });
    }

    /**
     * 콘솔 창 토글
     */
    toggleConsole() {
        this.isOpen = !this.isOpen;
        if (this.consoleElement) {
            this.consoleElement.style.display = this.isOpen ? 'flex' : 'none';
        }
        
        if (this.isOpen && this.consoleInput) {
            this.consoleInput.focus();
            this.get('InputManager').resetMouse();
        } else if (this.consoleInput) {
            this.consoleInput.value = '';
            this.updatePredictions();
        }
    }

    /**
     * 콘솔에 메시지 출력
     */
    log(message) {
        if (!this.consoleOutput) return;
        const line = document.createElement('div');
        line.textContent = message;
        this.consoleOutput.appendChild(line);
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
    }

    /**
     * 명령어 자동완성 제안
     */
    getPredictions(input) {
        if (!input) return [];
        const inputText = input.toLowerCase();
        return Object.keys(this.commands).filter(cmd => cmd.startsWith(inputText));
    }

    /**
     * 제안 UI 업데이트
     */
    updatePredictions() {
        if (!this.commandPredictions || !this.consoleInput) return;
        const predictions = this.getPredictions(this.consoleInput.value);
        
        if (predictions.length > 0 && this.consoleInput.value.length > 0) {
            this.commandPredictions.innerHTML = predictions.map(p => `<div>${this.commands[p]}</div>`).join('');
            this.commandPredictions.style.display = 'block';
        } else {
            this.commandPredictions.style.display = 'none';
        }
    }

    /**
     * 입력된 명령어 처리
     */
    handleCommand(command) {
        if (!command.trim()) return;
        const [cmd, ...args] = command.trim().split(/\s+/);
        this.log(`> ${command}`);

        switch (cmd.toLowerCase()) {
            case 'additem':
                this.cmdAddItem(args);
                break;
            case 'godmode':
                this.cmdGodMode();
                break;
            case 'gold':
                this.cmdAddGold(args);
                break;
            case 'help':
                this.log('사용 가능한 명령어:');
                Object.values(this.commands).forEach(desc => this.log(desc));
                break;
            default:
                this.log(`알 수 없는 명령어: ${cmd}`);
        }
    }

    // --- 개별 치트 명령어 구현 ---

    cmdAddItem(args) {
        const [itemId, quantityStr] = args;
        const quantity = parseInt(quantityStr) || 1;
        const session = this.get('PlayerSession');
        const data = this.get('DataManager');

        const itemData = data.getItem(itemId);
        if (!itemData) {
            this.log(`에러: 아이템 "${itemId}"을 찾을 수 없습니다.`);
            return;
        }

        for (let i = 0; i < quantity; i++) {
            session.giveItem(itemData);
        }
        this.log(`${itemData.name} (${itemId}) ${quantity}개를 추가했습니다.`);
    }

    cmdGodMode() {
        const player = this.get('EntityManager').player;
        if (player) {
            player.isInvincible = !player.isInvincible;
            this.log(`무적 모드: ${player.isInvincible ? 'ON' : 'OFF'}`);
            this.events.emit('SHOW_TOAST', { message: `무적 모드 ${player.isInvincible ? 'ON' : 'OFF'}` });
        } else {
            this.log('에러: 플레이어를 찾을 수 없습니다.');
        }
    }

    cmdAddGold(args) {
        const amount = parseInt(args[0]) || 1000;
        const session = this.get('PlayerSession');
        session.meta.valuables += amount;
        this.log(`${amount} 골드를 추가했습니다.`);
        this.events.emit('PLAYER_DATA_CHANGED');
    }
}
