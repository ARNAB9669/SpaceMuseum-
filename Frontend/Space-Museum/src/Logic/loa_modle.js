import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

/*/ CDN URL for the Space Museum architectural model /*/
const CDN_MUSEUM_OBJ_URL = 'https://raw.githubusercontent.com/ARNAB9669/SpaceMuseum-/main/Frontend/Space-Museum/public/Space-Mesume.obj';
const LOCAL_MUSEUM_OBJ_URL = '/Space-Mesume.obj';

/*/ Load and setup 3D Space Museum Island /*/
export async function loadMuseumIsland(scene, onProgress) {
  const loader = new OBJLoader();

  /*/ Palette: Cold Cosmic Blue (Outside Orbit View) vs Warm Classical European (Inside Gallery View) /*/
  const coldStructureColor = new THREE.Color(0x384556); /*/ Cold slate tech alloy /*/
  const warmStructureColor = new THREE.Color(0xd2c4b2); /*/ Warm French limestone / Louvre travertine /*/

  const coldPlatformColor = new THREE.Color(0x111827); /*/ Deep cosmic slate navy /*/
  const warmPlatformColor = new THREE.Color(0x241d1a); /*/ Deep warm aged walnut / basalt gallery floor /*/

  /*/ Material Setup for Museum Architecture /*/
  const structureMaterial = new THREE.MeshStandardMaterial({
    color: coldStructureColor.clone(),
    roughness: 0.65,
    metalness: 0.20,
    side: THREE.DoubleSide,
    emissive: 0x000000,
    emissiveIntensity: 0.0
  });

  const platformMaterial = new THREE.MeshStandardMaterial({
    color: coldPlatformColor.clone(),
    roughness: 0.30,
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
  const collidableMeshes = [];
  obj.traverse((child) => {
    if (child.isMesh) {
      if (child.name === 'Body4') {
        child.material = platformMaterial;
      } else {
        child.material = structureMaterial;
        collidableMeshes.push(child);
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

  /*/ Dynamic Architectural Lighting Architecture /*/
  const islandLights = new THREE.Group();
  islandLights.name = 'IslandLighting';

  /*/ 1. Ambient Fill Light /*/
  const coldAmbientColor = new THREE.Color(0x8ecae6);
  const warmAmbientColor = new THREE.Color(0xfff5ea);
  const ambientLight = new THREE.AmbientLight(coldAmbientColor.clone(), 0.85);
  islandLights.add(ambientLight);

  /*/ 2. Hemisphere Light /*/
  const coldHemiSky = new THREE.Color(0xbae6fd);
  const warmHemiSky = new THREE.Color(0xffeedb);
  const coldHemiGround = new THREE.Color(0x1e293b);
  const warmHemiGround = new THREE.Color(0x5c3826);
  const hemiLight = new THREE.HemisphereLight(coldHemiSky.clone(), coldHemiGround.clone(), 0.85);
  hemiLight.position.set(0, 20, 0);
  islandLights.add(hemiLight);

  /*/ 3. Primary Directional Sunlight /*/
  const coldDirColor = new THREE.Color(0xdbeafe);
  const warmDirColor = new THREE.Color(0xffecd1);
  const dirLight = new THREE.DirectionalLight(coldDirColor.clone(), 1.8);
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

  /*/ 4. Secondary Soft Cross-Fill Light /*/
  const coldFillColor = new THREE.Color(0x38bdf8);
  const warmFillColor = new THREE.Color(0xfed7aa);
  const fillLight = new THREE.DirectionalLight(coldFillColor.clone(), 0.9);
  fillLight.position.set(-15, 20, -15);
  islandLights.add(fillLight);

  /*/ 5. Gallery Overhead Accent Lights /*/
  const s = 0.055 / 0.08; /*/ 0.6875 ratio /*/
  const accentLightDefs = [
    { x: -10 * s, y: 1.4, z: -20 * s },
    { x: 0 * s,   y: 1.4, z: -20 * s },
    { x: 10 * s,  y: 1.4, z: -20 * s },
    { x: 0 * s,   y: 1.4, z: -28 * s },
    { x: 0 * s,   y: 1.4, z: -12 * s },
    { x: 0 * s,   y: 1.2, z: 0 * s   },
    { x: 6 * s,   y: 1.2, z: 0 * s   },
    { x: 0 * s,   y: 1.0, z: 6 * s   },
    { x: -10 * s, y: 1.0, z: 14 * s  },
    { x: -10 * s, y: 1.0, z: 22 * s  }
  ];

  const accentColdColors = [
    new THREE.Color(0x38bdf8),
    new THREE.Color(0xffffff),
    new THREE.Color(0x818cf8),
    new THREE.Color(0xbae6fd),
    new THREE.Color(0xf1f5f9),
    new THREE.Color(0xffffff),
    new THREE.Color(0xbae6fd),
    new THREE.Color(0x67e8f9),
    new THREE.Color(0x38bdf8),
    new THREE.Color(0x818cf8)
  ];

  const accentWarmColors = [
    new THREE.Color(0xffedd5),
    new THREE.Color(0xfef3c7),
    new THREE.Color(0xfde68a),
    new THREE.Color(0xffedd5),
    new THREE.Color(0xfef9c3),
    new THREE.Color(0xfff7ed),
    new THREE.Color(0xfef08a),
    new THREE.Color(0xffedd5),
    new THREE.Color(0xfef3c7),
    new THREE.Color(0xffeed5)
  ];

  const coldFixtureColor = new THREE.Color(0x94a3b8);
  const warmFixtureColor = new THREE.Color(0xfef08a);
  const coldFixtureEmissive = new THREE.Color(0x38bdf8);
  const warmFixtureEmissive = new THREE.Color(0xf59e0b);

  const fixtureGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.06, 16);
  const fixtureMat = new THREE.MeshStandardMaterial({
    color: coldFixtureColor.clone(),
    emissive: coldFixtureEmissive.clone(),
    emissiveIntensity: 0.6,
    roughness: 0.3
  });

  const pointLights = [];
  accentLightDefs.forEach(({ x, y, z }, idx) => {
    const pLight = new THREE.PointLight(accentColdColors[idx].clone(), 20, 16, 1.2);
    pLight.position.set(x, y, z);
    islandLights.add(pLight);
    pointLights.push(pLight);

    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.position.set(x, y, z);
    islandLights.add(fixture);
  });

  /*/ 6. Core Rotunda Point Light /*/
  const coldCoreColor = new THREE.Color(0x67e8f9);
  const warmCoreColor = new THREE.Color(0xfde68a);
  const coreLight = new THREE.PointLight(coldCoreColor.clone(), 2.5, 60, 1.2);
  coreLight.position.set(0, 6, 0);
  islandLights.add(coreLight);

  scene.add(islandLights);

  /*/ Dynamic Outside/Inside Transition State & Cinema Darkness /*/
  let currentFactor = 0.0; /*/ 0 = Outside Cold Blue, 1 = Inside Warm Classical /*/
  let currentCinema = 0.0; /*/ 0 = Regular Bright Gallery, 1 = Cinema Blackout /*/
  let isHighlighted = false;

  function applyAtmosphere() {
    /*/ Interpolate Architectural Materials /*/
    structureMaterial.color.lerpColors(coldStructureColor, warmStructureColor, currentFactor);
    structureMaterial.roughness = THREE.MathUtils.lerp(0.65, 0.72, currentFactor);
    structureMaterial.metalness = THREE.MathUtils.lerp(0.20, 0.05, currentFactor);

    platformMaterial.color.lerpColors(coldPlatformColor, warmPlatformColor, currentFactor);
    platformMaterial.roughness = THREE.MathUtils.lerp(0.30, 0.38, currentFactor);
    platformMaterial.metalness = THREE.MathUtils.lerp(0.35, 0.16, currentFactor);

    /*/ Interpolate Core Lights Colors /*/
    ambientLight.color.lerpColors(coldAmbientColor, warmAmbientColor, currentFactor);
    hemiLight.color.lerpColors(coldHemiSky, warmHemiSky, currentFactor);
    hemiLight.groundColor.lerpColors(coldHemiGround, warmHemiGround, currentFactor);
    dirLight.color.lerpColors(coldDirColor, warmDirColor, currentFactor);
    fillLight.color.lerpColors(coldFillColor, warmFillColor, currentFactor);
    coreLight.color.lerpColors(coldCoreColor, warmCoreColor, currentFactor);

    /*/ Base Intensities for Museum Island /*/
    const baseAmbient = THREE.MathUtils.lerp(0.85, 1.05, currentFactor);
    const baseHemi = THREE.MathUtils.lerp(0.85, 0.95, currentFactor);
    const baseDir = THREE.MathUtils.lerp(1.8, 2.2, currentFactor);
    const baseFill = THREE.MathUtils.lerp(0.9, 0.85, currentFactor);
    const baseCore = THREE.MathUtils.lerp(2.5, 3.2, currentFactor);

    /*/ Cinema Dimming: Smoothly dims when seated in a cinema chair (currentCinema: 0.0 -> 1.0) /*/
    ambientLight.intensity = THREE.MathUtils.lerp(baseAmbient, 0.0, currentCinema);
    hemiLight.intensity = THREE.MathUtils.lerp(baseHemi, 0.0, currentCinema);
    dirLight.intensity = THREE.MathUtils.lerp(baseDir, 0.0, currentCinema);
    fillLight.intensity = THREE.MathUtils.lerp(baseFill, 0.0, currentCinema);
    coreLight.intensity = THREE.MathUtils.lerp(baseCore, 0.0, currentCinema);

    pointLights.forEach((pLight, idx) => {
      pLight.color.lerpColors(accentColdColors[idx], accentWarmColors[idx], currentFactor);
      pLight.intensity = THREE.MathUtils.lerp(20.0, 0.0, currentCinema);
    });

    fixtureMat.color.lerpColors(coldFixtureColor, warmFixtureColor, currentFactor);
    fixtureMat.emissive.lerpColors(coldFixtureEmissive, warmFixtureEmissive, currentFactor);
  }

  obj.userData = {
    isMuseumIsland: true,
    collidableMeshes: collidableMeshes,
    setInsideTransition: (factor) => {
      currentFactor = THREE.MathUtils.clamp(factor, 0.0, 1.0);
      applyAtmosphere();
    },

    /*/ Smooth Cinema & Sound-Lock Atmospheric Dark Mode /*/
    setCinemaMode: (cinemaFactor) => {
      currentCinema = THREE.MathUtils.clamp(cinemaFactor, 0.0, 1.0);
      applyAtmosphere();
    },

    setHighlight: (active) => {
      isHighlighted = !!active;
      if (isHighlighted) {
        if (currentFactor < 0.5) {
          /*/ Cold Blue Orbit Glow Pop /*/
          structureMaterial.emissive.setHex(0x1e3a5f);
          structureMaterial.emissiveIntensity = 0.45;
          platformMaterial.emissive.setHex(0x0a192f);
          platformMaterial.emissiveIntensity = 0.25;
          coreLight.intensity = 4.2;
        } else {
          /*/ Warm Amber Gallery Glow Pop /*/
          structureMaterial.emissive.setHex(0x5c3826);
          structureMaterial.emissiveIntensity = 0.35;
          platformMaterial.emissive.setHex(0x3d2010);
          platformMaterial.emissiveIntensity = 0.2;
          coreLight.intensity = 4.8;
        }
      } else {
        structureMaterial.emissive.setHex(0x000000);
        structureMaterial.emissiveIntensity = 0.0;
        platformMaterial.emissive.setHex(0x000000);
        platformMaterial.emissiveIntensity = 0.0;
        applyAtmosphere();
      }
    }
  };

  /*/ Initialize Island in Cold Cosmic Blue state for Orbit View /*/
  obj.userData.setInsideTransition(0.0);
  obj.userData.collidableMeshes = collidableMeshes;

  return obj;
}
