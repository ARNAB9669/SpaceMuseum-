

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
