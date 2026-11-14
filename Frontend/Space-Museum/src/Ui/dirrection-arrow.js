import * as THREE from 'three';

/*/ Creates procedural chevron arrow texture on canvas /*/
function createChevronTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 256, 256);

  /*/ Glowing Forward Chevron Shape /*/
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 28;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 24;

  ctx.beginPath();
  ctx.moveTo(48, 170);
  ctx.lineTo(128, 86);
  ctx.lineTo(208, 170);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/*/ Holographic Directional Floor Decals on Museum Approach Road /*/
export class DirectionArrows {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'PathwayDirectionArrows';

    this.chevrons = [];
    this.animTime = 0;

    this.initArrows();
    this.scene.add(this.group);
  }

  initArrows() {
    const floorY = -1.86; /*/ Just above road floor Y = -1.87 to eliminate z-fighting /*/
    const texture = createChevronTexture();
    const arrowGeo = new THREE.PlaneGeometry(1.6, 1.6);
    arrowGeo.rotateX(-Math.PI / 2);

    /*/ Waypoint Centers along the road platform heading toward the entrance /*/
    const positions = [
      [4.0, floorY, 28.0],
      [4.0, floorY, 23.0],
      [4.0, floorY, 18.0],
      [4.0, floorY, 13.0],
      [4.0, floorY,  8.0]
    ];

    positions.forEach((pos, idx) => {
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const mesh = new THREE.Mesh(arrowGeo, mat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      /*/ Point chevron along -Z directly into the museum entrance /*/
      mesh.rotation.y = 0;

      this.chevrons.push({ mesh, offset: idx * 0.6 });
      this.group.add(mesh);
    });
  }

  update(delta) {
    this.animTime += delta * 3.0;

    this.chevrons.forEach((item) => {
      /*/ Forward-flowing wave illumination /*/
      const wave = Math.sin(this.animTime - item.offset);
      item.mesh.material.opacity = 0.35 + 0.55 * Math.max(0, wave);
    });
  }
}
