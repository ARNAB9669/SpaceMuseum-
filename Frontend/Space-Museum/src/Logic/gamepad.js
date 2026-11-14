/*/ =============================================================
    gamepad.js — Standard HTML5 Gamepad API Controller
    Supports Xbox, PlayStation (DualShock / DualSense), Nintendo Pro,
    and Generic HID Gamepads with dual analog sticks, button edge
    detection, haptic dual-rumble vibration, and HUD notifications.
    ============================================================= /*/

export class GamepadManager {
  constructor(controller = null) {
    this.controller = controller;
    this.gamepadIndex = null;
    this.deadzone = 0.15;
    this.lookSensitivity = 2.4; /*/ Radians per second at full tilt /*/

    /*/ Button states for single-press edge triggering /*/
    this.prevButtons = [];

    this.initEvents();
  }

  setController(controller) {
    this.controller = controller;
  }

  initEvents() {
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
      const name = (e.gamepad.id || 'Gamepad').split('(')[0].trim();
      this.showNotification(`🎮 Connected: ${name}`);
      this.vibrate(80, 0.3, 0.3);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this.showNotification('🎮 Gamepad Disconnected');
      }
    });
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
    }, 3500);
  }

  getGamepad() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (this.gamepadIndex !== null && gamepads[this.gamepadIndex] && gamepads[this.gamepadIndex].connected) {
      return gamepads[this.gamepadIndex];
    }
    /*/ Fallback: locate first available connected gamepad /*/
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        this.gamepadIndex = i;
        return gamepads[i];
      }
    }
    return null;
  }

  get isConnected() {
    return this.getGamepad() !== null;
  }

  applyDeadzone(value) {
    if (Math.abs(value) < this.deadzone) return 0;
    const sign = Math.sign(value);
    return sign * ((Math.abs(value) - this.deadzone) / (1 - this.deadzone));
  }

  /*/ Polls gamepad axes and buttons each frame /*/
  update(delta) {
    const gp = this.getGamepad();
    if (!gp) return null;

    /*/ 1. Left Stick: Movement (Axis 0 = X, Axis 1 = Y) /*/
    const moveX = this.applyDeadzone(gp.axes[0] || 0);
    const moveY = this.applyDeadzone(gp.axes[1] || 0);

    /*/ D-Pad Fallback (Buttons 12: Up, 13: Down, 14: Left, 15: Right) /*/
    let dpadX = 0;
    let dpadY = 0;
    if (gp.buttons[14]?.pressed) dpadX -= 1;
    if (gp.buttons[15]?.pressed) dpadX += 1;
    if (gp.buttons[12]?.pressed) dpadY -= 1;
    if (gp.buttons[13]?.pressed) dpadY += 1;

    const finalMoveX = Math.abs(moveX) > 0 ? moveX : dpadX;
    const finalMoveY = Math.abs(moveY) > 0 ? moveY : dpadY;

    /*/ 2. Right Stick: Camera Look (Axis 2 = X, Axis 3 = Y) /*/
    const lookX = this.applyDeadzone(gp.axes[2] || 0);
    const lookY = this.applyDeadzone(gp.axes[3] || 0);

    /*/ Apply look rotation directly to controller if attached /*/
    if (this.controller && (Math.abs(lookX) > 0 || Math.abs(lookY) > 0)) {
      this.controller.yaw -= lookX * this.lookSensitivity * delta;
      this.controller.pitch -= lookY * this.lookSensitivity * delta;
      if (typeof this.controller.clampPitch === 'function') {
        this.controller.clampPitch();
      }
    }

    /*/ 3. Buttons & Actions /*/
    /*/ Button 0: A / Cross (Confirm / Stand Up / Ascend) /*/
    const btnA = gp.buttons[0]?.pressed || false;
    const btnAPressed = btnA && !this.prevButtons[0];

    /*/ Button 1: B / Circle (Cancel / Stand Up / Descend) /*/
    const btnB = gp.buttons[1]?.pressed || false;
    const btnBPressed = btnB && !this.prevButtons[1];

    /*/ Button 2: X / Square (Interact / Sit in Seat - [E] key equivalent) /*/
    const btnX = gp.buttons[2]?.pressed || false;
    const btnXPressed = btnX && !this.prevButtons[2];

    /*/ Button 3: Y / Triangle (Toggle Flight Mode - [G] key equivalent) /*/
    const btnY = gp.buttons[3]?.pressed || false;
    const btnYPressed = btnY && !this.prevButtons[3];

    /*/ Sprint: RT (7), RB (5), or L3 Stick click (10) /*/
    const isSprinting = !!(gp.buttons[7]?.pressed || gp.buttons[5]?.pressed || gp.buttons[10]?.pressed);

    /*/ Flight Ascend/Descend: LB (4) = Down, RB (5) = Up or Left/Right Triggers /*/
    const flyUp = !!(gp.buttons[0]?.pressed || gp.buttons[5]?.pressed);
    const flyDown = !!(gp.buttons[1]?.pressed || gp.buttons[4]?.pressed);

    /*/ Cache button states for edge triggering /*/
    this.prevButtons = gp.buttons.map((b) => b.pressed);

    return {
      moveX: finalMoveX,
      moveY: finalMoveY,
      lookX,
      lookY,
      btnA: btnAPressed,
      btnB: btnBPressed,
      btnX: btnXPressed,
      btnY: btnYPressed,
      isSprinting,
      flyUp,
      flyDown
    };
  }

  /*/ Subtle vibration / haptic rumble /*/
  vibrate(duration = 100, weakMagnitude = 0.4, strongMagnitude = 0.4) {
    const gp = this.getGamepad();
    if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
      try {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration,
          weakMagnitude,
          strongMagnitude
        });
      } catch (e) {}
    }
  }
}
