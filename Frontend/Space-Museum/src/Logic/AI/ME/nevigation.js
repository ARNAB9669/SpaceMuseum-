import * as THREE from 'three';

/*/ Synthesized Atmospheric Entry & Docking Audio Engine /*/
class LandingAudioEngine {
  play() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      /*/ Deep Sub-Bass Atmospheric Descent /*/
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(95, now);
      sub.frequency.exponentialRampToValueAtTime(34, now + 2.4);
      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.35, now + 0.5);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 2.7);

      /*/ Pressurization White-Noise Decompression /*/
      const bufferSize = ctx.sampleRate * 1.5;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + 1.6);
      filter.Q.setValueAtTime(3.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);
      whiteNoise.stop(now + 1.9);

      /*/ Hermetic Seal Docking Chime /*/
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(587.33, now + 1.4);
      chime.frequency.setValueAtTime(880.0, now + 1.65);
      chimeGain.gain.setValueAtTime(0.001, now + 1.4);
      chimeGain.gain.linearRampToValueAtTime(0.18, now + 1.66);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(now + 1.4);
      chime.stop(now + 2.6);
    } catch (e) {}
  }
}

/*/ First-Person POV Controller with smooth landing, WASD movement and mouse look /*/
export class FirstPersonController {
  constructor(camera, domElement, orbitControls) {
    this.camera = camera;
    this.domElement = domElement;
    this.orbitControls = orbitControls;
    this.audio = new LandingAudioEngine();

    /*/ Operational State /*/
    this.isFirstPerson = false;
    this.isLanding = false;
    this.isAscending = false;

    /*/ Human Eye Height relative to Museum Floor (Floor Y = -1.87) /*/
    this.baseEyeHeight = -0.15;
    this.islandRadiusLimit = 38.0;

    /*/ View Angles /*/
    this.yaw = 0;
    this.pitch = 0;
    this.mouseSensitivity = 0.0022;

    /*/ Physics & Motion Velocity /*/
    this.velocity = new THREE.Vector3();
    this.walkSpeed = 6.2;
    this.sprintSpeed = 11.0;
    this.damping = 9.0;
    this.headBobTimer = 0;

    /*/ Input Map /*/
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false
    };

    /*/ Mouse Drag Fallback when PointerLock is not active /*/
    this.isDragging = false;
    this.prevPointerX = 0;
    this.prevPointerY = 0;

    this.initEventListeners();
    this.initHUD();
  }

  initHUD() {
    /*/ Create First-Person Navigation HUD element /*/
    this.hudElement = document.createElement('div');
    this.hudElement.className = 'firstperson-hud';
    this.hudElement.innerHTML = `
      <div class="fp-status-badge">
        <span class="fp-pulse-dot"></span>
        FIRST-PERSON POV ACTIVE
      </div>
      <div class="fp-instructions">
        <span>[W][A][S][D]</span> Move &bull; <span>[SHIFT]</span> Sprint &bull; <span>Mouse</span> Look
      </div>
      <button class="btn-orbit-return" id="btn-return-orbit">
        ORBIT VIEW [ESC]
      </button>
    `;
    document.body.appendChild(this.hudElement);

    /*/ Reticle Dot /*/
    this.reticle = document.createElement('div');
    this.reticle.className = 'firstperson-reticle';
    document.body.appendChild(this.reticle);

    /*/ Return Button Listener /*/
    const returnBtn = this.hudElement.querySelector('#btn-return-orbit');
    if (returnBtn) {
      returnBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.returnToOrbit();
      });
    }
  }

  initEventListeners() {
    /*/ Keyboard Listeners /*/
    window.addEventListener('keydown', (e) => {
      if (!this.isFirstPerson) return;

      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = true;

      /*/ ESC returns to orbit view /*/
      if (e.code === 'Escape') {
        this.returnToOrbit();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.sprint = false;
    });

    /*/ Pointer Lock Support /*/
    this.domElement.addEventListener('click', () => {
      if (this.isFirstPerson && !this.isLanding && !this.isAscending) {
        if (document.pointerLockElement !== this.domElement) {
          try {
            this.domElement.requestPointerLock();
          } catch (err) {}
        }
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.hasPointerLock = (document.pointerLockElement === this.domElement);
    });

    /*/ Mouse Look with Pointer Lock or Dragging /*/
    window.addEventListener('mousemove', (e) => {
      if (!this.isFirstPerson || this.isLanding || this.isAscending) return;

      if (this.hasPointerLock) {
        this.yaw -= e.movementX * this.mouseSensitivity;
        this.pitch -= e.movementY * this.mouseSensitivity;
        this.clampPitch();
      } else if (this.isDragging) {
        const dx = e.clientX - this.prevPointerX;
        const dy = e.clientY - this.prevPointerY;
        this.prevPointerX = e.clientX;
        this.prevPointerY = e.clientY;

        this.yaw -= dx * this.mouseSensitivity;
        this.pitch -= dy * this.mouseSensitivity;
        this.clampPitch();
      }
    });

    /*/ Drag fallback when pointer is not locked /*/
    this.domElement.addEventListener('pointerdown', (e) => {
      if (this.isFirstPerson && !this.hasPointerLock) {
        this.isDragging = true;
        this.prevPointerX = e.clientX;
        this.prevPointerY = e.clientY;
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });
  }

  clampPitch() {
    /*/ Clamp vertical look angle to avoid gimbal flips /*/
    const maxPitch = Math.PI * 0.44;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  /*/ Smooth Cinematic Landing from Orbit into Museum Interior /*/
  landInside(onComplete) {
    if (this.isLanding || this.isFirstPerson) return;
    this.isLanding = true;

    /*/ Trigger synthesized entry audio /*/
    this.audio.play();

    /*/ Disable OrbitControls during landing /*/
    this.orbitControls.enabled = false;

    /*/ Starting Camera State /*/
    const startPos = this.camera.position.clone();

    /*/ Target Landing Spot in Museum Plaza /*/
    const targetPos = new THREE.Vector3(0, this.baseEyeHeight, -13);
    const targetLook = new THREE.Vector3(3.5, 1.2, 5.0);

    /*/ High apex waypoint for a grand sweeping trajectory /*/
    const midPos = new THREE.Vector3(
      startPos.x * 0.4,
      Math.max(startPos.y * 0.5, 18),
      startPos.z * 0.4
    );

    const duration = 2.8;
    let elapsed = 0;

    const animateLanding = () => {
      if (!this.isLanding) return;

      const dt = 0.016;
      elapsed += dt;
      const t = Math.min(1.0, elapsed / duration);

      /*/ Quintic EaseInOut for silky smooth acceleration & touchdown /*/
      const ease = t < 0.5
        ? 16 * t * t * t * t * t
        : 1 - Math.pow(-2 * t + 2, 5) / 2;

      /*/ Quadratic Bezier Curve from Orbit -> Canopy -> Plaza /*/
      const inv = 1 - ease;
      const currentPos = new THREE.Vector3(
        inv * inv * startPos.x + 2 * inv * ease * midPos.x + ease * ease * targetPos.x,
        inv * inv * startPos.y + 2 * inv * ease * midPos.y + ease * ease * targetPos.y,
        inv * inv * startPos.z + 2 * inv * ease * midPos.z + ease * ease * targetPos.z
      );

      this.camera.position.copy(currentPos);

      /*/ Interpolate Look Direction /*/
      const lookAtPt = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 2, 0), targetLook, ease);
      this.camera.lookAt(lookAtPt);

      if (t < 1.0) {
        requestAnimationFrame(animateLanding);
      } else {
        this.isLanding = false;
        this.isFirstPerson = true;

        /*/ Compute initial yaw/pitch from arrived orientation /*/
        const dir = new THREE.Vector3().subVectors(targetLook, targetPos).normalize();
        this.yaw = Math.atan2(-dir.x, -dir.z);
        this.pitch = Math.asin(dir.y);

        /*/ Show First-Person UI /*/
        if (this.hudElement) this.hudElement.classList.add('visible');
        if (this.reticle) this.reticle.classList.add('visible');

        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animateLanding);
  }

  /*/ Return smoothly from First Person to Orbit View /*/
  returnToOrbit(onComplete) {
    if (this.isAscending || !this.isFirstPerson) return;
    this.isAscending = true;
    this.isFirstPerson = false;

    /*/ Release Pointer Lock /*/
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    /*/ Hide First-Person UI /*/
    if (this.hudElement) this.hudElement.classList.remove('visible');
    if (this.reticle) this.reticle.classList.remove('visible');

    const startPos = this.camera.position.clone();
    const targetOrbitPos = new THREE.Vector3(0, 35, 75);
    const targetCenter = new THREE.Vector3(0, 2, 0);

    const duration = 2.0;
    let elapsed = 0;

    const animateAscent = () => {
      elapsed += 0.016;
      const t = Math.min(1.0, elapsed / duration);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(startPos, targetOrbitPos, ease);
      this.camera.lookAt(targetCenter);

      if (t < 1.0) {
        requestAnimationFrame(animateAscent);
      } else {
        this.isAscending = false;
        this.orbitControls.enabled = true;
        this.orbitControls.target.copy(targetCenter);
        this.orbitControls.update();

        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(animateAscent);
  }

  /*/ Frame Update: Computes First-Person Camera Motion & Damping /*/
  update(delta) {
    if (!this.isFirstPerson || this.isLanding || this.isAscending) return;

    /*/ Compute Horizontal Forward & Right Movement Vectors /*/
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    /*/ Desired Movement Direction /*/
    const inputDir = new THREE.Vector3();
    if (this.keys.forward) inputDir.add(forward);
    if (this.keys.backward) inputDir.sub(forward);
    if (this.keys.right) inputDir.add(right);
    if (this.keys.left) inputDir.sub(right);

    const speed = this.keys.sprint ? this.sprintSpeed : this.walkSpeed;
    const isMoving = inputDir.lengthSq() > 0.001;

    if (isMoving) {
      inputDir.normalize();
      const targetVel = inputDir.multiplyScalar(speed);
      this.velocity.lerp(targetVel, Math.min(1.0, delta * this.damping));
    } else {
      this.velocity.lerp(new THREE.Vector3(0, 0, 0), Math.min(1.0, delta * this.damping));
    }

    /*/ Apply Movement to Camera Position /*/
    this.camera.position.addScaledVector(this.velocity, delta);

    /*/ Island Radial Boundary Check (keep user on museum platform) /*/
    const horizontalDist = Math.hypot(this.camera.position.x, this.camera.position.z);
    if (horizontalDist > this.islandRadiusLimit) {
      const angle = Math.atan2(this.camera.position.z, this.camera.position.x);
      this.camera.position.x = Math.cos(angle) * this.islandRadiusLimit;
      this.camera.position.z = Math.sin(angle) * this.islandRadiusLimit;
    }

    /*/ Head-bobbing effect while walking /*/
    if (isMoving && this.velocity.length() > 0.5) {
      const bobFreq = this.keys.sprint ? 14.0 : 9.5;
      this.headBobTimer += delta * bobFreq;
      const bobAmount = Math.sin(this.headBobTimer) * 0.035;
      this.camera.position.y = this.baseEyeHeight + bobAmount;
    } else {
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.baseEyeHeight, delta * 6.0);
    }

    /*/ Update Camera Orientation from Euler Angles /*/
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }
}
