import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

/*/ CDN URL for the Space Museum architectural model /*/
const CDN_MUSEUM_OBJ_URL = 'https://raw.githubusercontent.com/ARNAB9669/SpaceMuseum-/main/Frontend/Space-Museum/public/Space-Mesume.obj';
const LOCAL_MUSEUM_OBJ_URL = '/Space-Mesume.obj';

/*/ Load and setup 3D Space Museum Island /*/
export async function loadMuseumIsland(scene, onProgress) {
  const loader = new OBJLoader();

  /*/ Material Setup for Museum Architecture /*/
  const structureMaterial = new THREE.MeshStandardMaterial({
    color: 0x333b4f,
    roughness: 0.5,
    metalness: 0.4,
    flatShading: false
  });

  const platformMaterial = new THREE.MeshStandardMaterial({
    color: 0x1e2538,
    roughness: 0.7,
    metalness: 0.2
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

  /*/ Add Key Architectural Lighting for the Island /*/
  const islandLights = new THREE.Group();
  islandLights.name = 'IslandLighting';

  /*/ Main Sun / Starlight /*/
  const sunLight = new THREE.DirectionalLight(0xfff6e5, 1.8);
  sunLight.position.set(60, 90, 50);
  islandLights.add(sunLight);

  /*/ Blue Atmospheric Bounce Light from Nebula /*/
  const bounceLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
  bounceLight.position.set(-60, -40, -40);
  islandLights.add(bounceLight);

  /*/ Core Center Pedestal Point Light /*/
  const coreLight = new THREE.PointLight(0x67e8f9, 2.5, 80, 1.2);
  coreLight.position.set(0, 8, 0);
  islandLights.add(coreLight);

  scene.add(islandLights);

  return obj;
}
