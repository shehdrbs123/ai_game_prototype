import { BaseManager } from '../core/BaseManager.js';

/**
 * AudioSystem: 오디오 컨텍스트 관리, BGM/SFX 채널 믹싱, 사운드 이펙트 재생을 담당합니다.
 * C# Porting: Unity의 AudioMixer, AudioSource, AudioClip 시스템으로 대응됩니다.
 */
export class AudioSystem extends BaseManager {
    /**
     * @param {DIContainer} app 
     */
    constructor(app) {
        super(app);
        
        /** @private @type {AudioContext} */
        this.ctx = null;
        
        // --- Audio Graph Nodes (Unity AudioMixer와 유사한 구조) ---
        /** @private @type {DynamicsCompressorNode} 리미터 역할 */
        this.limiter = null;
        /** @private @type {GainNode} 전체 볼륨 */
        this.masterGain = null;
        /** @private @type {GainNode} 배경음 볼륨 */
        this.bgmGain = null;
        /** @private @type {GainNode} 효과음 볼륨 */
        this.sfxGain = null;
        
        /** @private @type {HTMLElement} MIDI 플레이어 참조 */
        this.midiPlayer = null;
        
        /** @private @type {string|null} 현재 재생 중인 BGM 이름 */
        this.currentBGM = null;
    }

    /**
     * 시스템 초기화
     */
    init() {
        if (this.ctx) return;
        
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            console.error('AudioSystem: Web Audio API not supported.');
            return;
        }

        this.ctx = new AudioContext();
        
        // 1. Limiter (DynamicsCompressorNode): 피크 클리핑 방지
        this.limiter = this.ctx.createDynamicsCompressor();
        this.limiter.threshold.setValueAtTime(-12, this.ctx.currentTime);
        this.limiter.knee.setValueAtTime(30, this.ctx.currentTime);
        this.limiter.ratio.setValueAtTime(12, this.ctx.currentTime);
        this.limiter.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.limiter.release.setValueAtTime(0.25, this.ctx.currentTime);
        
        // 2. Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;
        
        // 3. Category Gains (Channels)
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.4;
        
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.7;
        
        // 연결 구조: [Source] -> (BGM/SFX Gain) -> Master Gain -> Limiter -> Destination
        this.bgmGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.limiter);
        this.limiter.connect(this.ctx.destination);
        
        // MIDI 플레이어 참조
        this.midiPlayer = document.getElementById('bgmPlayer');
        
        this.initialized = true;
        console.log('AudioSystem initialized with Master/BGM/SFX channels.');
    }

    /**
     * 배경음악 볼륨 설정 (0.0 ~ 1.0)
     */
    setBGMVolume(value) {
        if (!this.bgmGain) return;
        this.bgmGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.1);
    }

    /**
     * 효과음 볼륨 설정 (0.0 ~ 1.0)
     */
    setSFXVolume(value) {
        if (!this.sfxGain) return;
        this.sfxGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.1);
    }

    /**
     * 효과음(SFX)을 재생합니다.
     * C# Porting: AudioSource.PlayOneShot(clip)으로 대응됩니다.
     * @param {string} type 사운드 타입 (ui, sword, hit 등)
     * @param {number} vol 개별 볼륨 배율
     */
    play(type, vol = 1) {
        if (!this.initialized) this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        let t = this.ctx.currentTime;
        
        // 효과음 채널(sfxGain)에 연결
        gain.connect(this.sfxGain);
        
        switch(type) {
            case 'ui':
                osc.type = 'sine'; osc.frequency.setValueAtTime(600, t);
                gain.gain.setValueAtTime(0.1 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.connect(gain); osc.start(t); osc.stop(t + 0.1); break;
            case 'hit':
                osc.type = 'square'; osc.frequency.setValueAtTime(100, t); osc.frequency.exponentialRampToValueAtTime(20, t + 0.1);
                gain.gain.setValueAtTime(0.2 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.connect(gain); osc.start(t); osc.stop(t + 0.1); break;
            case 'sword':
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
                gain.gain.setValueAtTime(0.15 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                osc.connect(gain); osc.start(t); osc.stop(t + 0.2); break;
            case 'step':
                // 발소리: 낮은 주파수의 삼각형파 + 아주 짧은 노이즈 버스트 조합 (타격감 개선)
                osc.type = 'triangle'; 
                osc.frequency.setValueAtTime(60, t); 
                osc.frequency.exponentialRampToValueAtTime(10, t + 0.1);
                gain.gain.setValueAtTime(0.1 * vol, t); 
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                
                // 짧은 노이즈 추가 (바닥 닿는 소리)
                const stepBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.02, this.ctx.sampleRate);
                const stepOut = stepBuf.getChannelData(0);
                for(let i = 0; i < stepOut.length; i++) stepOut[i] = Math.random() * 2 - 1;
                const stepNoise = this.ctx.createBufferSource();
                stepNoise.buffer = stepBuf;
                const stepNGain = this.ctx.createGain();
                stepNGain.gain.setValueAtTime(0.03 * vol, t);
                stepNGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
                stepNoise.connect(stepNGain); stepNGain.connect(this.sfxGain);
                stepNoise.start(t);

                osc.connect(gain); osc.start(t); osc.stop(t + 0.1); break;
            case 'dash':
                osc.type = 'sine'; osc.frequency.setValueAtTime(800, t); osc.frequency.exponentialRampToValueAtTime(100, t + 0.25);
                gain.gain.setValueAtTime(0.1 * vol, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                osc.connect(gain); osc.start(t); osc.stop(t + 0.25); break;
            // ... (추가 사운드 타입은 필요 시 확장)
            default:
                // 기본 효과음
                osc.type = 'sine'; osc.frequency.setValueAtTime(440, t);
                gain.gain.setValueAtTime(0.05 * vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                osc.connect(gain); osc.start(t); osc.stop(t + 0.1);
        }
    }

    /**
     * 배경음악(BGM)을 시작합니다.
     * @param {string} type 
     */
    async startBGM(type = 'dungeon') {
        if (!this.initialized) this.init();
        if (!this.ctx || !this.midiPlayer) return;

        if (this.currentBGM === type) return;
        this.currentBGM = type;
        
        const trackId = 'bgm'; // 추후 기획에 따라 맵핑
        try {
            const response = await fetch(`/midi/token/${trackId}`);
            if (!response.ok) throw new Error(`MIDI token fail: ${response.statusText}`);
            const { token } = await response.json();
            const midiUrl = `/midi/asset/${trackId}?token=${encodeURIComponent(token)}`;
            
            if (window.customElements && customElements.whenDefined) {
                await customElements.whenDefined('midi-player');
            }
            
            this.midiPlayer.src = midiUrl;
            
            // 로딩 대기 후 재생
            setTimeout(() => {
                if (typeof this.midiPlayer.start === 'function') {
                    this.midiPlayer.start();
                }
            }, 1000);
            
            console.log(`AudioSystem: BGM '${type}' started.`);
        } catch (error) {
            console.error('AudioSystem: BGM failed:', error);
            this.currentBGM = null;
        }
    }

    stopBGM() {
        this.currentBGM = null;
        if (this.midiPlayer) {
            this.midiPlayer.stop();
        }
    }

    destroy() {
        if (this.ctx) {
            this.ctx.close();
        }
        super.destroy();
    }
}
