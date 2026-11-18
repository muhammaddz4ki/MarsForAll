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
- **360° Rover Mastcam Explorer:** Equirectangular WebGL panorama viewer at key rover stations with interactive geological hotspots and seamless zenith/nadir sky synthesis.
- **3D Planetary Globe:** Interactive Three.js Martian globe with landing site pins and orbital camera transitions.
- **Astronaut Helmet Visor HUD:** Distraction-free first-person EVA visor overlay featuring an azimuth compass tape, PLSS life-support gauges, environmental weather readout, and target reticle.
- **Ingenuity Aerial Scout Simulator:** Site-aware rotorcraft reconnaissance simulator with animated radar footprint and `60°` pitched camera tracking across Gale and Jezero targets.

### 2.5 Earth Analogue Matcher Lab
- Quantitatively compares Martian geological formations against terrestrial extreme environments (**Atacama Desert**, **McMurdo Dry Valleys**, **Rio Tinto**, **Pilbara Craton**, **Icelandic Basalt Highlands**, and **Salar de Uyuni**) using mineralogical, thermal, and morphological similarity scoring.

---

## 3. System Architecture & Geodesic Foundations

```text
ares-martian-map/
├── apps/
│   └── web/                        # Next.js 14 App Router (TypeScript + Tailwind CSS)
│       ├── messages/               # Synchronized Bilingual Dictionaries (id.json, en.json)
│       └── src/
│           ├── app/
│           │   ├── [locale]/       # Localized routes (/id, /en, /id/peta, /en/peta)
│           │   └── api/
│           │       ├── mars-tiles/ # Mercator-to-Equirectangular NASA WMTS Tile Proxy
│           │       ├── mission-config/ # MMGIS-compatible open mission configuration API
│           │       └── panorama-proxy/ # Resilient Rover 360° imagery proxy
│           ├── components/mars/    # Modular GIS, 3D Globe, 360° POV, Visor HUD & Charts
│           └── lib/martian/        # Geodesic math, A* router, 35-param ML scorer, MMGIS utils
└── packages/
    └── shared/                     # Shared TypeScript interfaces & planetary constants
```

### Geodesic & Mathematical Rigor
1. **IAU-2015 Mars Ellipsoid Datum:** All spatial calculations use Mars's equatorial radius $R_{eq} = 3,396.19\text{ km}$ ($1^\circ \approx 59.27\text{ km}$ at the equator) rather than Earth-centric constants.
2. **Web Mercator to NASA Mars Trek Equirectangular Transform:**
   $$\lambda_{\text{deg}} = \left(\frac{x_{\text{merc}} + 0.5}{2^z}\right) \times 360^\circ - 180^\circ, \quad \phi_{\text{deg}} = \arctan\left(\sinh\left(\pi - \frac{2\pi(y_{\text{merc}} + 0.5)}{2^z}\right)\right) \times \frac{180^\circ}{\pi}$$
3. **EVA Slope & Hazard Cost Function:** Penalizes slopes $>15^\circ$ exponentially while routing around low-thermal-inertia sand traps and high-exposure ridges.

---

## 4. NASA Open Data & Heritage Acknowledgements

- **NASA / JPL-Caltech Mars Trek WMTS API:** Orbital imagery and digital elevation models (`Viking MDIM 2.1`, `MOLA Colorized Elevation`, `THEMIS Day/Night IR`, `CTX`, and `HiRISE`).
- **NASA-AMMOS MMGIS:** Architectural inspiration for spatial statistics (`area2D`, `length2D`, ZOI `min/max/avg/stddev`), elevation transect profiling, coordinate deep-linking, and `/api/mission-config` schema.
- **NASA Planetary Data System (PDS):** Curiosity (MSL) and Perseverance (Mars 2020) rover traverse coordinates, sol waypoints, and Mastcam/Navcam surface panoramas.

> *Disclaimer: MarsForAll is an independent open-source project developed for the NASA Space Apps Challenge. It is not an official NASA website or product.*

---

## 5. Getting Started (Local Development)

### Prerequisites
- **Node.js** `>= 18.18.0` (Node 20+ recommended)
- **pnpm** `>= 9.0.0` (or `npm`)

### Installation & Run

```bash
# 1. Clone the repository
git clone [https://github.com/muhammaddz4ki/MarsForAll.git](https://github.com/muhammaddz4ki/MarsForAll.git)
cd MarsForAll

# 2. Install dependencies
pnpm install

# 3. Start the development server (http://localhost:3000)
pnpm --prefix apps/web dev
```

### Production Build & Typecheck

```bash
# Run static type verification
npm --prefix apps/web run typecheck

# Build production bundle
npm --prefix apps/web run build

# Start production server
npm --prefix apps/web run start
```

---

## 6. Deployment (Vercel)

This monorepo is pre-configured for zero-config deployment on **Vercel**:
- **Framework Preset:** `Next.js`
- **Root Directory:** `apps/web`
- **Build Command:** Default (`next build`)
- **Environment Variables:** None required (all NASA WMTS endpoints and offline fallbacks work out of the box).
