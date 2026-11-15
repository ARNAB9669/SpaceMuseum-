import * as THREE from 'three';
import GUI from 'three/addons/libs/lil-gui.module.min.js';
import { SoundEffects } from '../../soundfx.js';
import { GamepadManager } from '../../gamepad.js';

/*/ Synthesized Atmospheric Entry & Docking Audio Engine /*/
class LandingAudioEngine {
  play() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      /*/ Gentle Sub-Bass Cinematic Drone /*/
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(65, now);
      sub.frequency.exponentialRampToValueAtTime(32, now + 3.0);
      subGain.gain.setValueAtTime(0.0001, now);
      subGain.gain.linearRampToValueAtTime(0.06, now + 0.8);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 3.5);

      /*/ Soft Ambient Airflow (Whispering Wind) /*/
      const bufferSize = ctx.sampleRate * 2.0;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 2.6);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.0001, now);
      noiseGain.gain.linearRampToValueAtTime(0.02, now + 0.6);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.9);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);
      whiteNoise.stop(now + 3.0);

      /*/ Soft Harmonic Arrival Chime /*/
      const chime = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(523.25, now + 2.2);
      chime.frequency.setValueAtTime(659.25, now + 2.5);
      chime.frequency.setValueAtTime(783.99, now + 2.8);
      chimeGain.gain.setValueAtTime(0.0001, now + 2.2);
      chimeGain.gain.linearRampToValueAtTime(0.06, now + 2.85);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);
      chime.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chime.start(now + 2.2);
      chime.stop(now + 3.9);
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

    /*/ Gamepad API Controller (Xbox / PlayStation / Nintendo Pro / Generic) /*/
    this.gamepad = new GamepadManager(this);

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

    /*/ Physical Wall Collision System (12 Radial Rays with Penetration Sliding) /*/
    this.collidableMeshes = [];
    this.playerRadius = 0.38;
    this.collisionRaycaster = new THREE.Raycaster();
    this.collisionRaycaster.firstHitOnly = true;

    this.collisionRayDirections = [];
    const rayCount = 12;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      this.collisionRayDirections.push(new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)));
    }

    this.initEventListeners();
    this.initHUD();
    this.initCameraGui();
  }

  /*/ Collidable Meshes Registration & Wall Collision Engine /*/
  setCollidableMeshes(meshes) {
    this.collidableMeshes = Array.isArray(meshes) ? [...meshes] : [];
  }

  addCollidableMeshes(meshes) {
    if (Array.isArray(meshes)) {
      this.collidableMeshes.push(...meshes);
    } else if (meshes) {
      this.collidableMeshes.push(meshes);
    }
  }

  handleWallCollisions() {
    if (!this.collidableMeshes || this.collidableMeshes.length === 0) return;
    if (this.isSeated || this.isLanding || this.isAscending || this.isFlying) return;

    const R = this.playerRadius;
    this.collisionRaycaster.far = R * 1.6;

    for (let pass = 0; pass < 2; pass++) {
      let collided = false;
      const checkOrigin = new THREE.Vector3(
        this.camera.position.x,
        this.camera.position.y - 0.25,
        this.camera.position.z
      );

      for (let i = 0; i < this.collisionRayDirections.length; i++) {
        const dir = this.collisionRayDirections[i];
        this.collisionRaycaster.set(checkOrigin, dir);

        const hits = this.collisionRaycaster.intersectObjects(this.collidableMeshes, true);
        if (hits.length > 0) {
          const hit = hits[0];
          if (hit.distance < R) {
            const penetration = R - hit.distance;
            this.camera.position.x -= dir.x * penetration;
            this.camera.position.z -= dir.z * penetration;

            const velDot = this.velocity.x * dir.x + this.velocity.z * dir.z;
            if (velDot > 0) {
              this.velocity.x -= dir.x * velDot;
              this.velocity.z -= dir.z * velDot;
            }
            collided = true;
          }
        }
      }
      if (!collided) break;
    }
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
    this.gamepad?.vibrate(70, 0.3, 0.4);

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

      /*/ Ground interaction key (Sit in Seat when near one, or Speak with Relic) /*/
      if (e.code === 'KeyE' && !this.isSeated) {
        if (e.repeat) return; /*/ Suppress rapid OS keyboard repeat to prevent connection thrashing /*/
        if (this.theatre) {
          const nearbySeat = this.theatre.checkSeatProximity(this.camera.position);
          if (nearbySeat) {
            this.theatre.sitInSeat(nearbySeat);
            return;
          }
        }
        if (this.onInteract) {
          this.onInteract();
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

    /*/ Mouse & Touch Look: Supports both Pointer Lock and Free Dragging (especially when seated) /*/
    window.addEventListener('pointermove', (e) => {
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

    /*/ Window-level Drag Initiation: Allows looking around anywhere even when seated or on touch devices /*/
    window.addEventListener('pointerdown', (e) => {
      if (!this.isFirstPerson || this.hasPointerLock || this.isLanding || this.isAscending) return;

      /*/ Do not start camera drag if interacting with buttons, inputs, dock cards, or video iframe /*/
      if (e.target && e.target.closest && e.target.closest('button, a, input, select, textarea, #cinema-mission-dock, #cinema-dock-minipill, iframe')) {
        return;
      }

      this.isDragging = true;
      this.prevPointerX = e.clientX;
      this.prevPointerY = e.clientY;
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    window.addEventListener('pointercancel', () => {
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

    /*/ Trigger gentle entry atmospheric audio /*/
    this.audio.play();

    /*/ Disable OrbitControls during landing /*/
    this.orbitControls.enabled = false;

    /*/ Starting Camera State /*/
    const startPos = this.camera.position.clone();

    /*/ Target Landing Spot: Calibrated to User's Exact Choice (X: 15.04, Y: baseEyeHeight, Z: 10.41) /*/
    const targetPos = (customTargetPos && customTargetPos.isVector3)
      ? customTargetPos.clone()
      : (this.customLandingPos
        ? this.customLandingPos.clone()
        : new THREE.Vector3(15.04, this.baseEyeHeight, 10.41));

    const targetLook = (customTargetLook && customTargetLook.isVector3)
      ? customTargetLook.clone()
      : new THREE.Vector3(12.0, this.baseEyeHeight, 24.0);

    /*/ Compute exact final yaw/pitch and orientation quaternion /*/
    const finalDir = new THREE.Vector3().subVectors(targetLook, targetPos).normalize();
    const finalYaw = Math.atan2(-finalDir.x, -finalDir.z);
    const finalPitch = Math.asin(Math.max(-0.95, Math.min(0.95, finalDir.y)));
    const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(finalPitch, finalYaw, 0, 'YXZ'));

    /*/ Smooth 4-Point Cubic Bezier Flight Trajectory:
        p0 = startPos (high orbit)
        p1 = high archway curving gracefully over the transparent biodome
        p2 = low level alignment waypoint (behind landing spot along road tangent)
        p3 = targetPos (soft, horizontal touchdown at eye level) /*/
    const p0 = startPos;
    const p1 = new THREE.Vector3(
      startPos.x * 0.65 + targetPos.x * 0.35,
      Math.max(startPos.y * 0.75, 24.0),
      startPos.z * 0.65 + targetPos.z * 0.35
    );
    const p2 = new THREE.Vector3(
      targetPos.x - finalDir.x * 7.5,
      targetPos.y + 1.10,
      targetPos.z - finalDir.z * 7.5
    );
    const p3 = targetPos;

    const duration = 3.8; /*/ Graceful 3.8s majestic glide /*/
    let elapsed = 0;
    const startFov = this.camera.fov;
    let lastTime = performance.now();

    const animateLanding = () => {
      if (!this.isLanding) return;

      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;
      const t = Math.min(1.0, elapsed / duration);

      /*/ Smooth Cosine Easing (Zero jerk, continuous gentle acceleration & deceleration) /*/
      const ease = 0.5 * (1 - Math.cos(Math.PI * t));

      /*/ Cubic Bezier Position Interpolation /*/
      const u = 1 - ease;
      const u2 = u * u;
      const u3 = u2 * u;
      const e2 = ease * ease;
      const e3 = e2 * ease;

      const currentPos = new THREE.Vector3(
        u3 * p0.x + 3 * u2 * ease * p1.x + 3 * u * e2 * p2.x + e3 * p3.x,
        u3 * p0.y + 3 * u2 * ease * p1.y + 3 * u * e2 * p2.y + e3 * p3.y,
        u3 * p0.z + 3 * u2 * ease * p1.z + 3 * u * e2 * p2.z + e3 * p3.z
      );
      this.camera.position.copy(currentPos);

      /*/ Seamless Look & Orientation Blending without abrupt snapping /*/
      const lookAtPt = new THREE.Vector3().lerpVectors(new THREE.Vector3(0, 2, 0), targetLook, ease);
      const lookMatrix = new THREE.Matrix4().lookAt(currentPos, lookAtPt, new THREE.Vector3(0, 1, 0));
      const lookQuat = new THREE.Quaternion().setFromRotationMatrix(lookMatrix);

      /*/ Slerp smoothly into the exact first-person orientation /*/
      this.camera.quaternion.slerpQuaternions(lookQuat, targetQuat, ease * ease);

      /*/ Smooth FOV transition /*/
      this.camera.fov = THREE.MathUtils.lerp(startFov, this.targetFov, ease);
      this.camera.updateProjectionMatrix();

      if (t < 1.0) {
        requestAnimationFrame(animateLanding);
      } else {
        this.isLanding = false;
        this.isFirstPerson = true;

        this.yaw = finalYaw;
        this.pitch = finalPitch;
        this.camera.position.copy(targetPos);
        const finalEuler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
        this.camera.quaternion.setFromEuler(finalEuler);
        this.camera.updateMatrixWorld();

        /*/ Show First-Person UI /*/
        if (this.hudElement) this.hudElement.classList.add('visible');
        if (this.reticle) this.reticle.classList.add('visible');
        this.gamepad?.vibrate(90, 0.4, 0.3);

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

    /*/ Poll Gamepad API Controller /*/
    const gp = this.gamepad?.update(delta);

    /*/ Gamepad Flight Mode Toggle: Button Y (Triangle) /*/
    if (gp?.btnY) {
      this.toggleFlyMode();
    }

    /*/ Gamepad Interaction: Press X or A to Sit in Seat or Speak with Relic /*/
    if ((gp?.btnX || gp?.btnA) && !this.isSeated) {
      let targetSeat = this.theatre ? this.theatre.checkSeatProximity(this.camera.position) : null;
      if (!targetSeat && this.theatre) {
        /*/ Crosshair Raycast Fallback: sitting while looking directly at a seat within 3.6m /*/
        const seatRay = new THREE.Raycaster();
        seatRay.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        seatRay.far = 3.6;
        const seatMeshes = this.theatre.getSeatMeshes();
        const hits = seatRay.intersectObjects(seatMeshes, true);
        if (hits.length > 0 && hits[0].object.userData?.seatData) {
          targetSeat = hits[0].object.userData.seatData;
        }
      }
      if (targetSeat) {
        this.theatre.sitInSeat(targetSeat);
        this.gamepad?.vibrate(70, 0.4, 0.4);
      } else if (this.onInteract) {
        this.onInteract();
        this.gamepad?.vibrate(50, 0.3, 0.3);
      }
    }

    /*/ Synchronize camera orientation with pitch & yaw /*/
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
    this.camera.updateMatrixWorld();

    /*/ Dynamic Player Ambient Aura Light (Silenced only when seated in theatre chair) /*/
    if (this.playerLight) {
      const targetPlayerLight = this.isSeated ? 0.0 : 2.0;
      const lightDamp = 1.0 - Math.exp(-4.0 * delta);
      this.playerLight.intensity = THREE.MathUtils.lerp(this.playerLight.intensity, targetPlayerLight, lightDamp);
    }

    /*/ --- SEATED IN THEATRE CHAIR --- /*/
    if (this.isSeated) {
      /*/ Stand Up via Gamepad (Left Stick tilt, Button A, Button B, or Button X) /*/
      const gpWantsStand = gp && (Math.abs(gp.moveX) > 0.4 || Math.abs(gp.moveY) > 0.4 || gp.btnA || gp.btnB || gp.btnX);
      if (gpWantsStand) {
        if (this.theatre) {
          this.theatre.standUp();
        } else {
          this.setSeated(false);
        }
        this.gamepad?.vibrate(50, 0.3, 0.2);
        return;
      }

      this.velocity.set(0, 0, 0);
      this.camera.position.copy(this.seatedEyePos);

      const modeText = this.hudElement?.querySelector('#fp-mode-text');
      const instrText = this.hudElement?.querySelector('#fp-instr');
      if (modeText) modeText.textContent = `SEATED • ${this.currentSeat?.name?.toUpperCase() || 'THEATRE'}`;
      if (instrText && instrText.dataset.mode !== 'seated') {
        instrText.dataset.mode = 'seated';
        instrText.innerHTML = `<span>[E]</span> Stand Up &bull; Mouse Look Around &bull; <span>[M]</span> Stories`;
      }
      return;
    }

    const modeText = this.hudElement?.querySelector('#fp-mode-text');
    const instrText = this.hudElement?.querySelector('#fp-instr');
    if (modeText) {
      const targetMode = this.isFlying ? 'DRONE FLIGHT MODE' : 'FIRST-PERSON POV';
      if (modeText.textContent !== targetMode) modeText.textContent = targetMode;
    }
    if (instrText) {
      const targetType = this.isFlying ? 'fly' : 'walk';
      if (instrText.dataset.mode !== targetType) {
        instrText.dataset.mode = targetType;
        instrText.innerHTML = this.isFlying
          ? `<span>[W][A][S][D]</span> 3D Thrust &bull; <span>[SPACE]</span> Ascend &bull; <span>[C]</span> Descend`
          : `<span>[W][A][S][D]</span> Move &bull; <span>[SHIFT]</span> Sprint &bull; <span>[G]</span> Fly Mode`;
      }
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

      /*/ Blend Analog Gamepad Left Stick and Triggers in 3D Flight /*/
      if (gp) {
        if (Math.abs(gp.moveX) > 0 || Math.abs(gp.moveY) > 0) {
          flyDir.addScaledVector(right, gp.moveX);
          flyDir.addScaledVector(forward, -gp.moveY);
        }
        if (gp.flyUp) flyDir.add(up);
        if (gp.flyDown) flyDir.sub(up);
      }

      const isSprinting = this.keys.sprint || !!(gp?.isSprinting);
      const speed = isSprinting ? this.flySprintSpeed : this.flySpeed;

      if (flyDir.lengthSq() > 0.001) {
        flyDir.normalize();
        this.velocity.copy(flyDir).multiplyScalar(speed);
      } else {
        const flyDamp = Math.exp(-11.9 * delta); /*/ Frame-rate independent aerodynamic glide /*/
        this.velocity.multiplyScalar(flyDamp);
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

    /*/ Blend Analog Gamepad Left Stick Movement /*/
    if (gp && (Math.abs(gp.moveX) > 0 || Math.abs(gp.moveY) > 0)) {
      moveDir.addScaledVector(right, gp.moveX);
      moveDir.addScaledVector(forward, -gp.moveY);
    }

    const isMoving = moveDir.lengthSq() > 0.001;
    const isSprinting = this.keys.sprint || !!(gp?.isSprinting);

    if (isMoving) {
      const inputMagnitude = Math.min(1.0, moveDir.length());
      moveDir.normalize();
      const currentSpeed = (isSprinting ? this.sprintSpeed : this.walkSpeed) * inputMagnitude;
      this.velocity.x = moveDir.x * currentSpeed;
      this.velocity.z = moveDir.z * currentSpeed;
    } else {
      /*/ Frame-rate independent smooth friction deceleration /*/
      const walkDamp = Math.exp(-17.26 * delta);
      this.velocity.x *= walkDamp;
      this.velocity.z *= walkDamp;
      if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
    }

    this.camera.position.x += this.velocity.x * delta;
    this.camera.position.z += this.velocity.z * delta;

    /*/ Physical Wall Collision System (Sliding & Penetration Resolution) /*/
    this.handleWallCollisions();

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
      const eyeDamp = 1.0 - Math.exp(-6.0 * delta);
      this.camera.position.y = THREE.MathUtils.lerp(this.camera.position.y, this.baseEyeHeight, eyeDamp);
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
