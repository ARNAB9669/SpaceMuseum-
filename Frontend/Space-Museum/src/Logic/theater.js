/*/ ============================================================================
    theater.js — NASA Space Apps Archival Documentary Movie Theatre System
    NASA Space Apps Challenge 2026: "Abandoned but not Forgotten"

    Mounts real YouTube iframe video directly onto the 3D auditorium screen
    using Three.js CSS3DRenderer, creating a true in-world cinema experience.
    Provides a low-profile bottom cinema dock for mission documentary selection
    without obstructing the movie theater view.
    ============================================================================ /*/

import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

/*/ ----------------------------------------------------------------------------
    Curated Archival Mission Documentary Catalog (NASA Space Apps 2026):
    1.  https://youtu.be/gaM1GDUOO9A — NEAR Shoemaker (Landing on Asteroid Eros)
    2.  https://youtu.be/Dv9_P2TsoaU — Dawn Mission (Vesta & Ceres Protoplanets)
    3.  https://youtu.be/_2IjXlKj5kw — Phoenix & InSight (Mars Landers & Marsquakes)
    4.  https://youtu.be/BoI1B4_2XnU — Viking 1 & 2 (First Surface Operations on Mars)
    5.  https://youtu.be/KV8etrzverU — Spirit & Opportunity (15 Years & 45km on Mars)
    6.  https://youtu.be/9RhaBzn8yyQ — Mars Pathfinder & Sojourner (First Mobile Rover)
    7.  https://youtu.be/BGJ3oYD4K-k — ALSEP (Apollo Lunar Surface Experiments)
    8.  https://youtu.be/q3fE2EbRTEw — Apollo Lunar Modules (Monuments in Moondust)
    9.  https://youtu.be/8Zgv1iVY1kc — Surveyor Landers (Precursor Lunar Scouts)
    10. https://youtu.be/-YMSF0f8nTI — Kepler Space Telescope (Hunting Alien Worlds)
    11. https://youtu.be/69FTSCsHybA — Ingenuity Mars Helicopter (First Flight on Mars)
    12. https://youtu.be/3e8GQDRC7-U — Pioneer 10 & 11 (Journey into the Deep Unknown)
    ---------------------------------------------------------------------------- /*/

export const THEATER_STORIES = [
  {
    id: 'KV8etrzverU',
    url: 'https://youtu.be/KV8etrzverU',
    title: 'Spirit & Opportunity',
    subtitle: 'Mars Exploration Rovers • 15 Years on Mars',
    category: 'mars',
    categoryName: 'Mars Surface',
    target: 'MARS • MERIDIANI PLANUM',
    targetColor: '#f97316',
    year: '2003 – 2018',
    description: '45.16 km driven across 5,111 Martian sols. Discovered ancient standing liquid water.'
  },
  {
    id: '69FTSCsHybA',
    url: 'https://youtu.be/69FTSCsHybA',
    title: 'Ingenuity Mars Helicopter',
    subtitle: 'First Powered Flight on Another World',
    category: 'mars',
    categoryName: 'Mars Surface',
    target: 'MARS • JEZERO CRATER',
    targetColor: '#f97316',
    year: '2020 – 2024',
    description: 'Completed 72 aerial flights through razor-thin 1% Martian atmosphere.'
  },
  {
    id: 'q3fE2EbRTEw',
    url: 'https://youtu.be/q3fE2EbRTEw',
    title: 'Apollo Lunar Modules',
    subtitle: 'Monuments in Moondust • Apollo 11–17',
    category: 'moon',
    categoryName: 'Lunar Expeditions',
    target: 'MOON • TRANQUILITY TO TAURUS',
    targetColor: '#0ea5e9',
    year: '1969 – 1972',
    description: 'The descent stages of six Apollo Lunar Modules that remain standing on the Moon.'
  },
  {
    id: 'gaM1GDUOO9A',
    url: 'https://youtu.be/gaM1GDUOO9A',
    title: 'NEAR Shoemaker',
    subtitle: 'First Landing on Asteroid 433 Eros',
    category: 'asteroid',
    categoryName: 'Asteroids & Ceres',
    target: 'ASTEROID 433 EROS',
    targetColor: '#a855f7',
    year: '1996 – 2001',
    description: 'The first robotic probe to orbit and touch down on a near-Earth asteroid.'
  },
  {
    id: 'Dv9_P2TsoaU',
    url: 'https://youtu.be/Dv9_P2TsoaU',
    title: 'NASA Dawn Mission',
    subtitle: 'Vesta & Ceres • Asteroid Belt Explorer',
    category: 'asteroid',
    categoryName: 'Asteroids & Ceres',
    target: 'VESTA & CERES',
    targetColor: '#38bdf8',
    year: '2007 – 2018',
    description: 'Powered by ion thrusters, Dawn orbited both giant protoplanet Vesta and dwarf planet Ceres.'
  },
  {
    id: '_2IjXlKj5kw',
    url: 'https://youtu.be/_2IjXlKj5kw',
    title: 'Phoenix & InSight',
    subtitle: 'Mars Landers • Listening to Marsquakes',
    category: 'mars',
    categoryName: 'Mars Surface',
    target: 'MARS • NORTH POLAR & ELYSIUM',
    targetColor: '#f97316',
    year: '2007 – 2022',
    description: 'Verified subsurface ice near the north pole and recorded 1,300+ marsquakes.'
  },
  {
    id: 'BoI1B4_2XnU',
    url: 'https://youtu.be/BoI1B4_2XnU',
    title: 'Viking 1 & 2',
    subtitle: 'First Successful Surface Operations on Mars',
    category: 'mars',
    categoryName: 'Mars Surface',
    target: 'MARS • CHRYSE & UTOPIA',
    targetColor: '#f97316',
    year: '1975 – 1982',
    description: 'Transmitted humanity’s first color panoramas from the red surface and analyzed soil.'
  },
  {
    id: '9RhaBzn8yyQ',
    url: 'https://youtu.be/9RhaBzn8yyQ',
    title: 'Mars Pathfinder & Sojourner',
    subtitle: 'NASA’s First Mobile Rover on Mars',
    category: 'mars',
    categoryName: 'Mars Surface',
    target: 'MARS • ARES VALLIS',
    targetColor: '#f97316',
    year: '1996 – 1997',
    description: 'The pioneer micro-rover that proved mobile wheeled robotics were possible on Mars.'
  },
  {
    id: 'BGJ3oYD4K-k',
    url: 'https://youtu.be/BGJ3oYD4K-k',
    title: 'ALSEP Lunar Experiments',
    subtitle: 'Apollo Lunar Surface Experiments Package',
    category: 'moon',
    categoryName: 'Lunar Expeditions',
    target: 'MOON • APOLLO SITES',
    targetColor: '#0ea5e9',
    year: '1969 – 1977',
    description: 'Nuclear-powered science packages deployed by astronauts, measuring moonquakes for 8 years.'
  },
  {
    id: '8Zgv1iVY1kc',
    url: 'https://youtu.be/8Zgv1iVY1kc',
    title: 'Surveyor Landers',
    subtitle: 'Moon Explorers • Precursors to Apollo',
    category: 'moon',
    categoryName: 'Lunar Expeditions',
    target: 'MOON • OCEAN OF STORMS',
    targetColor: '#0ea5e9',
    year: '1966 – 1968',
    description: 'Robotic scouts that proved lunar regolith could support a human spacecraft landing.'
  },
  {
    id: '-YMSF0f8nTI',
    url: 'https://youtu.be/-YMSF0f8nTI',
    title: 'Kepler Space Telescope',
    subtitle: 'Hunting Alien Worlds • Exoplanet Pioneer',
    category: 'deepspace',
    categoryName: 'Deep Space',
    target: 'CYGNUS & LYRA CONSTELLATIONS',
    targetColor: '#eab308',
    year: '2009 – 2018',
    description: 'Discovered over 2,600 confirmed alien worlds orbiting other stars in our galaxy.'
  },
  {
    id: '3e8GQDRC7-U',
    url: 'https://youtu.be/3e8GQDRC7-U',
    title: 'Pioneer 10 & 11',
    subtitle: 'Journey into the Deep Unknown',
    category: 'deepspace',
    categoryName: 'Deep Space',
    target: 'JUPITER, SATURN & DEEP VOID',
    targetColor: '#eab308',
    year: '1972 – 2003',
    description: 'First probes past Asteroid Belt to Jupiter and Saturn, carrying the Golden Plaques.'
  }
];

export class TheaterManager {
  constructor(theatreRoom = null, fpController = null, camera = null) {
    this.theatre = theatreRoom;
    this.fpController = fpController;
    this.camera = camera;

    this.currentStory = null;
    this.isPlaying = false;
    this.isSeated = false;
    this.activeFilter = 'all';
    this.isDockOpen = true;

    /*/ CSS3D Subsystem /*/
    this.cssRenderer = null;
    this.cssScene = null;
    this.cssScreenObject = null;
    this.screenDomElement = null;
    this.iframeElement = null;

    /*/ UI Elements /*/
    this.dockEl = null;

    this.initStyles();
    this.initCSS3DRenderer();
    this.initScreenDOM();
    this.initCinemaDock();
    this.bindEvents();
  }

  /*/ Inject Sleek Theater & Cinema Dock Styles /*/
  initStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('theater-cinema-screen-styles')) return;

    const style = document.createElement('style');
    style.id = 'theater-cinema-screen-styles';
    style.textContent = `
      /*/ 3D Screen HTML Container (Rendered by CSS3DRenderer on the physical auditorium wall) /*/
      .theater-3d-screen-container {
        width: 1920px;
        height: 1034px;
        background: #020617;
        position: relative;
        overflow: hidden;
        border-radius: 6px;
        box-shadow: 0 0 40px rgba(56, 189, 248, 0.45);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        user-select: none;
      }

      .theater-3d-screen-container iframe {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
        background: #000;
      }

      /*/ High-Tech NASA Standby Screen when No Video is Playing /*/
      .theater-screen-standby {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 48px 60px;
        box-sizing: border-box;
        background: radial-gradient(circle at 50% 45%, #081226 0%, #030712 85%);
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }

      .theater-standby-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 2px solid rgba(56, 189, 248, 0.3);
        padding-bottom: 20px;
      }

      .theater-standby-logo {
        font-size: 24px;
        font-weight: 800;
        letter-spacing: 2px;
        color: #38bdf8;
      }

      .theater-standby-badge {
        background: rgba(56, 189, 248, 0.15);
        border: 1px solid rgba(56, 189, 248, 0.5);
        color: #7dd3fc;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 1px;
      }

      .theater-standby-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 16px;
      }

      .theater-standby-hero-title {
        font-size: 56px;
        font-weight: 900;
        letter-spacing: 1px;
        color: #ffffff;
        text-shadow: 0 0 30px rgba(56, 189, 248, 0.6);
        margin: 0;
      }

      .theater-standby-hero-sub {
        font-size: 24px;
        color: #94a3b8;
        max-width: 900px;
        margin: 0;
        line-height: 1.4;
      }

      .theater-standby-pulse-cta {
        margin-top: 18px;
        display: inline-flex;
        align-items: center;
        gap: 12px;
        background: rgba(249, 115, 22, 0.2);
        border: 1px solid rgba(249, 115, 22, 0.6);
        color: #fdba74;
        padding: 12px 28px;
        border-radius: 30px;
        font-size: 18px;
        font-weight: 700;
        animation: theaterPulseCta 2s infinite;
      }

      @keyframes theaterPulseCta {
        0%, 100% { box-shadow: 0 0 10px rgba(249, 115, 22, 0.4); transform: scale(1); }
        50% { box-shadow: 0 0 25px rgba(249, 115, 22, 0.8); transform: scale(1.02); }
      }

      .theater-standby-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 16px;
        color: #64748b;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding-top: 18px;
      }

      /*/ --- Sleek Floating Cinema Dock at the Bottom of the Viewport --- /*/
      #cinema-mission-dock {
        position: fixed;
        bottom: 22px;
        left: 50%;
        transform: translateX(-50%);
        width: 92vw;
        max-width: 1280px;
        background: rgba(8, 14, 28, 0.88);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(56, 189, 248, 0.35);
        border-radius: 20px;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.2);
        padding: 14px 20px;
        z-index: 85;
        display: none;
        flex-direction: column;
        gap: 10px;
        transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        user-select: none;
      }

      #cinema-mission-dock.dock-minimized {
        transform: translateX(-50%) translateY(calc(100% + 30px));
        opacity: 0;
        pointer-events: none;
      }

      /*/ Minimized Floating Toggle Pill /*/
      #cinema-dock-minipill {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.92);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(56, 189, 248, 0.5);
        border-radius: 30px;
        padding: 8px 22px;
        color: #f8fafc;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.5px;
        z-index: 86;
        display: none;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 189, 248, 0.35);
        transition: all 0.25s ease;
      }

      #cinema-dock-minipill:hover {
        background: #0284c7;
        border-color: #38bdf8;
        box-shadow: 0 8px 35px rgba(2, 132, 199, 0.6);
        transform: translateX(-50%) translateY(-2px);
      }

      /*/ Dock Top Header & Category Filters /*/
      .dock-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .dock-title-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .dock-title-badge {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1px;
        color: #f97316;
        text-transform: uppercase;
      }

      .dock-title-text {
        font-size: 14px;
        font-weight: 700;
        color: #f8fafc;
      }

      .dock-filter-pills {
        display: flex;
        align-items: center;
        gap: 6px;
        overflow-x: auto;
      }

      .dock-pill {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #94a3b8;
        padding: 4px 12px;
        border-radius: 14px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .dock-pill:hover {
        background: rgba(56, 189, 248, 0.2);
        color: #ffffff;
      }

      .dock-pill.active {
        background: #0284c7;
        border-color: #38bdf8;
        color: #ffffff;
        box-shadow: 0 0 12px rgba(2, 132, 199, 0.5);
      }

      .dock-btn-close {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #94a3b8;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .dock-btn-close:hover {
        background: rgba(239, 68, 68, 0.25);
        color: #fca5a5;
        border-color: #ef4444;
      }

      /*/ Horizontal Film Strip /*/
      .dock-film-strip {
        display: flex;
        align-items: center;
        gap: 12px;
        overflow-x: auto;
        padding: 4px 2px 8px;
        scrollbar-width: thin;
        scrollbar-color: rgba(56, 189, 248, 0.4) transparent;
      }

      .dock-film-strip::-webkit-scrollbar {
        height: 6px;
      }

      .dock-film-strip::-webkit-scrollbar-thumb {
        background: rgba(56, 189, 248, 0.35);
        border-radius: 3px;
      }

      .dock-card {
        flex: 0 0 210px;
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
      }

      .dock-card:hover {
        transform: translateY(-4px) scale(1.03);
        border-color: #38bdf8;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8), 0 0 16px rgba(56, 189, 248, 0.35);
        background: rgba(30, 41, 59, 0.95);
      }

      .dock-card.active-film {
        border-color: #10b981;
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
      }

      .dock-card-thumb {
        position: relative;
        width: 100%;
        height: 118px;
        background: #000;
        overflow: hidden;
      }

      .dock-card-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .dock-card:hover .dock-card-thumb img {
        transform: scale(1.08);
      }

      .dock-card-target-badge {
        position: absolute;
        top: 6px;
        left: 6px;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.5px;
        color: #ffffff;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid currentColor;
        backdrop-filter: blur(4px);
      }

      .dock-card-play-btn {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(2, 6, 23, 0.4);
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .dock-card:hover .dock-card-play-btn {
        opacity: 1;
      }

      .dock-card-play-icon {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #38bdf8;
        color: #070b14;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 16px rgba(56, 189, 248, 0.8);
      }

      .dock-card-meta {
        padding: 8px 10px 10px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .dock-card-title {
        font-size: 12px;
        font-weight: 700;
        color: #f8fafc;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .dock-card-sub {
        font-size: 10px;
        color: #38bdf8;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `;
    document.head.appendChild(style);
  }

  /*/ Initialize Three.js CSS3DRenderer for in-world screen projection /*/
  initCSS3DRenderer() {
    if (typeof document === 'undefined') return;

    this.cssRenderer = new CSS3DRenderer();
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight);

    const dom = this.cssRenderer.domElement;
    dom.id = 'css3d-theatre-root';
    dom.style.position = 'absolute';
    dom.style.top = '0';
    dom.style.left = '0';
    dom.style.width = '100%';
    dom.style.height = '100%';
    dom.style.pointerEvents = 'none';
    dom.style.zIndex = '10'; /*/ Sits on top of WebGL canvas /*/

    const app = document.getElementById('app') || document.body;
    app.appendChild(dom);

    this.cssScene = new THREE.Scene();

    window.addEventListener('resize', () => {
      if (this.cssRenderer) {
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
      }
    });
  }

  /*/ Build the In-World Screen Container & attach to ScreenGroup in 3D /*/
  initScreenDOM() {
    if (typeof document === 'undefined') return;

    const screenContainer = document.createElement('div');
    screenContainer.className = 'theater-3d-screen-container';
    screenContainer.id = 'theater-3d-screen-container';

    /*/ Initial Standby Screen Content /*/
    screenContainer.innerHTML = this.getStandbyScreenHTML();
    this.screenDomElement = screenContainer;

    /*/ Wrap into a CSS3DObject /*/
    this.cssScreenObject = new CSS3DObject(screenContainer);

    /*/
      Dimensions calibration:
      3D Screen Mesh = 3.90m wide by 2.10m high.
      DOM container = 1920px wide by 1034px high.
      Scale: 3.90 / 1920 = 0.00203125 (exact 1:1 match in 3D space).
    /*/
    const scaleFactor = 3.90 / 1920;
    this.cssScreenObject.scale.set(scaleFactor, scaleFactor, 1);

    /*/ Position slightly in front (+0.025m) of the 3D plane mesh /*/
    this.cssScreenObject.position.set(0, 0, 0.025);

    /*/ Hidden by default until visitor sits in cinema chair /*/
    this.cssScreenObject.visible = false;

    /*/ Attach to theatre.screenGroup if ready, or to cssScene /*/
    if (this.theatre?.screenGroup) {
      this.theatre.screenGroup.add(this.cssScreenObject);
    } else {
      this.cssScene.add(this.cssScreenObject);
    }
  }

  /*/ HTML template for Standby Cinema Screen /*/
  getStandbyScreenHTML() {
    return `
      <div class="theater-screen-standby">
        <div class="theater-standby-top">
          <div class="theater-standby-logo">NASA SPACE APPS • DOCUMENTARY THEATRE</div>
          <div class="theater-standby-badge">4K LASER PROJECTION</div>
        </div>
        <div class="theater-standby-center">
          <h1 class="theater-standby-hero-title">ABANDONED BUT NOT FORGOTTEN</h1>
          <p class="theater-standby-hero-sub">
            Archival cinematic documentary series chronicling humanity’s courageous robotic explorers,
            lunar monuments, and interstellar emissaries.
          </p>
          <div class="theater-standby-pulse-cta">
            <span>🎬</span>
            <span>Select a film from the dock below to begin screening</span>
          </div>
        </div>
        <div class="theater-standby-bottom">
          <span>SURROUND SOUND DOLBY ATMOS • ARCHIVAL TELEMETRY</span>
          <span>12 HISTORICAL MISSIONS AVAILABLE</span>
        </div>
      </div>
    `;
  }

  /*/ Build the Sleek Bottom Mission Selection Dock /*/
  initCinemaDock() {
    if (typeof document === 'undefined') return;

    /*/ 1. Minimized Toggle Pill /*/
    const miniPill = document.createElement('div');
    miniPill.id = 'cinema-dock-minipill';
    miniPill.innerHTML = `
      <span>🎬</span>
      <span id="cinema-minipill-label">Change Mission Film (12)</span>
      <span style="font-size: 11px; opacity: 0.7;">[M]</span>
    `;
    miniPill.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openDock();
    });
    document.body.appendChild(miniPill);
    this.miniPillEl = miniPill;

    /*/ 2. Full Bottom Dock /*/
    const dock = document.createElement('div');
    dock.id = 'cinema-mission-dock';
    dock.innerHTML = `
      <div class="dock-header-row">
        <div class="dock-title-group">
          <span class="dock-title-badge">AUDITORIUM PROGRAM</span>
          <span class="dock-title-text">Select Archival Mission Film to Screen on Wall</span>
        </div>
        <div class="dock-filter-pills">
          <button class="dock-pill active" data-filter="all">All (12)</button>
          <button class="dock-pill" data-filter="mars">🔴 Mars (5)</button>
          <button class="dock-pill" data-filter="moon">🌕 Moon (3)</button>
          <button class="dock-pill" data-filter="asteroid">☄️ Asteroids (2)</button>
          <button class="dock-pill" data-filter="deepspace">🌌 Deep Space (2)</button>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button id="btn-dock-minimize" class="dock-btn-close">Hide Menu [M]</button>
          <button id="btn-dock-stand" class="dock-btn-close" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border-color: rgba(239, 68, 68, 0.5);">Stand Up [E]</button>
        </div>
      </div>
      <div class="dock-film-strip" id="dock-film-strip"></div>
    `;
    document.body.appendChild(dock);
    this.dockEl = dock;

    this.renderDockCards('all');
  }

  /*/ Render Cards in the Horizontal Film Strip /*/
  renderDockCards(filter = 'all') {
    const strip = this.dockEl?.querySelector('#dock-film-strip');
    if (!strip) return;
    strip.innerHTML = '';

    const list = filter === 'all'
      ? THEATER_STORIES
      : THEATER_STORIES.filter((s) => s.category === filter);

    list.forEach((story) => {
      const card = document.createElement('div');
      card.className = `dock-card ${this.currentStory?.id === story.id ? 'active-film' : ''}`;
      card.setAttribute('data-id', story.id);

      /*/ Crisp 16:9 YouTube Thumbnail /*/
      const thumbUrl = `https://img.youtube.com/vi/${story.id}/mqdefault.jpg`;

      card.innerHTML = `
        <div class="dock-card-thumb">
          <img src="${thumbUrl}" alt="${story.title}" loading="lazy" />
          <div class="dock-card-target-badge" style="color: ${story.targetColor}; border-color: ${story.targetColor};">
            ${story.target.split('•')[0].trim()}
          </div>
          <div class="dock-card-play-btn">
            <div class="dock-card-play-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
        <div class="dock-card-meta">
          <div class="dock-card-title">${story.title}</div>
          <div class="dock-card-sub">${story.year} • ${story.categoryName}</div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        e.stopPropagation();
        this.playStoryOnScreen(story.id);
      });

      strip.appendChild(card);
    });
  }

  /*/ Bind Interactive Events /*/
  bindEvents() {
    /*/ Filter Pills /*/
    const pills = this.dockEl?.querySelectorAll('.dock-pill');
    if (pills) {
      pills.forEach((pill) => {
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          pills.forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');
          const cat = pill.getAttribute('data-filter') || 'all';
          this.activeFilter = cat;
          this.renderDockCards(cat);
        });
      });
    }

    /*/ Minimize / Hide Button /*/
    const minBtn = this.dockEl?.querySelector('#btn-dock-minimize');
    if (minBtn) {
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.minimizeDock();
      });
    }

    /*/ Stand Up Button in Dock /*/
    const standBtn = this.dockEl?.querySelector('#btn-dock-stand');
    if (standBtn) {
      standBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.theatre?.standUp) {
          this.theatre.standUp();
        }
      });
    }

    /*/ Keyboard Shortcuts while Seated /*/
    window.addEventListener('keydown', (e) => {
      if (!this.isSeated) return;

      if (e.code === 'KeyM' && !e.repeat) {
        if (this.isDockOpen) {
          this.minimizeDock();
        } else {
          this.openDock();
        }
      }
    });
  }

  /*/ Open the Cinema Mission Selection Dock /*/
  openDock() {
    if (!this.dockEl) return;
    this.isDockOpen = true;
    this.dockEl.style.display = 'flex';
    this.dockEl.classList.remove('dock-minimized');
    if (this.miniPillEl) this.miniPillEl.style.display = 'none';
  }

  /*/ Minimize the Dock into a small Floating Pill /*/
  minimizeDock() {
    if (!this.dockEl) return;
    this.isDockOpen = false;
    this.dockEl.classList.add('dock-minimized');
    setTimeout(() => {
      if (!this.isDockOpen && this.dockEl) {
        this.dockEl.style.display = 'none';
      }
    }, 350);

    if (this.miniPillEl && this.isSeated) {
      this.miniPillEl.style.display = 'flex';
    }
  }

  /*/ Mount and Play Selected Documentary directly ON THE 3D AUDITORIUM SCREEN /*/
  playStoryOnScreen(storyId) {
    const story = THEATER_STORIES.find((s) => s.id === storyId) || THEATER_STORIES[0];
    this.currentStory = story;
    this.isPlaying = true;

    if (!this.screenDomElement) return;

    /*/ Mount YouTube Embed Iframe into the 3D screen container /*/
    this.screenDomElement.innerHTML = `
      <iframe
        id="theater-3d-youtube-iframe"
        src="https://www.youtube-nocookie.com/embed/${story.id}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&controls=1"
        title="${story.title}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen>
      </iframe>
    `;

    /*/ Make iframe interactive to user mouse events when seated /*/
    const iframe = this.screenDomElement.querySelector('iframe');
    if (iframe) {
      iframe.style.pointerEvents = 'auto';
    }

    /*/ Auto-minimize dock so viewer enjoys clear, unobstructed view of the 3D screen /*/
    this.minimizeDock();

    /*/ Update Minipill Label /*/
    const pillLabel = document.getElementById('cinema-minipill-label');
    if (pillLabel) {
      pillLabel.textContent = `Screening: ${story.title} • [M] Change`;
    }

    /*/ Highlight active card in dock /*/
    this.renderDockCards(this.activeFilter);

    if (this.fpController?.showNotification) {
      this.fpController.showNotification(`🎬 Screening on Auditorium Wall: ${story.title}`);
    }
  }

  /*/ Triggered when Visitor Sits Down in any Cinema Chair /*/
  onSeated(seat) {
    this.isSeated = true;

    /*/ Show in-world 3D screen /*/
    if (this.cssScreenObject) {
      this.cssScreenObject.visible = true;
    }

    /*/ Ensure CSS3D screen object is attached to screenGroup /*/
    if (this.theatre?.screenGroup && this.cssScreenObject && this.cssScreenObject.parent !== this.theatre.screenGroup) {
      this.theatre.screenGroup.add(this.cssScreenObject);
    }

    /*/ If no film is playing, open the selection dock; if already playing, keep minipill ready /*/
    if (!this.isPlaying || !this.currentStory) {
      this.openDock();
    } else {
      this.minimizeDock();
    }
  }

  /*/ Triggered when Visitor Stands Up from Cinema Chair /*/
  onStandUp() {
    this.isSeated = false;
    this.isPlaying = false;
    this.currentStory = null;

    /*/ Hide in-world 3D screen so WebGL canvas texture takes over seamlessly /*/
    if (this.cssScreenObject) {
      this.cssScreenObject.visible = false;
    }

    if (this.dockEl) {
      this.dockEl.style.display = 'none';
      this.dockEl.classList.add('dock-minimized');
    }

    if (this.miniPillEl) {
      this.miniPillEl.style.display = 'none';
    }

    /*/ Reset 3D screen to Standby mode and unmount iframe to silence audio immediately /*/
    if (this.screenDomElement) {
      this.screenDomElement.innerHTML = this.getStandbyScreenHTML();
    }
  }

  /*/ Per-Frame Render Sync for CSS3DRenderer /*/
  update(delta) {
    if (!this.cssRenderer || !this.camera) return;

    /*/ Render the CSS3D scene using the active Three.js camera /*/
    const sceneToRender = this.theatre?.scene || this.cssScene;
    if (sceneToRender) {
      this.cssRenderer.render(sceneToRender, this.camera);
    }
  }
}
