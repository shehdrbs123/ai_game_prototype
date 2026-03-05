export class AudioSystem {
    constructor() {
        this.ctx = null;
        this.compressor = null;
        this.masterGain = null;
        this.midiPlayer = null;
        this.currentBGM = null;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.ctx = new AudioContext();
        
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -15;
        this.compressor.knee.value = 10;
        this.compressor.ratio.value = 12;
        this.compressor.attack.value = 0.01;
        this.compressor.release.value = 0.25;
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.7; 
        
        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        
        // Get the MIDI player element
        this.midiPlayer = document.getElementById('bgmPlayer');
        if (this.midiPlayer) {
            // Route the MIDI player's output through our Web Audio API context
            this.midiPlayer.connect(this.masterGain);
        }
    }

    play(type, vol = 1) {
        if (!this.ctx) this.init(); if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        let t = this.ctx.currentTime;
        
        switch(type) {
            case 'ui':
                osc.type = 'sine'; osc.frequency.setValueAtTime(600, t);
                gain.gain.setValueAtTime(0.05 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.1); break;
            case 'pick':
                osc.type = 'sine'; osc.frequency.setValueAtTime(400, t); osc.frequency.linearRampToValueAtTime(800, t + 0.1);
                gain.gain.setValueAtTime(0.05 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.1); break;
            case 'drop':
                osc.type = 'triangle'; osc.frequency.setValueAtTime(400, t); osc.frequency.linearRampToValueAtTime(200, t + 0.1);
                gain.gain.setValueAtTime(0.05 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.1); break;
            case 'inv_move':
                osc.type = 'sine'; osc.frequency.setValueAtTime(300, t); osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
                gain.gain.setValueAtTime(0.08 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.05); break;
            case 'equip':
                osc.type = 'triangle'; osc.frequency.setValueAtTime(600, t); osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);
                gain.gain.setValueAtTime(0.15 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.1); break;
            case 'sword':
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
                gain.gain.setValueAtTime(0.05 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.2); break;
            case 'spear':
                osc.type = 'triangle'; osc.frequency.setValueAtTime(300, t); osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
                gain.gain.setValueAtTime(0.05 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.15); break;
            case 'bow':
                osc.type = 'sine'; osc.frequency.setValueAtTime(800, t); osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);
                gain.gain.setValueAtTime(0.05 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.15); break;
            case 'enemy_melee':
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, t); osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);
                gain.gain.setValueAtTime(0.06 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.15); break;
            case 'enemy_ranged':
                osc.type = 'square'; osc.frequency.setValueAtTime(400, t); osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);
                gain.gain.setValueAtTime(0.03 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.2); break;
            case 'hit':
                osc.type = 'square'; osc.frequency.setValueAtTime(100, t); osc.frequency.exponentialRampToValueAtTime(20, t + 0.1);
                gain.gain.setValueAtTime(0.1 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.1); break;
            case 'loot':
                let bSize = this.ctx.sampleRate * 0.15; let noiseBuf = this.ctx.createBuffer(1, bSize, this.ctx.sampleRate);
                let out = noiseBuf.getChannelData(0); for(let i = 0; i < bSize; i++) out[i] = (Math.random() * 2 - 1) * 0.7;
                let noiseSource = this.ctx.createBufferSource(); noiseSource.buffer = noiseBuf;
                let bandpass = this.ctx.createBiquadFilter(); bandpass.type = 'lowpass'; bandpass.frequency.value = 300; 
                noiseSource.connect(bandpass); bandpass.connect(gain); gain.connect(this.compressor);
                gain.gain.setValueAtTime(0.5 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
                noiseSource.start(t); break;
            case 'success':
                osc.type = 'triangle'; osc.frequency.setValueAtTime(440, t); osc.frequency.setValueAtTime(554, t + 0.1);
                osc.frequency.setValueAtTime(659, t + 0.2); osc.frequency.setValueAtTime(880, t + 0.3);
                gain.gain.setValueAtTime(0.1 * vol, t); gain.gain.linearRampToValueAtTime(0.1, t + 0.3); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.8);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.8); break;
            case 'fail':
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, t); osc.frequency.linearRampToValueAtTime(50, t + 0.5);
                gain.gain.setValueAtTime(0.1 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.5); break;
            case 'dash':
                osc.type = 'sine'; osc.frequency.setValueAtTime(800, t); osc.frequency.exponentialRampToValueAtTime(100, t + 0.25);
                gain.gain.setValueAtTime(0.1 * vol, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.25); break;
            case 'step':
                osc.type = 'sine'; osc.frequency.setValueAtTime(100, t); osc.frequency.exponentialRampToValueAtTime(10, t + 0.05);
                gain.gain.setValueAtTime(0.15 * vol, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                osc.connect(gain); gain.connect(this.compressor); osc.start(t); osc.stop(t + 0.05); break;
        }
    }

    async startBGM(type = 'dungeon') {
        if (!this.initIfNeeded()) return;
        if (this.currentBGM === type && this.midiPlayer && !this.midiPlayer.player.ended) {
            return;
        }
        this.currentBGM = type;
        
        // For now, we only have one BGM track. We can map 'type' to different track IDs later.
        const trackId = 'bgm';

        try {
            console.log(`Fetching token for MIDI track: ${trackId}`);
            const response = await fetch(`/midi/token/${trackId}`);
            if (!response.ok) {
                throw new Error(`Failed to get MIDI token: ${response.statusText}`);
            }
            const { token } = await response.json();
            console.log('Token received, setting player source.');
            
            this.midiPlayer.src = `/midi/asset/${trackId}?token=${encodeURIComponent(token)}`;
            
            // The player will start automatically due to the 'loop' attribute,
            // but we can call start() to be explicit if it's the first time.
            await this.midiPlayer.start();
            console.log('MIDI BGM started.');

        } catch (error) {
            console.error('Could not start BGM:', error);
            this.currentBGM = null;
        }
    }

    stopBGM() {
        this.currentBGM = null;
        if (this.midiPlayer) {
            this.midiPlayer.stop();
            console.log('MIDI BGM stopped.');
        }
    }

    initIfNeeded() {
        if (!this.ctx) this.init();
        if (!this.ctx) {
            console.warn("AudioContext could not be initialized.");
            return false;
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        if (!this.midiPlayer) {
            console.error("Midi player not found!");
            return false;
        }
        return true;
    }
}
