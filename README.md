# MARSFORALL // GALE-01
### Interplanetary Survival Guide: Hyperlocalized Martian Excursion Map & ML Prospector

> **NASA Space Apps Challenge 2026 Submission**  
> **Challenge:** Interplanetary Survival Guide: Martian Map  
> **Primary Target:** Mount Sharp (*Aeolis Mons*), Gale Crater, Mars (`Lat: -5.4453°, Lon: 137.8414°`)  
> **Scientific Focus:** Curiosity Rover 2025 Boxwork Mineral Vein Discovery, 5 NASA Operational Layers, & Curiosity Historical Traverse  
> **Official Repository:** [https://github.com/muhammaddz4ki/MarsForAll](https://github.com/muhammaddz4ki/MarsForAll)

---

## 1. Executive Summary

Global planetary exploration portals (such as JPL Mars Trek and USGS Astrogeology Planetary Geologic Mapping) are engineered for regional orbital surveys. However, human astronauts conducting localized surface extravehicular activities ("Marswalks") face extreme terrain and environmental challenges requiring hyperlocalized, multi-layered telemetry.

**MARSFORALL // GALE-01** provides an autonomous, offline-first tactical decision interface for crewed Martian surface operations. Focused on Mount Sharp in Gale Crater—specifically the intricate boxwork mineral ridges identified by the MSL Curiosity rover in 2025—the platform synthesizes multimodal orbital GIS data, thermal subsurface consistency models, real-time rover environmental telemetry, machine-learning resource prospecting, and physiological consumable tracking into a unified mission cockpit.

---

## 2. Core Capabilities & Scientific Innovations

### A. High-Performance Hybrid Map Viewport (MapLibre GL 2.5D/3D)
- **Local-First Resilience**: Pre-packaged high-resolution vector GeoJSON contours, geological polygon units, and hazard zones for zero-latency offline operation during communication blackouts.
- **Live Planetary Tile Fallback**: Capable of streaming live USGS Mars Astrogeology and NASA Mars Trek WMTS orthomosaics and DEM hillshades when orbital uplinks are available.
- **Unified Dual-Mode Telemetry**:
  - `[Habitat Mission Control]`: Multi-panel strategic operations view for Science Officers and Flight Directors.
  - `[Astronaut Helmet Visor HUD]`: Minimalist heads-up display overlay with compass tape, pitch ladder, slope safety alerts, and real-time oxygen/battery telemetry for surface EVAs.

### B. 5 Operational Scientific Overlay Layers (NASA Mars Trek Catalog)
1. **Layer 1: Optical & Geologic Units**: HiRISE 25 cm/px & CTX 6 m/px orbital imagery blended with USGS Planetary Geologic Mapping units (Noachian/Hesperian/Amazonian, boxwork veins, smectite clay, hematite ridge, capping sandstone).
2. **Layer 2: Topographic DEM & Mobility Hazard**: MOLA & HiRISE 1m DTM contours with slope classification:
   - `[SAFE <15°]`: Green corridor, nominal rover/EVA foot traction.
   - `[CAUTION 15°-25°]`: Yellow sector, elevated metabolic exertion.
   - `[HAZARD >25°]`: Red boundary, catastrophic rollover and cliff hazard.
3. **Layer 3: Thermal & Subsurface Sand Trap Detector**: THEMIS Night IR & TES Apparent Thermal Inertia with Morgan et al. 2020 consistency index (`+1` consistent with buried water ice/hydrated minerals, `0` inconclusive, `-1` inconsistent), identifying firm bedrock (`[BEDROCK FIRM]`) vs loose dust/sand sinkage hazards (`[SOFT SAND TRAP RISK]`).
4. **Layer 4: Science & Hydrated Mineralogy**: CRISM 18 m/px hyperspectral mapping (smectite clays, polyhydrated sulfates, hematite, silica) and GRS/MONS/DAN Water-Equivalent Hydrogen (`WEH %`).
5. **Layer 5: Safety & Space Environment**: MGS MAG Crustal Magnetic Field intensity (`nT`) natural radiation shielding combined with MSL RAD surface dosimetry (`mSv/sol`) and REMS atmospheric conditions.

### C. Curiosity Rover Historical Traverse & Landing Ellipse
- Complete Gale Crater mission timeline path: Bradbury Landing Ellipse -> Yellowknife Bay -> Pahrump Hills -> Vera Rubin Ridge -> Glen Torridon -> Gediz Vallis -> Boxwork 2025.
- Dashed tactical cyan trail with historical Sol checkpoints and interactive toggle.

### D. ML Prospector Engine & Uncertainty Quantification
- **Multi-Factor Fusion Model**: Evaluates hydrated mineral signatures, apparent thermal inertia, MGS MAG deflection, and regolith sinkage risk.
- **Confidence Scoring**: Delivers a Scientific Resource Promise Score ($0\text{--}100\%$) paired with an Uncertainty Index ($\pm\%$) and an automated decision matrix (`[PRIORITY_SAMPLING_SITE]`, `[SECONDARY_EXPLORATION]`, `[HAZARD_BYPASS_REQUIRED]`).

### E. Weighted Earth Analogue Matcher
Calibrates Martian surface samples against terrestrial analogues using Euclidean feature weighting:
- **Haughton Impact Crater (Devon Island, Canada)**: Polygon permafrost breccias.
- **Mars Hill & Badwater (Death Valley, USA)**: Alluvial gravel fans and scree slopes.
- **Río Tinto (Spain)**: Acidic gossan iron-sulfate deposits.
- **Atacama Desert (Yungay Basin, Chile)**: Hyper-arid nitrate/perchlorate salts.

### F. Terrain-Aware Marswalk Route Planner
- **Slope-Penalized Pathfinding**: Dynamic distance calculation with exponential slope penalties for ascents $>15^\circ$.
- **Astronaut Life Support Modeling**: Calculates MET expenditure, metabolic oxygen consumption rates ($0.95\text{--}2.20\text{ L/min}$), battery draw, and enforces a mandatory $25\%$ emergency reserve threshold.

---

## 3. Strict UI Design System & NASA Space Apps Compliance

- **ZERO Gradients (Pure Flat Matte Surfaces)**: No CSS gradients, linear transitions, or glows. Built strictly with solid matte hues (`#07090e`, `#0b0f17`, `#111827`, `#161e2e`) and crisp `1px solid` slate borders for maximum legibility under high-contrast cockpit conditions.
- **ZERO Emojis / Unicode Emoticons**: 100% of indicators are monochrome SVG vectors (stroke `1.5px`) and structured status badges (`[SAFE <15 DEG]`, `[CAUTION 15-25 DEG]`, `[HAZARD >25 DEG]`, `[CT: +1]`).
- **Tabular Monospace Telemetry**: All numbers, spatial coordinates, elevations, and metric units (`m`, `km`, `deg`, `tiu`, `mSv/sol`, `L/min`, `kg`) are strictly formatted in `font-mono tabular-nums`.
- **STRICT BRANDING COMPLIANCE**:
  - **Zero Official NASA Logos**: The official NASA insignia ("meatball") and NASA "worm" logo are strictly prohibited and not included anywhere in the repository or user interface.
  - Dedicated custom vector mission badge: `apps/web/public/images/ares-path-badge.svg`.

---

## 4. Scientific Attributions & Data Sources

This application synthesizes open planetary data in accordance with NASA Open Science guidelines:
- **JPL Mars Trek**: Gale Crater DEM and base imagery layers ([trek.nasa.gov/mars](https://trek.nasa.gov/mars/)).
- **USGS Planetary Geologic Mapping Program**: Mount Sharp (Aeolis Mons) structural mapping and stratigraphy.
- **NASA AMMOS MMGIS**: Open-source planetary mapping interface paradigms.
- **NASA PDS Geosciences Node**: Mars Science Laboratory (MSL) Curiosity ChemCam, Mastcam, RAD, and REMS instrument telemetry.
- **NASA Worldview / GIBS**: Earth analogue comparative multispectral datasets.

---

## 5. Repository Structure

```
ares-martian-map/
├── AGENTS.md                  # Universal AI Coding Agent Project Guidelines
├── rules.md                   # Strict Architecture & Compliance Reference
├── .cursorrules               # Cursor / Antigravity Persistent Rules
├── .github/
│   └── copilot-instructions.md # GitHub Copilot Agent Configuration
├── apps/
│   ├── web/                   # Next.js 14 App Router, MapLibre GL, Tailwind CSS
│   │   ├── messages/          # EN & ID Localization Dictionaries
│   │   ├── public/images/     # Flat Vector Mission Badge (No NASA Logos)
│   │   └── src/
│   │       ├── app/           # Locale-aware App Router ([locale]/page.tsx, /peta)
│   │       ├── components/    # Mission Badge & Mars UI Component Suite
│   │       │   └── mars/      # AresMapViewer, VisorHud, ProspectorPanel, etc.
│   │       └── lib/
│   │           ├── martian/   # Mathematical Engines & Planetary Models
│   │           └── services/  # Cesium & Worldview Integration Adapters
│   └── api/                   # Headless API Workspace
├── packages/
│   └── shared/                # Shared TypeScript Martian Domain Models
└── scripts/
    └── verify-mars-engines.mjs # Standalone Automated Verification Script
```

---

## 6. Local Quickstart Guide

### Prerequisites
- **Node.js** `>= 20.0.0`
- **pnpm** `>= 9.0.0` (`npm install -g pnpm`)

### 1. Installation
```bash
git clone https://github.com/muhammaddz4ki/MarsForAll.git
cd MarsForAll
pnpm install
```

### 2. Verify Scientific Calculation Engines
```bash
pnpm --filter @marsforall/shared build
node scripts/verify-mars-engines.mjs
```
*Expected: All 7 verification test suites pass successfully.*

### 3. Run Development Server
```bash
pnpm --filter @marsforall/web dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build & Typecheck
```bash
pnpm --filter @marsforall/web typecheck
pnpm --filter @marsforall/web build
```

---

## 7. Official Repository & Deployment
- **GitHub Repository**: [https://github.com/muhammaddz4ki/MarsForAll](https://github.com/muhammaddz4ki/MarsForAll)
- **Clone (HTTPS)**: `git clone https://github.com/muhammaddz4ki/MarsForAll.git`
- **Submission Branch**: `main`

---

## 8. License
Distributed under the MIT License. Developed for NASA Space Apps Challenge 2026.
