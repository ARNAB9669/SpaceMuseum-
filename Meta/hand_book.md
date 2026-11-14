

### Log : 1
**Title**: Monorepo Architecture & Git Isolation  
**Description**: Established a clean monorepo architecture separating `Frontend/Space-Museum/`, `Backend/`, and `Meta/` to ensure full compliance with the NASA Space Apps Challenge submission guidelines. Initialized a clean Git repository on branch `main` and created the development branch `work-here`. Configured `.gitignore` to safeguard proprietary architecture notes (`Meta/stuff.md`) while tracking public code and 3D assets.

---

### Log : 2
**Title**: Procedural Deep Space Environment (`src/Ui/dome.js`)  
**Description**: Built a high-performance, procedural 360° deep space celestial environment in Three.js without relying on heavy external static skybox textures:
- **Multi-tiered Starfield**: 8,000 background stars distributed spherically via Fibonacci sphere sampling, plus 180 prominent focal stars categorized by real astronomical spectral types (O/B blue `#9bb0ff`, A white `#f8f9ff`, F/G warm white `#fff4e8`, K golden `#ffd2a1`, and M red giant `#ff8866`).
- **Dynamic In-Memory Textures**: Generated soft circular alpha textures for stars and volumetric gas puffs using dynamic HTML5 Canvas radial gradients, guaranteeing zero network asset latency.
- **Volumetric Cosmic Nebulae**: Layered additive sprites (`THREE.AdditiveBlending`) with multi-spectrum interstellar dust colors (indigo, cyan, deep violet, teal, and magenta).
- **Distant Celestial Horizon**: Crescent planet body positioned in the deep background with a soft atmospheric halo.
- **Cosmic Drift**: Subtle rotation applied to the star sphere and nebula group in each render frame.

---

### Log : 3
**Title**: Timer Engine Migration to `THREE.Timer`  
**Issue**: Legacy `THREE.Clock` can suffer from frame rate accumulation issues, time drift, and large delta spikes when browser tabs are throttled or restored from background sleep.  
**Fix**: Migrated `src/main.js` to use core `THREE.Timer` (`new THREE.Timer()`). In the `requestAnimationFrame` loop, timestamps are passed to `timer.update(timestamp)` and precision deltas are retrieved via `timer.getDelta()`.  
**Note for future**: Always use `THREE.Timer` instead of `THREE.Clock` in modern Three.js projects for stable animation deltas and fixed-timestep physics.

---

---

### Log : 4
**Title**: 3D Museum Island Loading via CDN & Geometry Calibration  
**Description**: Implemented `src/Logic/loa_modle.js` to load the custom Autodesk Fusion 360 architectural island (`Space-Mesume.obj`) into the deep space scene:
- **CDN Primary with Local Fallback**: Wired the loader to stream the 9.5MB geometry directly from the GitHub CDN (`https://raw.githubusercontent.com/.../Space-Mesume.obj`) with automatic fallback to local `public/` assets.
- **Axis Re-orientation**: Fixed CAD-to-WebGL axis convention mismatch by rotating $-90^\circ$ around the $X$-axis (`obj.rotation.x = -Math.PI / 2`), transforming Fusion 360's vertical $+Z$ coordinate into Three.js's vertical $+Y$ coordinate.
- **Centering & Bounding Box**: Scaled by factor $0.055$ and automatically translated using `THREE.Box3` to center the floating museum island perfectly at $(0, 0, 0)$.
- **PBR Material & Illumination**: Replaced default unlit mesh surfaces with textured `MeshStandardMaterial` (PBR roughness, metalness, and vertex normal recomputation), complemented by sun directional lighting, blue nebula bounce light, and a core rotunda point light.

---

### Log : 5
**Title**: White Transparent Biodome / Firmament Canopy (`src/Ui/dome.js`)  
**Description**: Designed and engineered a transparent hemispherical glass canopy enclosing the floating circular museum island, inspired by classic "firmament" biodome architecture:
- **Geometry & Calibration**: Constructed an upper-hemisphere geometry (`SphereGeometry`) with a base radius of $42.25\text{m}$ anchored at the island floor level ($Y = -2.42\text{m}$). Scaled $Y$ by $0.62$ to form a sleek semi-ellipsoid dome that clears the central museum tower.
- **Physical Glass Shading**: Utilized `MeshPhysicalMaterial` configured for optical transparency (`roughness: 0.08`, `transmission: 0.85`, `ior: 1.45`, `opacity: 0.32`, `DoubleSide`, `depthWrite: false`) allowing starlight and cosmic nebulae to refract realistically through the dome.
- **Geodesic Lattice Ribs**: Embedded a subtle rotating geodesic wireframe overlay (`LineSegments` with additive starlight sheen) providing structural panel definition across the canopy surface.
- **Perimeter Seal Ring**: Anchored the dome to the disc using an emissive neon cyan/white torus ring (`TorusGeometry`) sealing the atmospheric boundary of the island station.

---

### Log : 6
**Title**: AAA Cinematic Game Intro & Cutscene Swoop (`src/Logic/intro.js`)  
**Description**: Implemented a full-scale AAA gaming intro sequence and orbital docking cutscene on website load:
- **Telemetry Preloader Overlay**: Futuristic frosted glass HUD displaying real-time telemetry calibration (coordinates, sol count, biodome status) and simulated sensor calibration progress bar ($0\% \to 100\%$).
- **Synthesized Web Audio SFX**: Generated high-fidelity cinematic sound effects natively via the Web Audio API without relying on external audio assets (sub-bass frequency drop from $65\text{Hz} \to 32\text{Hz}$, cybernetic resonance ping, and filtered decompression noise).
- **Cinematic Camera Flight**: Built a smooth Bezier flight path starting from high orbital perspective $(120, 160, 240)$ curving past the transparent firmament biodome down to establishing museum view $(0, 35, 75)$ using quintic ease-out deceleration ($1 - (1-t)^{3.5}$).
- **Widescreen Letterboxing & Controls Handover**: Displayed 8vh cinematic black letterbox bars during flight, fading seamlessly into the primary HUD and unlocking interactive `OrbitControls` upon arrival. Included `[ESC] Skip Intro` functionality.


---

### Log : 7
**Title**: Intro Simplification — Auto-Play, No Overlay, No Button  
**Issue**: Previous intro showed a full-screen frosted-glass overlay with telemetry terminal, progress bar, and "INITIALIZE DOCKING SEQUENCE" button that required user interaction before they could see the 3D scene. Users would leave before clicking.  
**Fix**: Stripped the entire overlay from `src/Logic/intro.js` and purged all dead CSS classes from `src/Ui/style.css`. Camera swoop now starts immediately on page load — no overlay, no button, no terminal box, no letterbox bars. 3D background (space environment + dome + island) is always visible from frame 0. `[ESC]` still skips the swoop and hands off to OrbitControls. HUD fades in after swoop completes. `style.css` reduced from 619 lines → 86 lines (removed: `.intro-overlay`, `.intro-card`, `.intro-badge`, `.intro-badge-pulse`, `.intro-title`, `.intro-tagline`, `.intro-telemetry`, `.telemetry-row`, `.telemetry-label`, `.telemetry-val`, `.intro-progress-container`, `.intro-progress-track`, `.intro-progress-fill`, `.intro-progress-status`, `.btn-launch-sequence`, `.cinematic-bar`, `.btn-intro-skip`). Build verified ✓ in 1.45s.  
**Note for future**: Intro state is intentionally stateless — if a future feature requires a "Press any key to start" gating screen (e.g. for a multiplayer lobby), re-add it as a separate `src/Ui/LandingGate.js` component, NOT inside `intro.js` which owns camera choreography only.


---

### Log : 8
**Title**: Station Hover Highlight, Selection Pop & First-Person POV Landing Navigation  
**Description**: Implemented interactive selection and seamless transition from orbital perspective to first-person POV interior exploration:
- **Station Hover Raycasting & Visual Pop**: Raycaster actively tracks cursor over the transparent firmament biodome (`glassMesh`, `baseRing`) and museum architecture. When hovered, the station triggers an interactive "pop" and highlight:
  - Biodome smoothly scales up by $+3.5\%$ with spring damping.
  - Base perimeter ring surges in cyan emissive luminosity ($0.6 \to 2.1$).
  - Geodesic grid lattice lines brighten ($0.12 \to 0.57$) in neon starlight cyan (`#38bdf8`).
  - Glass canopy and museum architecture take on an illuminated starlight sheen, with core pedestal light brightening ($2.5 \to 4.2$).
  - Sleek HUD status pill appears: `STATION TARGETED • CLICK TO LAND & ENTER` with animated pulse indicator. Cursor switches to `pointer`.
- **Cinematic Atmospheric Landing Cutscene**: Clicking the selected station triggers an orbital descent:
  - Synthesized Web Audio SFX generates an atmospheric pass-through sweep ($95\text{Hz} \to 34\text{Hz}$ sub-bass glide, airlock white-noise decompression, and hermetic seal tone).
  - Quintic ease-in-out Bezier flight path curves from orbital position down through the canopy to museum courtyard entry `(0, -0.15, -13)` at exact human eye level ($1.72\text{m}$ above the $Y = -1.87$ floor).
- **First-Person POV Controller (`src/Logic/AI/ME/nevigation.js`)**:
  - Uses the existing `THREE.PerspectiveCamera` for seamless visual fidelity.
  - **Look Controls**: Supports Pointer Lock (`canvas.requestPointerLock()`) on click with smooth mouse drag fallback. Vertical pitch clamped to $\pm 80^\circ$ to prevent gimbal inversion.
  - **Movement Physics**: Smooth horizontal vector locomotion along player facing direction with `WASD` / arrow keys, `Shift` sprint multiplier ($6.2\text{m/s} \to 11.0\text{m/s}$), momentum damping ($9.0$), and subtle rhythmic head-bobbing.
  - **Perimeter Safety**: Island radial boundary clamp ($R \le 38.0\text{m}$) prevents walking off the floating museum disc into outer space.
  - **Return to Orbit**: `[ESC]` key or clicking `ORBIT VIEW` in the HUD gracefully ascends the perspective camera back to orbital vantage `(0, 35, 75)` and hands control back to `OrbitControls`.


---

### Log : 9
**Title**: Approach Road Drop Point, 50% Wall Eye Height Calibration & Runway Lights with Guidance Arch  
**Description**: Refined the First-Person POV landing location and perspective scaling, and built airport-style approach road infrastructure guiding visitors directly into the museum:
- **50% Wall Eye Height Calibration (`src/Logic/AI/ME/nevigation.js`)**:
  - Measured architectural model geometry: Museum floor is at $Y = -1.87$, wall coping is at $Y = 0.33$, giving an absolute wall height of $2.20\text{m}$.
  - Re-calibrated player eye level to exactly $50\%$ of the wall height: $Y_{\text{eye}} = -1.87 + (0.5 \times 2.20) = -0.77\text{m}$.
  - The museum wall now stands $1.10\text{m}$ above eye level and $1.10\text{m}$ below, giving a realistic, towering architectural presence without towering over the viewer.
- **Road Drop Point**:
  - Moved the landing drop point to the beginning of the curved approach road at $(-6.2, -0.77, -22.0)$ facing forward along the runway toward the building entrance at $(-6.2, -0.77, -2.0)$.
- **Runway Pathway Lights (`src/Ui/road-light.js`)**:
  - Installed a series of 14 futuristic sci-fi bollards along both the left curb ($X = -10.8$) and right curb ($X = -1.6$) from $Z = -24.0$ to $Z = +12.0$.
  - Each bollard features a dark titanium base, an illuminated cyan LED emitter ring (`#38bdf8`), an additive ground decal ring, and alternating point lights casting pools of starlight onto the pavement.
  - Added a sequential wave pulse animation (`Math.sin(pulseTime - offset)`) flowing down the runway toward the building.
- **Overhead Guidance Gantry & Entrance Sign (`src/Ui/banner.js`)**:
  - Spanned a titanium archway gantry across the road at $Z = -2.0$ ($9.2\text{m}$ span, $3.8\text{m}$ height).
  - Suspended a double-sided illuminated holographic sign: `NASA SPACE MUSEUM // MAIN EXHIBITION ENTRANCE // LUNAR & MARTIAN RELIC GALLERIES // WALK INSIDE TO EXPLORE`.
  - Added downward spotlights illuminating the portal.
- **Holographic Direction Chevrons (`src/Ui/dirrection-arrow.js`)**:
  - Projected animated cyan chevron arrows onto the asphalt along the center of the road ($X = -6.2$) with sequential forward-running light flow.


---

### Log : 10
**Title**: Comprehensive Performance & FPS Optimization  
**Issue**: Severe frame drops and lag occurred in first-person mode and when navigating the station.  
**Fix**: Diagnosed and resolved 5 critical bottlenecks:
1. **Removed Swarm of 16 Dynamic PointLights**: Replaced individual point lights along the road and banners with a single zero-overhead `HemisphereLight(0xe2e8f0, 0x1e293b, 2.0)` and self-luminous emissive materials (`MeshBasicMaterial` ground decals and `#38bdf8` LED rings). This eliminated 16 light attenuation loop passes over 44,594 vertices per frame.
2. **Eliminated Full-Screen Transmission Pass**: The dome's `MeshPhysicalMaterial` with `transmission: 0.85` previously forced a secondary off-screen render target copy of the entire scene every frame. Switched to high-efficiency `MeshStandardMaterial` (`opacity: 0.22, roughness: 0.1, metalness: 0.15`), providing crystal-clear transparency with zero render target overhead.
3. **Throttled Raycasting on PointerMove**: Replaced the deep recursive traversal of all 44k island triangles on every mousemove with a fast proxy raycast against `biodome.getRaycastMeshes()` (1 sphere test, 0.001ms), throttled via `requestAnimationFrame`.
4. **Disabled Unused Shadow Maps**: Turned off `renderer.shadowMap.enabled = false` to eliminate redundant shadow map passes in deep space.
5. **Capped Viewport Pixel Ratio**: Clamped device pixel ratio to `1.5` to prevent 2x/3x Retina resolution fragment shader bottlenecks.  
**Note for future**: In WebGL with large architectural models (40k+ vertices), prefer `HemisphereLight` and emissive shaders over multiple dynamic `PointLight`s to guarantee a sustained 60-120 FPS.


---

### Log : 11
**Title**: Road Platform Drop Point Realignment & Approach Corridor Relocation  
**Issue**: When clicking the dome, the camera was landing on the rear/backside of the island ($Z = -22$), facing away from the actual entrance with the tower and entrance banner misplaced behind the viewer.  
**Fix**: Analyzed the 3D model geometry to pinpoint `Body4` ($X \in [-9.5, 17.7]$, $Z \in [6.9, 32.5]$), which is the intended front road platform and entrance apron.
1. **Drop Point Coordinates (`src/Logic/AI/ME/nevigation.js`)**: Moved the landing target from $(-6.2, -0.77, -22.0)$ to $(4.0, -0.77, 28.0)$, looking along $-Z$ towards $(4.0, -0.77, 8.0)$. The camera now drops directly onto the front road platform, facing forward into the museum entrance with the central tower and exhibition rooms directly ahead.
2. **Guidance Arch Relocation (`src/Ui/banner.js`)**: Shifted the titanium archway and illuminated double-sided banner from the rear ($Z = -2.0$) to the front entrance threshold at $Z = 21.0$, spanning across $X \in [-2.5, 10.5]$ (span $13.0\text{m}$, height $4.2\text{m}$).
3. **Runway Lights Alignment (`src/Ui/road-light.js`)**: Realigned the 14 runway bollards along the road platform curbs ($X = -2.2$ left, $X = 10.2$ right) from $Z = 30.0$ to $Z = 6.0$.
4. **Direction Chevrons Alignment (`src/Ui/dirrection-arrow.js`)**: Repositioned holographic animated floor chevrons along the central axis ($X = 4.0$) pointing into the entrance doors.  
**Note for future**: In `Space-Mesume.obj`, `Body4` represents the front approach platform and entrance apron ($+Z$ quadrant), while the central tower is located at $X \approx 7.1, Z \approx 9.9$. Any future exhibits or entryway elements should orient towards $+Z$ when facing visitors.


---

### Log : 12
**Title**: Lighting Calibration & Port from Experimental Build  
**Description**: Ported the exact architectural lighting, materials, and camera aura lighting from the original experimental build (`/Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/src/`):
- **Core Atmospheric Lighting (`src/Logic/loa_modle.js`)**:
  - `AmbientLight(0xffffff, 0.95)`: Balanced pure white ambient fill ensuring clear visibility and eliminates pitch-black shadows across all chambers and roadways.
  - `HemisphereLight(0xbae6fd, 0x1e293b, 0.85)` at `(0, 20, 0)`: Sky-blue celestial tint from above with warm ground reflection below.
  - `DirectionalLight(0xffffff, 1.8)` at `(12, 25, 15)`: Primary architectural sunlight with calibrated shadow camera (`near: 0.5, far: 70, left/right: ±30, top/bottom: ±30, bias: -0.0003`, 2048x2048 map).
  - `DirectionalLight(0xdbeafe, 0.9)` at `(-15, 20, -15)`: Soft cross-fill light preventing stark contrast clipping.
- **Overhead Chamber & Corridor Accent Lights**:
  - Re-introduced the 10 overhead ceiling lights with their visual sleek LED cylinder fixtures (`CylinderGeometry(0.24, 0.28, 0.06, 16)`) across all exhibition halls, central atrium, and connecting galleries.
- **First-Person Camera Aura Light (`src/Logic/AI/ME/nevigation.js`)**:
  - Attached `PointLight(0xffffff, 1.8, 12, 1.5)` to the player camera (from `player.js`), ensuring smooth, natural eye-level illumination wherever the visitor walks.
- **Architectural Materials Restored**:
  - Walls: `0x475569` (rich slate concrete gray, roughness 0.65, metalness 0.15, double-sided).
  - Floor platform: `0x0f172a` (deep slate/navy, roughness 0.25, metalness 0.35).
- **Renderer Settings**:
  - `PCFSoftShadowMap` re-enabled with `ACESFilmicToneMapping` at exposure `1.15`.


---

### Log : 13
**Title**: Roadway Bollard Lights Removal  
**Description**: Removed the small pathway runway bollard lights and their circular ground projection decals along the road platform per user request, creating a clean, unobstructed walking surface leading into the museum entrance archway.


---

### Log : 14
**Title**: Developer Drone Flight Mode  
**Description**: Implemented a 3D drone / free-flight mode for first-person POV to allow surveying the entire museum architecture, chambers, and road layout from above during development:
- **Flight Toggle**: Pressing `[G]` or clicking the on-screen `[G] FLIGHT: OFF/ACTIVE` button toggles developer flight mode on and off.
- **Altitude Controls**: `[SPACE]` smoothly ascends up into the air; `[C]` smoothly descends.
- **Unconstrained 3D Motion**: In flight mode, movement speed increases ($16.0\text{m/s}$ normal, $32.0\text{m/s}$ with `[SHIFT]` sprint) and camera altitude can fly freely up to $Y = 26.0\text{m}$ (under the biodome apex) across a full $41\text{m}$ radius.
- **Seamless Ground Re-entry**: Toggling flight mode off smoothly brings the camera back down to human eye level ($Y = -0.77\text{m}$) and restores physical ground walking.


---

### Log : 15
**Title**: Entrance Banner Removal & Exact Experimental Flight Mode Port  
**Description**: Fully ported the flight movement system from the original reference implementation (`/Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/src/player.js`) and removed the central entrance banner gantry per user request:
- **Middle Banner Archway Removed**:
  - Removed `GuidanceBanner` from [main.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/main.js) and converted [banner.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/Ui/banner.js) to a clean stub.
  - Cleared the physical gantry archway and sign from the middle entrance of the road platform.
- **Exact Experimental Flight Mode Port (`src/Logic/AI/ME/nevigation.js`)**:
  - **3D Look-Direction Flight**: Replaced horizontal-only movement with `camera.getWorldDirection(forward)`. Looking up or down and pressing `[W]` now directly soars or dives in true 3D space.
  - **Dynamic Elevation & Strafe**: `[SPACE]` ascends vertically (`flyUp`), `[C]` descends vertically (`flyDown`), `[A]/[D]` strafe horizontally via cross-product with world up.
  - **Aero Deceleration**: Added the exact `0.82` aerodynamic glide decay from `player.js` for instant responsiveness without laggy inertia dampening.
  - **Speeds & Boost**: Standard flight speed calibrated to $12.0\text{m/s}$ and sprint boost (`[SHIFT]`) to $26.0\text{m/s}$.
  - **Flight Ceiling & Radius**: Increased ceiling to $Y = 65.0\text{m}$ and radius to $55\text{m}$, allowing wide overhead panoramic views of the entire museum and biodome.
  - **Toast Notifications**: Integrated `#gamepad-badge` notification toast with cyan theme displaying flight activation and landing alerts.

