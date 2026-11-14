/*/ Procedural Web Audio API Sound Generator (Zero External MP3 Dependencies) /*/
/*/ Ported from Space Museum Experiment Audio Engine /*/

export class SoundEffects {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.lastStepTime = 0;
  }

  /*/ Initialize or resume Web Audio Context on user interaction /*/
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /*/ Soft rhythmic footstep audio for walking (380ms interval) and sprinting (240ms interval) /*/
  playFootstep(isSprinting = false) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = Date.now();
    const minInterval = isSprinting ? 240 : 380;
    if (now - this.lastStepTime < minInterval) return;
    this.lastStepTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      /*/ Low frequency click with subtle procedural pitch jitter /*/
      const baseFreq = isSprinting ? 120 : 105;
      osc.frequency.setValueAtTime(baseFreq + Math.random() * 20, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + (isSprinting ? 0.06 : 0.08));

      const stepVolume = isSprinting ? 0.08 : 0.05;
      gain.gain.setValueAtTime(stepVolume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isSprinting ? 0.06 : 0.08));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (e) {
      /*/ Browser audio policy restriction safeguard /*/
    }
  }

  /*/ Jump lift audio /*/
  playJump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.17);
    } catch (e) {}
  }

  /*/ Landing thump audio /*/
  playLand() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(90, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch (e) {}
  }

  /*/ Sci-fi melodic chime for exhibit inspection and cinema seat selection /*/
  playExhibitChime() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const freqs = [523.25, 659.25, 783.99, 1046.5]; /*/ C - E - G - C celestial chord /*/
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.05);

        const startTime = this.ctx.currentTime + idx * 0.05;
        gain.gain.setValueAtTime(0.07, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } catch (e) {}
  }

  /*/ Toggle mute state /*/
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}
