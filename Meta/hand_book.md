

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


---

### Log : 16
**Title**: Classical European Museum Warm Lighting & Limestone Wall Transformation  
**Description**: Transformed the museum from cold, sterile blue/slate tones to a warm, prestigious classical European gallery aesthetic (inspired by grand European institutions like the Louvre, Vatican galleries, and classical travertine museum wings):
- **Warm Limestone Architectural Walls (`src/Logic/loa_modle.js`)**:
  - Replaced cold slate gray (`0x475569`) with warm French limestone / Roman travertine gallery stone (`0xd2c4b2`, roughness 0.72, metalness 0.05).
- **Aged Gallery Hardwood / Basalt Floor**:
  - Replaced dark navy platform (`0x0f172a`) with deep warm aged walnut / basalt gallery floor (`0x241d1a`, roughness 0.38, metalness 0.16).
- **Warm Architectural Gallery Illumination**:
  - **Ambient Light**: Warm gallery soft ambient fill (`0xfff5ea`, intensity 1.05).
  - **Hemisphere Light**: Golden daylight from upper skylight (`0xffeedb`) with warm terracotta / polished hardwood bounce from below (`0x5c3826`, intensity 0.95).
  - **Primary Directional Sun**: Warm 3000K afternoon sunlight (`0xffecd1`, intensity 2.2).
  - **Cross-Fill Light**: Warm amber / champagne soft fill (`0xfed7aa`, intensity 0.85).
  - **Overhead Chamber Downlights**: Warm halogen / incandescent exhibition spotlights (`0xffedd5`, `0xfef3c7`, `0xfde68a`, `0xfef08a`) with warm glowing brass ceiling fixtures (`0xfef08a`, emissive `0xf59e0b`).
  - **Core Rotunda Light**: Warm golden amber lantern (`0xfde68a`, intensity 3.2).
- **Player Camera Aura Light (`src/Logic/AI/ME/nevigation.js`)**:
  - Calibrated player camera illumination to a warm incandescent gallery lantern glow (`0xffedd5`, intensity 2.0).
- **Wayfinding & Canopy Accents**:
  - Floor chevrons in [dirrection-arrow.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/Ui/dirrection-arrow.js) updated to warm brass floor inlays (`#f59e0b`, glow `#fbbf24`).
  - Biodome foundation rim ring in [dome.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/Ui/dome.js) styled with warm champagne gold (`0xfef3c7`, emissive `0xf59e0b`).


---

### Log : 17
**Title**: Dynamic Adaptive Environment: Cold Sci-Fi Blue Exterior vs Warm European Interior  
**Description**: Implemented a dynamic atmospheric color & lighting interpolation system that adapts automatically based on whether the viewer is outside in deep space orbit or walking/flying inside the biodome:
- **Outside Orbit View (Cold Cosmic Blue)**:
  - While surveying the station from deep space, the station retains its sleek, cold sci-fi aesthetic: cold slate alloy walls (`0x384556`), cosmic navy floor platform (`0x111827`), cool starlight ambient (`0x8ecae6`), crisp blue directional light (`0xdbeafe`), electric cyan biodome foundation ring (`0x38bdf8`), and holographic cyan chevrons.
- **Cinematic Atmospheric Transition**:
  - In [main.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/main.js), `currentAtmosphereFactor` dynamically interpolates between `0.0` (Orbit) and `1.0` (Inside) at delta-scaled transition speeds.
  - As the landing sequence descends through the biodome canopy, the cold cosmic blue smoothly melts into warm golden gallery tones over the 2.8s descent curve.
- **Inside Interior View (Warm Classical European Gallery)**:
  - Inside First-Person POV and drone flight mode, all materials and lights transition into rich warm European museum tones: French limestone / Roman travertine walls (`0xd2c4b2`), aged walnut floor (`0x241d1a`), warm 3000K afternoon sunlight (`0xffecd1`), golden daylight hemisphere fill (`0xffeedb` / `0x5c3826`), warm amber exhibition spotlights, and warm brass wayfinding inlays.
- **Reversible Orbit Return**:
  - Pressing `[ESC]` smoothly reverses the transition, returning the station to the cold blue exterior as the camera ascends back out to orbit.


---

### Log : 18
**Title**: Interactive Floor Map & Precision Landing Spot Calibrator  
**Description**: Implemented an architectural top-down Floor Map and real-time 3D coordinate calibration tool so the user can visually select and copy exact landing coordinates:
- **Floor Map & Landing Selector Mode ([map-selector.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/Logic/map-selector.js))**:
  - **Top-Down Architectural View**: Clicking `[🗺️ FLOOR MAP & LANDING SELECTOR]` or pressing `[M]` smoothly glides the camera directly overhead ($Y = 54.0\text{m}$) overlooking the full floor plan of all exhibition rooms, galleries, and approach road platforms.
  - **Real-Time Floor Reticle**: Moving the mouse over any floor or road platform displays a holographic cursor ring and tooltip with live $(X, Z)$ coordinates.
  - **Interactive Landing Marker**: Clicking anywhere on the floor drops a 3D animated beacon (concentric pulsing target rings, vertical laser pillar, and spinning diamond).
  - **Coordinate Panel & Actions**:
    - Displays exact coordinates: $X, Y, Z$ (with calibrated human eye height $+1.1\text{m}$ above the clicked surface).
    - **`[📋 COPY COORDINATES]`**: Copies formatted coordinates directly to clipboard to easily share with the AI agent.
    - **`[🚀 TEST LAND HERE]`**: Triggers the cinematic landing descent directly onto the selected coordinate so the user can verify the view in first-person immediately.
- **First-Person & Flight Mode Live Coordinates ([nevigation.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/Logic/AI/ME/nevigation.js))**:
  - Added real-time coordinate badge `POS: X: ... | Y: ... | Z: ...` to the first-person HUD.
  - Clicking this badge copies the player's live position directly to clipboard.
- **Custom Landing Target Integration**:
  - `landInside` now accepts custom coordinates and saves selected points as the default landing destination when clicking the biodome.


---

### Log : 19
**Title**: Precision Calibration to User-Selected Landing Coordinates  
**Description**: Locked in the exact landing point and camera look angle chosen and confirmed by the user via the live HUD coordinate badge (`POS: X: 15.04 | Y: -0.77 | Z: 10.41`):
- **Exact Landing Coordinates ([nevigation.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/Logic/AI/ME/nevigation.js))**:
  - `targetPos`: Updated default landing point to $(15.04, -0.77, 10.41)$.
  - `targetLook`: Calibrated look direction to $(12.0, -0.77, 24.0)$, orienting the visitor to look straight ahead down the curving road platform toward the museum entrance with the limestone building wall on the right side.
  - `midPos`: Calibrated trajectory waypoint to $(0.4 \times \text{start}.x + 0.6 \times 15.04, \text{apex } 22.0\text{m}, 0.4 \times \text{start}.z + 0.6 \times 10.41)$ for a smooth parabolic landing swoop through the dome canopy.
- **Directional Chevrons Realigned ([dirrection-arrow.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/Ui/dirrection-arrow.js))**:
  - Re-mapped all 6 holographic floor chevrons along the exact road curve starting right in front of the touchdown point:
    - $(14.8, 13.5) \rightarrow (14.0, 17.5) \rightarrow (12.5, 21.5) \rightarrow (10.2, 25.0) \rightarrow (6.8, 27.5) \rightarrow (3.0, 28.0)$.
  - Each chevron dynamically rotates along the road tangent curve, guiding visitors smoothly into the museum.


---

### Log : 20
**Title**: Approach Road Direction Chevrons Tangent Orientation Fix  
**Description**: Fixed the orientation and progression of all pathway guidance chevrons along the L-shaped road platform:
- **Root Cause of Broken Arrows**:
  - The chevron geometry base plane is rotated $-90^\circ$ around $X$, placing the apex along the local $-Z$ axis.
  - The previous rotation formula used $\text{atan2}(dx, dz)$ rather than $\text{atan2}(-dx, -dz)$, causing all chevrons to be flipped $180^\circ$ backwards and sideways.
  - The terminal chevron also had an inverted constant rotation ($-90^\circ$ instead of $+90^\circ$).
- **Calculated Tangent Alignment ([dirrection-arrow.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/Ui/dirrection-arrow.js))**:
  - Re-mapped waypoints along the road and oriented each chevron using $\text{Math.atan2}(-\Delta x, -\Delta z)$ to point directly toward the next waypoint.
  - Added `polygonOffset` to eliminate all surface depth-clipping with the road platform.
  - Synchronized sequential wave pulse animation towards the entrance.


---

### Log : 21
**Title**: Approach Road Direction Chevrons Dead-Center Alignment & Full Extension  
**Description**: Fully recalibrated and extended the holographic floor chevrons along the exact architectural centerline of the dark asphalt road (`Body4`) to eliminate all curb clipping and guide visitors all the way into the museum entrance:
- **Geometry & Root Cause Analysis**:
  - Sliced the 3D model vertices of the road surface (`Body4`, $Y \approx -1.87\text{m}$):
    - **Straight Section**: $X \in [12.55, 17.71]$ (width $5.16\text{m}$), dead-center is $X = 15.13$.
    - **Corner Curve**: Inner curb is an arc with $R_{\text{in}} \approx 5.08\text{m}$ centered at $(7.46, 22.69)$; outer curb has $R_{\text{out}} \approx 10.0\text{m}$. Dead-center curve radius is $R_{\text{center}} \approx 7.54\text{m}$.
    - **Horizontal Avenue**: $Z \in [27.77, 32.46]$ (width $4.68\text{m}$), dead-center is $Z = 30.11$.
  - Previous coordinates placed chevrons at $X = 12.00$ and $Z = 27.20 \dots 27.50$, which fell outside the asphalt boundaries ($X < 12.55$ and $Z < 27.77$), causing them to clip and rest on top of the beige curb ledge.
  - Furthermore, the previous arrows stopped short at $X = 2.20$, leaving the remaining $11\text{m}$ of the avenue unguided.
- **Precision Centerline Trajectory ([dirrection-arrow.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/Ui/dirrection-arrow.js))**:
  - Extended all the way from touchdown $(15.04, 10.41)$ at $Z = 11.50$ along $X = 15.13$, smoothly curving through the corner ($R \approx 7.54\text{m}$), and spanning across the horizontal avenue ($Z = 30.11$).


---

### Log : 22
**Title**: Approach Road Decals Runway Ending Alignment & Margin Calibration  
**Description**: Refined the terminal section of the horizontal avenue chevrons to fix the skewed trajectory and edge collision at the museum entrance:
- **Root Cause Analysis ([media_1794653146147_3ed9207e.jpg](file:///Users/arnabbiswas/.gemini/antigravity/brain/73192dd4-6b59-453c-aab9-5cb0f7083de7/.user_uploaded/media_1794653146147_3ed9207e.jpg))**:
  - The road surface is a straight rectangular strip with a fixed centerline at $Z = 30.11$ terminating at $X = -9.46$.
  - In Log 21, the last two chevrons had their $Z$ coordinates shifted to $29.80$ and $28.50$, causing the path to visibly break off from the road centerline and skew upwards into the inner curb.
  - The fallback `next` vector for the final chevron had an artificial $dz = -1.5$ term, forcing a $53^\circ$ diagonal tilt rather than pointing straight down the avenue.
  - The terminal position $X = -8.80$ was too close to the asphalt boundary ($X = -9.46$) for a $1.5\text{m}$ chevron, causing the apex to touch and clip off the edge of the road.
- **Precision Centerline & Margin Fix ([dirrection-arrow.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/Ui/dirrection-arrow.js))**:
  - **Uniform Centerline Trajectory**: All 8 chevrons on the horizontal avenue now strictly maintain $Z = 30.11$:
    $$(6.00, 30.11) \to (3.90, 30.11) \to (1.80, 30.11) \to (-0.30, 30.11) \to (-2.40, 30.11) \to (-4.50, 30.11) \to (-6.50, 30.11) \to (-8.30, 30.11)$$
  - **Clean Terminal Buffer**: The final chevron is positioned at $X = -8.30$, maintaining an exact $1.16\text{m}$ center margin and $0.41\text{m}$ apex clearance before the road ends at $X = -9.46$.
  - **Parallel Orientation**: Removed the artificial $dz$ tilt on the terminal chevron ($dz = 0.0$); all avenue chevrons now point perfectly straight and parallel along $-X$ ($\text{rotation.y} = 90^\circ$).
  - **Uniform Spacing**: Balanced chevron intervals to a consistent $2.0\text{m} \dots 2.1\text{m}$ throughout the straightaway.


---

### Log : 23
**Title**: Museum Entrance Final Approach Road 90° Turn & Doorway Threshold Extension  
**Description**: Fully mapped and extended the holographic floor chevrons along the final branching section of the dark asphalt road that turns $90^\circ$ and leads straight into the museum entrance doorway:
- **Geometry & Architectural Analysis ([media_1794654000365_344f1573.jpg](file:///Users/arnabbiswas/.gemini/antigravity/brain/73192dd4-6b59-453c-aab9-5cb0f7083de7/.user_uploaded/media_1794654000365_344f1573.jpg))**:
  - As revealed in the user's overhead perspective, the dark road does not terminate at the horizontal avenue; it curves $90^\circ$ around the corner of the beige platform and runs straight along the entrance corridor ($X \in [-9.46, -7.39]$, width $2.07\text{m}$) directly into the museum entrance archway at $Z = 22.81$.
  - Previous chevrons stopped short at the corner ($X = -8.30, Z = 30.11$), leaving the entire turning arc and the final entrance corridor empty.
- **22-Waypoint Full-Route Trajectory ([dirrection-arrow.js](file:///Users/arnabbiswas/Documents/Mine/©Covelly/SpaceMuseum/Space-Museum/Frontend/Space-Museum/src/Ui/dirrection-arrow.js))**:
  - **Entrance Curve Transition**: Smoothly rounds the corner between inner curb ($R \approx 2.5\text{m}$) and outer island rim:
    $$(-4.50, 30.11) \to (-6.40, 29.80) \to (-7.70, 28.20)$$
  - **Straight Entrance Corridor to Threshold**: Perfectly centered on $X = -8.42$ with equal $34\text{cm}$ clearance from both the museum wall and platform curb:
    $$(-8.35, 26.30) \to (-8.42, 24.50) \to (-8.42, 22.90)$$
  - **Dynamic Tangent Alignment**:
    - Smooth angular transition through the final curve: $90.0^\circ \to 80.7^\circ \to 39.1^\circ \to 18.9^\circ \to 2.2^\circ \to 0.0^\circ$.
    - The terminal chevron at $(-8.42, 22.90)$ sits directly on the museum threshold and points along $-Z$ ($0.0^\circ$) straight into the main exhibition gallery.
  - **Proportional Geometry**: Chevron size calibrated to $1.4\text{m} \times 1.4\text{m}$ to maintain clean margins in the $2.07\text{m}$ wide entrance corridor.
  - **Wave Propagation**: Wave phase adjusted to `idx * 0.35` for a continuous light sweep across all 22 chevrons.







