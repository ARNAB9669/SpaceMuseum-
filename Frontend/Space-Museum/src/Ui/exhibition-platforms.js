import * as THREE from 'three';
import GUI from 'three/addons/libs/lil-gui.module.min.js';

/*/ =============================================================
    exhibition-platforms.js — 13 Architectural Rover Display Podia
    Procedural sci-fi museum exhibition pedestals in the central
    open-air courtyard plaza. Features multi-tier chamfered titanium bases,
    polished obsidian decks, pulsing neon LED halo rings, concentric
    docking target reticles, and high-definition mission plaques.
    Includes live lil-gui calibration and 3D model mount points.
    ============================================================= /*/

export class ExhibitionPlatforms {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'ExhibitionPlatformsGroup';
    this.glowTime = 0;
    this.platforms = [];
    this.collidableMeshes = [];

    /*/ Global Arena Base Floor Level (Snapping directly to courtyard ground Y = -2.42) /*/
    this.floorY = -2.42;

    /*/ Mission Metadata for the 13 Historic NASA Exploration Missions /*/
    this.missionData = [
      { id: '01', title: 'APOLLO 11 LM', sub: 'LUNAR LANDER • 1969', color: '#38bdf8' },
      { id: '02', title: 'APOLLO 15 LM', sub: 'LUNAR ROVER MISSION • 1971', color: '#38bdf8' },
      { id: '03', title: 'APOLLO 12 LM', sub: 'OCEAN OF STORMS • 1969', color: '#38bdf8' },
      { id: '04', title: 'SURVEYOR 3', sub: 'ROBOTIC MOON PROBE • 1967', color: '#38bdf8' },
      { id: '05', title: 'SOJOURNER ROVER', sub: 'PATHFINDER MARS • 1997', color: '#f97316' },
      { id: '06', title: 'SPIRIT & OPPORTUNITY', sub: 'TWIN MER ROVERS • 2004', color: '#f97316' },
      { id: '07', title: 'VIKING LANDER', sub: 'HISTORIC MARS TOUCHDOWN • 1976', color: '#ef4444' },
      { id: '08', title: 'INSIGHT LANDER', sub: 'MARTIAN GEOPHYSICS • 2018', color: '#f97316' },
      { id: '09', title: 'DAWN SPACECRAFT', sub: 'VESTA & CERES PROBE • 2007', color: '#38bdf8' },
      { id: '10', title: 'NEAR SHOEMAKER', sub: 'ASTEROID 433 EROS • 1996', color: '#a855f7' },
      { id: '11', title: 'PIONEER 10 & 11', sub: 'JUPITER & SATURN VOYAGERS • 1972', color: '#fbbf24' },
      { id: '12', title: 'INGENUITY HELI', sub: 'MARS POWERED FLIGHT • 2021', color: '#10b981' },
      { id: '13', title: 'KEPLER / K2', sub: 'EXOPLANET HUNTER • 2009', color: '#6366f1' }
    ];

    /*/ Default Symmetrical 3-Row Layout in the Open Exhibition Plaza /*/
    this.defaultLayout = [
      /*/ Row 1 (North / Deep Plaza, Z = -18.50) /*/
      { index: 0,  x: -9.00, z: -18.50, rotY: 0.0,  radius: 1.20, height: 0.28 },
      { index: 1,  x: -3.00, z: -18.50, rotY: 0.0,  radius: 1.20, height: 0.28 },
      { index: 2,  x:  3.00, z: -18.50, rotY: 0.0,  radius: 1.20, height: 0.28 },
      { index: 3,  x:  9.00, z: -18.50, rotY: 0.0,  radius: 1.20, height: 0.28 },

      /*/ Row 2 (Central Grand Showcase Aisle, Z = -12.50) /*/
      { index: 4,  x: -10.00, z: -12.50, rotY: 0.0, radius: 1.20, height: 0.28 },
      { index: 5,  x:  -5.00, z: -12.50, rotY: 0.0, radius: 1.20, height: 0.28 },
      { index: 6,  x:   0.00, z: -12.50, rotY: 0.0, radius: 1.45, height: 0.35 }, /*/ Centerpiece VIP platform /*/
      { index: 7,  x:   5.00, z: -12.50, rotY: 0.0, radius: 1.20, height: 0.28 },
      { index: 8,  x:  10.00, z: -12.50, rotY: 0.0, radius: 1.20, height: 0.28 },

      /*/ Row 3 (South / Gallery Approach, Z = -6.50) /*/
      { index: 9,  x: -9.00, z: -6.50, rotY: 0.0,  radius: 1.20, height: 0.28 },
      { index: 10, x: -3.00, z: -6.50, rotY: 0.0,  radius: 1.20, height: 0.28 },
      { index: 11, x:  3.00, z: -6.50, rotY: 0.0,  radius: 1.20, height: 0.28 },
      { index: 12, x:  9.00, z: -6.50, rotY: 0.0,  radius: 1.20, height: 0.28 }
    ];

    /*/ Configurable Parameters /*/
    this.params = {
      visible: true,
      globalScale: 1.0,
      baseColor: '#1e293b',
      deckColor: '#0f172a',
      glowColor: '#00b3ff',
      glowIntensity: 1.0,
      showReticles: true,
      showPlaques: true,
      selectedPlatformIndex: 0,
      copyToClipboard: () => this.copyValues(),
      resetToDefaults: () => this.resetDefaults()
    };

    /*/ Clone positions for live calibration /*/
    this.platformConfigs = JSON.parse(JSON.stringify(this.defaultLayout));

    this.initSharedMaterials();
    this.buildPlatforms();
    this.scene.add(this.group);
    this.initGui();
  }

  initSharedMaterials() {
    /*/ High-Performance Shared PBR Materials /*/
    this.baseMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.params.baseColor),
      metalness: 0.85,
      roughness: 0.25
    });

    this.deckMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.params.deckColor),
      metalness: 0.40,
      roughness: 0.15
    });

    this.glowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.params.glowColor),
      transparent: true,
      opacity: 0.85
    });

    this.reticleMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55
    });

    this.stanchionMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.90,
      roughness: 0.20
    });
  }

  createPlaqueTexture(data) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    /*/ Background Glass Obsidian Card /*/
    ctx.fillStyle = 'rgba(15, 23, 42, 0.96)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /*/ Cyan Tech Border Frame /*/
    ctx.strokeStyle = data.color || '#38bdf8';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    /*/ Top Tech Header Strip /*/
    ctx.fillStyle = data.color || '#38bdf8';
    ctx.fillRect(6, 6, canvas.width - 12, 38);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`NASA EXHIBIT  [ PLATFORM ${data.id} ]`, 24, 32);

    /*/ Mission Title /*/
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(data.title, 24, 105);

    /*/ Subtitle / Mission Classification /*/
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 20px monospace';
    ctx.fillText(data.sub, 24, 150);

    /*/ Staging Status Indicator /*/
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(36, 205, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('3D ROVER MODEL STAGING DOCK', 58, 212);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  buildPlatforms() {
    /*/ Clear previous platform meshes /*/
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
    }
    this.platforms = [];
    this.collidableMeshes = [];

    this.platformConfigs.forEach((cfg) => {
      const pGroup = new THREE.Group();
      pGroup.name = `ExhibitionPlatform_${cfg.index + 1}`;
      pGroup.position.set(cfg.x, this.floorY, cfg.z);
      pGroup.rotation.y = THREE.MathUtils.degToRad(cfg.rotY);
      pGroup.scale.setScalar(this.params.globalScale);

      const R = cfg.radius;
      const H = cfg.height;
      const baseH = H * 0.55;
      const deckH = H * 0.45;

      /*/ 1. Chamfered Metallic Base Plinth /*/
      const baseGeo = new THREE.CylinderGeometry(R, R * 1.08, baseH, 32);
      const baseMesh = new THREE.Mesh(baseGeo, this.baseMat);
      baseMesh.position.y = baseH / 2;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      pGroup.add(baseMesh);
      this.collidableMeshes.push(baseMesh);

      /*/ 2. Glowing Neon LED Ring Trim /*/
      const glowGeo = new THREE.TorusGeometry(R * 1.01, 0.025, 12, 32);
      glowGeo.rotateX(Math.PI / 2);
      const glowMesh = new THREE.Mesh(glowGeo, this.glowMat);
      glowMesh.position.y = baseH;
      pGroup.add(glowMesh);

      /*/ 3. Polished Obsidian Display Deck /*/
      const deckGeo = new THREE.CylinderGeometry(R * 0.96, R * 0.98, deckH, 32);
      const deckMesh = new THREE.Mesh(deckGeo, this.deckMat);
      deckMesh.position.y = baseH + deckH / 2;
      deckMesh.castShadow = true;
      deckMesh.receiveShadow = true;
      pGroup.add(deckMesh);
      this.collidableMeshes.push(deckMesh);

      /*/ 4. Concentric Docking Reticle On Deck Surface /*/
      const reticleGroup = new THREE.Group();
      reticleGroup.name = 'DockingReticle';
      reticleGroup.visible = this.params.showReticles;

      const outerRingGeo = new THREE.RingGeometry(R * 0.75, R * 0.77, 32);
      outerRingGeo.rotateX(-Math.PI / 2);
      const outerRing = new THREE.Mesh(outerRingGeo, this.reticleMat);
      outerRing.position.y = H + 0.002;
      reticleGroup.add(outerRing);

      const innerRingGeo = new THREE.RingGeometry(R * 0.40, R * 0.42, 32);
      innerRingGeo.rotateX(-Math.PI / 2);
      const innerRing = new THREE.Mesh(innerRingGeo, this.reticleMat);
      innerRing.position.y = H + 0.002;
      reticleGroup.add(innerRing);

      /*/ Crosshair Lines /*/
      const crossGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-R * 0.70, H + 0.002, 0),
        new THREE.Vector3( R * 0.70, H + 0.002, 0),
        new THREE.Vector3(0, H + 0.002, -R * 0.70),
        new THREE.Vector3(0, H + 0.002,  R * 0.70)
      ]);
      const crossLines = new THREE.LineSegments(crossGeo, this.reticleMat);
      reticleGroup.add(crossLines);

      pGroup.add(reticleGroup);

      /*/ 5. Interactive Sci-Fi Information Plaque Stanchion /*/
      const plaqueGroup = new THREE.Group();
      plaqueGroup.name = 'InformationPlaque';
      plaqueGroup.visible = this.params.showPlaques;

      /*/ Stanchion Post /*/
      const postGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.75, 12);
      const postMesh = new THREE.Mesh(postGeo, this.stanchionMat);
      postMesh.position.set(0, 0.38, R + 0.28);
      postMesh.rotation.x = THREE.MathUtils.degToRad(-15);
      plaqueGroup.add(postMesh);

      /*/ Angled Information Plaque Tablet /*/
      const data = this.missionData[cfg.index] || { id: `${cfg.index + 1}`, title: `MISSION ${cfg.index + 1}`, sub: 'NASA EXPLORATION', color: '#38bdf8' };
      const plaqueTex = this.createPlaqueTexture(data);
      const tabletGeo = new THREE.BoxGeometry(0.55, 0.30, 0.025);
      const tabletMat = new THREE.MeshStandardMaterial({
        map: plaqueTex,
        metalness: 0.5,
        roughness: 0.3,
        emissive: new THREE.Color(data.color || '#38bdf8'),
        emissiveMap: plaqueTex,
        emissiveIntensity: 0.35
      });
      const tabletMesh = new THREE.Mesh(tabletGeo, tabletMat);
      tabletMesh.position.set(0, 0.75, R + 0.38);
      tabletMesh.rotation.x = THREE.MathUtils.degToRad(-45);
      plaqueGroup.add(tabletMesh);

      pGroup.add(plaqueGroup);

      /*/ 6. Dedicated 3D Model Mount Point (Slot where user models will be placed) /*/
      const mountPoint = new THREE.Group();
      mountPoint.name = `ModelMountPoint_${cfg.index + 1}`;
      mountPoint.position.set(0, H, 0);
      pGroup.add(mountPoint);

      this.group.add(pGroup);
      this.platforms.push({
        group: pGroup,
        config: cfg,
        mountPoint: mountPoint,
        reticleGroup: reticleGroup,
        plaqueGroup: plaqueGroup
      });
    });
  }

  /*/ Convenience method to mount a 3D rover model onto a specific platform /*/
  addRoverModel(platformIndex, modelObject, scale = 1.0, offsetY = 0.0) {
    if (platformIndex < 0 || platformIndex >= this.platforms.length) {
      console.warn(`[ExhibitionPlatforms] Invalid platform index: ${platformIndex}`);
      return;
    }
    const mount = this.platforms[platformIndex].mountPoint;
    modelObject.scale.setScalar(scale);
    modelObject.position.y += offsetY;
    mount.add(modelObject);
    console.log(`[ExhibitionPlatforms] Mounted 3D model to Platform ${platformIndex + 1} (${this.missionData[platformIndex].title})`);
  }

  applyTransforms() {
    this.group.visible = this.params.visible;
    this.baseMat.color.set(this.params.baseColor);
    this.deckMat.color.set(this.params.deckColor);
    this.glowMat.color.set(this.params.glowColor);

    this.platforms.forEach((p, idx) => {
      const cfg = this.platformConfigs[idx];
      p.group.position.set(cfg.x, this.floorY, cfg.z);
      p.group.rotation.y = THREE.MathUtils.degToRad(cfg.rotY);
      p.group.scale.setScalar(this.params.globalScale);
      p.reticleGroup.visible = this.params.showReticles;
      p.plaqueGroup.visible = this.params.showPlaques;
    });
  }

  initGui() {
    /*/ UI Gating: Only display lil-gui controls if window.DEBUG_EXHIBITION_PLATFORMS is true
        or when explicitly requested via #gui hash in the URL.
        To re-open the live calibration GUI, add #gui to the URL in browser /*/
    if (typeof window !== 'undefined' && !window.location.hash.includes('gui') && !window.DEBUG_EXHIBITION_PLATFORMS) {
      return;
    }

    try {
      this.gui = new GUI({ title: '🏛️ 13 Rover Platforms Calibration' });
      this.gui.domElement.style.position = 'fixed';
      this.gui.domElement.style.top = '20px';
      this.gui.domElement.style.right = '20px';
      this.gui.domElement.style.zIndex = '999999';

      /*/ Prevent canvas pointer lock from interfering with slider drag /*/
      ['pointerdown', 'mousedown', 'click', 'touchstart'].forEach((evt) => {
        this.gui.domElement.addEventListener(evt, (e) => e.stopPropagation());
      });

      const globalFolder = this.gui.addFolder('🌐 Master Arena Controls');
      globalFolder.add(this.params, 'visible').name('Show Platforms').onChange(() => this.applyTransforms());
      globalFolder.add(this.params, 'globalScale', 0.5, 2.0, 0.05).name('Global Scale').onChange(() => this.applyTransforms());
      globalFolder.addColor(this.params, 'glowColor').name('LED Glow Color').onChange(() => this.applyTransforms());
      globalFolder.add(this.params, 'glowIntensity', 0.1, 3.0, 0.1).name('Glow Pulse');
      globalFolder.add(this.params, 'showReticles').name('Docking Targets').onChange(() => this.applyTransforms());
      globalFolder.add(this.params, 'showPlaques').name('Mission Plaques').onChange(() => this.applyTransforms());
      globalFolder.open();

      /*/ Individual Platform Tuner /*/
      const singleFolder = this.gui.addFolder('📍 Tune Selected Platform');
      const platformOptions = {};
      this.missionData.forEach((m, idx) => {
        platformOptions[`[${m.id}] ${m.title}`] = idx;
      });

      const selectedCfg = () => this.platformConfigs[this.params.selectedPlatformIndex];

      singleFolder.add(this.params, 'selectedPlatformIndex', platformOptions).name('Select Platform').onChange(() => {
        if (this.xCtrl) this.xCtrl.setValue(selectedCfg().x);
        if (this.zCtrl) this.zCtrl.setValue(selectedCfg().z);
        if (this.rotCtrl) this.rotCtrl.setValue(selectedCfg().rotY);
      });

      this.xCtrl = singleFolder.add(selectedCfg(), 'x', -15.0, 15.0, 0.1).name('X (Left/Right)').onChange((val) => {
        selectedCfg().x = val;
        this.applyTransforms();
      });

      this.zCtrl = singleFolder.add(selectedCfg(), 'z', -25.0, -2.0, 0.1).name('Z (Depth)').onChange((val) => {
        selectedCfg().z = val;
        this.applyTransforms();
      });

      this.rotCtrl = singleFolder.add(selectedCfg(), 'rotY', -180, 180, 5).name('Yaw Y (Deg)').onChange((val) => {
        selectedCfg().rotY = val;
        this.applyTransforms();
      });
      singleFolder.open();

      this.gui.add(this.params, 'copyToClipboard').name('📋 Copy Coordinates');
      this.gui.add(this.params, 'resetToDefaults').name('🔄 Reset to Defaults');
    } catch (err) {
      console.warn('[ExhibitionPlatforms] Failed to initialize lil-gui:', err);
    }
  }

  resetDefaults() {
    this.platformConfigs = JSON.parse(JSON.stringify(this.defaultLayout));
    if (this.gui && typeof this.gui.controllersRecursive === 'function') {
      this.gui.controllersRecursive().forEach((c) => c.updateDisplay());
    }
    this.applyTransforms();

    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '90px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '12px 24px';
    toast.style.background = 'rgba(15, 23, 42, 0.95)';
    toast.style.border = '1px solid #f59e0b';
    toast.style.borderRadius = '8px';
    toast.style.color = '#fbbf24';
    toast.style.fontFamily = 'monospace';
    toast.style.fontSize = '13px';
    toast.style.zIndex = '999999';
    toast.style.boxShadow = '0 8px 32px rgba(245, 158, 11, 0.35)';
    toast.innerHTML = '🔄 <b>13 Rover Platforms reset to default layout!</b>';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.6s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 600);
    }, 2800);
  }

  copyValues() {
    const formatted = `EXHIBITION_PLATFORMS_CONFIG = ${JSON.stringify(this.platformConfigs, null, 2)};`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    console.log('[ExhibitionPlatforms] Current Configuration:\n', formatted);

    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '90px';
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
    toast.innerHTML = '📋 <b>13 Platform Coordinates copied!</b> Paste in chat.';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.6s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 600);
    }, 2800);
  }

  update(delta) {
    /*/ Breathing Neon Halo Ring Animation /*/
    if (this.glowMat) {
      this.glowTime += delta * 2.4;
      this.glowMat.opacity = (0.65 + 0.30 * Math.sin(this.glowTime)) * this.params.glowIntensity;
    }
  }
}
