import * as THREE from 'three';

/*/ Synthesized Cinematic Audio - plays on page load /*/
class IntroAudioEngine {
  play() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();

      const now = ctx.currentTime;

      /*/ Deep Sub-Bass Drone /*/
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(65, now);
      sub.frequency.exponentialRampToValueAtTime(32, now + 3.5);
      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.28, now + 0.4);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 4.2);

      /*/ Chime Ping /*/
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(880, now);
      chime.frequency.exponentialRampToValueAtTime(440, now + 0.8);
      chimeGain.gain.setValueAtTime(0.14, now);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(now);
      chime.stop(now + 1.3);
    } catch (e) {}
  }
}

/*/ AAA Cinematic Auto Camera Swoop — no overlay, no button, starts immediately /*/
export class IntroSequence {
  constructor(camera, controls) {
    this.camera = camera;
    this.controls = controls;
    this.audio = new IntroAudioEngine();

    this.isCompleted = false;

    /*/ Bezier flight path: far orbit → curve → final view /*/
    this.startPos   = new THREE.Vector3(120, 160, 240);
    this.midPos     = new THREE.Vector3(55, 65, 110);
    this.endPos     = new THREE.Vector3(0, 35, 75);
    this.startLook  = new THREE.Vector3(0, 0, 0);
    this.endLook    = new THREE.Vector3(0, 2, 0);

    this.duration = 4.5;
    this.elapsed = 0;

    /*/ Skip via ESC /*/
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.isCompleted) this.complete();
    });

    /*/ Start immediately on load /*/
    this.camera.position.copy(this.startPos);
    this.camera.lookAt(this.startLook);
    this.controls.enabled = false;

    /*/ Play audio on first user interaction to satisfy autoplay policy /*/
    const tryAudio = () => {
      this.audio.play();
      window.removeEventListener('pointerdown', tryAudio);
    };
    window.addEventListener('pointerdown', tryAudio, { once: true });
    /*/ Also try immediately in case browser allows it /*/
    try { this.audio.play(); } catch (e) {}
  }

  update(delta) {
    if (this.isCompleted) return;

    this.elapsed += delta;
    const t = Math.min(1.0, this.elapsed / this.duration);

    /*/ Cubic ease-out deceleration /*/
    const ease = 1 - Math.pow(1 - t, 3.5);

    /*/ Quadratic Bezier position /*/
    const e1 = 1 - ease;
    const pos = new THREE.Vector3(
      e1 * e1 * this.startPos.x + 2 * e1 * ease * this.midPos.x + ease * ease * this.endPos.x,
      e1 * e1 * this.startPos.y + 2 * e1 * ease * this.midPos.y + ease * ease * this.endPos.y,
      e1 * e1 * this.startPos.z + 2 * e1 * ease * this.midPos.z + ease * ease * this.endPos.z
    );

    this.camera.position.copy(pos);
    this.camera.lookAt(new THREE.Vector3().lerpVectors(this.startLook, this.endLook, ease));

    if (t >= 1.0) this.complete();
  }

  complete() {
    if (this.isCompleted) return;
    this.isCompleted = true;

    this.camera.position.copy(this.endPos);
    this.controls.enabled = true;
    this.controls.target.copy(this.endLook);
    this.controls.update();

    /*/ Reveal HUD /*/
    const hud = document.querySelector('.space-hud');
    if (hud) hud.classList.add('visible');
  }
}
