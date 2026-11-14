import * as THREE from 'three';
import GUI from 'three/addons/libs/lil-gui.module.min.js';

/*/ Creates procedural soft round texture for star particles /*/
function createStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(0.15, 'rgba(230, 245, 255, 0.9)');
  gradient.addColorStop(0.4, 'rgba(120, 180, 255, 0.35)');
  gradient.addColorStop(0.8, 'rgba(60, 100, 200, 0.08)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/*/ Creates soft volumetric nebula gas puff texture /*/
function createNebulaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.3, 'rgba(200, 220, 255, 0.35)');
  gradient.addColorStop(0.65, 'rgba(100, 140, 255, 0.1)');
  gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/*/ Space Environment Background (Cosmic Stars, Nebulae, Horizon) /*/
export class SpaceEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'SpaceEnvironment';
    this.scene.add(this.group);

    this.starTexture = createStarTexture();
    this.nebulaTexture = createNebulaTexture();

    this.initBackgroundStars();
    this.initBrightStars();
    this.initNebulae();
    this.initDistantCelestial();
    this.initAmbientSpaceGlow();
  }

  initBackgroundStars() {
    const starCount = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const spectralColors = [
      new THREE.Color('#9bb0ff'), /*/ Deep Blue (O/B type) /*/
      new THREE.Color('#bbccff'), /*/ Light Blue /*/
      new THREE.Color('#f8f9ff'), /*/ Pure White (A type) /*/
      new THREE.Color('#fff4e8'), /*/ Warm White (F/G type) /*/
      new THREE.Color('#ffd2a1'), /*/ Golden Orange (K type) /*/
      new THREE.Color('#ff8866')  /*/ Red Giant (M type) /*/
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 600 + Math.random() * 500;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = spectralColors[Math.floor(Math.random() * spectralColors.length)];
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() < 0.95 ? (1.5 + Math.random() * 2.5) : (4.0 + Math.random() * 4.0);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 2.5,
      map: this.starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, material);
    this.group.add(this.stars);
  }

  initBrightStars() {
    const brightCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(brightCount * 3);
    const colors = new Float32Array(brightCount * 3);

    const palette = [
      new THREE.Color('#70b4ff'),
      new THREE.Color('#ffffff'),
      new THREE.Color('#ffe299'),
      new THREE.Color('#ff7e67')
    ];

    for (let i = 0; i < brightCount; i++) {
      const radius = 550 + Math.random() * 300;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 8.0,
      map: this.starTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.brightStars = new THREE.Points(geometry, material);
    this.group.add(this.brightStars);
  }

  initNebulae() {
    this.nebulaGroup = new THREE.Group();

    const nebulaPuffCount = 90;
    const nebulaColors = [
      new THREE.Color('#1e1b4b'), /*/ Deep Indigo /*/
      new THREE.Color('#0369a1'), /*/ Cyan Glow /*/
      new THREE.Color('#4c1d95'), /*/ Nebula Purple /*/
      new THREE.Color('#0f766e'), /*/ Teal Ion Cloud /*/
      new THREE.Color('#831843')  /*/ Deep Rose Magenta /*/
    ];

    for (let i = 0; i < nebulaPuffCount; i++) {
      const material = new THREE.SpriteMaterial({
        map: this.nebulaTexture,
        color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
        transparent: true,
        opacity: 0.12 + Math.random() * 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const sprite = new THREE.Sprite(material);
      const radius = 450 + Math.random() * 250;
      const theta = Math.PI * 0.8 + (Math.random() - 0.5) * 1.5;
      const phi = Math.PI * 0.45 + (Math.random() - 0.5) * 1.0;

      sprite.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta) + (Math.random() - 0.5) * 100,
        radius * Math.cos(phi)
      );

      const scale = 140 + Math.random() * 180;
      sprite.scale.set(scale, scale, 1);

      this.nebulaGroup.add(sprite);
    }

    this.group.add(this.nebulaGroup);
  }

  initDistantCelestial() {
    const celestialGroup = new THREE.Group();
    celestialGroup.position.set(380, 160, -520);

    const planetGeo = new THREE.SphereGeometry(32, 32, 32);
    const planetMat = new THREE.MeshBasicMaterial({ color: 0x05162a });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    celestialGroup.add(planet);

    const glowMat = new THREE.SpriteMaterial({
      map: this.nebulaTexture,
      color: new THREE.Color('#38bdf8'),
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const glowSprite = new THREE.Sprite(glowMat);
    glowSprite.scale.set(120, 120, 1);
    glowSprite.position.set(-8, 6, 0);
    celestialGroup.add(glowSprite);

    this.celestial = celestialGroup;
    this.group.add(this.celestial);
  }

  initAmbientSpaceGlow() {
    /*/ Distant celestial starlight direction /*/
    const starlight = new THREE.DirectionalLight(0xdbeafe, 0.4);
    starlight.position.set(-200, 300, 400);
    this.group.add(starlight);
  }

  update(delta) {
    if (this.stars) {
      this.stars.rotation.y += delta * 0.003;
      this.stars.rotation.x += delta * 0.001;
    }
    if (this.brightStars) {
      this.brightStars.rotation.y += delta * 0.003;
      this.brightStars.rotation.x += delta * 0.001;
    }
    if (this.nebulaGroup) {
      this.nebulaGroup.rotation.y += delta * 0.0015;
    }
  }
}

/*/ -------------------------------------------------------------
    Transparent White Biodome / Firmament Canopy
    Covers the circular museum island like a protective glass dome
    ------------------------------------------------------------- /*/
export class Biodome {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'IslandBiodome';

    /*/ Calibrated Dimensions to match the 3D Island base /*/
    this.baseRadius = 42.25;
    this.floorY = -2.42;
    this.domeHeightScale = 0.62; /*/ Gentle hemisphere ratio /*/

    /*/ Interactive Hover & Highlight State /*/
    this.isHighlighted = false;
    this.highlightFactor = 0; /*/ 0 = idle, 1 = fully popped & glowing /*/

    /*/ Outside (Cold Cosmic Blue) vs Inside (Warm Classical Gold) Colors /*/
    this.coldRingColor = new THREE.Color(0xdbeafe);
    this.warmRingColor = new THREE.Color(0xfef3c7);
    this.coldRingEmissive = new THREE.Color(0x38bdf8);
    this.warmRingEmissive = new THREE.Color(0xf59e0b);
    this.coldLineColor = new THREE.Color(0x93c5fd);
    this.warmLineColor = new THREE.Color(0xfef3c7);
    this.coldGlowColor = new THREE.Color(0x38bdf8);
    this.warmGlowColor = new THREE.Color(0xfef08a);

    this.initGlassCanopy();
    this.initGeodesicGrid();
    this.initBaseRimRing();
    this.initFresnelShieldGlow();

    /*/ Entrance Holographic Banner with Real-time lil-gui Editor /*/
    this.entranceBanner = new EntranceBanner(this.scene);

    this.setInsideTransition(0.0);

    this.group.position.set(0, this.floorY, 0);
    this.scene.add(this.group);
  }

  initGlassCanopy() {
    /*/ Upper hemisphere geometry (thetaLength = PI/2) /*/
    const geometry = new THREE.SphereGeometry(
      this.baseRadius,
      64,
      32,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );

    /*/ Scale Y to form a sleek architectural canopy /*/
    geometry.scale(1.0, this.domeHeightScale, 1.0);

    /*/ High-Performance White Translucent Glass Material /*/
    this.glassMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.15,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.glassMesh = new THREE.Mesh(geometry, this.glassMaterial);
    this.group.add(this.glassMesh);
  }

  initGeodesicGrid() {
    /*/ Structural Hexagonal / Lat-Lon Ribs /*/
    const gridGeometry = new THREE.SphereGeometry(
      this.baseRadius * 1.002,
      48,
      20,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    gridGeometry.scale(1.0, this.domeHeightScale, 1.0);

    const wireframe = new THREE.WireframeGeometry(gridGeometry);
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: 0xfef3c7,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.gridLines = new THREE.LineSegments(wireframe, this.lineMaterial);
    this.group.add(this.gridLines);
  }

  initBaseRimRing() {
    /*/ High-tech perimeter foundation ring sealing dome to disc /*/
    const ringGeo = new THREE.TorusGeometry(this.baseRadius, 0.45, 16, 128);
    ringGeo.rotateX(Math.PI / 2);

    this.ringMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.85
    });

    this.baseRing = new THREE.Mesh(ringGeo, this.ringMat);
    this.baseRing.position.y = 0.05;
    this.group.add(this.baseRing);
  }

  initFresnelShieldGlow() {
    /*/ Subtle soft starlight edge sheen /*/
    const outerGeo = new THREE.SphereGeometry(
      this.baseRadius * 1.008,
      32,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    );
    outerGeo.scale(1.0, this.domeHeightScale, 1.0);

    this.glowMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.glowDome = new THREE.Mesh(outerGeo, this.glowMat);
    this.group.add(this.glowDome);
  }

  setInsideTransition(factor) {
    const f = THREE.MathUtils.clamp(factor, 0.0, 1.0);
    if (this.ringMat) {
      this.ringMat.color.lerpColors(this.coldRingColor, this.warmRingColor, f);
      this.ringMat.emissive.lerpColors(this.coldRingEmissive, this.warmRingEmissive, f);
    }
    if (this.lineMaterial) {
      this.lineMaterial.color.lerpColors(this.coldLineColor, this.warmLineColor, f);
    }
    if (this.glowMat) {
      this.glowMat.color.lerpColors(this.coldGlowColor, this.warmGlowColor, f);
    }
  }

  setHighlight(active) {
    this.isHighlighted = !!active;
  }

  getRaycastMeshes() {
    return [this.glassMesh, this.baseRing];
  }

  update(delta) {
    /*/ Subtle structural grid rotation /*/
    if (this.gridLines) {
      this.gridLines.rotation.y += delta * 0.005;
    }

    /*/ Smooth pop & glow interpolation /*/
    const target = this.isHighlighted ? 1.0 : 0.0;
    this.highlightFactor += (target - this.highlightFactor) * Math.min(1.0, delta * 9.0);

    /*/ Scale Pop when hovered /*/
    const popScale = 1.0 + this.highlightFactor * 0.035;
    this.group.scale.set(popScale, popScale, popScale);

    /*/ Rim Ring Emissive Burst /*/
    if (this.ringMat) {
      this.ringMat.emissiveIntensity = 0.6 + this.highlightFactor * 1.5;
    }

    /*/ Geodesic Wireframe Brightness /*/
    if (this.lineMaterial) {
      this.lineMaterial.opacity = 0.12 + this.highlightFactor * 0.45;
    }

    /*/ Glass Sheen & Opacity Pop /*/
    if (this.glassMaterial) {
      this.glassMaterial.opacity = 0.32 + this.highlightFactor * 0.24;
    }

    /*/ Outer Holographic Shield Glow /*/
    if (this.glowMat) {
      this.glowMat.opacity = 0.06 + this.highlightFactor * 0.22;
    }

    /*/ Update Entrance Banner /*/
    if (this.entranceBanner) {
      this.entranceBanner.update(delta);
    }
  }
}

/*/ -------------------------------------------------------------
    Entrance Holographic Exhibition Banner with 3D Bezel Frame
    Displays /banner.png with frame, support mount & lil-gui controls
    ------------------------------------------------------------- /*/
export class EntranceBanner {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'EntranceBanner';
    this.glowTime = 0;

    /*/ Final Calibrated Parameters (Calibrated by user via GUI) /*/
    this.params = {
      posX: -14.90,
      posY: 0.30,
      posZ: 28.20,
      rotX: 0.0,
      rotY: 90.0,
      rotZ: 0.0,
      width: 5.50,
      height: 3.07, /*/ 16:9 native aspect ratio matching 2752x1536 banner.png /*/
      scale: 1.0,
      opacity: 1.0,
      toneMapped: true,
      visible: true,

      /*/ 3D Physical Frame & Mounting Options /*/
      frameVisible: true,
      frameThickness: 0.12,   /*/ Bezel width surrounding image in meters /*/
      frameDepth: 0.14,       /*/ Frame extrusion depth in meters /*/
      frameColor: '#1e293b',  /*/ Dark slate / titanium finish /*/
      frameMetalness: 0.85,
      frameRoughness: 0.25,
      showBacking: true,      /*/ Solid back enclosure plate /*/
      showLegs: true,         /*/ Vertical support gantry posts /*/
      legHeight: 2.15,        /*/ Support legs height down to platform floor /*/
      showGlowTrim: true,     /*/ Sci-fi neon accent trim /*/
      glowColor: '#38bdf8',   /*/ Luminous cyan accent /*/

      copyToClipboard: () => this.copyValues()
    };

    this.initBanner();
    this.initGui();
    this.applyTransforms();

    this.scene.add(this.group);
  }

  initBanner() {
    const loader = new THREE.TextureLoader();
    this.texture = loader.load('/banner.png');
    this.texture.colorSpace = THREE.SRGBColorSpace;

    this.geometry = new THREE.PlaneGeometry(this.params.width, this.params.height);
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: this.params.opacity,
      toneMapped: this.params.toneMapped
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, 0, 0.005);
    this.group.add(this.mesh);

    /*/ Frame container /*/
    this.frameGroup = new THREE.Group();
    this.frameGroup.name = 'BannerFrameGroup';
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

    /*/ 1. Top Bezel Bar /*/
    const topGeo = new THREE.BoxGeometry(W + 2 * T, T, D);
    const topMesh = new THREE.Mesh(topGeo, frameMat);
    topMesh.position.set(0, H / 2 + T / 2, 0);
    this.frameGroup.add(topMesh);

    /*/ 2. Bottom Bezel Bar /*/
    const bottomGeo = new THREE.BoxGeometry(W + 2 * T, T, D);
    const bottomMesh = new THREE.Mesh(bottomGeo, frameMat);
    bottomMesh.position.set(0, -H / 2 - T / 2, 0);
    this.frameGroup.add(bottomMesh);

    /*/ 3. Left Bezel Bar /*/
    const leftGeo = new THREE.BoxGeometry(T, H, D);
    const leftMesh = new THREE.Mesh(leftGeo, frameMat);
    leftMesh.position.set(-W / 2 - T / 2, 0, 0);
    this.frameGroup.add(leftMesh);

    /*/ 4. Right Bezel Bar /*/
    const rightGeo = new THREE.BoxGeometry(T, H, D);
    const rightMesh = new THREE.Mesh(rightGeo, frameMat);
    rightMesh.position.set(W / 2 + T / 2, 0, 0);
    this.frameGroup.add(rightMesh);

    /*/ 5. Solid Back Enclosure Plate /*/
    if (this.params.showBacking) {
      const backGeo = new THREE.BoxGeometry(W + 2 * T, H + 2 * T, 0.02);
      const backMat = new THREE.MeshStandardMaterial({
        color: this.params.frameColor,
        metalness: this.params.frameMetalness * 0.9,
        roughness: Math.min(1.0, this.params.frameRoughness * 1.2)
      });
      const backMesh = new THREE.Mesh(backGeo, backMat);
      backMesh.position.set(0, 0, -D / 2);
      this.frameGroup.add(backMesh);
    }

    /*/ 6. Vertical Support Gantry Posts (Legs) /*/
    if (this.params.showLegs) {
      const L = this.params.legHeight;
      const legGeo = new THREE.BoxGeometry(T, L, D);

      const leftLeg = new THREE.Mesh(legGeo, frameMat);
      leftLeg.position.set(-W / 2 - T / 2, -H / 2 - T - L / 2, 0);
      this.frameGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, frameMat);
      rightLeg.position.set(W / 2 + T / 2, -H / 2 - T - L / 2, 0);
      this.frameGroup.add(rightLeg);

      /*/ Heavy base mounting foot pads /*/
      const footGeo = new THREE.BoxGeometry(T * 1.7, 0.05, D * 1.7);
      const leftFoot = new THREE.Mesh(footGeo, frameMat);
      leftFoot.position.set(-W / 2 - T / 2, -H / 2 - T - L + 0.025, 0);
      this.frameGroup.add(leftFoot);

      const rightFoot = new THREE.Mesh(footGeo, frameMat);
      rightFoot.position.set(W / 2 + T / 2, -H / 2 - T - L + 0.025, 0);
      this.frameGroup.add(rightFoot);
    }

    /*/ 7. Luminous Holographic LED Accent Trim /*/
    if (this.params.showGlowTrim) {
      /*/ Inner image border glow /*/
      const innerTrimGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(W, H));
      this.trimMat = new THREE.LineBasicMaterial({
        color: this.params.glowColor,
        transparent: true,
        opacity: 0.85
      });
      const innerLine = new THREE.LineSegments(innerTrimGeo, this.trimMat);
      innerLine.position.set(0, 0, D / 2 + 0.003);
      this.frameGroup.add(innerLine);

      /*/ Outer frame border glow /*/
      const outerTrimGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(W + 2 * T, H + 2 * T));
      const outerTrimMat = new THREE.LineBasicMaterial({
        color: this.params.glowColor,
        transparent: true,
        opacity: 0.45
      });
      const outerLine = new THREE.LineSegments(outerTrimGeo, outerTrimMat);
      outerLine.position.set(0, 0, D / 2 + 0.003);
      this.frameGroup.add(outerLine);
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
    /*/ The banner coordinates and frame parameters are finalized.
        To re-open the live calibration GUI, add #gui to the URL in the browser /*/
    if (typeof window !== 'undefined' && !window.location.hash.includes('gui') && !window.DEBUG_BANNER) {
      return;
    }

    try {
      this.gui = new GUI({ title: '🏛️ Banner Position, Size & Frame' });
      this.gui.domElement.style.position = 'fixed';
      this.gui.domElement.style.top = '20px';
      this.gui.domElement.style.right = '20px';
      this.gui.domElement.style.zIndex = '99999';

      /*/ Prevent canvas clicks or pointer lock from stealing focus /*/
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
      sizeFolder.add(this.params, 'width', 0.5, 30, 0.1).name('Width (m)').onChange(() => {
        this.rebuildGeometry();
        this.applyTransforms();
      });
      sizeFolder.add(this.params, 'height', 0.5, 20, 0.1).name('Height (m)').onChange(() => {
        this.rebuildGeometry();
        this.applyTransforms();
      });
      sizeFolder.add(this.params, 'scale', 0.1, 5.0, 0.05).name('Overall Scale').onChange(() => this.applyTransforms());
      sizeFolder.open();

      const frameFolder = this.gui.addFolder('🖼️ 3D Frame & Mount');
      frameFolder.add(this.params, 'frameVisible').name('Frame Active').onChange(() => {
        this.rebuildFrame();
        this.applyTransforms();
      });
      frameFolder.add(this.params, 'frameThickness', 0.02, 0.40, 0.01).name('Thickness (m)').onChange(() => this.rebuildFrame());
      frameFolder.add(this.params, 'frameDepth', 0.02, 0.50, 0.01).name('Depth (m)').onChange(() => this.rebuildFrame());
      frameFolder.addColor(this.params, 'frameColor').name('Frame Color').onChange(() => this.rebuildFrame());
      frameFolder.add(this.params, 'frameMetalness', 0.0, 1.0, 0.05).name('Metalness').onChange(() => this.rebuildFrame());
      frameFolder.add(this.params, 'frameRoughness', 0.0, 1.0, 0.05).name('Roughness').onChange(() => this.rebuildFrame());
      frameFolder.add(this.params, 'showBacking').name('Backing Plate').onChange(() => this.rebuildFrame());
      frameFolder.add(this.params, 'showLegs').name('Support Legs').onChange(() => this.rebuildFrame());
      frameFolder.add(this.params, 'legHeight', 0.2, 8.0, 0.05).name('Leg Height (m)').onChange(() => this.rebuildFrame());
      frameFolder.add(this.params, 'showGlowTrim').name('LED Trim Glow').onChange(() => this.rebuildFrame());
      frameFolder.addColor(this.params, 'glowColor').name('Glow Color').onChange(() => this.rebuildFrame());
      frameFolder.open();

      const appFolder = this.gui.addFolder('✨ Appearance');
      appFolder.add(this.params, 'opacity', 0.0, 1.0, 0.05).name('Opacity').onChange(() => this.applyTransforms());
      appFolder.add(this.params, 'toneMapped').name('Tone Mapping').onChange(() => this.applyTransforms());
      appFolder.add(this.params, 'visible').name('Visible').onChange(() => this.applyTransforms());

      this.gui.add(this.params, 'copyToClipboard').name('📋 Copy Values to Chat');
    } catch (err) {
      console.warn('[EntranceBanner] Failed to initialize lil-gui:', err);
    }
  }

  copyValues() {
    const formatted = `BANNER_CONFIG = {
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
  frameMetalness: ${this.params.frameMetalness.toFixed(2)},
  frameRoughness: ${this.params.frameRoughness.toFixed(2)},
  showBacking: ${this.params.showBacking},
  showLegs: ${this.params.showLegs},
  legHeight: ${this.params.legHeight.toFixed(2)},
  showGlowTrim: ${this.params.showGlowTrim},
  glowColor: '${this.params.glowColor}'
};`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    console.log('[EntranceBanner] Current Settings:\n' + formatted);

    /*/ User-facing notification toast /*/
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
    toast.innerHTML = '📋 <b>Banner coordinates & frame settings copied!</b> Paste in chat.';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.6s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 600);
    }, 2800);
  }

  update(delta) {
    if (this.trimMat && this.params.showGlowTrim) {
      this.glowTime += delta * 2.5;
      this.trimMat.opacity = 0.55 + 0.35 * Math.sin(this.glowTime);
    }
  }
}
