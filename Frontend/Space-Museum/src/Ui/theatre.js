import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import GUI from 'three/addons/libs/lil-gui.module.min.js';

/*/ =============================================================
    theatre.js — NASA Space Apps Documentary Movie Theatre
    Dedicated cinematic auditorium featuring archival space
    documentary canvas projection, 3-tier stepped risers, 15 luxury
    theatre seats with crimson velvet & metal finish, dimmable sconces,
    projector lighting, acoustic ceiling and sit/stand POV interactivity.
    All auditorium elements are mathematically locked to the screen
    orientation so rotating/positioning the screen rotates and positions
    all chairs, risers, lighting and ceiling in unison.
    ============================================================= /*/

export class TheatreRoom {
  constructor(scene, camera = null, fpController = null) {
    this.scene = scene;
    this.camera = camera;
    this.fpController = fpController;

    /*/ Master Auditorium Group: Everything is built in local space relative to the screen /*/
    this.group = new THREE.Group();
    this.group.name = 'NASA_Documentary_Theatre';
    this.scene.add(this.group);

    /*/ Interactive & Collidable State /*/
    this.seats = [];
    this.seatContainers = [];
    this.collidableMeshes = [];
    this.sconceLights = [];
    this.ceilingLights = [];
    this.walkLights = [];
    this.roofGroup = null;
    this.screenBounceLight = null;
    this.isDimmed = false;
    this.currentSeatedSeat = null;
    this.baseSeatModel = null;

    /*/ Final Calibrated Parameters (Calibrated by user via GUI) /*/
    this.params = {
      /*/ Master Theater Transform (Screen Position & Orientation) /*/
      posX: -0.55,
      posY: -2.00,
      posZ: 21.70,
      pitchX: 0.0,
      yawY: 90.0,
      rollZ: 0.0,

      /*/ Cinema Screen Dimensions /*/
      screenWidth: 3.90,
      screenHeight: 2.10,
      screenElevation: 1.00, /*/ Screen center height above auditorium floor /*/

      /*/ Stepped Risers & Seating Layout /*/
      riserWidth: 3.60,
      rowStartDist: 3.15, /*/ Distance from screen to Row 1 in local Z /*/
      rowSpacing: 1.45,   /*/ Distance between consecutive rows /*/
      stepHeight: 0.18,   /*/ Elevation gain per tier /*/
      riserDepth: 1.05,

      /*/ Luxury Cinema Seats /*/
      seatCols: 5,
      seatSpacing: 0.68,
      seatScale: 1.80,

      /*/ Movie Theatre & Walkthrough Corridor Blackout Roof /*/
      roofVisible: true,
      roofPosX: 4.10,
      roofPosY: 0.35,
      roofPosZ: 17.85,
      roofWidth: 12.40,
      roofDepth: 13.80,
      roofThickness: 0.14,
      roofColor: '#070b14',

      /*/ Dim Atmospheric Lighting (Dark walking environment & complete blackout when seated) /*/
      sconceIntensity: 1.2,
      downlightIntensity: 0.0,
      projectorIntensity: 12.0,

      copyToClipboard: () => this.copyValues()
    };

    /*/ Initialize All Architectural Subsystems /*/
    this.initCanvasPlayer();
    this.initScreen();
    this.initRisers();
    this.initLighting();
    this.initRoofAndCorridor();
    this.loadSeatAsset();
    this.initGui();
    this.applyMasterTransforms();
  }

  /*/ --- 1. DYNAMIC DOCUMENTARY CANVAS (NASA SPACE APPS ARCHIVES) --- /*/
  initCanvasPlayer() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1280;
    this.canvas.height = 720;
    this.ctx = this.canvas.getContext('2d');

    this.screenTexture = new THREE.CanvasTexture(this.canvas);
    this.screenTexture.colorSpace = THREE.SRGBColorSpace;
    this.screenTexture.minFilter = THREE.LinearFilter;
    this.screenTexture.magFilter = THREE.LinearFilter;

    this.docTime = 0;
    this.currentChapter = 0;
    this.chapterTimer = 0;
    this.chapterDuration = 14.0; /*/ 14 seconds per mission chapter /*/

    this.chapters = [
      {
        title: 'OPPORTUNITY & SPIRIT (MER)',
        subtitle: 'Mars Exploration Rovers • 5,111 Sols on the Red Planet',
        accentColor: '#f97316',
        target: 'MARS • MERIDIANI PLANUM',
        hardware: 'Rocker-Bogie Suspension, Pancam, Solar Wings',
        status: 'Silent in Perseverance Valley since June 2018',
        stats: ['Distance: 45.16 km', 'Operational Goal: 90 Sols', 'Total Sols: 5,111 (15 Years)'],
        quote: '"My battery is low and it\'s getting dark."',
        notes: 'Discovered hematite spherules ("blueberries"), proving ancient Mars had liquid standing water.'
      },
      {
        title: 'APOLLO LUNAR MODULE DESCENT STAGES',
        subtitle: 'Apollo 11, 12, 14, 15, 16, 17 • Monuments in Moondust',
        accentColor: '#38bdf8',
        target: 'MOON • TRANQUILITY TO TAURUS-LITTROW',
        hardware: 'DPS Hypergolic Engine, Gold Mylar Thermal Foil, ALSEP Instruments',
        status: 'Permanent heritage monuments in the lunar vacuum',
        stats: ['Apollo 11–17: 6 Landings', 'Crew Landed: 12 Astronauts', 'Moon Samples: 382 kg'],
        quote: '"Here Men from the Planet Earth First Set Foot Upon the Moon. We Came in Peace for All Mankind."',
        notes: 'Descent stages remain preserved on lunar soil alongside retroreflectors still used to measure Moon distance.'
      },
      {
        title: 'CURIOSITY & PERSEVERANCE',
        subtitle: 'Nuclear-Powered Mobile Science Laboratories on Mars',
        accentColor: '#10b981',
        target: 'MARS • GALE & JEZERO CRATERS',
        hardware: 'MMRTG Nuclear Core, Robotic Arm, Ingenuity Mars Helicopter',
        status: 'Actively exploring ancient river delta & caching rock cores',
        stats: ['Ingenuity Flights: 72 Completed', 'Cached Sample Tubes: 24+ Sealed', 'Power: Plutonium-238'],
        quote: '"Ingenuity demonstrated powered aerodynamic flight in 1% Martian atmosphere."',
        notes: 'Sealed titanium sample tubes cached on the Martian surface await future NASA/ESA Mars Sample Return retrieval.'
      },
      {
        title: 'VOYAGER 1 & 2: EMBASSY TO THE STARS',
        subtitle: 'Interstellar Probes • The Golden Record in Deep Void',
        accentColor: '#eab308',
        target: 'INTERSTELLAR VOID (BEYOND THE HELIOPAUSE)',
        hardware: 'RTG Generators, 3.7m High-Gain Dish, Golden Phonograph Record',
        status: 'Operational in interstellar space, 24+ Billion km from Earth',
        stats: ['Distance: 24.3 Billion km', 'Speed: ~38,000 mph', 'Launch Year: 1977'],
        quote: '"Humanity\'s furthest voyagers will outlive our Sun as eternal cosmic emissaries."',
        notes: 'Carrying greetings in 55 human languages, music of Bach and Chuck Berry, and instructions to locate Earth.'
      }
    ];
  }

  /*/ --- 2. CINEMA SCREEN MESH, FRAME & PROJECTOR SPOTLIGHT --- /*/
  initScreen() {
    this.screenGroup = new THREE.Group();
    this.screenGroup.name = 'TheatreScreenGroup';
    /*/ Screen is at local (0, screenElevation, 0) facing local +Z towards the seating rows /*/
    this.screenGroup.position.set(0, this.params.screenElevation, 0);

    /*/ 1. Sleek metallic Cinema Frame/Bezel /*/
    const frameGeo = new THREE.BoxGeometry(this.params.screenWidth + 0.18, this.params.screenHeight + 0.18, 0.06);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.85,
      roughness: 0.25
    });
    this.frameMesh = new THREE.Mesh(frameGeo, frameMat);
    this.frameMesh.position.z = -0.03;
    this.screenGroup.add(this.frameMesh);

    /*/ 2. Glowing back-edge perimeter backlight /*/
    const glowEdges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(this.params.screenWidth + 0.18, this.params.screenHeight + 0.18));
    this.glowLine = new THREE.LineSegments(
      glowEdges,
      new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2, transparent: true, opacity: 0.85 })
    );
    this.glowLine.position.z = 0.005;
    this.screenGroup.add(this.glowLine);

    /*/ 3. Screen Surface Mesh /*/
    const screenGeo = new THREE.PlaneGeometry(this.params.screenWidth, this.params.screenHeight);
    this.screenMaterial = new THREE.MeshBasicMaterial({
      map: this.screenTexture,
      toneMapped: false,
      side: THREE.FrontSide
    });
    this.screenMesh = new THREE.Mesh(screenGeo, this.screenMaterial);
    this.screenMesh.position.z = 0.01;
    this.screenGroup.add(this.screenMesh);

    /*/ 4. Cinema Projector Light (attached inside group, shines from above screen onto seating) /*/
    this.projectorLight = new THREE.SpotLight(0xbae6fd, this.params.projectorIntensity, 14, Math.PI / 3, 0.5, 1.2);
    this.projectorLight.position.set(0, this.params.screenElevation + 0.4, 0.5);
    this.projTarget = new THREE.Object3D();
    this.projTarget.position.set(0, 0.3, this.params.rowStartDist + this.params.rowSpacing);
    this.group.add(this.projTarget);
    this.projectorLight.target = this.projTarget;
    this.group.add(this.projectorLight);

    /*/ 5. Dynamic Screen Bounce Light (illuminates the dark cinema room with the movie glow) /*/
    this.screenBounceLight = new THREE.PointLight(0x38bdf8, 0.6, 12, 1.3);
    this.screenBounceLight.position.set(0, this.params.screenElevation, 0.5);
    this.screenGroup.add(this.screenBounceLight);

    this.group.add(this.screenGroup);
  }

  /*/ --- 3. STEPPED RISERS & PLATFORMS --- /*/
  initRisers() {
    if (this.riserGroup) {
      this.group.remove(this.riserGroup);
    }
    this.riserGroup = new THREE.Group();
    this.riserGroup.name = 'TheatreRiserPlatforms';

    const riserMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, /*/ Deep charcoal slate riser /*/
      roughness: 0.4,
      metalness: 0.2
    });

    const ledMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8
    });

    const W = this.params.riserWidth;
    const D = this.params.riserDepth;
    const stepH = this.params.stepHeight;
    const z1 = this.params.rowStartDist;
    const z2 = z1 + this.params.rowSpacing;
    const z3 = z2 + this.params.rowSpacing;

    /*/ Tier 2 platform under Row 2 /*/
    const tier2Geo = new THREE.BoxGeometry(W, stepH, D);
    const tier2Box = new THREE.Mesh(tier2Geo, riserMat);
    tier2Box.position.set(0, stepH / 2, z2);
    tier2Box.receiveShadow = true;
    tier2Box.castShadow = true;
    this.riserGroup.add(tier2Box);

    const strip2Geo = new THREE.BoxGeometry(W, 0.02, 0.03);
    const strip2 = new THREE.Mesh(strip2Geo, ledMat);
    strip2.position.set(0, stepH + 0.01, z2 - D / 2);
    this.riserGroup.add(strip2);

    /*/ Tier 3 platform under Row 3 /*/
    const tier3Geo = new THREE.BoxGeometry(W, stepH * 2, D);
    const tier3Box = new THREE.Mesh(tier3Geo, riserMat);
    tier3Box.position.set(0, stepH, z3);
    tier3Box.receiveShadow = true;
    tier3Box.castShadow = true;
    this.riserGroup.add(tier3Box);

    const strip3Geo = new THREE.BoxGeometry(W, 0.02, 0.03);
    const strip3 = new THREE.Mesh(strip3Geo, ledMat);
    strip3.position.set(0, stepH * 2 + 0.01, z3 - D / 2);
    this.riserGroup.add(strip3);

    this.group.add(this.riserGroup);
  }

  /*/ --- 4. LOAD & POPULATE THEATRE SEATS --- /*/
  async loadSeatAsset() {
    const loader = new GLTFLoader();

    const loadUrl = (url) => {
      return new Promise((resolve, reject) => {
        loader.load(url, (gltf) => resolve(gltf), undefined, (err) => reject(err));
      });
    };

    let gltf;
    try {
      gltf = await loadUrl('/models/theatre-seat.glb');
    } catch {
      try {
        gltf = await loadUrl('/theatre-seat.glb');
      } catch (err) {
        console.error('[TheatreRoom] Failed to load theatre-seat.glb:', err);
        return;
      }
    }

    this.baseSeatModel = gltf.scene;

    this.baseSeatModel.traverse((c) => {
      if (c.isMesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        if (c.material) {
          /*/ Enhance crimson velvet & matte metal finish /*/
          if (c.material.name === 'mat8' || c.material.color?.r > 0.6) {
            c.material.roughness = 0.65;
            c.material.metalness = 0.05;
          } else {
            c.material.roughness = 0.35;
            c.material.metalness = 0.55;
          }
        }
      }
    });

    this.rebuildSeats();
    console.log(`[TheatreRoom] Successfully loaded and populated luxury cinema seats!`);
  }

  rebuildSeats() {
    if (!this.baseSeatModel) return;

    if (this.seatsGroup) {
      this.group.remove(this.seatsGroup);
    }
    this.seatsGroup = new THREE.Group();
    this.seatsGroup.name = 'TheatreSeatsGroup';

    this.seats = [];
    this.seatContainers = [];

    const S = this.params.seatScale;
    const rawMinY = -0.2450;
    const rawCenterX = -0.0683;
    const rawCenterZ = -0.0233;

    const z1 = this.params.rowStartDist;
    const z2 = z1 + this.params.rowSpacing;
    const z3 = z2 + this.params.rowSpacing;
    const stepH = this.params.stepHeight;

    const rowConfigs = [
      { row: 1, z: z1, y: 0.0 },
      { row: 2, z: z2, y: stepH },
      { row: 3, z: z3, y: stepH * 2 }
    ];

    rowConfigs.forEach((rowInfo) => {
      for (let col = 1; col <= this.params.seatCols; col++) {
        const colOffset = (col - (this.params.seatCols + 1) / 2) * this.params.seatSpacing;
        const seatX = colOffset;
        const seatY = rowInfo.y;
        const seatZ = rowInfo.z;

        const seatContainer = new THREE.Group();
        seatContainer.position.set(seatX, seatY, seatZ);

        const seatClone = this.baseSeatModel.clone(true);
        seatClone.scale.set(S, S, S);
        seatClone.position.set(-rawCenterX * S, -rawMinY * S, -rawCenterZ * S);
        seatContainer.add(seatClone);

        /*/ Rotate so chair front faces local -Z (DIRECTLY AT THE SCREEN at z=0) /*/
        seatContainer.rotation.y = Math.PI / 2;

        this.seatsGroup.add(seatContainer);
        this.seatContainers.push(seatContainer);

        /*/ Register interactable seat entry in local coordinates /*/
        const seatData = {
          id: `theatre-seat-r${rowInfo.row}-c${col}`,
          row: rowInfo.row,
          col: col,
          name: `Row ${rowInfo.row}, Seat ${col}`,
          container: seatContainer,
          localGroundPos: new THREE.Vector3(seatX, seatY, seatZ),
          localSitEyePos: new THREE.Vector3(seatX, seatY + 0.85, seatZ - 0.05),
          localLookTarget: new THREE.Vector3(0, this.params.screenElevation, 0),
          radius: 0.85
        };

        /*/ Tag seat meshes for raycaster hover and click selection /*/
        seatClone.traverse((child) => {
          if (child.isMesh) {
            child.userData.seatData = seatData;
            child.userData.isTheatreSeat = true;
          }
        });

        this.seats.push(seatData);
      }
    });

    this.group.add(this.seatsGroup);
  }

  /*/ --- 5. CINEMA ROOM LIGHTING --- /*/
  initLighting() {
    this.sconceGroup = new THREE.Group();
    this.sconceGroup.name = 'TheatreSconces';

    const halfW = this.params.riserWidth / 2 + 0.35;
    const z1 = this.params.rowStartDist;
    const z3 = z1 + this.params.rowSpacing * 2;

    const sconcePositions = [
      { x: -halfW, y: 1.15, z: z1 },
      { x: -halfW, y: 1.15, z: z3 },
      { x: halfW, y: 1.15, z: z1 },
      { x: halfW, y: 1.15, z: z3 }
    ];

    sconcePositions.forEach((pos) => {
      const pLight = new THREE.PointLight(0xfef08a, this.params.sconceIntensity, 8, 1.4);
      pLight.position.set(pos.x, pos.y, pos.z);
      this.sconceGroup.add(pLight);
      this.sconceLights.push(pLight);

      const fixture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.25, 16),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
      );
      fixture.position.set(pos.x, pos.y, pos.z);
      this.sconceGroup.add(fixture);

      const lens = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      lens.position.set(pos.x, pos.y, pos.z);
      this.sconceGroup.add(lens);
    });

    this.group.add(this.sconceGroup);
  }

  /*/ --- 5B. BLACKOUT ROOF SLAB & CORRIDOR ENCLOSURE --- /*/
  initRoofAndCorridor() {
    if (this.roofGroup) {
      this.scene.remove(this.roofGroup);
      this.roofGroup.traverse((child) => {
        if (child.isMesh) {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
            else child.material.dispose();
          }
        }
      });
      this.roofGroup = null;
    }

    if (!this.params.roofVisible) return;

    this.roofGroup = new THREE.Group();
    this.roofGroup.name = 'TheatreBlackoutRoof';

    /*/ 1. Solid Acoustic Blackout Ceiling Slab covering theatre & walkthrough corridor /*/
    const roofGeo = new THREE.BoxGeometry(
      this.params.roofWidth,
      this.params.roofThickness,
      this.params.roofDepth
    );

    const roofMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.params.roofColor),
      roughness: 0.95,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    this.roofMesh = new THREE.Mesh(roofGeo, roofMat);
    this.roofMesh.position.set(
      this.params.roofPosX,
      this.params.roofPosY,
      this.params.roofPosZ
    );
    this.roofMesh.castShadow = true;
    this.roofMesh.receiveShadow = true;
    this.roofGroup.add(this.roofMesh);

    /*/ 2. Architectural Ceiling Perimeter Edges /*/
    const edgeGeo = new THREE.EdgesGeometry(roofGeo);
    const edgeMat = new THREE.LineBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.75
    });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    this.roofMesh.add(edgeLines);

    this.scene.add(this.roofGroup);
  }

  /*/ --- 6. PROXIMITY CHECK & SEATING INTERACTION --- /*/
  getSeatMeshes() {
    const meshes = [];
    this.seats.forEach((seat) => {
      if (seat.container) {
        seat.container.traverse((child) => {
          if (child.isMesh) {
            meshes.push(child);
          }
        });
      }
    });
    return meshes;
  }

  checkSeatProximity(playerPos) {
    if (!playerPos) return null;
    let closestSeat = null;
    let minDistance = 2.2; /*/ Generous 2.2m radius for 1.8x scale luxury cinema seats /*/

    for (const seat of this.seats) {
      if (!seat.container) continue;

      /*/ Compute world position of seat /*/
      const worldGround = new THREE.Vector3();
      seat.container.getWorldPosition(worldGround);

      const dx = playerPos.x - worldGround.x;
      const dz = playerPos.z - worldGround.z;
      const dy = Math.abs(playerPos.y - worldGround.y);
      const dist2D = Math.hypot(dx, dz);

      if (dist2D < minDistance && dy < 2.5) {
        minDistance = dist2D;
        closestSeat = seat;
      }
    }
    return closestSeat;
  }

  sitInSeat(seat) {
    if (!seat || !this.fpController || !seat.container) return;
    this.currentSeatedSeat = seat;
    this.setDimmed(true);

    const worldEye = new THREE.Vector3();
    const worldScreen = new THREE.Vector3();
    seat.container.getWorldPosition(worldEye);
    worldEye.y += 0.85;

    this.screenGroup.getWorldPosition(worldScreen);
    worldScreen.y += this.params.screenHeight * 0.42;

    /*/ Turn camera directly towards the center of the projection screen /*/
    const dx = worldScreen.x - worldEye.x;
    const dz = worldScreen.z - worldEye.z;
    const dy = worldScreen.y - worldEye.y;
    const distXZ = Math.hypot(dx, dz);

    this.fpController.yaw = Math.atan2(-dx, -dz);
    this.fpController.pitch = Math.atan2(dy, distXZ);

    if (this.camera) {
      this.camera.position.copy(worldEye);
      const euler = new THREE.Euler(this.fpController.pitch, this.fpController.yaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(euler);
      this.camera.updateMatrixWorld();
    }

    this.fpController.setSeated(true, seat, worldEye);

    const hud = document.getElementById('cinema-hud');
    const label = document.getElementById('cinema-seat-label');
    if (hud) hud.classList.remove('hidden');
    if (label) label.textContent = `Row ${seat.row} • Seat ${seat.col}`;

    if (this.fpController.showNotification) {
      this.fpController.showNotification(`🎬 Seated in ${seat.name} • POV View Mode`);
    }
    if (this.fpController.playChime) {
      this.fpController.playChime();
    }
  }

  standUp() {
    if (!this.currentSeatedSeat || !this.fpController || !this.currentSeatedSeat.container) return;
    const seat = this.currentSeatedSeat;
    this.currentSeatedSeat = null;
    this.setDimmed(false);

    const worldGround = new THREE.Vector3();
    seat.container.getWorldPosition(worldGround);

    /*/ Step forward towards the screen /*/
    const worldScreen = new THREE.Vector3();
    this.screenGroup.getWorldPosition(worldScreen);
    const forwardDir = new THREE.Vector3().subVectors(worldScreen, worldGround).setY(0).normalize();

    if (this.camera) {
      this.camera.position.copy(worldGround).addScaledVector(forwardDir, 0.55);
      this.camera.position.y = worldGround.y + 0.68;
    }

    if (this.fpController) {
      this.fpController.setSeated(false);
      this.fpController.velocity.set(0, 0, 0);
    }

    const hud = document.getElementById('cinema-hud');
    if (hud) hud.classList.add('hidden');

    if (this.fpController?.showNotification) {
      this.fpController.showNotification('🚶 Stood up from cinema seat');
    }
  }

  setDimmed(dimmed) {
    this.isDimmed = dimmed;
  }

  /*/ --- 7. FRAME UPDATE (DOCUMENTARY CANVAS ANIMATION) --- /*/
  update(delta) {
    this.docTime += delta;
    this.chapterTimer += delta;

    if (this.chapterTimer >= this.chapterDuration) {
      this.chapterTimer = 0;
      this.currentChapter = (this.currentChapter + 1) % this.chapters.length;
    }

    this.renderCanvasFrame();
    this.screenTexture.needsUpdate = true;

    /*/ Smooth cinematic lighting transitions (Pitch black when seated, subtle dim when walking) /*/
    const targetSconce = this.isDimmed ? 0.0 : this.params.sconceIntensity;
    const targetWalkLight = this.isDimmed ? 0.0 : 0.7;
    const targetProjector = this.isDimmed ? 22.0 : this.params.projectorIntensity;
    const targetScreenBounce = this.isDimmed ? 4.2 : 0.6;

    this.sconceLights.forEach((light) => {
      light.intensity = THREE.MathUtils.lerp(light.intensity, targetSconce, delta * 3.5);
    });

    this.walkLights.forEach((light) => {
      light.intensity = THREE.MathUtils.lerp(light.intensity, targetWalkLight, delta * 3.5);
    });

    if (this.screenBounceLight) {
      this.screenBounceLight.intensity = THREE.MathUtils.lerp(this.screenBounceLight.intensity, targetScreenBounce, delta * 3.5);
    }

    /*/ Subtle projector flicker matching cinematic documentary footage /*/
    if (this.projectorLight) {
      const flicker = 0.95 + Math.sin(this.docTime * 18.0) * 0.05 + Math.cos(this.docTime * 7.3) * 0.03;
      this.projectorLight.intensity = THREE.MathUtils.lerp(this.projectorLight.intensity, targetProjector * flicker, delta * 3.5);
    }
  }

  /*/ Renders the 16:9 1280x720 NASA Space Apps Documentary frame /*/
  renderCanvasFrame() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const t = this.docTime;
    const ch = this.chapters[this.currentChapter];

    /*/ Background gradient with deep void /*/
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#030712');
    bgGrad.addColorStop(0.5, '#0b1329');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    /*/ Moving starfield gridlines on canvas /*/
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    const offsetX = (t * 8) % gridSize;
    const offsetY = (t * 4) % gridSize;
    for (let x = -gridSize; x < w + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + offsetX, 0);
      ctx.lineTo(x + offsetX, h);
      ctx.stroke();
    }
    for (let y = -gridSize; y < h + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + offsetY);
      ctx.lineTo(w, y + offsetY);
      ctx.stroke();
    }

    /*/ Top Header Bar /*/
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, w, 68);
    ctx.fillStyle = ch.accentColor;
    ctx.fillRect(0, 66, w, 2);

    /*/ NASA Space Apps Logo / Header Text /*/
    ctx.font = 'bold 20px "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('NASA SPACE APPS CHALLENGE 2026', 40, 42);

    ctx.font = '600 15px monospace';
    ctx.fillStyle = ch.accentColor;
    ctx.fillText('DOCUMENTARY THEATRE • ABANDONED BUT NOT FORGOTTEN', 440, 42);

    /*/ Timecode & REC indicator /*/
    const blink = Math.sin(t * 4) > 0;
    ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(1140, 38, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '600 15px monospace';
    ctx.fillStyle = '#94a3b8';
    const mins = Math.floor(t / 60).toString().padStart(2, '0');
    const secs = Math.floor(t % 60).toString().padStart(2, '0');
    const frames = Math.floor((t * 30) % 30).toString().padStart(2, '0');
    ctx.fillText(`REC [00:${mins}:${secs}:${frames}]`, 1160, 43);

    /*/ --- LEFT COLUMN: CHAPTER TITLES & HISTORICAL NARRATIVE --- /*/
    ctx.fillStyle = ch.accentColor;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`MISSION CHAPTER 0${this.currentChapter + 1} / 04`, 45, 120);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px "Segoe UI", sans-serif';
    ctx.fillText(ch.title, 45, 162);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px "Segoe UI", sans-serif';
    ctx.fillText(ch.subtitle, 45, 195);

    /*/ Target Location & Hardware Specs Card /*/
    ctx.fillStyle = 'rgba(30, 41, 59, 0.65)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(45, 230, 560, 240, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('TARGET SECTOR:', 65, 260);
    ctx.fillStyle = '#f1f5f9';
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillText(ch.target, 190, 260);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('HARDWARE:', 65, 292);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '14px "Segoe UI", sans-serif';
    ctx.fillText(ch.hardware, 190, 292);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('CURRENT STATE:', 65, 324);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'italic 14px "Segoe UI", sans-serif';
    ctx.fillText(ch.status, 190, 324);

    /*/ Telemetry Statistics /*/
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('MISSION TELEMETRY METRICS:', 65, 362);

    ch.stats.forEach((stat, i) => {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 14px monospace';
      ctx.fillText(`• ${stat}`, 75, 390 + i * 24);
    });

    /*/ Famous Quote / Inscription Card /*/
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = ch.accentColor;
    ctx.beginPath();
    ctx.roundRect(45, 490, 560, 95, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 17px "Georgia", serif';
    ctx.fillText(ch.quote, 65, 528);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText(ch.notes, 65, 562);

    /*/ --- RIGHT COLUMN: DYNAMIC 3D WIREFRAME GRAPHIC & RADAR --- /*/
    const cx = 950;
    const cy = 340;

    /*/ Glowing orbital compass ring /*/
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, Math.PI * 2);
    ctx.stroke();

    /*/ Radar sweep line /*/
    const sweepAngle = t * 1.8;
    ctx.strokeStyle = ch.accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * 180, cy + Math.sin(sweepAngle) * 180);
    ctx.stroke();

    /*/ Rotating 3D Wireframe Silhouette /*/
    this.drawWireframeGraphic(ctx, cx, cy, t, this.currentChapter, ch.accentColor);

    /*/ --- BOTTOM FOOTER: AUDIO EQUALIZER & MISSION TIMELINE --- /*/
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, h - 85, w, 85);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, h - 85, w, 1);

    /*/ Audio Equalizer Visualizer Bars /*/
    const barCount = 48;
    const barWidth = 6;
    const startX = 45;
    for (let i = 0; i < barCount; i++) {
      const freq = Math.sin(t * 8 + i * 0.4) * 0.5 + Math.cos(t * 14 - i * 0.6) * 0.3 + 0.5;
      const barHeight = Math.max(4, freq * 45);
      const grad = ctx.createLinearGradient(0, h - 20 - barHeight, 0, h - 20);
      grad.addColorStop(0, ch.accentColor);
      grad.addColorStop(1, '#0284c7');
      ctx.fillStyle = grad;
      ctx.fillRect(startX + i * (barWidth + 4), h - 25 - barHeight, barWidth, barHeight);
    }

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText('AUDIO TELEMETRY STREAM • NASA DEEP SPACE NETWORK (DSN)', 45, h - 72);

    /*/ Chapter progress timeline bar /*/
    const progressWidth = 460;
    const progressX = w - progressWidth - 45;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(progressX, h - 45, progressWidth, 8);

    const fillW = (this.chapterTimer / this.chapterDuration) * progressWidth;
    ctx.fillStyle = ch.accentColor;
    ctx.fillRect(progressX, h - 45, fillW, 8);

    ctx.font = '600 13px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`TRANSITION IN ${(this.chapterDuration - this.chapterTimer).toFixed(1)}s`, progressX, h - 55);

    /*/ Cinematic Film Grain & Vignette edges /*/
    const gradVig = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.85);
    gradVig.addColorStop(0, 'rgba(0,0,0,0)');
    gradVig.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = gradVig;
    ctx.fillRect(0, 0, w, h);
  }

  /*/ Draws rotating mathematical wireframe schematics /*/
  drawWireframeGraphic(ctx, cx, cy, t, chapter, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;

    const rot = t * 0.6;

    if (chapter === 0) {
      /*/ Mars Rover Wireframe /*/
      ctx.beginPath();
      ctx.strokeRect(-70, -25, 140, 50);
      ctx.strokeRect(-95, -45, 190, 20);
      [-65, 0, 65].forEach((wx) => {
        ctx.beginPath();
        ctx.arc(wx, 55, 18, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(35, -25);
      ctx.lineTo(35, -85);
      ctx.lineTo(55, -85);
      ctx.stroke();
    } else if (chapter === 1) {
      /*/ Apollo Lunar Module Descent Stage /*/
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a1 = (i / 8) * Math.PI * 2 + rot * 0.2;
        const a2 = ((i + 1) / 8) * Math.PI * 2 + rot * 0.2;
        ctx.moveTo(Math.cos(a1) * 75, Math.sin(a1) * 45 + 10);
        ctx.lineTo(Math.cos(a2) * 75, Math.sin(a2) * 45 + 10);
      }
      ctx.stroke();
      [[-75, 60], [75, 60], [-45, 80], [45, 80]].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.moveTo(px * 0.6, 20);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.strokeRect(px - 14, py, 28, 6);
      });
      ctx.beginPath();
      ctx.moveTo(-25, 25);
      ctx.lineTo(25, 25);
      ctx.lineTo(38, 70);
      ctx.lineTo(-38, 70);
      ctx.closePath();
      ctx.stroke();
    } else if (chapter === 2) {
      /*/ Nuclear Rover (Perseverance) & Helicopter /*/
      ctx.beginPath();
      ctx.strokeRect(-65, -30, 130, 60);
      ctx.moveTo(65, 0);
      ctx.lineTo(110, -20);
      ctx.lineTo(135, 15);
      ctx.stroke();
      ctx.moveTo(-110, -30);
      ctx.lineTo(-110, 30);
      ctx.moveTo(-140, -15);
      ctx.lineTo(-80, -15);
      ctx.moveTo(-135, 15);
      ctx.lineTo(-85, 15);
      ctx.stroke();
    } else {
      /*/ Voyager Golden Record & Probe /*/
      ctx.beginPath();
      ctx.arc(0, 0, 75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 55, 0, Math.PI * 2);
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const len = 30 + ((i * 17) % 40);
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  /*/ --- 8. LIL-GUI REAL-TIME CALIBRATION PANEL --- /*/
  initGui() {
    /*/ The movie theatre coordinates and layout are finalized.
        To re-open the live calibration GUI, add #gui to the URL in the browser /*/
    if (typeof window !== 'undefined' && !window.location.hash.includes('gui') && !window.DEBUG_THEATRE) {
      return;
    }

    try {
      this.gui = new GUI({ title: '🎬 Movie Theatre Calibration' });
      this.gui.domElement.style.position = 'fixed';
      this.gui.domElement.style.top = '20px';
      this.gui.domElement.style.right = '20px';
      this.gui.domElement.style.zIndex = '99999';

      ['pointerdown', 'mousedown', 'click', 'touchstart'].forEach((evt) => {
        this.gui.domElement.addEventListener(evt, (e) => e.stopPropagation());
      });

      /*/ Position Controls: Moves the screen and all seats together /*/
      const posFolder = this.gui.addFolder('📍 Position (X, Y, Z)');
      posFolder.add(this.params, 'posX', -15, 25, 0.05).name('X (Left/Right)').onChange(() => this.applyMasterTransforms());
      posFolder.add(this.params, 'posY', -5, 10, 0.05).name('Y (Height)').onChange(() => this.applyMasterTransforms());
      posFolder.add(this.params, 'posZ', 5, 35, 0.05).name('Z (Depth)').onChange(() => this.applyMasterTransforms());
      posFolder.open();

      /*/ Rotation Controls: Rotates the screen and all seats together in perfect alignment /*/
      const rotFolder = this.gui.addFolder('🔄 Rotation (Degrees)');
      rotFolder.add(this.params, 'pitchX', -180, 180, 1).name('Pitch X').onChange(() => this.applyMasterTransforms());
      rotFolder.add(this.params, 'yawY', -180, 180, 1).name('Yaw Y').onChange(() => this.applyMasterTransforms());
      rotFolder.add(this.params, 'rollZ', -180, 180, 1).name('Roll Z').onChange(() => this.applyMasterTransforms());
      rotFolder.open();

      /*/ Screen Dimensions /*/
      const screenFolder = this.gui.addFolder('📺 Cinema Screen');
      screenFolder.add(this.params, 'screenWidth', 1.0, 10.0, 0.1).name('Width (m)').onChange(() => this.rebuildScreen());
      screenFolder.add(this.params, 'screenHeight', 1.0, 6.0, 0.1).name('Height (m)').onChange(() => this.rebuildScreen());
      screenFolder.add(this.params, 'screenElevation', 0.2, 4.0, 0.05).name('Elevation (Y)').onChange(() => {
        if (this.screenGroup) this.screenGroup.position.y = this.params.screenElevation;
      });
      screenFolder.open();

      /*/ Seating & Riser Layout /*/
      const layoutFolder = this.gui.addFolder('🪑 Seating & Riser Layout');
      layoutFolder.add(this.params, 'rowStartDist', 1.0, 5.0, 0.05).name('Screen Distance').onChange(() => {
        this.initRisers();
        this.rebuildSeats();
      });
      layoutFolder.add(this.params, 'rowSpacing', 0.6, 2.5, 0.05).name('Row Spacing').onChange(() => {
        this.initRisers();
        this.rebuildSeats();
      });
      layoutFolder.add(this.params, 'seatSpacing', 0.4, 1.2, 0.02).name('Seat Spacing').onChange(() => this.rebuildSeats());
      layoutFolder.add(this.params, 'seatScale', 0.8, 3.0, 0.05).name('Seat Scale').onChange(() => this.rebuildSeats());

      /*/ Blackout Roof & Walkthrough Enclosure Controls /*/
      const roofFolder = this.gui.addFolder('🏠 Blackout Roof & Corridor');
      roofFolder.add(this.params, 'roofVisible').name('Roof Active').onChange(() => this.initRoofAndCorridor());
      roofFolder.add(this.params, 'roofPosX', -4, 12, 0.05).name('X (Center)').onChange(() => this.initRoofAndCorridor());
      roofFolder.add(this.params, 'roofPosY', -1, 3, 0.02).name('Y (Height)').onChange(() => this.initRoofAndCorridor());
      roofFolder.add(this.params, 'roofPosZ', 12, 28, 0.05).name('Z (Center)').onChange(() => this.initRoofAndCorridor());
      roofFolder.add(this.params, 'roofWidth', 6, 16, 0.1).name('Width (X)').onChange(() => this.initRoofAndCorridor());
      roofFolder.add(this.params, 'roofDepth', 6, 16, 0.1).name('Depth (Z)').onChange(() => this.initRoofAndCorridor());
      roofFolder.add(this.params, 'roofThickness', 0.04, 0.5, 0.01).name('Thickness').onChange(() => this.initRoofAndCorridor());
      roofFolder.addColor(this.params, 'roofColor').name('Roof Color').onChange(() => this.initRoofAndCorridor());

      /*/ Lighting Controls /*/
      const lightFolder = this.gui.addFolder('💡 Auditorium Lights');
      lightFolder.add(this.params, 'sconceIntensity', 0, 30, 0.5).name('Sconces').onChange((val) => {
        this.sconceLights.forEach((l) => (l.intensity = val));
      });
      lightFolder.add(this.params, 'downlightIntensity', 0, 20, 0.5).name('Downlights').onChange((val) => {
        this.ceilingLights.forEach((l) => (l.intensity = val));
      });
      lightFolder.add(this.params, 'projectorIntensity', 0, 40, 1).name('Projector').onChange((val) => {
        if (this.projectorLight) this.projectorLight.intensity = val;
      });

      this.gui.add(this.params, 'copyToClipboard').name('📋 Copy Theatre Config');
    } catch (err) {
      console.warn('[TheatreRoom] Failed to initialize lil-gui:', err);
    }
  }

  applyMasterTransforms() {
    if (this.group) {
      this.group.position.set(this.params.posX, this.params.posY, this.params.posZ);
      this.group.rotation.set(
        THREE.MathUtils.degToRad(this.params.pitchX),
        THREE.MathUtils.degToRad(this.params.yawY),
        THREE.MathUtils.degToRad(this.params.rollZ)
      );
    }
  }

  rebuildScreen() {
    if (this.screenMesh && this.screenMesh.geometry) {
      this.screenMesh.geometry.dispose();
      this.screenMesh.geometry = new THREE.PlaneGeometry(this.params.screenWidth, this.params.screenHeight);
    }
    if (this.frameMesh && this.frameMesh.geometry) {
      this.frameMesh.geometry.dispose();
      this.frameMesh.geometry = new THREE.BoxGeometry(this.params.screenWidth + 0.18, this.params.screenHeight + 0.18, 0.06);
    }
    if (this.glowLine && this.glowLine.geometry) {
      this.glowLine.geometry.dispose();
      this.glowLine.geometry = new THREE.EdgesGeometry(new THREE.PlaneGeometry(this.params.screenWidth + 0.18, this.params.screenHeight + 0.18));
    }
  }

  copyValues() {
    const formatted = `THEATRE_CONFIG = {
  posX: ${this.params.posX.toFixed(2)},
  posY: ${this.params.posY.toFixed(2)},
  posZ: ${this.params.posZ.toFixed(2)},
  pitchX: ${this.params.pitchX.toFixed(1)},
  yawY: ${this.params.yawY.toFixed(1)},
  rollZ: ${this.params.rollZ.toFixed(1)},
  screenWidth: ${this.params.screenWidth.toFixed(2)},
  screenHeight: ${this.params.screenHeight.toFixed(2)},
  screenElevation: ${this.params.screenElevation.toFixed(2)},
  riserWidth: ${this.params.riserWidth.toFixed(2)},
  rowStartDist: ${this.params.rowStartDist.toFixed(2)},
  rowSpacing: ${this.params.rowSpacing.toFixed(2)},
  stepHeight: ${this.params.stepHeight.toFixed(2)},
  seatCols: ${this.params.seatCols},
  seatSpacing: ${this.params.seatSpacing.toFixed(2)},
  seatScale: ${this.params.seatScale.toFixed(2)},
  roofVisible: ${this.params.roofVisible},
  roofPosX: ${this.params.roofPosX.toFixed(2)},
  roofPosY: ${this.params.roofPosY.toFixed(2)},
  roofPosZ: ${this.params.roofPosZ.toFixed(2)},
  roofWidth: ${this.params.roofWidth.toFixed(2)},
  roofDepth: ${this.params.roofDepth.toFixed(2)},
  roofThickness: ${this.params.roofThickness.toFixed(2)}
};`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(formatted).catch(() => {});
    }
    console.log('[TheatreRoom] Current Settings:\n' + formatted);

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
    toast.innerHTML = '📋 <b>Theatre coordinates copied!</b> Paste in chat.';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.6s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 600);
    }, 2800);
  }
}
