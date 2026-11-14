import * as THREE from 'three';

/*/ Creates procedural chevron arrow white mask texture on canvas /*/
function createChevronTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 256, 256);

  /*/ Glowing Forward Chevron Shape pointing forward towards top of texture /*/
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 28;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 24;

  ctx.beginPath();
  ctx.moveTo(52, 168);
  ctx.lineTo(128, 88);
  ctx.lineTo(204, 168);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/*/ Holographic Directional Floor Decals along Museum Approach Road /*/
export class DirectionArrows {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'PathwayDirectionArrows';

    this.chevrons = [];
    this.animTime = 0;

    /*/ Adaptive color states: Cold holographic cyan outside vs warm brass inside /*/
    this.coldColor = new THREE.Color(0x38bdf8);
    this.warmColor = new THREE.Color(0xfbbf24);

    this.initArrows();
    this.scene.add(this.group);
  }

  initArrows() {
    const floorY = -1.86; /*/ Just above road floor Y = -1.87 to eliminate z-fighting /*/
    const texture = createChevronTexture();
    const arrowGeo = new THREE.PlaneGeometry(1.4, 1.4);
    arrowGeo.rotateX(-Math.PI / 2);

    /*/ Seamless sequential waypoints following the exact dark asphalt road centerline from touchdown (15.04, 10.41), around the main curve, along the avenue, and through the final turn directly into the museum entrance doorway /*/
    const positions = [
      /*/ 1. Straight Section (From Landing Spot along Z-axis) /*/
      [15.13, floorY, 11.50],
      [15.13, floorY, 13.90],
      [15.13, floorY, 16.30],
      [15.13, floorY, 18.70],
      [15.13, floorY, 21.10],
      [15.13, floorY, 23.50],

      /*/ 2. Main Corner Curve (Centered on dark asphalt arc between inner and outer curbs) /*/
      [14.80, floorY, 25.80],
      [14.00, floorY, 28.00],
      [12.40, floorY, 29.40],
      [10.40, floorY, 29.95],
      [ 8.20, floorY, 30.08],

      /*/ 3. Horizontal Avenue (Along X-axis past the exhibition halls) /*/
      [ 6.00, floorY, 30.11],
      [ 3.90, floorY, 30.11],
      [ 1.80, floorY, 30.11],
      [-0.30, floorY, 30.11],
      [-2.40, floorY, 30.11],
      [-4.50, floorY, 30.11],

      /*/ 4. Entrance Turn & Final Approach (Rounding the corner onto the entrance road and leading straight to the threshold) /*/
      [-6.40, floorY, 29.80],
      [-7.70, floorY, 28.20],
      [-8.35, floorY, 26.30],
      [-8.42, floorY, 24.50],
      [-8.42, floorY, 22.90]
    ];

    positions.forEach((pos, idx) => {
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        color: this.coldColor.clone(),
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1.0,
        polygonOffsetUnits: -1.0
      });

      const mesh = new THREE.Mesh(arrowGeo, mat);
      mesh.position.set(pos[0], pos[1], pos[2]);

      /*/ Calculate exact forward direction to next waypoint along road /*/
      const next = idx < positions.length - 1
        ? positions[idx + 1]
        : [positions[idx][0], floorY, positions[idx][2] - 2.0];
      const dx = next[0] - pos[0];
      const dz = next[2] - pos[2];

      /*/ Geometry rotated by -90 deg X points along -Z, so rotation.y = atan2(-dx, -dz) orientates apex toward (dx, dz) /*/
      mesh.rotation.y = Math.atan2(-dx, -dz);

      this.chevrons.push({ mesh, mat, offset: idx * 0.35 });
      this.group.add(mesh);
    });
  }

  setInsideTransition(factor) {
    const f = THREE.MathUtils.clamp(factor, 0.0, 1.0);
    this.chevrons.forEach(({ mat }) => {
      if (mat) {
        mat.color.lerpColors(this.coldColor, this.warmColor, f);
      }
    });
  }

  update(delta) {
    this.animTime += delta * 3.2;

    this.chevrons.forEach((item, idx) => {
      /*/ Forward-flowing wave illumination towards the entrance /*/
      const wave = Math.sin(this.animTime - idx * 0.35);
      item.mesh.material.opacity = 0.25 + 0.65 * Math.max(0, wave);
    });
  }
}
