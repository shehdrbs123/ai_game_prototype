
import { DIContainer } from '../core/DIContainer.js';

export class CheatManager {
    constructor(c) {
        this.c = c;
        this.consoleElement = document.getElementById('cheatConsole');
        this.consoleOutput = document.getElementById('cheatOutput');
        this.consoleInput = document.getElementById('cheatInput');
        this.commandPredictions = document.getElementById('commandPredictions');
        this.isOpen = false;

        this.commands = {
            'additem': 'additem <itemId> [quantity] - Adds an item to inventory.',
            'godmode': 'godmode - Toggles player invincibility.',
            'help': 'help - Shows all available commands.'
        };

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

    toggleConsole() {
        this.isOpen = !this.isOpen;
        this.consoleElement.style.display = this.isOpen ? 'flex' : 'none';
        if (this.isOpen) {
            this.consoleInput.focus();
        } else {
            this.consoleInput.value = '';
            this.updatePredictions();
        }
    }

    log(message) {
        const line = document.createElement('div');
        line.textContent = message;
        this.consoleOutput.appendChild(line);
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
    }

    getPredictions(input) {
        if (!input) return [];
        const inputText = input.toLowerCase();
        if (!inputText) return [];
        return Object.keys(this.commands).filter(cmd => cmd.startsWith(inputText));
    }

    updatePredictions() {
        if (!this.commandPredictions) return;
        const predictions = this.getPredictions(this.consoleInput.value);
        if (predictions.length > 0 && this.consoleInput.value.length > 0) {
            this.commandPredictions.innerHTML = predictions.map(p => `<div>${this.commands[p]}</div>`).join('');
            this.commandPredictions.style.display = 'block';
        } else {
            this.commandPredictions.style.display = 'none';
        }
    }

    handleCommand(command) {
        const [cmd, ...args] = command.split(' ');
        this.log(`> ${command}`);

        switch (cmd.toLowerCase()) {
            case 'additem':
                this.addItem(args);
                break;
            case 'godmode':
                this.godMode();
                break;
            case 'help':
                this.log('Available commands:');
                Object.values(this.commands).forEach(desc => this.log(desc));
                break;
            default:
                this.log(`Unknown command: ${cmd}`);
        }
    }

    addItem(args) {
        const [itemId, quantityStr] = args;
        const quantity = parseInt(quantityStr) || 1;
        const playerSession = this.c.get('PlayerSession');
        const dataManager = this.c.get('DataManager');

        const itemData = dataManager.getItem(itemId);
        if (!itemData) {
            this.log(`Error: Item "${itemId}" not found.`);
            return;
        }

        playerSession.inventory.addItem(itemId, quantity);
        this.log(`Added ${quantity} of ${itemData.name} (${itemId}) to inventory.`);
        this.c.get('UIManager').refreshInventory();
    }

    godMode() {
        const player = this.c.get('EntityManager').player;
        if (player) {
            player.isInvincible = !player.isInvincible;
            this.log(`God mode ${player.isInvincible ? 'enabled' : 'disabled'}.`);
            this.c.get('UIManager').showToast(`God Mode ${player.isInvincible ? 'ON' : 'OFF'}`);
        } else {
            this.log('Error: Player not found.');
        }
    }
}
