import * as THREE from 'three';

/*/ Interactive Top-Down Floor Map & Landing Point Calibration Tool /*/
export class FloorMapSelector {
  constructor(scene, camera, controls, fpController, getIslandModel) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.fpController = fpController;
    this.getIslandModel = getIslandModel;

    this.isActive = false;
    this.selectedPos = null;
    this.animTime = 0;

    /*/ Camera Transition State /*/
    this.savedCameraPos = new THREE.Vector3();
    this.savedControlsTarget = new THREE.Vector3();
    this.targetCameraPos = new THREE.Vector3(0, 54, 0.01);
    this.targetControlsTarget = new THREE.Vector3(0, 0, 0);
    this.isTransitioning = false;

    /*/ Raycasting Setup /*/
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init3DMarkers();
    this.initUI();
    this.initListeners();
  }

  init3DMarkers() {
    this.markerGroup = new THREE.Group();
    this.markerGroup.name = 'LandingBeaconMarker';
    this.markerGroup.visible = false;

    /*/ Inner Target Ring /*/
    const innerRingGeo = new THREE.TorusGeometry(0.7, 0.04, 16, 48);
    innerRingGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95
    });
    this.innerRing = new THREE.Mesh(innerRingGeo, ringMat);
    this.markerGroup.add(this.innerRing);

    /*/ Outer Pulsing Radar Ring /*/
    const outerRingGeo = new THREE.TorusGeometry(1.3, 0.03, 16, 48);
    outerRingGeo.rotateX(-Math.PI / 2);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.8
    });
    this.outerRing = new THREE.Mesh(outerRingGeo, outerMat);
    this.markerGroup.add(this.outerRing);

    /*/ Vertical Holographic Laser Beacon Pillar /*/
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, 6.0, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.beam = new THREE.Mesh(beamGeo, beamMat);
    this.beam.position.y = 3.0;
    this.markerGroup.add(this.beam);

    /*/ Top Rotating Beacon Diamond /*/
    const diamondGeo = new THREE.OctahedronGeometry(0.35, 0);
    const diamondMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      wireframe: true
    });
    this.diamond = new THREE.Mesh(diamondGeo, diamondMat);
    this.diamond.position.y = 6.2;
    this.markerGroup.add(this.diamond);

    this.scene.add(this.markerGroup);

    /*/ Real-Time Floor Hover Cursor Reticle /*/
    const cursorGeo = new THREE.RingGeometry(0.35, 0.42, 32);
    cursorGeo.rotateX(-Math.PI / 2);
    const cursorMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide
    });
    this.hoverReticle = new THREE.Mesh(cursorGeo, cursorMat);
    this.hoverReticle.visible = false;
    this.scene.add(this.hoverReticle);
  }

  initUI() {
    /*/ Top-Right Floor Map Toggle Button /*/
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.id = 'btn-floor-map';
    this.toggleBtn.className = 'btn-map-toggle';
    this.toggleBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        <line x1="8" y1="2" x2="8" y2="18"/>
        <line x1="16" y1="6" x2="16" y2="22"/>
      </svg>
      <span>FLOOR MAP & LANDING SELECTOR [M]</span>
    `;
    document.body.appendChild(this.toggleBtn);

    /*/ Floating Coordinate Card for Selected Landing Point /*/
    this.card = document.createElement('div');
    this.card.className = 'landing-coord-card';
    this.card.innerHTML = `
      <div class="coord-card-header">
        <span class="coord-pulse-dot"></span>
        <span class="coord-tag">FLOOR LANDING TARGET</span>
      </div>
      <div class="coord-values" id="coord-values-text">
        Click anywhere on the floor to select a landing point
      </div>
      <div class="coord-actions">
        <button class="coord-btn copy-btn" id="btn-copy-coords" disabled>
          📋 COPY COORDINATES
        </button>
        <button class="coord-btn land-btn" id="btn-land-here" disabled>
          🚀 TEST LAND HERE
        </button>
        <button class="coord-btn close-btn" id="btn-close-map">
          EXIT MAP [M]
        </button>
      </div>
      <div class="coord-hint" id="coord-hint-text">
        Click on the road or any gallery chamber floor to lock landing coordinates.
      </div>
    `;
    document.body.appendChild(this.card);

    /*/ Hover Coordinates Tooltip /*/
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'floor-cursor-tooltip';
    document.body.appendChild(this.tooltip);

    /*/ Wire Button Listeners /*/
    this.toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMapMode();
    });

    const copyBtn = this.card.querySelector('#btn-copy-coords');
    if (copyBtn) {
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.copyCoordinates();
      });
    }

    const landBtn = this.card.querySelector('#btn-land-here');
    if (landBtn) {
      landBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.testLandHere();
      });
    }

    const closeBtn = this.card.querySelector('#btn-close-map');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setMapMode(false);
      });
    }
  }

  initListeners() {
    /*/ Toggle on [M] key /*/
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        if (!this.fpController.isFirstPerson && !this.fpController.isLanding) {
          this.toggleMapMode();
        }
      }
    });

    /*/ Hide Map button when First Person is active /*/
    const observer = new MutationObserver(() => {
      if (this.fpController.isFirstPerson) {
        this.toggleBtn.style.display = 'none';
        if (this.isActive) this.setMapMode(false);
      } else {
        this.toggleBtn.style.display = 'flex';
      }
    });
    if (this.fpController.hudElement) {
      observer.observe(this.fpController.hudElement, { attributes: true, attributeFilter: ['class'] });
    }
  }

  toggleMapMode() {
    this.setMapMode(!this.isActive);
  }

  setMapMode(active) {
    if (this.isActive === active) return;
    this.isActive = active;

    this.toggleBtn.classList.toggle('active', this.isActive);
    this.card.classList.toggle('visible', this.isActive);

    if (this.isActive) {
      /*/ Save current Orbit camera transform to restore later /*/
      this.savedCameraPos.copy(this.camera.position);
      this.savedControlsTarget.copy(this.controls.target);

      /*/ Smoothly transition camera to top-down architectural map view /*/
      this.isTransitioning = true;
      this.controls.autoRotate = false;

      this.hoverReticle.visible = true;
      this.tooltip.classList.add('visible');
    } else {
      /*/ Hide Floor Map UI & Tooltips /*/
      this.hoverReticle.visible = false;
      this.tooltip.classList.remove('visible');

      /*/ Restore Orbit camera /*/
      this.controls.target.copy(this.savedControlsTarget);
      this.camera.position.copy(this.savedCameraPos);
      this.controls.update();
      this.isTransitioning = false;
    }
  }

  getIntersectableMeshes() {
    const island = this.getIslandModel();
    if (!island) return [];
    const meshes = [];
    island.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child);
      }
    });
    return meshes;
  }

  handlePointerMove(event) {
    if (!this.isActive) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const targets = this.getIntersectableMeshes();
    const intersects = this.raycaster.intersectObjects(targets, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const p = hit.point;

      /*/ Snap hover reticle to floor surface /*/
      this.hoverReticle.position.set(p.x, p.y + 0.04, p.z);
      this.hoverReticle.visible = true;

      /*/ Position Tooltip next to cursor /*/
      this.tooltip.style.left = `${event.clientX + 16}px`;
      this.tooltip.style.top = `${event.clientY - 12}px`;
      this.tooltip.innerHTML = `Floor: X: ${p.x.toFixed(1)}, Z: ${p.z.toFixed(1)}`;
      this.tooltip.style.opacity = '1';
    } else {
      this.hoverReticle.visible = false;
      this.tooltip.style.opacity = '0';
    }
  }

  handleClick(event) {
    if (!this.isActive) return false;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const targets = this.getIntersectableMeshes();
    const intersects = this.raycaster.intersectObjects(targets, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const p = hit.point;

      /*/ Calibrated human eye height (+1.1m above hit floor level) /*/
      const eyeY = p.y + 1.1;
      this.selectedPos = new THREE.Vector3(p.x, eyeY, p.z);

      /*/ Place 3D Landing Marker /*/
      this.markerGroup.position.set(p.x, p.y + 0.02, p.z);
      this.markerGroup.visible = true;

      /*/ Update Card UI with Coordinates /*/
      const valEl = this.card.querySelector('#coord-values-text');
      if (valEl) {
        valEl.innerHTML = `
          <span>X: <b>${p.x.toFixed(2)}</b></span>
          <span>Y: <b>${eyeY.toFixed(2)}</b></span>
          <span>Z: <b>${p.z.toFixed(2)}</b></span>
        `;
      }

      /*/ Enable Actions /*/
      const copyBtn = this.card.querySelector('#btn-copy-coords');
      const landBtn = this.card.querySelector('#btn-land-here');
      const hintEl = this.card.querySelector('#coord-hint-text');

      if (copyBtn) copyBtn.disabled = false;
      if (landBtn) landBtn.disabled = false;
      if (hintEl) {
        hintEl.textContent = 'Selected! Click [COPY] to share with AI or [TEST LAND] to experience this point.';
      }

      /*/ Save as default custom landing spot in controller /*/
      this.fpController.customLandingPos = this.selectedPos.clone();

      return true;
    }

    return false;
  }

  copyCoordinates() {
    if (!this.selectedPos) return;

    const x = this.selectedPos.x.toFixed(2);
    const y = this.selectedPos.y.toFixed(2);
    const z = this.selectedPos.z.toFixed(2);
    const coordString = `X: ${x}, Y: ${y}, Z: ${z}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(coordString).then(() => {
        const copyBtn = this.card.querySelector('#btn-copy-coords');
        if (copyBtn) {
          const original = copyBtn.textContent;
          copyBtn.textContent = '✓ COPIED TO CLIPBOARD!';
          copyBtn.classList.add('success');
          setTimeout(() => {
            copyBtn.textContent = original;
            copyBtn.classList.remove('success');
          }, 2500);
        }
      });
    }
  }

  testLandHere() {
    if (!this.selectedPos) return;

    /*/ Hide map selector and trigger cinematic landing straight to chosen coordinates /*/
    const pos = this.selectedPos.clone();
    this.setMapMode(false);

    /*/ Direction pointing towards museum center (0, eyeY, 0) /*/
    const lookDir = new THREE.Vector3(0, pos.y, 0).sub(pos).normalize();
    const lookAtPos = pos.clone().addScaledVector(lookDir, 10.0);

    this.fpController.landInside(null, pos, lookAtPos);
  }

  update(delta) {
    this.animTime += delta;

    /*/ Marker beacon animation /*/
    if (this.markerGroup.visible) {
      if (this.outerRing) {
        const pulse = 1.0 + Math.sin(this.animTime * 3.5) * 0.25;
        this.outerRing.scale.set(pulse, pulse, pulse);
        this.outerRing.material.opacity = 0.5 + Math.sin(this.animTime * 3.5) * 0.35;
      }
      if (this.diamond) {
        this.diamond.rotation.y += delta * 1.8;
        this.diamond.position.y = 6.0 + Math.sin(this.animTime * 2.5) * 0.35;
      }
    }

    /*/ Smooth camera glide to Top-Down Map View /*/
    if (this.isActive && this.isTransitioning) {
      this.camera.position.lerp(this.targetCameraPos, Math.min(1.0, delta * 3.5));
      this.controls.target.lerp(this.targetControlsTarget, Math.min(1.0, delta * 3.5));
      this.controls.update();

      if (this.camera.position.distanceTo(this.targetCameraPos) < 0.2) {
        this.isTransitioning = false;
      }
    }
  }
}
