/**
 * SoundManager: 오디오 재생, 볼륨 제어 및 청력 보호를 위한 리미터 기능을 관리합니다.
 */
class SoundManager {
  constructor() {
    // Web Audio API 컨텍스트 초기화
    this.context = new (window.AudioContext || window.webkitAudioContext)();

    // 1. 리미터 (DynamicsCompressorNode): 갑작스러운 큰 소리를 방지하고 클리핑을 막습니다.
    this.limiter = this.context.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-12, this.context.currentTime); // -12dB부터 압축 시작
    this.limiter.knee.setValueAtTime(30, this.context.currentTime);      // 부드러운 곡선 적용
    this.limiter.ratio.setValueAtTime(12, this.context.currentTime);     // 강한 압축 비율 (리미터 역할)
    this.limiter.attack.setValueAtTime(0.003, this.context.currentTime); // 빠른 반응 속도
    this.limiter.release.setValueAtTime(0.25, this.context.currentTime); // 자연스러운 잔향 유지

    // 2. 마스터 게인: 전체 볼륨 제어
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.8;

    // 3. 카테고리별 게인: BGM과 SFX 개별 조절
    this.bgmGain = this.context.createGain();
    this.bgmGain.gain.value = 0.35; // 배경음악 기본 볼륨 (기존보다 낮게 설정)

    this.sfxGain = this.context.createGain();
    this.sfxGain.gain.value = 0.6;  // 효과음 기본 볼륨

    // 오디오 그래프 연결: [BGM/SFX] -> Master -> Limiter -> 출력(Destination)
    this.bgmGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.limiter);
    this.limiter.connect(this.context.destination);
  }

  /**
   * 배경음악 볼륨 설정 (0.0 ~ 1.0)
   */
  setBGMVolume(value) {
    const volume = Math.max(0, Math.min(1, value));
    this.bgmGain.gain.setTargetAtTime(volume, this.context.currentTime, 0.1);
  }

  /**
   * 효과음 볼륨 설정 (0.0 ~ 1.0)
   */
  setSFXVolume(value) {
    const volume = Math.max(0, Math.min(1, value));
    this.sfxGain.gain.setTargetAtTime(volume, this.context.currentTime, 0.1);
  }

  /**
   * 브라우저 정책에 따른 오디오 컨텍스트 재개
   */
  async resume() {
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }
}

module.exports = new SoundManager();