<div align="center">

# MARSFORALL — ARES MARTIAN MAP
### Planetary GIS Workstation, Autonomous EVA Route Planner & Multi-Modal Martian Surface Explorer

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-2.5D_Terrain-396CB2?style=flat-square)](https://maplibre.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D_%26_360%C2%B0-000000?style=flat-square&logo=three.js)](https://threejs.org/)
[![NASA Data](https://img.shields.io/badge/Data-NASA_Mars_Trek_%26_PDS-c85a32?style=flat-square)](https://trek.nasa.gov/mars/)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=flat-square)](./LICENSE)

**Bridging the gap between mission-critical planetary GIS (NASA-AMMOS MMGIS) and intuitive consumer navigation (Google Maps).**

[Live Web Application (ID)](https://marsforall.vercel.app/id/peta) • [Live Web Application (EN)](https://marsforall.vercel.app/en/peta) • [Mission Config API](https://marsforall.vercel.app/api/mission-config)

</div>

---

## 1. Executive Summary

Planetary datasets collected by NASA orbiters and rovers are extraordinarily rich, yet they remain locked behind complex scientific interfaces that are difficult for the public to navigate—while consumer mapping tools lack the geodesic rigor required for planetary exploration.

**MarsForAll (Ares Martian Map)** solves this by combining **Google Maps-grade intuitiveness** with **NASA-AMMOS MMGIS scientific precision**:
- **For the General Public & Students:** 1-click map layer switching (*True Satellite*, *Elevation Map*, *Night Thermal*), instant crater searchchips, plain-language Place Cards with terrain safety badges (`SAFE`, `STEEP`, `HAZARD`), and immersive 360° Rover Panoramas.
- **For Mission Planners & Researchers:** A 64×64 dynamic corridor A* EVA route planner with Catmull-Rom spline smoothing, real-time Portable Life Support System (PLSS) consumables modeling, a 35-parameter ISRU & Biosignature ML Prospector, Viewshed/Elevation transect profiling, and terrestrial analogue matching.

---

## 2. Core Features & Scientific Modules

### 2.1 Multi-Resolution Planetary GIS Engine (`2D / 2.5D`)
- **Real-Time Projection Proxy (`/api/mars-tiles`):** Dynamically transforms Web Mercator (`EPSG:3857`) tile requests into NASA Mars Trek Equirectangular (`Plate Carrée`) WMTS coordinates with smart global fallback to Viking MDIM 2.1.
- **1-Click Orbital Layer Fusion:**
  - **True Satellite (`CTX / HiRISE + Viking MDIM 2.1`):** High-resolution 6 m/px crater orthomosaics bounded to **Gale Crater (MSL Curiosity)** and **Jezero Crater (Mars 2020 Perseverance)** over a seamless global basemap.
  - **Elevation Map (`MOLA Colorized Hillshade`):** Laser altimetry topography revealing craters, ridges, and ancient river deltas.
  - **Night Thermal (`THEMIS Night IR`):** Thermal inertia mapping to distinguish exposed bedrock from hazardous loose sand traps.
- **Chronological Sol Traverse Scrubber:** Interactive timeline slider (`SOL 0` to `SOL 4180` in Gale; `SOL 0` to `SOL 1220` in Jezero) that replays rover traverse paths and active vehicle telemetry over time.

### 2.2 Autonomous Marswalk EVA Route Planner
- **Meandering Terrain-Aware A* Pathfinding:** Evaluates a high-resolution $64 \times 64$ cost grid factoring in MOLA slope angles, crater rims, sand trap hazards, and radiation exposure—smoothed via Catmull-Rom splines into natural valley-following paths.
- **Dual-Route Comparison (Google Maps Style):** Generates both a **Primary Safe Route** (`#10b981`) and a **Dashed Alternative Route** (`#f59e0b`) with floating distance/slope badges and one-click route switching.
- **PLSS Life-Support & Hazard Telemetry:** Computes real-time astronaut expenditure for Oxygen ($\text{O}_2$), Battery power, Cooling water ($\text{H}_2\text{O}$), and ionizing radiation dose ($\mu\text{Sv}$).
- **MMGIS Elevation Transect & Line-of-Sight (Viewshed):** Interactive bottom profile dock displaying elevation curves, slope gradients, and radio/visual line-of-sight from the habitat.

### 2.3 35-Parameter AI Resource Prospector (ISRU & Astrobiology)
- Evaluates candidate landing and excavation sites across **35 weighted planetary parameters**, including hydrated sulfate/phyllosilicate signatures, neutron spectrometer subsurface $\text{H}_2\text{O}$ ice stability, solar irradiance, slope stability, and regolith bearing capacity.

### 2.4 Immersive 3D Globe, 360° Surface POV, Visor HUD & Aerial Scout
- **3
