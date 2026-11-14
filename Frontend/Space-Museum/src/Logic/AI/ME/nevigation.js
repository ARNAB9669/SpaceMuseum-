import * as THREE from 'three';
import GUI from 'three/addons/libs/lil-gui.module.min.js';
import { SoundEffects } from '../../soundfx.js';

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

  /*/ Soft Melodic Chime for Seat Selection & Interaction /*/
  playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.07);
      osc.frequency.setValueAtTime(783.99, now + 0.14);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {}
  }
}

/*/ First-Person POV Controller with smooth landing, WASD movement and exact experimental flight mode /*/
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

    /*/ Audio & Sound FX Engine (Procedural Footsteps & Chimes) /*/
    this.soundfx = new SoundEffects();

    /*/ Theatre Seated POV Mode /*/
    this.isSeated = false;
    this.currentSeat = null;
    this.seatedEyePos = new THREE.Vector3();
    this.theatre = null;

    /*/ Human Eye Height calibrated to grand monumental architectural scale (Floor Y = -1.87) /*/
    this.baseEyeHeight = -1.32;
    this.islandRadiusLimit = 38.0;
    this.customLandingPos = null;

    /*/ Monumental Field of View & Cinematic Scale /*/
    this.defaultOrbitFov = 60.0;
    this.targetFov = 90.0;

    /*/ View Angles /*/
    this.yaw = 0;
    this.pitch = 0;
    this.mouseSensitivity = 0.0022;

    /*/ Player Ambient Aura Light (Warm incandescent gallery lantern) /*/
    this.playerLight = new THREE.PointLight(0xffedd5, 2.0, 14, 1.4);
    this.playerLight.position.set(0, 0, 0);
    this.camera.add(this.playerLight);

    /*/ Physics & Motion Velocity (Calibrated for grand architectural pacing) /*/
    this.velocity = new THREE.Vector3();
    this.walkSpeed = 1.8;
    this.sprintSpeed = 5.2;
    this.headBobTimer = 0;
    this.bobAmount = 0.025;

    /*/ Developer Drone / Flight Mode (Exact parameters from Experiment player.js) /*/
    this.isFlying = false;
    this.flySpeed = 12.0;
    this.flySprintSpeed = 26.0;

    /*/ Input Map matching Experiment player.js /*/
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      flyUp: false,
      flyDown: false
    };

    /*/ Mouse Drag Fallback when PointerLock is not active /*/
    this.isDragging = false;
    this.prevPointerX = 0;
    this.prevPointerY = 0;

    this.initEventListeners();
    this.initHUD();
    this.initCameraGui();
  }

  /*/ Seated Mode State Synchronizer /*/
  setSeated(isSeated, seatData = null, eyePos = null) {
    this.isSeated = isSeated;
    this.currentSeat = seatData;
    if (eyePos) {
      this.seatedEyePos.copy(eyePos);
    }
    this.velocity.set(0, 0, 0);
  }

  /*/ Melodic UI Chime Audio /*/
  playChime() {
    this.soundfx?.playExhibitChime();
    this.audio?.playChime();
  }

  /*/ Backward compatibility getter /*/
  get isFlightMode() {
    return this.isFlying;
  }

  set isFlightMode(val) {
    this.isFlying = val;
  }

  initHUD() {
    /*/ Create First-Person Navigation HUD element /*/
    this.hudElement = document.createElement('div');
    this.hudElement.className = 'firstperson-hud';
    this.hudElement.innerHTML = `
      <div class="fp-status-badge" id="fp-badge">
        <span class="fp-pulse-dot"></span>
        <span id="fp-mode-text">FIRST-PERSON POV</span>
      </div>
      <div class="fp-instructions" id="fp-instr">
        <span>[W][A][S][D]</span> Move &bull; <span>[SHIFT]</span> Sprint &bull; <span>[G]</span> Fly Mode
      </div>
      <div class="fp-coord-badge" id="fp-coord-display" title="Click to copy your coordinates to clipboard">
        POS: X: 4.00 | Y: -0.77 | Z: 28.00
      </div>
      <button class="btn-flight-mode" id="btn-flight-toggle" title="Toggle Developer Flight Mode [G]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        [G] FLIGHT: OFF
      </button>
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

    /*/ Flight Toggle Button Listener /*/
    const flightBtn = this.hudElement.querySelector('#btn-flight-toggle');
    if (flightBtn) {
      flightBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFlyMode();
      });
    }

    /*/ Live Coordinates Click-to-Copy Listener /*/
    const coordEl = this.hudElement.querySelector('#fp-coord-display');
    if (coordEl) {
      coordEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const coordText = `X: ${this.camera.position.x.toFixed(2)}, Y: ${this.camera.position.y.toFixed(2)}, Z: ${this.camera.position.z.toFixed(2)}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(coordText);
        }
        this.showNotification(`📋 Copied Coordinates: ${coordText}`);
      });
    }
  }

  showNotification(text) {
    let badge = document.getElementById('gamepad-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'gamepad-badge';
      document.body.appendChild(badge);
    }
    badge.textContent = text;
    badge.classList.add('visible');
    if (this.notifTimeout) clearTimeout(this.notifTimeout);
    this.notifTimeout = setTimeout(() => {
      badge.classList.remove('visible');
    }, 4000);
  }

  /*/ Exact toggleFlyMode logic from Experiment player.js /*/
  toggleFlyMode() {
    if (this.isSeated && this.theatre) {
      this.theatre.standUp();
    }

    this.isFlying = !this.isFlying;
    this.velocity.set(0, 0, 0);

    const btn = this.hudElement?.querySelector('#btn-flight-toggle');
    const modeText = this.hudElement?.querySelector('#fp-mode-text');
    const dot = this.hudElement?.querySelector('.fp-pulse-dot');
    const instr = this.hudElement?.querySelector('#fp-instr');

    if (btn) {
      btn.textContent = this.isFlying ? '[G] FLIGHT: ACTIVE' : '[G] FLIGHT: OFF';
      btn.classList.toggle('active', this.isFlying);
    }
    if (modeText) {
      modeText.textContent = this.isFlying ? 'DRONE FLIGHT ACTIVE' : 'FIRST-PERSON POV';
    }
    if (dot) {
      dot.style.background = this.isFlying ? '#38bdf8' : '#4ade80';
      dot.style.boxShadow = this.isFlying ? '0 0 8px #38bdf8' : '0 0 8px #4ade80';
    }
    if (instr) {
      instr.innerHTML = this.isFlying
        ? '<span>[W][A][S][D]</span> 3D Fly &bull; <span>[SPACE]</span> Ascend &bull; <span>[C]</span> Descend &bull; <span>[SHIFT]</span> Boost &bull; <span>[G]</span> Land'
        : '<span>[W][A][S][D]</span> Move &bull; <span>[SHIFT]</span> Sprint &bull; <span>[G]</span> Fly Mode';
    }

    if (this.isFlying) {
      if (this.camera.position.y < 1.0) {
        this.camera.position.y += 1.8;
      }
      this.showNotification('🛸 Fly Mode: [W/A/S/D] Fly • [Space] Ascend • [C] Descend • [Shift] Boost • [G] Land');
    } else {
      this.camera.position.y = this.baseEyeHeight;
      this.showNotification('🚶 Landed: Ground Walking Mode Active');
    }
  }

  /*/ Alias for backward compatibility /*/
  toggleFlightMode() {
    this.toggleFlyMode();
  }

  initEventListeners() {
    /*/ Keyboard Listeners /*/
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyG') {
        if (this.isSeated && this.theatre) {
          this.theatre.standUp();
        }
        if (!this.isFirstPerson && !this.isLanding && !this.isAscending) {
          /*/ Smoothly enter First-Person and activate flight mode /*/
          this.landInside(() => {
            this.toggleFlyMode();
          });
          return;
        }
        if (this.isFirstPerson) {
          this.toggleFlyMode();
          return;
        }
      }

      if (!this.isFirstPerson) return;

      /*/ Handle Seated Interaction (Press E, Space, or Escape to stand up) /*/
      if (this.isSeated) {
        if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Escape') {
          if (this.theatre) {
            this.theatre.standUp();
          }
          return;
        }
      }

      /*/ Ground interaction key (Sit in Seat when near one) /*/
      if (e.code === 'KeyE' && !this.isSeated && this.theatre) {
        const nearbySeat = this.theatre.checkSeatProximity(this.camera.position);
        if (nearbySeat) {
          this.theatre.sitInSeat(nearbySeat);
          return;
        }
      }

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = true;
          break;
        case 'KeyC':
          this.keys.flyDown = true;
          break;
        case 'Space':
          if (this.isFlying) {
            this.keys.flyUp = true;
            e.preventDefault();
          }
          break;
        case 'Escape':
          this.returnToOrbit();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.sprint = false;
          break;
        case 'KeyC':
          this.keys.flyDown = false;
          break;
        case 'Space':
          this.keys.flyUp = false;
          break;
      }
    });

    /*/ Pointer Lock Support /*/
    this.domElement.addEventListener('click', () => {
      this.soundfx?.init();
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
    /*/ Pitch clamp from Experiment player.js (Math.PI / 2.05) /*/
    const maxPitch = Math.PI / 2.05;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  /*/ Smooth Cinematic Landing from Orbit into Museum Interior /*/
  landInside(onComplete, customTargetPos, customTargetLook) {
    if (this.isLanding || this.isFirstPerson) return;
    this.isLanding = true;

    /*/ Initialize procedural sound engine on user interaction /*/
    this.soundfx?.init();

    /*/ Trigger synthesized entry audio /*/
    this.audio.play();

    /*/ Disable OrbitControls during landing /*/
    this.orbitControls.enabled = false;

    /*/ Starting Camera State /*/
    const startPos = this.camera.position.clone();

    /*/ Target Landing Spot: Calibrated to User's Exact Choice (X: 15.04, Y: -0.77, Z: 10.41) /*/
    const targetPos = (customTargetPos && customTargetPos.isVector3)
      ? customTargetPos.clone()
      : (this.customLandingPos
        ? this.customLandingPos.clone()
        : new THREE.Vector3(15.04, this.baseEyeHeight, 10.41));

    const targetLook = (customTargetLook && customTargetLook.isVector3)
      ? customTargetLook.clone()
      : new THREE.Vector3(12.0, this.baseEyeHeight, 24.0);

    /*/ High apex waypoint for a grand sweeping trajectory /*/
    const midPos = new THREE.Vector3(
      startPos.x * 0.4 + targetPos.x * 0.6,
      Math.max(startPos.y * 0.5, 22.0),
      startPos.z * 0.4 + targetPos.z * 0.6
    );

    const duration = 2.8;
    let elapsed = 0;
    const startFov = this.camera.fov;

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

      /*/ Smoothly transition FOV to monumental wide-angle perspective /*/
      this.camera.fov = THREE.MathUtils.lerp(startFov, this.targetFov, ease);
      this.camera.updateProjectionMatrix();

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
    if (this.isSeated && this.theatre) {
      this.theatre.standUp();
    }
    this.isAscending = true;
    this.isFirstPerson = false;
    this.isFlying = false;

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
    const startFov = this.camera.fov;

    const animateAscent = () => {
      elapsed += 0.016;
      const t = Math.min(1.0, elapsed / duration);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      this.camera.position.lerpVectors(startPos, targetOrbitPos, ease);
      this.camera.lookAt(targetCenter);

      /*/ Smoothly restore orbit FOV /*/
      this.camera.fov = THREE.MathUtils.lerp(startFov, this.defaultOrbitFov, ease);
      this.camera.updateProjectionMatrix();

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

  /*/ Frame Update: Computes Camera Motion & Damping /*/
  update(delta) {
    if (!this.isFirstPerson || this.isLanding || this.isAscending) return;

    /*/ Synchronize camera orientation with pitch & yaw /*/
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
    this.camera.updateMatrixWorld();

    /*/ Dynamic Player Ambient Aura Light (Silenced only when seated in theatre chair) /*/
    if (this.playerLight) {
      const targetPlayerLight = this.isSeated ? 0.0 : 2.0;
      this.playerLight.intensity = THREE.MathUtils.lerp(this.playerLight.intensity, targetPlayerLight, delta * 4.0);
    }

    /*/ --- SEATED IN THEATRE CHAIR --- /*/
    if (this.isSeated) {
      this.velocity.set(0, 0, 0);
      this.camera.position.copy(this.seatedEyePos);
      const coordEl = this.hudElement?.querySelector('#fp-coord-display');
      if (coordEl) {
        coordEl.textContent = `SEATED: ${this.currentSeat?.name || 'THEATRE'}`;
      }
      return;
    }

    /*/ Update Real-Time Player Coordinates in HUD /*/
    const coordEl = this.hudElement?.querySelector('#fp-coord-display');
    if (coordEl) {
      coordEl.textContent = `POS: X: ${this.camera.position.x.toFixed(2)} | Y: ${this.camera.position.y.toFixed(2)} | Z: ${this.camera.position.z.toFixed(2)}`;
    }

    /*/ --- 0. FLY / SPECTATOR DRONE MODE (Exact from Experiment player.js) --- /*/
    if (this.isFlying) {
      /*/ 3D Directional Movement: flies in the exact 3D direction the camera is looking /*/
      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const up = new THREE.Vector3(0, 1, 0);

      const flyDir = new THREE.Vector3();
      if (this.keys.forward) flyDir.add(forward);
      if (this.keys.backward) flyDir.sub(forward);
      if (this.keys.right) flyDir.add(right);
      if (this.keys.left) flyDir.sub(right);
      if (this.keys.flyUp) flyDir.add(up);
      if (this.keys.flyDown) flyDir.sub(up);

      const isSprinting = this.keys.sprint;
      const speed = isSprinting ? this.flySprintSpeed : this.flySpeed;

      if (flyDir.lengthSq() > 0.001) {
        flyDir.normalize();
        this.velocity.copy(flyDir).multiplyScalar(speed);
      } else {
        this.velocity.multiplyScalar(0.82); /*/ Smooth aerodynamic glide stop /*/
        if (this.velocity.lengthSq() < 0.01) this.velocity.set(0, 0, 0);
      }

      this.camera.position.addScaledVector(this.velocity, delta);

      /*/ Boundary clamping: floor at -1.55, max height 65m for panoramic overhead view /*/
      if (this.camera.position.y < -1.55) {
        this.camera.position.y = -1.55;
      }
      this.camera.position.y = Math.min(65.0, this.camera.position.y);
      this.camera.position.x = Math.max(-55, Math.min(55, this.camera.position.x));
      this.camera.position.z = Math.max(-55, Math.min(55, this.camera.position.z));
      return;
    }

    /*/ --- 1. GROUND WALKING MODE --- /*/
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    const moveDir = new THREE.Vector3();
    if (this.keys.forward) moveDir.add(forward);
    if (this.keys.backward) moveDir.sub(forward);
    if (this.keys.right) moveDir.add(right);
    if (this.keys.left) moveDir.sub(right);

    const isMoving = moveDir.lengthSq() > 0.001;
    const isSprinting = this.keys.sprint;

    if (isMoving) {
      const inputMagnitude = Math.min(1.0, moveDir.length());
      moveDir.normalize();
      const currentSpeed = (isSprinting ? this.sprintSpeed : this.walkSpeed) * inputMagnitude;
      this.velocity.x = moveDir.x * currentSpeed;
      this.velocity.z = moveDir.z * currentSpeed;
    } else {
      /*/ Smooth friction deceleration /*/
      this.velocity.x *= 0.75;
      this.velocity.z *= 0.75;
      if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
    }

    this.camera.position.x += this.velocity.x * delta;
    this.camera.position.z += this.velocity.z * delta;

    /*/ Island Radial Boundary Check /*/
    const horizontalDist = Math.hypot(this.camera.position.x, this.camera.position.z);
    if (horizontalDist > this.islandRadiusLimit) {
      const angle = Math.atan2(this.camera.position.z, this.camera.position.x);
      this.camera.position.x = Math.cos(angle) * this.islandRadiusLimit;
      this.camera.position.z = Math.sin(angle) * this.islandRadiusLimit;
    }

    /*/ Subtle head bobbing & rhythmic procedural footstep audio while walking /*/
    if (isMoving && Math.hypot(this.velocity.x, this.velocity.z) > 0.4) {
      const bobFreq = isSprinting ? 14.0 : 9.5;
      this.headBobTimer += delta * bobFreq;
      const bobAmount = Math.sin(this.headBobTimer) * this.bobAmount;
      this.camera.position.y = this.baseEyeHeight + bobAmount;

      /*/ Play procedural footsteps (walk / sprint) /*/
      if (this.soundfx && !this.isSeated && !this.isFlying) {
        this.soundfx.playFootstep(isSprinting);
      }
    } else {
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.baseEyeHeight, delta * 6.0);
    }
  }

  /*/ Live Camera Scale, Height & Monumental Perspective GUI /*/
  initCameraGui() {
    /*/ The camera scale parameters are finalized.
        To re-open the live calibration GUI, add #gui to the URL in browser /*/
    if (typeof window !== 'undefined' && !window.location.hash.includes('gui') && !window.DEBUG_CAMERA) {
      return;
    }

    try {
      this.gui = new GUI({ title: '🎥 World Scale & Monumental POV' });
      this.gui.domElement.style.position = 'fixed';
      this.gui.domElement.style.top = '20px';
      this.gui.domElement.style.left = '20px';
      this.gui.domElement.style.zIndex = '99999';

      /*/ Prevent canvas clicks or pointer lock from stealing focus /*/
      ['pointerdown', 'mousedown', 'click', 'touchstart'].forEach((evt) => {
        this.gui.domElement.addEventListener(evt, (e) => e.stopPropagation());
      });

      this.gui.add(this, 'targetFov', 55, 105, 1).name('FOV (Wide Angle)').onChange((val) => {
        if (this.isFirstPerson) {
          this.camera.fov = val;
          this.camera.updateProjectionMatrix();
        }
      });

      this.gui.add(this, 'baseEyeHeight', -1.75, -0.40, 0.02).name('Eye Height (Y)').onChange((val) => {
        if (this.isFirstPerson && !this.isFlying) {
          this.camera.position.y = val;
        }
      });

      this.gui.add(this, 'walkSpeed', 1.5, 8.0, 0.1).name('Walk Speed');
      this.gui.add(this, 'sprintSpeed', 3.0, 14.0, 0.2).name('Sprint Speed');
      this.gui.add(this, 'bobAmount', 0.0, 0.06, 0.005).name('Head Bob');

      this.gui.add({
        copyValues: () => {
          const text = `CAMERA_SCALE = {\n  fov: ${this.targetFov},\n  baseEyeHeight: ${this.baseEyeHeight.toFixed(2)},\n  walkSpeed: ${this.walkSpeed.toFixed(1)},\n  sprintSpeed: ${this.sprintSpeed.toFixed(1)}\n};`;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text);
          }
          this.showNotification('📋 Camera scale settings copied to clipboard!');
        }
      }, 'copyValues').name('📋 Copy Camera Scale');
    } catch (err) {
      console.warn('[FirstPersonController] Failed to initialize lil-gui:', err);
    }
  }
}
