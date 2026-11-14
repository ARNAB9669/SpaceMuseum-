import * as THREE from 'three';
import GUI from 'three/addons/libs/lil-gui.module.min.js';

/*/ =============================================================
    posters.js — All Wall Paintings, Signs & Surface Artworks
    Every piece of wall-mounted visual content for the Space Museum
    goes in this file: welcome signs, gallery plaques, exhibit
    posters, NASA tributes, and informational wall panels.
    ============================================================= /*/

/*/ -------------------------------------------------------------
    Entry Wall Welcome Sign
    Displays "WELCOME TO SPACE MUSEUM" with illuminated sci-fi
    signage, 3D bezel frame, and real-time lil-gui calibration
    ------------------------------------------------------------- /*/
export class WelcomeSign {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'EntryWallWelcomeSign';
    this.glowTime = 0;

    /*/ Final Calibrated Parameters (Calibrated by user via GUI) /*/
    this.params = {
      posX: -4.60,
      posY: -1.00,
      posZ: 23.50,
      rotX: 0.0,
      rotY: 0.0,
      rotZ: 0.0,
      width: 4.20,
      height: 1.90,
      scale: 1.0,
      opacity: 1.0,
      visible: true,

      /*/ 3D Physical Frame Options /*/
      frameVisible: true,
      frameThickness: 0.08,
      frameDepth: 0.08,
      frameColor: '#1e293b',
      frameMetalness: 0.85,
      frameRoughness: 0.25,
      showBacking: true,
      showGlowTrim: true,
      glowColor: '#38bdf8',

      copyToClipboard: () => this.copyValues()
    };

    this.initTexture();
    this.initSign();
    this.initGui();
    this.applyTransforms();

    this.scene.add(this.group);
  }

  initTexture() {
    const CW = 1536;
    const CH = 576;
    const canvas = document.createElement('canvas');
    canvas.width = CW;
    canvas.height = CH;
    const ctx = canvas.getContext('2d');

    /*/ 1. Deep Space Radial Background /*/
    const bg = ctx.createLinearGradient(0, 0, 0, CH);
    bg.addColorStop(0.0, '#070b14');
    bg.addColorStop(0.5, '#0f172a');
    bg.addColorStop(1.0, '#070b14');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CW, CH);

    /*/ 2. Decorative Outer Border /*/
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, CW - 40, CH - 40);

    /*/ 3. Header Accent Bar /*/
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(80, 50, CW - 160, 4);

    /*/ 4. Header Category Tag /*/
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#38bdf8';
    ctx.letterSpacing = '8px';
    ctx.fillText('★   NASA DEEP SPACE EXHIBITION   ★', CW / 2, 85);

    /*/ 5. Main Headline: WELCOME TO /*/
    ctx.font = '600 68px Arial, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.letterSpacing = '10px';
    ctx.shadowColor = 'rgba(226, 232, 240, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillText('WELCOME TO', CW / 2, 195);
    ctx.shadowBlur = 0;

    /*/ 6. Primary Title: SPACE MUSEUM (Glowing Warm Gold) /*/
    ctx.font = '900 125px Arial, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 32;
    ctx.letterSpacing = '12px';
    ctx.fillText('SPACE MUSEUM', CW / 2, 335);
    ctx.shadowBlur = 0;

    /*/ 7. Separator Line /*/
    const lineGrad = ctx.createLinearGradient(120, 0, CW - 120, 0);
    lineGrad.addColorStop(0.0, 'rgba(56, 189, 248, 0.0)');
    lineGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.9)');
    lineGrad.addColorStop(1.0, 'rgba(56, 189, 248, 0.0)');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(120, 410, CW - 240, 3);

    /*/ 8. Subtitle: Discover The Universe /*/
    ctx.font = '500 38px Arial, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.letterSpacing = '6px';
    ctx.fillText('HISTORICAL ARCHIVE & PLANETARY RELICS', CW / 2, 465);

    /*/ 9. Footer Accent Bar /*/
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(80, CH - 54, CW - 160, 4);

    /*/ 10. Corner Sci-Fi Bracket Accents /*/
    const corners = [
      [35, 35, 30, 30],
      [CW - 35, 35, -30, 30],
      [35, CH - 35, 30, -30],
      [CW - 35, CH - 35, -30, -30]
    ];
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 6;
    corners.forEach(([x, y, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + dy);
      ctx.lineTo(x, y);
      ctx.lineTo(x + dx, y);
      ctx.stroke();
    });

    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.needsUpdate = true;
  }

  initSign() {
    this.geometry = new THREE.PlaneGeometry(this.params.width, this.params.height);
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: this.params.opacity
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0.005);
    this.group.add(this.mesh);

    this.frameGroup = new THREE.Group();
    this.frameGroup.name = 'SignBezelFrame';
    this.group.add(this.frameGroup);

    this.rebuildFrame();
  }

  clearFrame() {
    if (!this.frameGroup) return;
    while (this.frameGroup.children.length > 0) {
      const child = this.frameGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      this.frameGroup.remove(child);
    }
  }

  rebuildFrame() {
    this.clearFrame();
    if (!this.params.frameVisible) return;

    const W = this.params.width;
    const H = this.params.height;
    const T = this.params.frameThickness;
    const D = this.params.frameDepth;

    const frameMat = new THREE.MeshStandardMaterial({
      color: this.params.frameColor,
      metalness: this.params.frameMetalness,
      roughness: this.params.frameRoughness
    });

    /*/ Top Bar /*/
    const topGeo = new THREE.BoxGeometry(W + 2 * T, T, D);
    const topMesh = new THREE.Mesh(topGeo, frameMat);
    topMesh.position.set(0, H / 2 + T / 2, 0);
    this.frameGroup.add(topMesh);

    /*/ Bottom Bar /*/
    const bottomGeo = new THREE.BoxGeometry(W + 2 * T, T, D);
    const bottomMesh = new THREE.Mesh(bottomGeo, frameMat);
    bottomMesh.position.set(0, -H / 2 - T / 2, 0);
    this.frameGroup.add(bottomMesh);

    /*/ Left Bar /*/
    const leftGeo = new THREE.BoxGeometry(T, H, D);
    const leftMesh = new THREE.Mesh(leftGeo, frameMat);
    leftMesh.position.set(-W / 2 - T / 2, 0, 0);
    this.frameGroup.add(leftMesh);

    /*/ Right Bar /*/
    const rightGeo = new THREE.BoxGeometry(T, H, D);
    const rightMesh = new THREE.Mesh(rightGeo, frameMat);
    rightMesh.position.set(W / 2 + T / 2, 0, 0);
    this.frameGroup.add(rightMesh);

    /*/ Backing Plate /*/
    if (this.params.showBacking) {
      const backGeo = new THREE.BoxGeometry(W + 2 * T, H + 2 * T, 0.02);
      const backMesh = new THREE.Mesh(backGeo, frameMat);
      backMesh.position.set(0, 0, -D / 2);
      this.frameGroup.add(backMesh);
    }

    /*/ Neon LED Trim Glow /*/
    if (this.params.showGlowTrim) {
      const trimGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(W, H));
      this.trimMat = new THREE.LineBasicMaterial({
        color: this.params.glowColor,
        transparent: true,
        opacity: 0.85
      });
      const trimLine = new THREE.LineSegments(trimGeo, this.trimMat);
      trimLine.position.set(0, 0, D / 2 + 0.003);
      this.frameGroup.add(trimLine);
    }
  }

  rebuildGeometry() {
    if (this.geometry) this.geometry.dispose();
    this.geometry = new THREE.PlaneGeometry(this.params.width, this.params.height);
    this.mesh.geometry = this.geometry;

    this.rebuildFrame();
  }

  applyTransforms() {
    this.group.position.set(this.params.posX, this.params.posY, this.params.posZ);
    this.group.rotation.set(
      THREE.MathUtils.degToRad(this.params.rotX),
      THREE.MathUtils.degToRad(this.params.rotY),
      THREE.MathUtils.degToRad(this.params.rotZ)
    );
    this.group.scale.setScalar(this.params.scale);
    this.mesh.visible = this.params.visible;
    if (this.frameGroup) this.frameGroup.visible = this.params.frameVisible && this.params.visible;
    this.material.opacity = this.params.opacity;
    this.material.needsUpdate = true;
  }

  initGui() {
    /*/ The welcome sign coordinates and dimensions are finalized.
        To re-open the live calibration GUI, add #gui to the URL in the browser /*/
    if (typeof window !== 'undefined' && !window.location.hash.includes('gui') && !window.DEBUG_WALL_SIGN) {
      return;
    }

    try {
      this.gui = new GUI({ title: '🏛️ Entry Wall Welcome Sign' });
      this.gui.domElement.style.position = 'fixed';
      this.gui.domElement.style.top = '20px';
      this.gui.domElement.style.right = '20px';
      this.gui.domElement.style.zIndex = '99999';

      /*/ Prevent canvas pointer lock from interfering with slider drag /*/
      ['pointerdown', 'mousedown', 'click', 'touchstart'].forEach((evt) => {
        this.gui.domElement.addEventListener(evt, (e) => e.stopPropagation());
      });

      const posFolder = this.gui.addFolder('📍 Position (X, Y, Z)');
      posFolder.add(this.params, 'posX', -35, 35, 0.05).name('X (Left/Right)').onChange(() => this.applyTransforms());
      posFolder.add(this.params, 'posY', -5, 25, 0.05).name('Y (Height)').onChange(() => this.applyTransforms());
      posFolder.add(this.params, 'posZ', -20, 45, 0.05).name('Z (Depth)').onChange(() => this.applyTransforms());
      posFolder.open();

      const rotFolder = this.gui.addFolder('🔄 Rotation (Degrees)');
      rotFolder.add(this.params, 'rotX', -180, 180, 1).name('Pitch X').onChange(() => this.applyTransforms());
      rotFolder.add(this.params, 'rotY', -180, 180, 1).name('Yaw Y').onChange(() => this.applyTransforms());
      rotFolder.add(this.params, 'rotZ', -180, 180, 1).name('Roll Z').onChange(() => this.applyTransforms());
      rotFolder.open();

      const sizeFolder = this.gui.addFolder('📐 Dimensions & Scale');
      sizeFolder.add(this.params, 'width', 0.5, 20, 0.1).name('Width (m)').onChange(() => {
        this.rebuildGeometry();
        this.applyTransforms();
      });
      sizeFolder.add(this.params, 'height', 0.5, 10, 0.1).name('Height (m)').onChange(() => {
        this.rebuildGeometry();
        this.applyTransforms();
      });
      sizeFolder.add(this.params, 'scale', 0.1, 5.0, 0.05).name('Scale').onChange(() => this.applyTransforms());
      sizeFolder.open();

      const frameFolder = this.gui.addFolder('🖼️ 3D Frame');
      frameFolder.add(this.params, 'frameVisible').name('Frame Active').onChange(() => {
        this.rebuildFrame();
        this.applyTransforms();
      });
      frameFolder.add(this.params, 'frameThickness', 0.02, 0.30, 0.01).name('Thickness (m)').onChange(() => this.rebuildFrame());
      frameFolder.add(this.params, 'frameDepth', 0.02, 0.30, 0.01).name('Depth (m)').onChange(() => this.rebuildFrame());
      frameFolder.addColor(this.params, 'frameColor').name('Color').onChange(() => this.rebuildFrame());
      frameFolder.add(this.params, 'showGlowTrim').name('LED Glow Trim').onChange(() => this.rebuildFrame());
      frameFolder.addColor(this.params, 'glowColor').name('Glow Color').onChange(() => this.rebuildFrame());

      this.gui.add(this.params, 'copyToClipboard').name('📋 Copy Wall Sign Values');
    } catch (err) {
      console.warn('[WelcomeSign] Failed to initialize lil-gui:', err);
    }
  }

  copyValues() {
    const formatted = `WELCOME_SIGN_CONFIG = {
  posX: ${this.params.posX.toFixed(2)},
  posY: ${this.params.posY.toFixed(2)},
  posZ: ${this.params.posZ.toFixed(2)},
  rotX: ${this.params.rotX.toFixed(1)},
  rotY: ${this.params.rotY.toFixed(1)},
  rotZ: ${this.params.rotZ.toFixed(1)},
  width: ${this.params.width.toFixed(2)},
  height: ${this.params.height.toFixed(2)},
  scale: ${this.params.scale.toFixed(2)},
  frameVisible: ${this.params.frameVisible},
  frameThickness: ${this.params.frameThickness.toFixed(2)},
  frameDepth: ${this.params.frameDepth.toFixed(2)},
  frameColor: '${this.params.frameColor}',
  showBacking: ${this.params.showBacking},
  showGlowTrim: ${this.params.showGlowTrim},
  glowColor: '${this.params.glowColor}'
};`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    console.log('[WelcomeSign] Current Settings:\n' + formatted);

    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '85px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '12px 24px';
    toast.style.background = 'rgba(15, 23, 42, 0.95)';
    toast.style.border = '1px solid #38bdf8';
    toast.style.borderRadius = '8px';
    toast.style.color = '#38bdf8';
    toast.style.fontFamily = 'monospace';
    toast.style.fontSize = '13px';
    toast.style.zIndex = '999999';
    toast.style.boxShadow = '0 8px 32px rgba(56, 189, 248, 0.35)';
    toast.innerHTML = '📋 <b>Welcome Sign coordinates copied!</b> Paste in chat.';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.6s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 600);
    }, 2800);
  }

  update(delta) {
    if (this.trimMat && this.params.showGlowTrim) {
      this.glowTime += delta * 2.2;
      this.trimMat.opacity = 0.55 + 0.35 * Math.sin(this.glowTime);
    }
  }
}

/*/ -------------------------------------------------------------
    Outer Wall Exhibition Poster
    Displays /out-wal;-poster.png with 3D bezel frame & live lil-gui
    ------------------------------------------------------------- /*/
export class OuterWallPoster {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'OuterWallPoster';
    this.glowTime = 0;

    /*/ Calibrated Parameters /*/
    this.params = {
      posX: 10.05,
      posY: -1.00,
      posZ: 20.50,
      rotX: -1.0,
      rotY: 90.0, /*/ Facing +X outward toward the approach road /*/
      rotZ: 0.0,
      width: 3.80,
      height: 2.00,
      scale: 1.10,
      opacity: 1.0,
      toneMapped: true,
      visible: true,

      /*/ 3D Physical Frame Options /*/
      frameVisible: true,
      frameThickness: 0.08,
      frameDepth: 0.02,
      frameColor: '#1e293b',
      frameMetalness: 0.85,
      frameRoughness: 0.25,
      showBacking: true,
      showGlowTrim: true,
      glowColor: '#38bdf8',

      copyToClipboard: () => this.copyValues()
    };

    this.initPoster();
    this.initGui();
    this.applyTransforms();

    this.scene.add(this.group);
  }

  initPoster() {
    const loader = new THREE.TextureLoader();

    this.geometry = new THREE.PlaneGeometry(this.params.width, this.params.height);
    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: false,
      opacity: this.params.opacity,
      toneMapped: this.params.toneMapped
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0.005);
    this.group.add(this.mesh);

    /*/ Load high-resolution outer wall poster texture /*/
    const onTextureLoaded = (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      this.material.map = tex;
      this.material.needsUpdate = true;
    };

    loader.load(
      '/outer-wall-poster.png',
      onTextureLoaded,
      undefined,
      (err) => {
        console.warn('[OuterWallPoster] Error loading /outer-wall-poster.png, trying fallback:', err);
        loader.load('/out-wal;-poster.png', onTextureLoaded);
      }
    );

    this.frameGroup = new THREE.Group();
    this.frameGroup.name = 'OuterWallPosterFrame';
    this.group.add(this.frameGroup);

    this.rebuildFrame();
  }

  clearFrame() {
    if (!this.frameGroup) return;
    while (this.frameGroup.children.length > 0) {
      const child = this.frameGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
      this.frameGroup.remove(child);
    }
  }

  rebuildFrame() {
    this.clearFrame();
    if (!this.params.frameVisible) return;

    const W = this.params.width;
    const H = this.params.height;
    const T = this.params.frameThickness;
    const D = this.params.frameDepth;

    const frameMat = new THREE.MeshStandardMaterial({
      color: this.params.frameColor,
      metalness: this.params.frameMetalness,
      roughness: this.params.frameRoughness
    });

    /*/ Top Bar /*/
    const topGeo = new THREE.BoxGeometry(W + 2 * T, T, D);
    const topMesh = new THREE.Mesh(topGeo, frameMat);
    topMesh.position.set(0, H / 2 + T / 2, 0);
    this.frameGroup.add(topMesh);

    /*/ Bottom Bar /*/
    const bottomGeo = new THREE.BoxGeometry(W + 2 * T, T, D);
    const bottomMesh = new THREE.Mesh(bottomGeo, frameMat);
    bottomMesh.position.set(0, -H / 2 - T / 2, 0);
    this.frameGroup.add(bottomMesh);

    /*/ Left Bar /*/
    const leftGeo = new THREE.BoxGeometry(T, H, D);
    const leftMesh = new THREE.Mesh(leftGeo, frameMat);
    leftMesh.position.set(-W / 2 - T / 2, 0, 0);
    this.frameGroup.add(leftMesh);

    /*/ Right Bar /*/
    const rightGeo = new THREE.BoxGeometry(T, H, D);
    const rightMesh = new THREE.Mesh(rightGeo, frameMat);
    rightMesh.position.set(W / 2 + T / 2, 0, 0);
    this.frameGroup.add(rightMesh);

    /*/ Backing Plate /*/
    if (this.params.showBacking) {
      const backGeo = new THREE.BoxGeometry(W + 2 * T, H + 2 * T, 0.02);
      const backMesh = new THREE.Mesh(backGeo, frameMat);
      backMesh.position.set(0, 0, -D / 2);
      this.frameGroup.add(backMesh);
    }

    /*/ Neon LED Trim Glow /*/
    if (this.params.showGlowTrim) {
      const trimGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(W, H));
      this.trimMat = new THREE.LineBasicMaterial({
        color: this.params.glowColor,
        transparent: true,
        opacity: 0.85
      });
      const trimLine = new THREE.LineSegments(trimGeo, this.trimMat);
      trimLine.position.set(0, 0, D / 2 + 0.003);
      this.frameGroup.add(trimLine);
    }
  }

  rebuildGeometry() {
    if (this.geometry) this.geometry.dispose();
    this.geometry = new THREE.PlaneGeometry(this.params.width, this.params.height);
    this.mesh.geometry = this.geometry;

    this.rebuildFrame();
  }

  applyTransforms() {
    this.group.position.set(this.params.posX, this.params.posY, this.params.posZ);
    this.group.rotation.set(
      THREE.MathUtils.degToRad(this.params.rotX),
      THREE.MathUtils.degToRad(this.params.rotY),
      THREE.MathUtils.degToRad(this.params.rotZ)
    );
    this.group.scale.setScalar(this.params.scale);
    this.mesh.visible = this.params.visible;
    if (this.frameGroup) this.frameGroup.visible = this.params.frameVisible && this.params.visible;
    this.material.opacity = this.params.opacity;
    this.material.toneMapped = this.params.toneMapped;
    this.material.needsUpdate = true;
  }

  initGui() {
    try {
      this.gui = new GUI({ title: '🖼️ Outer Wall Poster' });
      this.gui.domElement.style.position = 'fixed';
      this.gui.domElement.style.top = '20px';
      this.gui.domElement.style.right = '20px';
      this.gui.domElement.style.zIndex = '99999';

      /*/ Prevent canvas pointer lock from interfering with slider drag /*/
      ['pointerdown', 'mousedown', 'click', 'touchstart'].forEach((evt) => {
        this.gui.domElement.addEventListener(evt, (e) => e.stopPropagation());
      });

      const posFolder = this.gui.addFolder('📍 Position (X, Y, Z)');
      posFolder.add(this.params, 'posX', -35, 35, 0.05).name('X (Left/Right)').onChange(() => this.applyTransforms());
      posFolder.add(this.params, 'posY', -5, 25, 0.05).name('Y (Height)').onChange(() => this.applyTransforms());
      posFolder.add(this.params, 'posZ', -20, 45, 0.05).name('Z (Depth)').onChange(() => this.applyTransforms());
      posFolder.open();

      const rotFolder = this.gui.addFolder('🔄 Rotation (Degrees)');
      rotFolder.add(this.params, 'rotX', -180, 180, 1).name('Pitch X').onChange(() => this.applyTransforms());
      rotFolder.add(this.params, 'rotY', -180, 180, 1).name('Yaw Y').onChange(() => this.applyTransforms());
      rotFolder.add(this.params, 'rotZ', -180, 180, 1).name('Roll Z').onChange(() => this.applyTransforms());
      rotFolder.open();

      const sizeFolder = this.gui.addFolder('📐 Dimensions & Scale');
      sizeFolder.add(this.params, 'width', 0.5, 20, 0.1).name('Width (m)').onChange(() => {
        this.rebuildGeometry();
        this.applyTransforms();
      });
      sizeFolder.add(this.params, 'height', 0.5, 10, 0.1).name('Height (m)').onChange(() => {
        this.rebuildGeometry();
        this.applyTransforms();
      });
      sizeFolder.add(this.params, 'scale', 0.1, 5.0, 0.05).name('Scale').onChange(() => this.applyTransforms());
      sizeFolder.open();

      const frameFolder = this.gui.addFolder('🖼️ 3D Frame');
      frameFolder.add(this.params, 'frameVisible').name('Frame Active').onChange(() => {
        this.rebuildFrame();
        this.applyTransforms();
      });
      frameFolder.add(this.params, 'frameThickness', 0.02, 0.30, 0.01).name('Thickness (m)').onChange(() => this.rebuildFrame());
      frameFolder.add(this.params, 'frameDepth', 0.02, 0.30, 0.01).name('Depth (m)').onChange(() => this.rebuildFrame());
      frameFolder.addColor(this.params, 'frameColor').name('Color').onChange(() => this.rebuildFrame());
      frameFolder.add(this.params, 'showGlowTrim').name('LED Glow Trim').onChange(() => this.rebuildFrame());
      frameFolder.addColor(this.params, 'glowColor').name('Glow Color').onChange(() => this.rebuildFrame());

      this.gui.add(this.params, 'copyToClipboard').name('📋 Copy Poster Values');
    } catch (err) {
      console.warn('[OuterWallPoster] Failed to initialize lil-gui:', err);
    }
  }

  copyValues() {
    const formatted = `OUTER_WALL_POSTER_CONFIG = {
  posX: ${this.params.posX.toFixed(2)},
  posY: ${this.params.posY.toFixed(2)},
  posZ: ${this.params.posZ.toFixed(2)},
  rotX: ${this.params.rotX.toFixed(1)},
  rotY: ${this.params.rotY.toFixed(1)},
  rotZ: ${this.params.rotZ.toFixed(1)},
  width: ${this.params.width.toFixed(2)},
  height: ${this.params.height.toFixed(2)},
  scale: ${this.params.scale.toFixed(2)},
  frameVisible: ${this.params.frameVisible},
  frameThickness: ${this.params.frameThickness.toFixed(2)},
  frameDepth: ${this.params.frameDepth.toFixed(2)},
  frameColor: '${this.params.frameColor}',
  showBacking: ${this.params.showBacking},
  showGlowTrim: ${this.params.showGlowTrim},
  glowColor: '${this.params.glowColor}'
};`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    console.log('[OuterWallPoster] Current Settings:\n' + formatted);

    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '85px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '12px 24px';
    toast.style.background = 'rgba(15, 23, 42, 0.95)';
    toast.style.border = '1px solid #38bdf8';
    toast.style.borderRadius = '8px';
    toast.style.color = '#38bdf8';
    toast.style.fontFamily = 'monospace';
    toast.style.fontSize = '13px';
    toast.style.zIndex = '999999';
    toast.style.boxShadow = '0 8px 32px rgba(56, 189, 248, 0.35)';
    toast.innerHTML = '📋 <b>Outer Wall Poster coordinates copied!</b> Paste in chat.';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.6s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 600);
    }, 2800);
  }

  update(delta) {
    if (this.trimMat && this.params.showGlowTrim) {
      this.glowTime += delta * 2.2;
      this.trimMat.opacity = 0.55 + 0.35 * Math.sin(this.glowTime);
    }
  }
}
