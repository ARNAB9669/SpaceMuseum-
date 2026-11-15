/*/ Import styles and dependencies /*/
import './Ui/style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SpaceEnvironment, Biodome } from './Ui/dome.js';
import { loadMuseumIsland } from './Logic/loa_modle.js';
import { IntroSequence } from './Logic/intro.js';
import { FirstPersonController } from './Logic/AI/ME/nevigation.js';
import { DirectionArrows } from './Ui/dirrection-arrow.js';
import { RoadLights } from './Ui/road-light.js';
import { FloorMapSelector } from './Logic/map-selector.js';
import { WelcomeSign, OuterWallPoster, EntranceCorridorPoster, Apollo15Poster, Apollo12Poster, Surveyor3Poster, SojournerRoverPoster, SpiritOpportunityPoster, VikingLanderPoster, InsightLanderPoster, DawnMissionPoster, NearShoemakerPoster, PioneerPoster, IngenuityHelicopterPoster, KeplerK2Poster } from './Ui/posters.js';
import { TheatreRoom } from './Ui/theatre.js';
import { ExhibitionPlatforms } from './Ui/exhibition-platforms.js';

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

/*/ Intelligent Adaptive DPR: Tablets & Mobile capped at 1.0; Desktop capped at 1.25 for 60 FPS /*/
const isMobileOrTablet = (typeof navigator !== 'undefined') && (
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (window.innerWidth <= 1024 && ('ontouchstart' in window || navigator.maxTouchPoints > 0))
);
const optimalDPR = isMobileOrTablet ? 1.0 : Math.min(window.devicePixelRatio, 1.25);

/*/ WebGL Renderer /*/
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: !isMobileOrTablet, /*/ Fast hardware anti-aliasing on desktop; native subpixel rendering on tablets /*/
  powerPreference: 'high-performance'
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(optimalDPR);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

/*/ Interactive Orbit Controls /*/
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.rotateSpeed = 0.6;
controls.enableZoom = false; /*/ Mouse scroll zoom disabled as requested /*/
controls.target.set(0, 2, 0);
controls.autoRotate = true;
controls.autoRotateSpeed = 0.2;

/*/ Prevent default page scroll on canvas wheel event /*/
canvas.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });

/*/ Initialize Procedural Deep Space Environment /*/
const spaceEnv = new SpaceEnvironment(scene);

/*/ Precision High-Performance Core Clock & Timer (Decoupled from screen refresh rate) /*/
const timer = new THREE.Timer();
timer.connect(document);

/*/ Transparent White Biodome Covering Museum Island /*/
const biodome = new Biodome(scene);

/*/ AAA Game Intro & Cutscene Controller /*/
const intro = new IntroSequence(camera, controls);

/*/ First-Person POV Controller (Perspective Camera) /*/
const fpController = new FirstPersonController(camera, canvas, controls);

/*/ Approach Road Infrastructure: Direction Chevrons & Road Luminaires /*/
const directionArrows = new DirectionArrows(scene);
const roadLights = new RoadLights(scene);

/*/ Interactive Floor Map & Landing Point Selector /*/
const mapSelector = new FloorMapSelector(scene, camera, controls, fpController, () => museumIslandModel);

/*/ Wall Paintings, Signs & Surface Artworks /*/
const welcomeSign = new WelcomeSign(scene);
const outerWallPoster = new OuterWallPoster(scene);
const corridorPoster = new EntranceCorridorPoster(scene);
const apollo15Poster = new Apollo15Poster(scene);
const apollo12Poster = new Apollo12Poster(scene);
const surveyor3Poster = new Surveyor3Poster(scene);
const sojournerRoverPoster = new SojournerRoverPoster(scene);
const spiritOpportunityPoster = new SpiritOpportunityPoster(scene);
const vikingLanderPoster = new VikingLanderPoster(scene);
const insightLanderPoster = new InsightLanderPoster(scene);
const dawnMissionPoster = new DawnMissionPoster(scene);
const nearShoemakerPoster = new NearShoemakerPoster(scene);
const pioneerPoster = new PioneerPoster(scene);
const ingenuityHelicopterPoster = new IngenuityHelicopterPoster(scene);
const keplerK2Poster = new KeplerK2Poster(scene);

/*/ Central Open-Air Courtyard: 13 Rover Exhibition Platforms /*/
const exhibitionPlatforms = new ExhibitionPlatforms(scene);
fpController.addCollidableMeshes(exhibitionPlatforms.collidableMeshes);

/*/ NASA Space Apps Documentary Movie Theatre /*/
const theatre = new TheatreRoom(scene, camera, fpController);
fpController.theatre = theatre;

/*/ UI Interactive Elements /*/
const interactPrompt = document.getElementById('interact-prompt');
const btnCinemaStand = document.getElementById('btn-cinema-stand');

if (btnCinemaStand) {
  btnCinemaStand.addEventListener('click', (e) => {
    e.stopPropagation();
    if (theatre.currentSeatedSeat) {
      theatre.standUp();
    }
  });
}

/*/ Museum Island 3D Model Reference /*/
let museumIslandModel = null;
loadMuseumIsland(scene)
  .then((obj) => {
    museumIslandModel = obj;
    if (obj.userData?.collidableMeshes) {
      fpController.setCollidableMeshes(obj.userData.collidableMeshes);
    }
    if (theatre.getCollidableMeshes) {
      fpController.addCollidableMeshes(theatre.getCollidableMeshes());
    }
    if (roadLights.getCollidableMeshes) {
      fpController.addCollidableMeshes(roadLights.getCollidableMeshes());
    }
    if (roadLights.snapToGround) {
      roadLights.snapToGround(obj);
    }
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

/*/ Click to Land Inside Museum in First-Person POV or Select Cinema Seat /*/
function onCanvasClick(event) {
  /*/ Handle Floor Map Selection if active /*/
  if (mapSelector.isActive) {
    const handled = mapSelector.handleClick(event);
    if (handled) return;
  }

  /*/ Direct Raycast Selection for Theatre Seats /*/
  const seatMeshes = theatre.getSeatMeshes();
  if (seatMeshes.length > 0) {
    const clickRay = new THREE.Raycaster();
    const clickMouse = (document.pointerLockElement === canvas)
      ? new THREE.Vector2(0, 0)
      : new THREE.Vector2(
          (event.clientX / window.innerWidth) * 2 - 1,
          -(event.clientY / window.innerHeight) * 2 + 1
        );
    clickRay.setFromCamera(clickMouse, camera);
    const seatHits = clickRay.intersectObjects(seatMeshes, true);
    if (seatHits.length > 0) {
      const clickedSeat = seatHits[0].object.userData.seatData;
      if (clickedSeat) {
        if (fpController.isFirstPerson) {
          theatre.sitInSeat(clickedSeat);
        } else {
          fpController.landInside(() => {
            theatre.sitInSeat(clickedSeat);
          });
        }
        return;
      }
    }
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
  renderer.setPixelRatio(isMobileOrTablet ? 1.0 : Math.min(window.devicePixelRatio, 1.25));
}
window.addEventListener('resize', onWindowResize);

/*/ Dynamic Atmospheric Transition: Cold Blue Outside in Space <-> Warm European Inside Museum /*/
let currentAtmosphereFactor = 0.0;
let currentCinemaDarkFactor = 0.0;

/*/ Main Render & Animation Loop: Polled from Clock via THREE.Timer /*/
function animate(timestamp) {
  requestAnimationFrame(animate);

  /*/ Poll Clock via THREE.Timer for Real-World Elapsed Time Delta (Decoupled from Screen Frame Rate) /*/
  timer.update(timestamp);
  const delta = Math.min(timer.getDelta(), 0.1);

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
  roadLights.setInsideTransition(currentAtmosphereFactor);

  /*/ Dynamic Cinema Dark Mode: Only activates when seated in a theatre chair (Matching Experiments Prototype) /*/
  const targetCinemaDark = (fpController.isFirstPerson && fpController.isSeated) ? 1.0 : 0.0;
  currentCinemaDarkFactor += (targetCinemaDark - currentCinemaDarkFactor) * Math.min(1.0, delta * 3.0);

  if (museumIslandModel?.userData?.setCinemaMode) {
    museumIslandModel.userData.setCinemaMode(currentCinemaDarkFactor);
  }
  roadLights.setCinemaMode(currentCinemaDarkFactor);

  spaceEnv.update(delta);
  biodome.update(delta);
  directionArrows.update(delta);
  roadLights.update(delta);
  mapSelector.update(delta);
  welcomeSign.update(delta);
  outerWallPoster.update(delta);
  corridorPoster.update(delta);
  apollo15Poster.update(delta);
  apollo12Poster.update(delta);
  surveyor3Poster.update(delta);
  sojournerRoverPoster.update(delta);
  spiritOpportunityPoster.update(delta);
  vikingLanderPoster.update(delta);
  insightLanderPoster.update(delta);
  dawnMissionPoster.update(delta);
  nearShoemakerPoster.update(delta);
  pioneerPoster.update(delta);
  ingenuityHelicopterPoster.update(delta);
  keplerK2Poster.update(delta);
  exhibitionPlatforms.update(delta);
  theatre.update(delta);

  /*/ Check proximity to cinema seats when in First-Person POV /*/
  if (fpController.isFirstPerson && !fpController.isLanding && !fpController.isAscending) {
    if (fpController.isSeated) {
      if (interactPrompt) interactPrompt.classList.add('hidden');
    } else {
      const nearbySeat = theatre.checkSeatProximity(camera.position);
      if (nearbySeat) {
        if (interactPrompt) {
          interactPrompt.classList.remove('hidden');
          const promptKey = interactPrompt.querySelector('.prompt-key');
          const promptText = interactPrompt.querySelector('.prompt-text');
          if (promptKey) {
            promptKey.textContent = fpController.gamepad?.isConnected ? 'X' : 'E';
          }
          if (promptText) {
            promptText.textContent = `Sit in Seat (${nearbySeat.name})`;
          }
        }
      } else {
        if (interactPrompt) interactPrompt.classList.add('hidden');
      }
    }
  } else {
    if (interactPrompt) interactPrompt.classList.add('hidden');
  }

  renderer.render(scene, camera);
}

requestAnimationFrame(animate);
