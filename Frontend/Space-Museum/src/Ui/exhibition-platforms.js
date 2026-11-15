import * as THREE from 'three';
import GUI from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

/*/ =============================================================
    exhibition-platforms.js — Exhibition Rover Display Podia
    Procedural sci-fi museum exhibition pedestals in the central
    open-air courtyard plaza. Features multi-tier chamfered titanium bases,
    polished obsidian decks, pulsing neon LED halo rings, concentric
    docking target reticles, authentic 3D tablet stands with mission plaques,
    and loaded 3D NASA rovers / spacecraft.
    Provides dedicated lil-gui calibration for each individual platform
    and model (radius, height, coordinates, orientation, scale, hover).
    ============================================================= /*/

export class ExhibitionPlatforms {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'ExhibitionPlatformsGroup';
    this.glowTime = 0;
    this.platforms = [];
    this.collidableMeshes = [];

    /*/ Initialize DRACO decompression loader for lightweight NASA 3D models /*/
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/');

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    this.mountedModels = {};

    /*/ 100% Procedural Sci-Fi Tablet Stand Calibration /*/
    this.standParams = {
      offsetZ: 0.24,
      tabletHeight: 0.98,
      tabletTilt: -51
    };

    /*/ Stage Spotlight Configuration (Focuses dramatic stage lighting on each rover) /*/
    this.stageLightParams = {
      enabled: true,
      intensity: 50.0,
      angle: 65,
      penumbra: 0.3,
      color: '#ffffff',
      distanceRatio: 2.8,
      targetOffsetY: 1.0
    };

    /*/ Global Arena Base Floor Level (Courtyard ground Y = -2.42) /*/
    this.floorY = -2.42;

    /*/ Active Exhibition Podia Roster (Exactly 8 NASA Exploration Missions with 3D Models) /*/
    this.defaultPlatforms = [
      {
        id: '01',
        title: 'APOLLO 11 LM',
        sub: 'LUNAR LANDER • 1969',
        color: '#38bdf8',
        modelUrl: '/models/Apollo Lunar Module.glb',
        x: -10.50,
        z: -17.40,
        rotY: 43.0,
        scaleX: 1.0,
        scaleZ: 1.0,
        radius: 2.30,
        height: 0.31,
        standAngle: 0,
        scale: 0.65,
        modelRotX: 0.0,
        modelRotY: 15.0,
        modelRotZ: 0.0,
        offsetY: 0.0,
        turntable: true,
        turntableSpeed: 0.2
      },
      {
        id: '06',
        title: 'SPIRIT & OPPORTUNITY',
        sub: 'TWIN MER ROVERS • 2004',
        color: '#f97316',
        modelUrl: '/models/24883_MER_static.glb',
        x: -4.60,
        z: -6.80,
        rotY: 152.0,
        scaleX: 1.0,
        scaleZ: 1.0,
        radius: 1.50,
        height: 0.28,
        standAngle: 0,
        scale: 1.275,
        modelRotX: 0.0,
        modelRotY: 15.0,
        modelRotZ: 0.0,
        offsetY: 0.0,
        turntable: true,
        turntableSpeed: 0.2
      },
      {
        id: '07',
        title: 'VIKING LANDER',
        sub: 'HISTORIC MARS TOUCHDOWN • 1976',
        color: '#ef4444',
        modelUrl: '/models/Viking Lander.glb',
        x: -3.10,
        z: -17.70,
        rotY: 25.0,
        scaleX: 1.0,
        scaleZ: 1.0,
        radius: 2.15,
        height: 0.32,
        standAngle: 0,
        scale: 0.215,
        modelRotX: 0.0,
        modelRotY: 20.0,
        modelRotZ: 0.0,
        offsetY: 0.0,
        turntable: true,
        turntableSpeed: 0.2
      },
      {
        id: '08',
        title: 'INSIGHT LANDER',
        sub: 'MARTIAN GEOPHYSICS • 2018',
        color: '#f97316',
        modelUrl: '/models/24880_InSight_deployed.glb',
        x: 4.00,
        z: -17.70,
        rotY: -8.0,
        scaleX: 1.0,
        scaleZ: 1.0,
        radius: 2.40,
        height: 0.28,
        standAngle: 0,
        scale: 0.96,
        modelRotX: 0.0,
        modelRotY: 15.0,
        modelRotZ: 0.0,
        offsetY: 0.0,
        turntable: true,
        turntableSpeed: 0.2
      },
      {
        id: '09',
        title: 'DAWN SPACECRAFT',
        sub: 'VESTA & CERES PROBE • 2007',
        color: '#38bdf8',
        modelUrl: '/models/Dawn.glb',
        x: 10.80,
        z: -15.80,
        rotY: 0.0,
        scaleX: 1.0,
        scaleZ: 1.0,
        radius: 3.15,
        height: 0.28,
        standAngle: 0,
        scale: 0.295,
        modelRotX: 0.0,
        modelRotY: 25.0,
        modelRotZ: 0.0,
        offsetY: 0.25,
        turntable: true,
        turntableSpeed: 0.2
      },
      {
        id: '10',
        title: 'NEAR SHOEMAKER',
        sub: 'ASTEROID 433 EROS • 1996',
        color: '#a855f7',
        modelUrl: '/models/NEAR Shoemaker.glb',
        x: -10.90,
        z: -7.40,
        rotY: -37.0,
        scaleX: 1.0,
        scaleZ: 1.0,
        radius: 2.05,
        height: 0.26,
        standAngle: 180,
        scale: 0.92,
        modelRotX: 0.0,
        modelRotY: 15.0,
        modelRotZ: 0.0,
        offsetY: 0.39,
        turntable: true,
        turntableSpeed: 0.2
      },
      {
        id: '11',
        title: 'PIONEER 10 & 11',
        sub: 'JUPITER & SATURN VOYAGERS • 1972',
        color: '#fbbf24',
        modelUrl: '/models/Pioneer 10.glb',
        x: 3.60,
        z: -6.80,
        rotY: 0.0,
        scaleX: 1.0,
        scaleZ: 1.0,
        radius: 1.60,
        height: 0.28,
        standAngle: 180,
        scale: 0.22,
        modelRotX: 0.0,
        modelRotY: 35.0,
        modelRotZ: 0.0,
        offsetY: 0.30,
        turntable: true,
        turntableSpeed: 0.2
      },
      {
        id: '12',
        title: 'INGENUITY HELI',
        sub: 'MARS POWERED FLIGHT • 2021',
        color: '#10b981',
        modelUrl: '/models/Ingenuity Mars Helicopter.glb',
        x: 11.50,
        z: -6.50,
        rotY: 67.0,
        scaleX: 1.0,
        scaleZ: 1.0,
        radius: 1.95,
        height: 0.28,
        standAngle: 180,
        scale: 3.00,
        modelRotX: 0.0,
        modelRotY: 20.0,
        modelRotZ: 0.0,
        offsetY: 0.0,
        turntable: true,
        turntableSpeed: 0.2
      }
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
      showPlaques: true
    };

    /*/ Active Runtime Configurations /*/
    this.platformConfigs = JSON.parse(JSON.stringify(this.defaultPlatforms));

    this.initSharedMaterials();
    this.buildPlatforms();
    this.loadInitialModels();
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

    this.standMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25
    });

    this.sharedMaterials = new Set([
      this.baseMat,
      this.deckMat,
      this.glowMat,
      this.reticleMat,
      this.stanchionMat,
      this.standMat
    ]);
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
    ctx.font = 'bold 34px sans-serif';
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

    this.platformConfigs.forEach((cfg, idx) => {
      const pGroup = new THREE.Group();
      pGroup.name = `ExhibitionPlatform_${cfg.id}`;
      pGroup.position.set(cfg.x, this.floorY, cfg.z);
      pGroup.rotation.y = THREE.MathUtils.degToRad(cfg.rotY);
      const sx = this.params.globalScale * (cfg.scaleX !== undefined ? cfg.scaleX : 1.0);
      const sy = this.params.globalScale;
      const sz = this.params.globalScale * (cfg.scaleZ !== undefined ? cfg.scaleZ : 1.0);
      pGroup.scale.set(sx, sy, sz);

      const R = cfg.radius;
      const H = cfg.height;
      const baseH = H * 0.55;
      const deckH = H * 0.45;

      /*/ 1. Chamfered Metallic Base Plinth /*/
      const baseGeo = new THREE.CylinderGeometry(R, R * 1.08, baseH, 32);
      const baseMesh = new THREE.Mesh(baseGeo, this.baseMat);
      baseMesh.position.y = baseH / 2;
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
      pGroup.add(plaqueGroup);

      /*/ 6. Dedicated 3D Model Mount Point /*/
      const mountPoint = new THREE.Group();
      mountPoint.name = `ModelMountPoint_${cfg.id}`;
      mountPoint.position.set(0, H, 0);
      pGroup.add(mountPoint);

      /*/ 7. Dramatic Architectural Rover Stage Spotlight System /*/
      const stageLightGroup = new THREE.Group();
      stageLightGroup.name = `StageLights_${cfg.id}`;
      pGroup.add(stageLightGroup);

      this.group.add(pGroup);
      const platformEntry = {
        group: pGroup,
        config: cfg,
        baseMesh: baseMesh,
        glowMesh: glowMesh,
        deckMesh: deckMesh,
        mountPoint: mountPoint,
        reticleGroup: reticleGroup,
        plaqueGroup: plaqueGroup,
        stageLightGroup: stageLightGroup
      };
      this.platforms.push(platformEntry);
      this.setupPlatformStand(platformEntry, idx);
      this.setupStageLights(platformEntry, idx);
    });
  }

  /*/ Dynamically rebuild a platform when its radius or height is adjusted in lil-gui /*/
  rebuildPlatformGeometry(idx) {
    const p = this.platforms[idx];
    if (!p) return;
    const cfg = this.platformConfigs[idx];
    const R = cfg.radius;
    const H = cfg.height;
    const baseH = H * 0.55;
    const deckH = H * 0.45;

    /*/ Update Non-Uniform Platform Scales /*/
    const sx = this.params.globalScale * (cfg.scaleX !== undefined ? cfg.scaleX : 1.0);
    const sy = this.params.globalScale;
    const sz = this.params.globalScale * (cfg.scaleZ !== undefined ? cfg.scaleZ : 1.0);
    p.group.scale.set(sx, sy, sz);

    /*/ 1. Update Chamfered Plinth Geometry /*/
    if (p.baseMesh) {
      p.baseMesh.geometry.dispose();
      p.baseMesh.geometry = new THREE.CylinderGeometry(R, R * 1.08, baseH, 32);
      p.baseMesh.position.y = baseH / 2;
    }

    /*/ 2. Update Glowing LED Ring Geometry /*/
    if (p.glowMesh) {
      p.glowMesh.geometry.dispose();
      const glowGeo = new THREE.TorusGeometry(R * 1.01, 0.025, 12, 32);
      glowGeo.rotateX(Math.PI / 2);
      p.glowMesh.geometry = glowGeo;
      p.glowMesh.position.y = baseH;
    }

    /*/ 3. Update Obsidian Deck Geometry /*/
    if (p.deckMesh) {
      p.deckMesh.geometry.dispose();
      p.deckMesh.geometry = new THREE.CylinderGeometry(R * 0.96, R * 0.98, deckH, 32);
      p.deckMesh.position.y = baseH + deckH / 2;
    }

    /*/ 4. Update Docking Reticle Geometry /*/
    if (p.reticleGroup) {
      while (p.reticleGroup.children.length > 0) {
        const child = p.reticleGroup.children[0];
        if (child.geometry) child.geometry.dispose();
        p.reticleGroup.remove(child);
      }

      const outerRingGeo = new THREE.RingGeometry(R * 0.75, R * 0.77, 32);
      outerRingGeo.rotateX(-Math.PI / 2);
      const outerRing = new THREE.Mesh(outerRingGeo, this.reticleMat);
      outerRing.position.y = H + 0.002;
      p.reticleGroup.add(outerRing);

      const innerRingGeo = new THREE.RingGeometry(R * 0.40, R * 0.42, 32);
      innerRingGeo.rotateX(-Math.PI / 2);
      const innerRing = new THREE.Mesh(innerRingGeo, this.reticleMat);
      innerRing.position.y = H + 0.002;
      p.reticleGroup.add(innerRing);

      const crossGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-R * 0.70, H + 0.002, 0),
        new THREE.Vector3( R * 0.70, H + 0.002, 0),
        new THREE.Vector3(0, H + 0.002, -R * 0.70),
        new THREE.Vector3(0, H + 0.002,  R * 0.70)
      ]);
      const crossLines = new THREE.LineSegments(crossGeo, this.reticleMat);
      p.reticleGroup.add(crossLines);
    }

    /*/ 5. Update Mount Point Height so 3D Model rests on the deck surface /*/
    if (p.mountPoint) {
      p.mountPoint.position.y = H;
    }

    /*/ 6. Reposition Tablet Stand relative to updated radius /*/
    this.setupPlatformStand(p, idx);

    /*/ 7. Realign Stage Spotlight Fixtures & Focused Beam on deck rim /*/
    this.setupStageLights(p, idx);
  }

  loadInitialModels() {
    this.platformConfigs.forEach((cfg, idx) => {
      if (cfg.modelUrl) {
        this.loadPlatformModel(idx, cfg);
      }
    });
  }

  loadPlatformModel(platformIndex, cfg) {
    const p = this.platforms[platformIndex];
    if (!p) {
      console.warn(`[ExhibitionPlatforms] Platform index ${platformIndex} not found`);
      return;
    }

    const {
      modelUrl,
      scale = 0.30,
      modelRotX = 0,
      modelRotY = 0,
      modelRotZ = 0,
      offsetY = 0,
      turntable = false,
      turntableSpeed = 0.2,
      title = `Model_${platformIndex + 1}`
    } = cfg;

    /*/ Clear any existing mounted model on this platform /*/
    while (p.mountPoint.children.length > 0) {
      const child = p.mountPoint.children[0];
      p.mountPoint.remove(child);
    }

    const modelPivot = new THREE.Group();
    modelPivot.name = `ModelPivot_${title}`;
    modelPivot.position.set(0, offsetY, 0);
    modelPivot.rotation.set(
      THREE.MathUtils.degToRad(modelRotX || 0),
      THREE.MathUtils.degToRad(modelRotY || 0),
      THREE.MathUtils.degToRad(modelRotZ || 0)
    );
    modelPivot.scale.setScalar(scale);

    this.gltfLoader.load(
      encodeURI(modelUrl),
      (gltf) => {
        const model = gltf.scene;
        model.name = title;

        /*/ Compute bounding box to ground landing pads perfectly on deck (Y = 0) and center on X/Z /*/
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);

        model.position.set(-center.x, -box.min.y, -center.z);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              if (child.material.map) child.material.map.colorSpace = THREE.SRGBColorSpace;
              child.material.needsUpdate = true;
            }
          }
        });

        modelPivot.add(model);
        p.mountPoint.add(modelPivot);

        this.mountedModels[platformIndex] = {
          name: title,
          pivot: modelPivot,
          model: model,
          options: { scale, modelRotX, modelRotY, modelRotZ, offsetY, turntable, turntableSpeed }
        };

        console.log(`[ExhibitionPlatforms] Staged 3D model "${title}" on Platform ${cfg.id}`);
      },
      undefined,
      (err) => {
        console.error(`[ExhibitionPlatforms] Error loading 3D model ${modelUrl}:`, err);
      }
    );
  }

  /*/ 100% Procedural Sci-Fi Tablet Stand & Mission Plaque Mount /*/
  setupPlatformStand(p, idx) {
    if (!p || !p.plaqueGroup) return;

    /*/ Clean up existing stand and tablet in plaqueGroup /*/
    while (p.plaqueGroup.children.length > 0) {
      const child = p.plaqueGroup.children[0];
      child.traverse((obj) => {
        if (obj.isMesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            if (obj.material.map) obj.material.map.dispose();
            if (obj.material.emissiveMap) obj.material.emissiveMap.dispose();
            if (!this.sharedMaterials || !this.sharedMaterials.has(obj.material)) {
              obj.material.dispose();
            }
          }
        }
      });
      p.plaqueGroup.remove(child);
    }

    const cfg = this.platformConfigs[idx] || p.config;
    const R = cfg.radius;
    const offsetZ = this.standParams.offsetZ;
    const tabletH = this.standParams.tabletHeight;
    const tabletTilt = this.standParams.tabletTilt;
    const tiltRad = THREE.MathUtils.degToRad(tabletTilt);
    const standAngle = (cfg.standAngle !== undefined) ? cfg.standAngle : 0;
    const angleRad = THREE.MathUtils.degToRad(standAngle);
    const D = R + offsetZ;
    const posX = D * Math.sin(angleRad);
    const posZ = D * Math.cos(angleRad);
    const missionColor = new THREE.Color(cfg.color || '#38bdf8');

    /*/ 1. Stand Container (Rotated towards viewpoint) /*/
    const standHolder = new THREE.Group();
    standHolder.name = `StandHolder_${cfg.id}`;
    standHolder.position.set(posX, 0, posZ);
    standHolder.rotation.y = angleRad;

    /*/ 2. 100% Code-Generated Sci-Fi Architectural Stanchion Stand /*/
    const standGroup = new THREE.Group();
    standGroup.name = `ProceduralStand_${cfg.id}`;

    /*/ A. Weighted Floor Base Plinth & Chamfer /*/
    const basePlinthGeo = new THREE.BoxGeometry(0.38, 0.018, 0.28);
    const basePlinth = new THREE.Mesh(basePlinthGeo, this.stanchionMat);
    basePlinth.position.set(0, 0.009, 0.02);
    basePlinth.receiveShadow = true;
    standGroup.add(basePlinth);

    const baseTopChamferGeo = new THREE.BoxGeometry(0.34, 0.010, 0.24);
    const baseTopChamfer = new THREE.Mesh(baseTopChamferGeo, this.standMat);
    baseTopChamfer.position.set(0, 0.023, 0.02);
    baseTopChamfer.receiveShadow = true;
    standGroup.add(baseTopChamfer);

    /*/ Base Front Neon Status Strip /*/
    const baseTrimGeo = new THREE.BoxGeometry(0.30, 0.004, 0.008);
    const baseTrimMat = new THREE.MeshBasicMaterial({ color: missionColor });
    const baseTrim = new THREE.Mesh(baseTrimGeo, baseTrimMat);
    baseTrim.position.set(0, 0.027, 0.138);
    standGroup.add(baseTrim);

    /*/ B. Twin Aerodynamic Curved Stanchion Struts /*/
    const strutRadius = 0.012;
    const strutSeparation = 0.13;
    const cradleY = tabletH - 0.055;
    const cradleZ = -0.028;

    [-strutSeparation, strutSeparation].forEach((strutX) => {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(strutX, 0.028, 0.04),
        new THREE.Vector3(strutX, tabletH * 0.38, 0.035),
        new THREE.Vector3(strutX, tabletH * 0.72, 0.010),
        new THREE.Vector3(strutX, tabletH * 0.90, cradleZ * 0.6),
        new THREE.Vector3(strutX, cradleY, cradleZ)
      ]);
      const strutGeo = new THREE.TubeGeometry(curve, 20, strutRadius, 12, false);
      const strutMesh = new THREE.Mesh(strutGeo, this.standMat);
      strutMesh.receiveShadow = true;
      standGroup.add(strutMesh);
    });

    /*/ C. Horizontal Stiffener Cross-Braces /*/
    const braceGeo1 = new THREE.CylinderGeometry(0.007, 0.007, strutSeparation * 2, 12);
    braceGeo1.rotateZ(Math.PI / 2);
    const brace1 = new THREE.Mesh(braceGeo1, this.stanchionMat);
    brace1.position.set(0, tabletH * 0.35, 0.035);
    brace1.receiveShadow = true;
    standGroup.add(brace1);

    const braceGeo2 = new THREE.CylinderGeometry(0.007, 0.007, strutSeparation * 2, 12);
    braceGeo2.rotateZ(Math.PI / 2);
    const brace2 = new THREE.Mesh(braceGeo2, this.stanchionMat);
    brace2.position.set(0, tabletH * 0.75, 0.010);
    brace2.receiveShadow = true;
    standGroup.add(brace2);

    /*/ D. Top Swivel Cradle Mount Bracket /*/
    const cradleBarGeo = new THREE.BoxGeometry(0.30, 0.024, 0.026);
    const cradleBar = new THREE.Mesh(cradleBarGeo, this.stanchionMat);
    cradleBar.position.set(0, cradleY, cradleZ);
    cradleBar.rotation.x = tiltRad;
    cradleBar.receiveShadow = true;
    standGroup.add(cradleBar);

    standHolder.add(standGroup);

    /*/ 3. Digital Information Tablet (Backing Bezel + Screen + Neon Trim) /*/
    const tabletHolder = new THREE.Group();
    tabletHolder.name = `TabletHolder_${cfg.id}`;
    tabletHolder.position.set(0, tabletH, 0);
    tabletHolder.rotation.x = tiltRad;

    /*/ Bezel Frame Backing Shell /*/
    const frameGeo = new THREE.BoxGeometry(0.38, 0.20, 0.020);
    const frameMesh = new THREE.Mesh(frameGeo, this.standMat);
    frameMesh.position.set(0, 0, -0.004);
    frameMesh.receiveShadow = true;
    tabletHolder.add(frameMesh);

    /*/ Interactive Display Canvas Screen /*/
    const plaqueTex = this.createPlaqueTexture(cfg);
    const screenGeo = new THREE.BoxGeometry(0.36, 0.18, 0.008);
    const screenMat = new THREE.MeshStandardMaterial({
      map: plaqueTex,
      metalness: 0.5,
      roughness: 0.3,
      emissive: missionColor,
      emissiveMap: plaqueTex,
      emissiveIntensity: 0.35
    });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.name = `TabletScreen_${cfg.id}`;
    screenMesh.position.set(0, 0, 0.007);
    screenMesh.receiveShadow = true;
    tabletHolder.add(screenMesh);

    /*/ Screen Lower Accent LED Glow Trim /*/
    const screenTrimGeo = new THREE.BoxGeometry(0.36, 0.005, 0.004);
    const screenTrimMat = new THREE.MeshBasicMaterial({ color: missionColor });
    const screenTrim = new THREE.Mesh(screenTrimGeo, screenTrimMat);
    screenTrim.position.set(0, -0.092, 0.010);
    tabletHolder.add(screenTrim);

    standHolder.add(tabletHolder);
    p.plaqueGroup.add(standHolder);
  }

  /*/ Architectural Rover Stage Spotlight System (Focuses dramatic stage light on centerpiece rover) /*/
  setupStageLights(p, idx) {
    if (!p || !p.stageLightGroup) return;

    /*/ Clean up existing stage lights and fixtures in stageLightGroup /*/
    while (p.stageLightGroup.children.length > 0) {
      const child = p.stageLightGroup.children[0];
      p.stageLightGroup.remove(child);
      child.traverse((obj) => {
        if (obj.isMesh) {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material && !this.sharedMaterials.has(obj.material)) {
            obj.material.dispose();
          }
        }
      });
    }

    if (!this.stageLightParams.enabled) return;

    const cfg = this.platformConfigs[idx] || p.config;
    if (cfg.stageLight === false) return;

    const R = cfg.radius;
    const H = cfg.height;
    const standAngle = (cfg.standAngle !== undefined) ? cfg.standAngle : 0;
    const targetY = H + (cfg.offsetY || 0) + this.stageLightParams.targetOffsetY;
    const targetVec = new THREE.Vector3(0, targetY, 0);

    /*/ 1. Invisible Target Anchor for SpotLight Tracking /*/
    const spotTarget = new THREE.Object3D();
    spotTarget.name = `SpotTarget_${cfg.id}`;
    spotTarget.position.copy(targetVec);
    p.stageLightGroup.add(spotTarget);

    /*/ 2. 3-Point Exhibition Stage Spotlight Array (Key, Fill & Rim on Deck Rim) /*/
    const fixtureDefs = [
      { name: 'KeySpotlight',  angleOffset: -42, hasBeam: true,  intensityMult: 1.0 },
      { name: 'FillSpotlight', angleOffset:  42, hasBeam: false, intensityMult: 0.5 },
      { name: 'RimSpotlight',  angleOffset: 180, hasBeam: false, intensityMult: 0.7 }
    ];

    const fixtureRadius = R * 0.90;
    const spotColor = new THREE.Color(this.stageLightParams.color);

    fixtureDefs.forEach((def) => {
      const angleDeg = standAngle + def.angleOffset;
      const angleRad = THREE.MathUtils.degToRad(angleDeg);
      const fx = fixtureRadius * Math.sin(angleRad);
      const fz = fixtureRadius * Math.cos(angleRad);
      const fy = H;

      /*/ Physical Miniature Stage Light Fixture Group /*/
      const fixtureGroup = new THREE.Group();
      fixtureGroup.name = `StageFixture_${def.name}_${cfg.id}`;
      fixtureGroup.position.set(fx, fy, fz);

      /*/ A. Bolted Circular Base Flange /*/
      const flangeGeo = new THREE.CylinderGeometry(0.045, 0.052, 0.014, 16);
      const flangeMesh = new THREE.Mesh(flangeGeo, this.stanchionMat);
      flangeMesh.position.y = 0.007;
      flangeMesh.receiveShadow = true;
      fixtureGroup.add(flangeMesh);

      /*/ B. Swivel Head & Spotlight Can (Aimed precisely at Rover Center) /*/
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 0.042, 0);

      /*/ Vector from fixture head to rover target /*/
      const localTarget = new THREE.Vector3(0 - fx, targetY - fy - 0.042, 0 - fz);
      headGroup.lookAt(localTarget);

      /*/ Yoke Bracket Prongs (Left & Right) /*/
      const yokeArmGeo = new THREE.BoxGeometry(0.008, 0.045, 0.016);
      const leftYoke = new THREE.Mesh(yokeArmGeo, this.stanchionMat);
      leftYoke.position.set(-0.042, 0, 0);
      headGroup.add(leftYoke);

      const rightYoke = new THREE.Mesh(yokeArmGeo, this.stanchionMat);
      rightYoke.position.set(0.042, 0, 0);
      headGroup.add(rightYoke);

      /*/ Tapered Cylindrical Spotlight Can /*/
      const canGeo = new THREE.CylinderGeometry(0.032, 0.040, 0.082, 16);
      canGeo.rotateX(Math.PI / 2);
      const canMesh = new THREE.Mesh(canGeo, this.standMat);
      canMesh.position.set(0, 0.008, 0);
      canMesh.receiveShadow = true;
      headGroup.add(canMesh);

      /*/ Glowing Optical Front Lens Diffuser /*/
      const lensGeo = new THREE.CircleGeometry(0.030, 16);
      const lensMat = new THREE.MeshBasicMaterial({ color: spotColor });
      const lensMesh = new THREE.Mesh(lensGeo, lensMat);
      lensMesh.position.set(0, 0.008, 0.042);
      headGroup.add(lensMesh);

      /*/ Anti-Glare Snoot Cowl Hood /*/
      const cowlGeo = new THREE.CylinderGeometry(0.035, 0.032, 0.018, 16, 1, true);
      cowlGeo.rotateX(Math.PI / 2);
      const cowlMesh = new THREE.Mesh(cowlGeo, this.stanchionMat);
      cowlMesh.position.set(0, 0.008, 0.046);
      headGroup.add(cowlMesh);

      fixtureGroup.add(headGroup);
      p.stageLightGroup.add(fixtureGroup);

      /*/ C. Real-Time Focused SpotLight (Mounted on Key Stage Fixture) /*/
      if (def.hasBeam) {
        const spotLight = new THREE.SpotLight(
          spotColor,
          this.stageLightParams.intensity * def.intensityMult,
          R * this.stageLightParams.distanceRatio,
          THREE.MathUtils.degToRad(this.stageLightParams.angle),
          this.stageLightParams.penumbra,
          1.5
        );
        spotLight.name = `RoverSpotLight_${cfg.id}`;
        spotLight.position.set(fx, fy + 0.08, fz);
        spotLight.target = spotTarget;
        spotLight.castShadow = false;
        p.stageLightGroup.add(spotLight);
      }
    });
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
      this.rebuildPlatformGeometry(idx);
    });
  }

  initGui() {
    /*/ UI Gating: Only display lil-gui controls if window.DEBUG_EXHIBITION_PLATFORMS is true
        or when explicitly requested via #gui hash in the URL.
        To open the live calibration GUI, add #gui to the URL in browser /*/
    if (typeof window !== 'undefined' && !window.location.hash.includes('gui') && !window.DEBUG_EXHIBITION_PLATFORMS) {
      return;
    }

    try {
      this.gui = new GUI({ title: '🏛️ Exhibition Platforms & Models' });
      this.gui.domElement.style.position = 'fixed';
      this.gui.domElement.style.top = '20px';
      this.gui.domElement.style.right = '20px';
      this.gui.domElement.style.zIndex = '999999';

      /*/ Prevent canvas pointer lock from interfering with slider drag /*/
      ['pointerdown', 'mousedown', 'click', 'touchstart'].forEach((evt) => {
        this.gui.domElement.addEventListener(evt, (e) => e.stopPropagation());
      });

      /*/ Master Action Buttons /*/
      this.gui.add({ copyAll: () => this.copyAllDetails() }, 'copyAll').name('📋 Copy All Platform Details');
      this.gui.add({ resetAll: () => this.resetDefaults() }, 'resetAll').name('🔄 Reset All to Defaults');

      /*/ Global Arena Master Settings /*/
      const globalFolder = this.gui.addFolder('🌐 Master Arena Controls');
      globalFolder.add(this.params, 'visible').name('Show Platforms').onChange(() => this.applyTransforms());
      globalFolder.add(this.params, 'globalScale', 0.5, 2.0, 0.05).name('Global Scale').onChange(() => this.applyTransforms());
      globalFolder.addColor(this.params, 'glowColor').name('LED Glow Color').onChange(() => this.applyTransforms());
      globalFolder.add(this.params, 'glowIntensity', 0.1, 3.0, 0.1).name('Glow Pulse');
      globalFolder.add(this.params, 'showReticles').name('Docking Targets').onChange(() => this.applyTransforms());
      globalFolder.add(this.params, 'showPlaques').name('Mission Plaques').onChange(() => this.applyTransforms());
      globalFolder.close();

      /*/ 3D Tablet Stand Global Settings /*/
      const standFolder = this.gui.addFolder('📱 3D Tablet Stand Settings');
      standFolder.add(this.standParams, 'offsetZ', 0.10, 0.60, 0.01).name('Stand Distance Z').onChange(() => {
        this.platforms.forEach((p, idx) => this.setupPlatformStand(p, idx));
      });
      standFolder.add(this.standParams, 'tabletHeight', 0.60, 1.40, 0.01).name('Tablet Height Y').onChange(() => {
        this.platforms.forEach((p, idx) => this.setupPlatformStand(p, idx));
      });
      standFolder.add(this.standParams, 'tabletTilt', -70, -10, 1).name('Tablet Tilt Angle').onChange(() => {
        this.platforms.forEach((p, idx) => this.setupPlatformStand(p, idx));
      });
      standFolder.close();

      /*/ Rover Stage Spotlight Settings /*/
      const spotFolder = this.gui.addFolder('💡 Rover Stage Spotlight Settings');
      spotFolder.add(this.stageLightParams, 'enabled').name('Enable Stage Lights').onChange(() => {
        this.platforms.forEach((p, idx) => this.setupStageLights(p, idx));
      });
      spotFolder.add(this.stageLightParams, 'intensity', 0, 100, 1).name('Beam Intensity').onChange(() => {
        this.platforms.forEach((p, idx) => this.setupStageLights(p, idx));
      });
      spotFolder.add(this.stageLightParams, 'angle', 15, 80, 1).name('Beam Angle (Deg)').onChange(() => {
        this.platforms.forEach((p, idx) => this.setupStageLights(p, idx));
      });
      spotFolder.add(this.stageLightParams, 'penumbra', 0.1, 1.0, 0.05).name('Beam Penumbra').onChange(() => {
        this.platforms.forEach((p, idx) => this.setupStageLights(p, idx));
      });
      spotFolder.addColor(this.stageLightParams, 'color').name('Beam Color').onChange(() => {
        this.platforms.forEach((p, idx) => this.setupStageLights(p, idx));
      });
      spotFolder.add(this.stageLightParams, 'targetOffsetY', 0.0, 2.5, 0.05).name('Focus Height Y').onChange(() => {
        this.platforms.forEach((p, idx) => this.setupStageLights(p, idx));
      });
      spotFolder.close();

      /*/ Dedicated Subfolder for Each Active Platform & 3D Model /*/
      const platformsFolder = this.gui.addFolder('🛸 Active Exhibition Podia');

      this.platformConfigs.forEach((cfg, idx) => {
        const folderName = `[P${cfg.id}] ${cfg.title}`;
        const subFolder = platformsFolder.addFolder(folderName);

        /*/ Platform Podia Geometry & Placement Controls /*/
        subFolder.add(cfg, 'radius', 0.50, 4.00, 0.05).name('Platform Radius (m)').onChange(() => {
          this.rebuildPlatformGeometry(idx);
        });

        subFolder.add(cfg, 'height', 0.10, 1.00, 0.01).name('Platform Height (m)').onChange(() => {
          this.rebuildPlatformGeometry(idx);
        });

        subFolder.add(cfg, 'scaleX', 0.20, 3.00, 0.05).name('Platform Scale X').onChange((val) => {
          const p = this.platforms[idx];
          if (p) p.group.scale.x = this.params.globalScale * val;
        });

        subFolder.add(cfg, 'scaleZ', 0.20, 3.00, 0.05).name('Platform Scale Z').onChange((val) => {
          const p = this.platforms[idx];
          if (p) p.group.scale.z = this.params.globalScale * val;
        });

        subFolder.add(cfg, 'x', -15.0, 15.0, 0.1).name('Position X').onChange((val) => {
          const p = this.platforms[idx];
          if (p) p.group.position.x = val;
        });

        subFolder.add(cfg, 'z', -25.0, -2.0, 0.1).name('Position Z').onChange((val) => {
          const p = this.platforms[idx];
          if (p) p.group.position.z = val;
        });

        subFolder.add(cfg, 'rotY', -180, 180, 1).name('Platform Yaw Y (Deg)').onChange((val) => {
          const p = this.platforms[idx];
          if (p) p.group.rotation.y = THREE.MathUtils.degToRad(val);
        });

        subFolder.add(cfg, 'standAngle', 0, 360, 5).name('Stand Angle (Deg)').onChange(() => {
          const p = this.platforms[idx];
          if (p) this.setupPlatformStand(p, idx);
        });

        /*/ 3D Model Scale & Orientation Controls /*/
        subFolder.add(cfg, 'scale', 0.005, 3.0, 0.005).name('Model Scale').onChange((val) => {
          const m = this.mountedModels[idx];
          if (m && m.pivot) {
            m.pivot.scale.setScalar(val);
            if (m.options) m.options.scale = val;
          }
        });

        subFolder.add(cfg, 'modelRotX', -180, 180, 1).name('Model Pitch X (Deg)').onChange((val) => {
          const m = this.mountedModels[idx];
          if (m && m.pivot) {
            m.pivot.rotation.x = THREE.MathUtils.degToRad(val);
            if (m.options) m.options.modelRotX = val;
          }
        });

        subFolder.add(cfg, 'modelRotY', -180, 180, 1).name('Model Yaw Y (Deg)').onChange((val) => {
          const m = this.mountedModels[idx];
          if (m && m.pivot) {
            m.pivot.rotation.y = THREE.MathUtils.degToRad(val);
            if (m.options) m.options.modelRotY = val;
          }
        });

        subFolder.add(cfg, 'modelRotZ', -180, 180, 1).name('Model Roll Z (Deg)').onChange((val) => {
          const m = this.mountedModels[idx];
          if (m && m.pivot) {
            m.pivot.rotation.z = THREE.MathUtils.degToRad(val);
            if (m.options) m.options.modelRotZ = val;
          }
        });

        subFolder.add(cfg, 'offsetY', -0.50, 3.0, 0.01).name('Model Hover Y').onChange((val) => {
          const m = this.mountedModels[idx];
          if (m && m.pivot) {
            m.pivot.position.y = val;
            if (m.options) m.options.offsetY = val;
          }
        });

        subFolder.add(cfg, 'turntable').name('Turntable Spin').onChange((val) => {
          const m = this.mountedModels[idx];
          if (m && m.options) m.options.turntable = val;
        });

        subFolder.add(cfg, 'turntableSpeed', 0.05, 1.0, 0.05).name('Spin Speed').onChange((val) => {
          const m = this.mountedModels[idx];
          if (m && m.options) m.options.turntableSpeed = val;
        });

        if (cfg.stageLight === undefined) cfg.stageLight = true;
        subFolder.add(cfg, 'stageLight').name('Stage Light On').onChange(() => {
          this.setupStageLights(this.platforms[idx], idx);
        });

        subFolder.close();
      });

      platformsFolder.open();
    } catch (err) {
      console.warn('[ExhibitionPlatforms] Failed to initialize lil-gui:', err);
    }
  }

  resetDefaults() {
    this.platformConfigs = JSON.parse(JSON.stringify(this.defaultPlatforms));
    this.platformConfigs.forEach((cfg, idx) => {
      const p = this.platforms[idx];
      if (p) {
        p.group.position.set(cfg.x, this.floorY, cfg.z);
        p.group.rotation.y = THREE.MathUtils.degToRad(cfg.rotY);
        this.rebuildPlatformGeometry(idx);

        const m = this.mountedModels[idx];
        if (m && m.pivot) {
          m.pivot.scale.setScalar(cfg.scale);
          m.pivot.rotation.set(
            THREE.MathUtils.degToRad(cfg.modelRotX || 0),
            THREE.MathUtils.degToRad(cfg.modelRotY || 0),
            THREE.MathUtils.degToRad(cfg.modelRotZ || 0)
          );
          m.pivot.position.y = cfg.offsetY;
          if (m.options) {
            m.options.scale = cfg.scale;
            m.options.modelRotX = cfg.modelRotX || 0;
            m.options.modelRotY = cfg.modelRotY || 0;
            m.options.modelRotZ = cfg.modelRotZ || 0;
            m.options.offsetY = cfg.offsetY;
            m.options.turntable = cfg.turntable;
            m.options.turntableSpeed = cfg.turntableSpeed;
          }
        }
      }
    });

    if (this.gui && typeof this.gui.controllersRecursive === 'function') {
      this.gui.controllersRecursive().forEach((c) => c.updateDisplay());
    }

    this.showToast('🔄 <b>All Exhibition Platforms & Models reset to defaults!</b>', '#f59e0b', '#fbbf24');
  }

  copyAllDetails() {
    const formatted = `EXHIBITION_PLATFORMS_CONFIG = ${JSON.stringify(this.platformConfigs, null, 2)};`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    console.log('[ExhibitionPlatforms] Current Platform & Model Configuration:\n', formatted);
    this.showToast('📋 <b>All Platform & Model Details copied to clipboard!</b>', '#38bdf8', '#38bdf8');
  }

  showToast(html, borderColor, textColor) {
    if (typeof document === 'undefined') return;
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '90px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '12px 24px';
    toast.style.background = 'rgba(15, 23, 42, 0.95)';
    toast.style.border = `1px solid ${borderColor}`;
    toast.style.borderRadius = '8px';
    toast.style.color = textColor;
    toast.style.fontFamily = 'monospace';
    toast.style.fontSize = '13px';
    toast.style.zIndex = '999999';
    toast.style.boxShadow = `0 8px 32px ${borderColor}40`;
    toast.innerHTML = html;
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

    /*/ Turntable Animation for Mounted Rover Models /*/
    if (this.mountedModels) {
      Object.values(this.mountedModels).forEach((entry) => {
        if (entry.options && entry.options.turntable && entry.pivot) {
          entry.pivot.rotation.y += delta * entry.options.turntableSpeed;
        }
      });
    }
  }
}
