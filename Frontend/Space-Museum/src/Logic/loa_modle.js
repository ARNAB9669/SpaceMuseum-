import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

/*/ CDN URL for the Space Museum architectural model /*/
const CDN_MUSEUM_OBJ_URL = 'https://raw.githubusercontent.com/ARNAB9669/SpaceMuseum-/main/Frontend/Space-Museum/public/Space-Mesume.obj';
const LOCAL_MUSEUM_OBJ_URL = '/Space-Mesume.obj';

/*/ Load and setup 3D Space Museum Island /*/
export async function loadMuseumIsland(scene, onProgress) {
  const loader = new OBJLoader();

  /*/ Material Setup for Museum Architecture (Identical to original museum.js) /*/
  const structureMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569, /*/ Rich slate concrete gray with clear 3D definition /*/
    roughness: 0.65,
    metalness: 0.15,
    side: THREE.DoubleSide,
    emissive: 0x000000,
    emissiveIntensity: 0.0
  });

  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a, /*/ Deep slate/navy for dramatic floor contrast /*/
    roughness: 0.25,
    metalness: 0.35,
    emissive: 0x000000,
    emissiveIntensity: 0.0
  });

  /*/ Primary attempt via GitHub CDN with local fallback /*/
  const loadUrl = async (url) => {
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (obj) => resolve(obj),
        (xhr) => {
          if (xhr.lengthComputable && onProgress) {
            onProgress(xhr.loaded / xhr.total);
          }
        },
        (err) => reject(err)
      );
    });
  };

  let obj;
  try {
    /*/ Attempt CDN load /*/
    obj = await loadUrl(CDN_MUSEUM_OBJ_URL);
  } catch (cdnErr) {
    console.warn('[loa_modle] CDN fetch failed, falling back to local asset:', cdnErr);
    /*/ Fallback to local Vite public asset /*/
    obj = await loadUrl(LOCAL_MUSEUM_OBJ_URL);
  }

  /*/ Apply PBR Materials & Smooth Normals /*/
  obj.traverse((child) => {
    if (child.isMesh) {
      if (child.name === 'Body4') {
        child.material = platformMaterial;
      } else {
        child.material = structureMaterial;
      }
      child.castShadow = true;
      child.receiveShadow = true;
      child.geometry.computeVertexNormals();
    }
  });

  /*/ Coordinate System Correction (Fusion 360 +Z Up -> Three.js +Y Up) /*/
  obj.rotation.x = -Math.PI / 2;

  /*/ Normalize Scale & Center Island in Space /*/
  const scale = 0.055;
  obj.scale.set(scale, scale, scale);

  const box = new THREE.Box3().setFromObject(obj);
  const center = box.getCenter(new THREE.Vector3());

  /*/ Center to (0, 0, 0) /*/
  obj.position.x = -center.x;
  obj.position.y = -center.y;
  obj.position.z = -center.z;

  scene.add(obj);

  /*/ Exact Architectural Lighting setup from original experimental museum.js /*/
  const islandLights = new THREE.Group();
  islandLights.name = 'IslandLighting';

  /*/ 1. Balanced ambient fill so shadows and 3D depth are clear /*/
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
  islandLights.add(ambientLight);

  /*/ 2. Hemisphere light (sky blue above, warm floor bounce) /*/
  const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.85);
  hemiLight.position.set(0, 20, 0);
  islandLights.add(hemiLight);

  /*/ 3. Primary sunlight from top-right for realistic architectural shadows /*/
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
  dirLight.position.set(12, 25, 15);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 70;
  dirLight.shadow.camera.left = -30;
  dirLight.shadow.camera.right = 30;
  dirLight.shadow.camera.top = 30;
  dirLight.shadow.camera.bottom = -30;
  dirLight.shadow.bias = -0.0003;
  islandLights.add(dirLight);

  /*/ 4. Secondary soft fill light /*/
  const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.9);
  fillLight.position.set(-15, 20, -15);
  islandLights.add(fillLight);

  /*/ 5. Gallery Overhead Accent Lights (scaled to fit current 0.055 island geometry) /*/
  const s = 0.055 / 0.08; /*/ 0.6875 ratio /*/
  const accentLightDefs = [
    { x: -10 * s, y: 1.4, z: -20 * s, color: 0x38bdf8, intensity: 22 },
    { x: 0 * s,   y: 1.4, z: -20 * s, color: 0xffffff, intensity: 26 },
    { x: 10 * s,  y: 1.4, z: -20 * s, color: 0x818cf8, intensity: 22 },
    { x: 0 * s,   y: 1.4, z: -28 * s, color: 0xbae6fd, intensity: 20 },
    { x: 0 * s,   y: 1.4, z: -12 * s, color: 0xf1f5f9, intensity: 20 },
    { x: 0 * s,   y: 1.2, z: 0 * s,   color: 0xffffff, intensity: 24 },
    { x: 6 * s,   y: 1.2, z: 0 * s,   color: 0xfef9c3, intensity: 20 },
    { x: 0 * s,   y: 1.0, z: 6 * s,   color: 0xfff8ee, intensity: 20 },
    { x: -10 * s, y: 1.0, z: 14 * s,  color: 0xeff6ff, intensity: 20 },
    { x: -10 * s, y: 1.0, z: 22 * s,  color: 0xffedd5, intensity: 20 }
  ];

  const fixtureGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.06, 16);
  const fixtureMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  accentLightDefs.forEach(({ x, y, z, color, intensity }) => {
    const pLight = new THREE.PointLight(color, intensity, 16, 1.2);
    pLight.position.set(x, y, z);
    islandLights.add(pLight);

    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.position.set(x, y, z);
    islandLights.add(fixture);
  });

  /*/ Core Center Pedestal Point Light /*/
  const coreLight = new THREE.PointLight(0x67e8f9, 2.5, 60, 1.2);
  coreLight.position.set(0, 6, 0);
  islandLights.add(coreLight);

  scene.add(islandLights);

  /*/ Interactive Highlight Controller for Museum Island /*/
  let isHighlighted = false;
  obj.userData = {
    isMuseumIsland: true,
    setHighlight: (active) => {
      isHighlighted = !!active;
      if (isHighlighted) {
        structureMaterial.emissive.setHex(0x1e3a5f);
        structureMaterial.emissiveIntensity = 0.45;
        platformMaterial.emissive.setHex(0x0a192f);
        platformMaterial.emissiveIntensity = 0.25;
        coreLight.intensity = 4.2;
      } else {
        structureMaterial.emissive.setHex(0x000000);
        structureMaterial.emissiveIntensity = 0.0;
        platformMaterial.emissive.setHex(0x000000);
        platformMaterial.emissiveIntensity = 0.0;
        coreLight.intensity = 2.5;
      }
    }
  };

  return obj;
}
