/*/ Import styles and dependencies /*/
import './Ui/style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SpaceEnvironment, Biodome } from './Ui/dome.js';
import { loadMuseumIsland } from './Logic/loa_modle.js';
import { IntroSequence } from './Logic/intro.js';
import { FirstPersonController } from './Logic/AI/ME/nevigation.js';
import { DirectionArrows } from './Ui/dirrection-arrow.js';
import { FloorMapSelector } from './Logic/map-selector.js';
import { WelcomeSign, OuterWallPoster } from './Ui/posters.js';

/*/ Canvas & Rendering Setup /*/
const canvas = document.getElementById('webgl-canvas');
const dockPrompt = document.getElementById('dock-prompt');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#010106');

/*/ Camera Setup (Perspective Camera with 0.05m Near Plane for Immersive First-Person Scale) /*/
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.05,
  3000
);
camera.position.set(120, 160, 240);

/*/ WebGL Renderer /*/
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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

/*/ AAA Game Intro & Cutscene Controller /*/
const intro = new IntroSequence(camera, controls);

/*/ First-Person POV Controller (Perspective Camera) /*/
const fpController = new FirstPersonController(camera, canvas, controls);

/*/ Approach Road Infrastructure: Direction Chevrons /*/
const directionArrows = new DirectionArrows(scene);

/*/ Interactive Floor Map & Landing Point Selector /*/
const mapSelector = new FloorMapSelector(scene, camera, controls, fpController, () => museumIslandModel);

/*/ Wall Paintings, Signs & Surface Artworks /*/
const welcomeSign = new WelcomeSign(scene);
const outerWallPoster = new OuterWallPoster(scene);

/*/ Museum Island 3D Model Reference /*/
let museumIslandModel = null;
loadMuseumIsland(scene)
  .then((obj) => {
    museumIslandModel = obj;
  })
  .catch((err) => {
    console.error('[main] Failed to load Space Museum Island:', err);
  });

/*/ Raycasting for Hover Highlight & Selection (High-Performance Proxy) /*/
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHovered = false;
let raycastPending = false;

/*/ Track Mouse Position for Raycasting with Frame Throttling /*/
function onPointerMove(event) {
  /*/ Pass to Floor Map Selector if active /*/
  if (mapSelector.isActive) {
    mapSelector.handlePointerMove(event);
    return;
  }

  /*/ Only raycast when in Orbit Mode (not while in First Person or during landing) /*/
  if (fpController.isFirstPerson || fpController.isLanding || fpController.isAscending) {
    if (isHovered) {
      isHovered = false;
      canvas.style.cursor = 'default';
      biodome.setHighlight(false);
      if (museumIslandModel?.userData?.setHighlight) {
        museumIslandModel.userData.setHighlight(false);
      }
      if (dockPrompt) dockPrompt.classList.remove('visible');
    }
    return;
  }

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (raycastPending) return;
  raycastPending = true;

  requestAnimationFrame(() => {
    raycastPending = false;
    raycaster.setFromCamera(mouse, camera);

    /*/ Raycast against the enclosing biodome canopy (instant 0.001ms test) /*/
    const interactiveTargets = biodome.getRaycastMeshes();
    const intersects = raycaster.intersectObjects(interactiveTargets, false);
    const nowHovered = intersects.length > 0;

    if (nowHovered !== isHovered) {
      isHovered = nowHovered;
      canvas.style.cursor = isHovered ? 'pointer' : 'default';

      /*/ Highlight & Pop Dome and Island /*/
      biodome.setHighlight(isHovered);
      if (museumIslandModel?.userData?.setHighlight) {
        museumIslandModel.userData.setHighlight(isHovered);
      }

      /*/ Show / Hide Selection Docking Prompt /*/
      if (dockPrompt) {
        if (isHovered) {
          dockPrompt.classList.add('visible');
        } else {
          dockPrompt.classList.remove('visible');
        }
      }
    }
  });
}
window.addEventListener('pointermove', onPointerMove);

/*/ Click to Land Inside Museum in First-Person POV /*/
function onCanvasClick(event) {
  /*/ Handle Floor Map Selection if active /*/
  if (mapSelector.isActive) {
    const handled = mapSelector.handleClick(event);
    if (handled) return;
  }

  if (isHovered && !fpController.isFirstPerson && !fpController.isLanding && !fpController.isAscending) {
    /*/ Clear hover highlights /*/
    isHovered = false;
    canvas.style.cursor = 'default';
    biodome.setHighlight(false);
    if (museumIslandModel?.userData?.setHighlight) {
      museumIslandModel.userData.setHighlight(false);
    }
    if (dockPrompt) dockPrompt.classList.remove('visible');

    /*/ Execute cinematic landing into first person POV /*/
    fpController.landInside();
  }
}
canvas.addEventListener('click', onCanvasClick);

/*/ Window Resize Handler /*/
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
}
window.addEventListener('resize', onWindowResize);

/*/ Dynamic Atmospheric Transition: Cold Blue Outside in Space <-> Warm European Inside Museum /*/
let currentAtmosphereFactor = 0.0;

/*/ Main Render & Animation Loop /*/
function animate(timestamp) {
  requestAnimationFrame(animate);

  /*/ Update Timer & High-Precision Delta /*/
  timer.update(timestamp);
  const delta = timer.getDelta();

  /*/ Update Intro Cutscene, Controls, First Person & Biodome /*/
  intro.update(delta);

  if (fpController.isFirstPerson) {
    fpController.update(delta);
  } else if (!fpController.isLanding && !fpController.isAscending) {
    controls.update();
  }

  /*/ Smoothly blend between Cold Cosmic Blue (Orbit) and Warm Classical European (Inside) /*/
  const isInside = fpController.isFirstPerson || fpController.isLanding;
  const targetTransition = isInside ? 1.0 : 0.0;
  const transitionSpeed = fpController.isLanding ? 1.1 : 2.2;
  currentAtmosphereFactor += (targetTransition - currentAtmosphereFactor) * Math.min(1.0, delta * transitionSpeed);

  if (museumIslandModel?.userData?.setInsideTransition) {
    museumIslandModel.userData.setInsideTransition(currentAtmosphereFactor);
  }
  biodome.setInsideTransition(currentAtmosphereFactor);
  directionArrows.setInsideTransition(currentAtmosphereFactor);

  spaceEnv.update(delta);
  biodome.update(delta);
  directionArrows.update(delta);
  mapSelector.update(delta);
  welcomeSign.update(delta);
  outerWallPoster.update(delta);

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
