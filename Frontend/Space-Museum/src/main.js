/*/ Import styles and dependencies /*/
import './Ui/style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SpaceEnvironment, Biodome } from './Ui/dome.js';
import { loadMuseumIsland } from './Logic/loa_modle.js';

/*/ Canvas & Rendering Setup /*/
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#010106');

/*/ Camera Setup /*/
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  3000
);
camera.position.set(0, 35, 75);

/*/ WebGL Renderer /*/
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

/*/ Interactive Orbit Controls /*/
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.6;
controls.zoomSpeed = 0.8;
controls.minDistance = 8;
controls.maxDistance = 350;
controls.target.set(0, 2, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.2;

/*/ Initialize Procedural Deep Space Environment /*/
const spaceEnv = new SpaceEnvironment(scene);

/*/ Precision High-Performance Core Timer /*/
const timer = new THREE.Timer();

/*/ Transparent White Biodome Covering Museum Island /*/
const biodome = new Biodome(scene);

/*/ Load 3D Museum Island from CDN /*/
loadMuseumIsland(scene).catch((err) => {
  console.error('[main] Failed to load Space Museum Island:', err);
});

/*/ Window Resize Handler /*/
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}
window.addEventListener('resize', onWindowResize);

/*/ Main Render & Animation Loop /*/
function animate(timestamp) {
  requestAnimationFrame(animate);

  /*/ Update Timer & High-Precision Delta /*/
  timer.update(timestamp);
  const delta = timer.getDelta();

  /*/ Update Controls, Cosmic Drift & Biodome Grid /*/
  controls.update();
  spaceEnv.update(delta);
  biodome.update(delta);

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
