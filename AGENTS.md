# AGENTS.md — ARES-PATH // GALE-01 AI Development Standards
**Project:** ARES-PATH // GALE-01 — Interplanetary Survival Guide: Martian Map  
**Event:** NASA Space Apps Challenge 2026  
**Primary Target:** Mount Sharp (Aeolis Mons), Gale Crater, Mars (`Lat: -5.4453°, Lon: 137.8414°`)  
**Mission Focal Point:** 2025 Curiosity Rover Boxwork Mineral Vein Discovery & Excursion Traverses

---

## 1. STRICT BRANDING COMPLIANCE (ZERO NASA LOGOS)
- **MANDATORY RULE:** NEVER download, embed, import, render, or simulate the official NASA insignia ("meatball") or NASA "worm" logos anywhere in the repository, UI, assets, favicons, or documentation.
- Use ONLY the custom project vector mission emblem: `ARES-PATH // GALE-01` (`/images/ares-path-badge.svg`).
- Scientific data attributions MUST be text-only citations crediting USGS Astrogeology, NASA AMMOS MMGIS, JPL Mars Trek, NASA Worldview / GIBS, and Mars Rover Raw Images.

---

## 2. STRICT UI DESIGN SYSTEM (ZERO GRADIENTS & ZERO EMOJIS)
1. **ZERO GRADIENTS (100% Flat Matte):**
   - Prohibited: `bg-gradient-*`, `from-*`, `via-*`, `to-*`, `linear-gradient`, `radial-gradient`, `filter: blur()`, `drop-shadow()`, and glowing borders.
   - Allowed: Flat solid surfaces only (`#07090e`, `#0b0f17`, `#111827`, `#161e2e`, `#1f2937`) separated by crisp `1px solid` borders (`border-slate-800`, `border-slate-700`).
2. **ZERO EMOJIS (100% Flat Technical):**
   - Prohibited: Unicode emojis anywhere in UI labels, buttons, headers, or alerts.
   - Allowed: Sharp monochrome inline SVG vector icons (`1.5px - 2px` stroke width, `currentColor`) and structured bracketed status tags (e.g. `[SAFE <15 DEG]`, `[CAUTION 15-25 DEG]`, `[HAZARD >25 DEG]`, `[STATUS: ACTIVE]`).
3. **TABULAR SCIENTIFIC TYPOGRAPHY:**
   - Numerical data (coordinates, elevation, slope, Prospector scores, Earth analogue weights, O2, battery, radiation) MUST use `font-mono tabular-nums`.
   - All physical metrics MUST display explicit SI/planetary units: `m`, `km`, `deg`, `tiu`, `mSv/sol`, `L/min`, `kg`, `kPa`.

---

## 3. CORE SCIENTIFIC & TECHNICAL ARCHITECTURE
1. **Four Planetary Scientific Layers:**
   - `Optical & Geologic Units`: HiRISE 25cm/px basemap with USGS geologic unit polygons (boxwork veins, smectite clay, hematite ridge, capping sandstone).
   - `Topographic & Mobility Hazard`: 1m DEM contours with slope safety masks (<15° Safe, 15°-25° Caution, >25° Impassable).
   - `Thermal & Subsurface Consistency`: Morgan et al. (2020) model (ATI threshold ~75 tiu, Consistency Index $C_T = +1, 0, -1$).
   - `Radiation & Space Weather`: MSL RAD measured surface dosimetry (`mSv/sol`) and REMS atmospheric conditions.
2. **Core Computational Engines:**
   - `Prospector ML Data Fusion`: Computes Resource Promise Score (`0-100%`) and Model Uncertainty Index (`±%`) derived from orbital-to-rover resolution gap.
   - `Earth Analogue Matcher`: Dynamic MCDA similarity matcher across 4 terrestrial sites (Haughton Crater, Death Valley, Río Tinto, Atacama) with real-time priority weight sliders.
   - `Terrain-Aware Marswalk Router (A*)`: A* pathfinding with metabolic consumables calculation for Solo Astronaut vs. Paired Crew + Cargo Mule Rover modes.
   - `Dual-Mode Unified Viewport`: Seamless 1-click toggle between Habitat Mission Control and Astronaut Visor HUD with Surface POV eye-level panorama modal.
3. **Offline-First Resilience:**
   - Embedded local GeoJSON (`mountSharpGeology.json`) and waypoint datasets MUST always serve as primary fail-safe data sources to guarantee flawless live judging presentations without internet dependencies.
