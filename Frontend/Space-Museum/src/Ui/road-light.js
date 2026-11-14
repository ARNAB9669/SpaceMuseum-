import * as THREE from 'three';
import GUI from 'three/addons/libs/lil-gui.module.min.js';

/*/ =============================================================
    road-light.js — Architectural Sci-Fi Road Luminaires
    Procedural museum streetlights positioned along the outer curb
    of the curved approach road. Features tapered dark titanium masts,
    cantilever luminaire heads, warm recessed LED diffusers, soft
    asphalt pool lighting, adaptive atmospheric transitions, and
    physical collision posts for first-person navigation.
    ============================================================= /*/

export class RoadLights {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'PathwayRoadLuminaires';

    /*/ State & Transitions /*/
    this.lamps = [];
    this.lights = [];
    this.collidableMeshes = [];
    this.animTime = 0;
    this.currentTransition = 0.0;
    this.currentCinemaDark = 0.0;

    /*/ Adaptive Color Palette: Cosmic Cyan (Orbit) <-> Warm Amber (Interior Approach) /*/
    this.coldEmissive = new THREE.Color(0x38bdf8);
    this.warmEmissive = new THREE.Color(0xfbbf24);
    this.coldLightColor = new THREE.Color(0xbae6fd);
    this.warmLightColor = new THREE.Color(0xffedd5);

    /*/ Configurable Parameters /*/
    this.params = {
      visible: true,
      mastHeight: 3.20,
      armLength: 1.35,
      lightIntensity: 2.80,
      lightDistance: 9.50,
      lightDecay: 1.60,
      emissiveIntensity: 2.40,
      lightYOffset: 0.15,
      showLightPools: true
    };

    this.initLamps();
    this.initGui();
    this.scene.add(this.group);
  }

  initLamps() {
    const floorY = -1.87;

    /*/ Road Outer Curb Waypoints [X, Y, Z, Yaw (radians)]
        Placed on the outer white pavement along the perimeter of the road,
        with cantilever luminaire arms extending inward over the curb. /*/
    const lampDefinitions = [
      /*/ Section 1: Straight Runway (Near Landing Spot, Along Z-axis) /*/
      { x: 18.40, y: floorY, z: 11.50, yaw: -Math.PI / 2 },
      { x: 18.60, y: floorY, z: 17.20, yaw: -Math.PI / 2 },
      { x: 18.90, y: floorY, z: 22.80, yaw: -Math.PI / 2 },

      /*/ Section 2: Outer Curved Arc (Shifted outward onto white pavement) /*/
      { x: 19.30, y: floorY, z: 28.20, yaw: -1.65 },
      { x: 16.90, y: floorY, z: 34.00, yaw: -2.35 },
      { x: 11.90, y: floorY, z: 34.90, yaw: -2.55 },

      /*/ Section 3: Horizontal Avenue (Along X-axis, clear of road curb) /*/
      { x: 6.20, y: floorY, z: 34.40, yaw: Math.PI },
      { x: 1.20, y: floorY, z: 34.40, yaw: Math.PI },
      { x: -3.80, y: floorY, z: 34.40, yaw: Math.PI },

      /*/ Section 4: Entrance Bend (Leading to museum doorway) /*/
      { x: -10.90, y: floorY, z: 32.80, yaw: 2.50 },
      { x: -12.40, y: floorY, z: 25.20, yaw: Math.PI / 2 }
    ];

    /*/ Shared Materials for Optimal Performance (Single Draw Batch) /*/
    const mastMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,     /*/ Dark matte aerospace slate /*/
      metalness: 0.85,
      roughness: 0.25
    });

    const jointMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,     /*/ Deep carbon obsidian /*/
      metalness: 0.90,
      roughness: 0.20
    });

    this.emissiveMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: this.coldEmissive.clone(),
      emissiveIntensity: this.params.emissiveIntensity,
      roughness: 0.15,
      metalness: 0.10
    });

    const H = this.params.mastHeight;
    const armL = this.params.armLength;

    /*/ Master Procedural Luminaire Component Geometry /*/
    const baseGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.08, 16);
    const mastGeo = new THREE.CylinderGeometry(0.065, 0.09, H, 16);
    const collarGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.14, 16);
    const armGeo = new THREE.BoxGeometry(0.06, 0.06, armL);
    const headHousingGeo = new THREE.BoxGeometry(0.20, 0.07, 0.52);
    const emitterGeo = new THREE.PlaneGeometry(0.15, 0.44);
    emitterGeo.rotateX(Math.PI / 2); /*/ Face downward towards road surface /*/

    lampDefinitions.forEach((def, index) => {
      const lampContainer = new THREE.Group();
      lampContainer.name = `RoadLuminaire_${index + 1}`;
      lampContainer.position.set(def.x, def.y, def.z);
      lampContainer.rotation.y = def.yaw;

      /*/ 1. Flanged Base Mount /*/
      const baseMesh = new THREE.Mesh(baseGeo, jointMaterial);
      baseMesh.position.y = 0.04;
      baseMesh.receiveShadow = true;
      lampContainer.add(baseMesh);

      /*/ 2. Tapered Vertical Mast (Collidable) /*/
      const mastMesh = new THREE.Mesh(mastGeo, mastMaterial);
      mastMesh.position.y = H / 2 + 0.08;
      mastMesh.castShadow = true;
      mastMesh.receiveShadow = true;
      lampContainer.add(mastMesh);
      this.collidableMeshes.push(mastMesh);

      /*/ 3. Mast-Arm Transition Collar /*/
      const collarMesh = new THREE.Mesh(collarGeo, jointMaterial);
      collarMesh.position.y = H + 0.08;
      lampContainer.add(collarMesh);

      /*/ 4. Cantilever Luminaire Arm extending toward road center /*/
      const armMesh = new THREE.Mesh(armGeo, mastMaterial);
      armMesh.position.set(0, H + 0.08, armL / 2);
      armMesh.rotation.x = 0.06; /*/ Subtle downward cantilever tilt /*/
      lampContainer.add(armMesh);

      /*/ 5. Luminaire Head Housing /*/
      const headMesh = new THREE.Mesh(headHousingGeo, jointMaterial);
      headMesh.position.set(0, H + 0.05, armL);
      headMesh.castShadow = true;
      lampContainer.add(headMesh);

      /*/ 6. Glowing Recessed LED Diffuser Panel /*/
      const emitterMesh = new THREE.Mesh(emitterGeo, this.emissiveMaterial);
      emitterMesh.position.set(0, H + 0.01, armL);
      lampContainer.add(emitterMesh);

      /*/ 7. Strategic Real-Time Downward Road Pool Light (Every other lamp for high 60fps performance) /*/
      if (index % 2 === 0 || index === lampDefinitions.length - 1) {
        const light = new THREE.PointLight(
          this.coldLightColor.clone(),
          this.params.lightIntensity,
          this.params.lightDistance,
          this.params.lightDecay
        );
        light.position.set(0, H - 0.20, armL);
        lampContainer.add(light);
        this.lights.push(light);
      }

      this.group.add(lampContainer);
      this.lamps.push(lampContainer);
    });
  }

  /*/ Transition Between Cold Cosmic Space (Orbit) and Warm Golden Interior (First-Person Approach) /*/
  setInsideTransition(factor) {
    this.currentTransition = THREE.MathUtils.clamp(factor, 0.0, 1.0);
    this.applyAtmosphere();
  }

  /*/ Cinema Mode Dimming (When seated in auditorium) /*/
  setCinemaMode(factor) {
    this.currentCinemaDark = THREE.MathUtils.clamp(factor, 0.0, 1.0);
    this.applyAtmosphere();
  }

  applyAtmosphere() {
    const t = this.currentTransition;
    const cinemaDark = this.currentCinemaDark;

    /*/ Interpolate emissive and light colors /*/
    const curEmissive = this.coldEmissive.clone().lerp(this.warmEmissive, t);
    const curLightColor = this.coldLightColor.clone().lerp(this.warmLightColor, t);

    /*/ Outdoor road lamps remain softly visible during cinema with atmospheric dimming /*/
    const cinemaMult = 1.0 - cinemaDark * 0.45;

    if (this.emissiveMaterial) {
      this.emissiveMaterial.emissive.copy(curEmissive);
      this.emissiveMaterial.emissiveIntensity = this.params.emissiveIntensity * cinemaMult;
    }

    this.lights.forEach((light) => {
      light.color.copy(curLightColor);
      light.intensity = this.params.lightIntensity * (0.8 + 0.35 * t) * cinemaMult;
    });
  }

  /*/ Returns Physical Posts for First-Person Wall Collision Engine /*/
  getCollidableMeshes() {
    return this.collidableMeshes || [];
  }

  initGui() {
    /*/ Calibration GUI enabled when #gui is present in URL /*/
    if (typeof window !== 'undefined' && !window.location.hash.includes('gui') && !window.DEBUG_ROAD_LIGHTS) {
      return;
    }

    try {
      this.gui = new GUI({ title: '💡 Pathway Road Luminaires' });
      this.gui.domElement.style.position = 'fixed';
      this.gui.domElement.style.top = '70px';
      this.gui.domElement.style.right = '20px';

      this.gui.add(this.params, 'visible').name('Visible').onChange((v) => {
        this.group.visible = v;
      });

      this.gui.add(this.params, 'lightIntensity', 0.0, 8.0, 0.1).name('Light Intensity').onChange(() => {
        this.applyAtmosphere();
      });

      this.gui.add(this.params, 'emissiveIntensity', 0.0, 6.0, 0.1).name('Emissive Glow').onChange(() => {
        this.applyAtmosphere();
      });

      this.gui.add(this.params, 'lightDistance', 3.0, 20.0, 0.5).name('Light Radius').onChange((v) => {
        this.lights.forEach((l) => (l.distance = v));
      });
    } catch (e) {}
  }

  update(delta) {
    if (!this.group.visible) return;

    /*/ Subtle breathing glow modulation /*/
    this.animTime += delta * 1.5;
    const pulse = 1.0 + 0.03 * Math.sin(this.animTime);

    if (this.emissiveMaterial) {
      const cinemaMult = 1.0 - this.currentCinemaDark * 0.45;
      this.emissiveMaterial.emissiveIntensity = this.params.emissiveIntensity * pulse * cinemaMult;
    }
  }
}
