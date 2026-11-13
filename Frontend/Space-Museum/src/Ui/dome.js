import * as THREE from 'three';

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
    const ambient = new THREE.AmbientLight(0x0a1020, 0.4);
    this.group.add(ambient);

    const starlight = new THREE.DirectionalLight(0xdbeafe, 0.6);
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

    this.initGlassCanopy();
    this.initGeodesicGrid();
    this.initBaseRimRing();
    this.initFresnelShieldGlow();

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

    /*/ White Translucent Glass Material /*/
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.08,
      metalness: 0.1,
      transmission: 0.85,  /*/ Real optical transmission /*/
      ior: 1.45,           /*/ Glass Index of Refraction /*/
      transparent: true,
      opacity: 0.32,
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
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.12,
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
      color: 0xdbeafe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.6,
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
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });

    this.glowDome = new THREE.Mesh(outerGeo, this.glowMat);
    this.group.add(this.glowDome);
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
  }
}
