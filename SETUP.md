# MARSFORALL // GALE-01 — Local Setup & Development Guide

Project: **MARSFORALL // GALE-01** — Interplanetary Survival Guide: Martian Map  
Event: **NASA Space Apps Challenge 2026**  
Primary Target: **Mount Sharp (Aeolis Mons), Gale Crater, Mars** (`Lat: -5.4453°, Lon: 137.8414°`)  
Secondary Site: **Jezero Crater, Mars** (`Lat: 18.4447°, Lon: 77.4508°`)

---

## Prerequisites

- **Node.js >= 20**
- **pnpm >= 9** (`corepack enable` or `npm i -g pnpm@9`)
- Modern web browser with WebGL 2.0 acceleration support (Chrome / Edge / Firefox)

---

## 1. Quickstart (Development)

Clone repository and install monorepo dependencies:

```bash
git clone https://github.com/muhammaddz4ki/MarsForAll.git
cd MarsForAll
pnpm install
```

Boot the Next.js Martian Navigation Cockpit:

```bash
pnpm --filter @marsforall/web dev
```

Open your browser at:
- **Cockpit Map (Indonesian):** `http://localhost:3000/id/peta`
- **Cockpit Map (English):** `http://localhost:3000/en/peta`
- **Mission Landing Page:** `http://localhost:3000/en`

---

## 2. 360° Panorama JPEG Storage Directory

User-supplied spherical panoramas should be placed directly inside:
```
apps/web/public/panoramas/
```

- **Format:** `.jpg` / `.jpeg` / `.png`
- **Aspect Ratio:** **2:1 Equirectangular Spherical Projection** (e.g., `2048x1024`, `4096x2048`, `8192x4096`)
- **Metadata Registration:**
  - Files are automatically registered in `panoramas-registry.json` or can be added dynamically inside the application via the **`[+ WAYPOINT 360°]`** map toolbar button.
  - Waypoints with 360° panoramas display an illuminated cyan camera badge on the map (`📷 360°`). Clicking or double-clicking launches the real-time Three.js spherical WebGL POV viewer.

---

## 3. Core Architecture & Features

### A. 5 NASA Operational & Scientific Layers (Bioscape Data Portal Grouped Tree)
1. **Layer 1: Optical & USGS Geologic Units:** HiRISE 25cm/px & CTX 6m/px orbital mosaics with USGS geological contacts.
2. **Layer 2: Topographic Slope & 1m DTM Hazard Mask:** Slopes classified into `<15° Safe Walk`, `15°–25° Caution`, and `>25° Impassable Cliff Hazard`.
3. **Layer 3: THEMIS Night IR & Sand Trap Detector:** Morgan et al. (2020) Apparent Thermal Inertia model separating firm bedrock (`[BEDROCK FIRM]`) from dangerous sinkage sand traps (`[SOFT SAND TRAP RISK]`).
4. **Layer 4: CRISM Hydrated Minerals & GRS WEH:** 18m hyperspectral clay/sulfate mapping and water-equivalent hydrogen.
5. **Layer 5: MGS MAG Crustal Magnetic Field & MSL RAD:** Localized remanent crustal magnetic deflection umbrella against ionizing cosmic radiation.

### B. High-Density 5-Meter Marswalk Router & Docked Elevation Transect
- Discrete sampling every **~5 meters** along EVA excursion paths (300–600 nodes).
- Bottom docked elevation transect profile with synchronized interactive yellow needle scrubber.
- Dynamic camera bounds auto-framing (`map.fitBounds`) ensuring close, crisp visualization of the active trajectory.

---

## 4. Useful Monorepo Commands

```bash
# Run web development server
pnpm --filter @marsforall/web dev

# Check TypeScript types across packages
pnpm typecheck

# Lint codebase
pnpm lint

# Production build
pnpm --filter @marsforall/web build
```

---

## 5. Offline-First Architecture & Tile Proxies

The application features 100% offline-first resilience:
- External NASA Mars Trek WMTS endpoints are proxied through `/api/mars-tiles/*` with server-side LRU tile caching.
- If external connectivity is unavailable, the application automatically falls back to procedural vector contours and embedded GeoJSON without breaking UI functionality.
