# ARES-PATH // GALE-01
### Interplanetary Survival Guide: Hyperlocalized Martian Excursion Map & ML Prospector

> **NASA Space Apps Challenge 2026 Submission**  
> **Challenge:** Interplanetary Survival Guide: Martian Map  
> **Primary Target:** Mount Sharp (*Aeolis Mons*), Gale Crater, Mars (`Lat: -5.4453°, Lon: 137.8414°`)  
> **Scientific Focus:** Curiosity Rover 2025 Boxwork Crystalline Fracture Ridge Exploration & Excursion Safety

---

## 1. Executive Summary

Global planetary exploration portals (such as JPL Mars Trek and USGS Astrogeology Planetary Geologic Mapping) are engineered for regional orbital surveys. However, human astronauts conducting localized surface extravehicular activities ("Marswalks") face extreme terrain and environmental challenges requiring hyperlocalized, multi-layered telemetry.

**ARES-PATH // GALE-01** provides an autonomous, offline-first tactical decision interface for crewed Martian surface operations. Focused on Mount Sharp in Gale Crater—specifically the intricate boxwork mineral ridges identified by the MSL Curiosity rover in 2025—the platform synthesizes multimodal orbital GIS data, thermal subsurface consistency models, real-time rover environmental telemetry, machine-learning resource prospecting, and physiological consumable tracking into a unified mission cockpit.

---

## 2. Core Capabilities & Scientific Innovations

### A. High-Performance Hybrid Map Viewport (MapLibre GL 2.5D/3D)
- **Local-First Resilience**: Pre-packaged high-resolution vector GeoJSON contours, geological polygon units, and hazard zones for zero-latency offline operation during communication blackouts.
- **Live Planetary Tile Fallback**: Capable of streaming live USGS Mars Astrogeology and NASA Mars Trek WMTS orthomosaics and DEM hillshades when orbital uplinks are available.
- **Unified Dual-Mode Telemetry**:
  - `[Habitat Mission Control]`: Multi-panel strategic operations view for Science Officers and Flight Directors.
  - `[Astronaut Helmet Visor HUD]`: Minimalist heads-up display overlay with compass tape, pitch ladder, slope safety alerts, and real-time oxygen/battery telemetry for surface EVAs.

### B. 4 Specialized Scientific Overlay Layers
1. **Optical & Geologic Units**: Delineates boxwork crystalline fracture networks, clay-bearing strata, magnesium-sulfate units, and basaltic sand dunes.
2. **Topographic DEM & Mobility Hazard**: Slope classification with strict traversal zoning:
   - `[SAFE <15°]`: Green corridor, nominal rover/EVA wheel traction.
   - `[CAUTION 15°-25°]`: Yellow sector, loose regolith slip danger, throttle restricted.
   - `[HAZARD >25°]`: Red boundary, catastrophic rollover and landslide hazard.
3. **Thermal Inertia & Subsurface Ice Consistency**: Implements the Morgan et al. 2020 consistency index (`+1` consistent with buried water ice/hydrated minerals, `0` inconclusive, `-1` inconsistent) alongside Apparent Thermal Inertia (`ATI` in $\text{J}\cdot\text{m}^{-2}\cdot\text{K}^{-1}\cdot\text{s}^{-1/2}$).
4. **Radiation & Space Weather**: Surface absorbed dose rate from Curiosity's Radiation Assessment Detector (RAD, nominal $\sim 0.64\text{ mSv/sol}$) and Rover Environmental Monitoring Station (REMS) UV and diurnal temperature telemetry.

### C. ML Prospector Engine & Uncertainty Quantification
- **Multi-Factor Fusion Model**: Evaluates hydrated mineral signatures (CRISM $2.3\ \mu\text{m}$ absorption), thermal inertia, morphological fractured network indicators, and extraction viability.
- **Confidence Scoring**: Delivers a Scientific Resource Promise Score ($0\text{--}100\%$) paired with an Uncertainty Index ($\pm\%$) and an automated decision matrix (`[TRIAGE: PRIORITY 1]`, `[TRIAGE: PRIORITY 2]`, `[PASS]`).

### D. 7-Parameter Weighted Earth Analogue Matcher
Calibrates Martian surface samples against terrestrial analogues using Euclidean feature weighting:
- **Utah Brushy Basin Member**: Fluvial smectite clays and silica ridge networks.
- **Atacama Desert (Yungay Basin)**: Hyper-arid perchlorate salts, sulfate crusts, and low-moisture extremes.
- **Rio Tinto Iron Gossan**: Acidic ferric-sulfate precipitations and gossan weathering caps.
- **Svalbard Basalt Volcanic Vents**: Cold cryogenic hydrothermal vents and carbonate globules.
- **Axel Heiberg Island Cold Springs**: Cryogenic subzero brine springs and permafrost gullies.

### E. Terrain-Aware Marswalk Route Planner
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
git clone <repository-url> ares-martian-map
cd ares-martian-map
pnpm install
```

### 2. Verify Scientific Calculation Engines
```bash
pnpm --filter @ares-path/shared build
node scripts/verify-mars-engines.mjs
```
*Expected: All 6 test suites pass (`[PASS] Mount Sharp Waypoints`, `[PASS] Prospector ML Fusion`, `[PASS] Earth Analogue Matcher`, `[PASS] Marswalk Route Planner`, `[PASS] Mineral Hardness`, `[PASS] Consumable Safety Checks`).*

### 3. Run Development Server
```bash
pnpm --filter @ares-path/web dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build & Typecheck
```bash
pnpm --filter @ares-path/web typecheck
pnpm --filter @ares-path/web build
```

---

## 7. License
Distributed under the MIT License. Developed for NASA Space Apps Challenge 2026.
