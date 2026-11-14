# Permanent Rules & Architecture Reference: ARES-PATH // GALE-01
**Repository:** `d:\Nasa\ares-martian-map`  
**Challenge Submisi:** NASA Space Apps Challenge 2026 — Interplanetary Survival Guide: Martian Map  
**Target:** Mount Sharp (Aeolis Mons), Gale Crater (`Lat: -5.4453°, Lon: 137.8414°`)

---

## 1. Branding & Attribution Policy
- **Absolute Ban on NASA Insignia:** Do NOT use the NASA meatball logo or NASA worm logo under any circumstance.
- **Project Identity:** Identify solely as `ARES-PATH // GALE-01` with vector badge `/images/ares-path-badge.svg`.
- **Attribution Format:** Factual, text-only citations crediting USGS-NASA Planetary Geologic Mapping Program, JPL Mars Trek, NASA AMMOS MMGIS, NASA Worldview / GIBS, and Mars Curiosity Raw Images.

---

## 2. Visual Design & UI System
- **Strictly No Gradients:** No `bg-gradient-*`, `linear-gradient`, `radial-gradient`, `box-shadow` blurs, or glow effects.
- **Strictly Flat Matte Palette:** Background `#07090e`, Panels `#0b0f17`, Cards `#111827`, Active highlights `#161e2e`. Sharp borders `1px solid #1e293b` / `#334155`.
- **Strictly No Unicode Emojis:** Use clean inline SVG icons (`strokeWidth="1.5"` or `"2"`, `currentColor`) and bracketed text badges (`[NOMINAL]`, `[HAZARD]`, `[ACTIVE]`).
- **Data Display:** `font-mono tabular-nums` for all numbers; explicit scientific units on every metric (`m`, `km`, `deg`, `tiu`, `mSv/sol`, `L/min`, `kg`).

---

## 3. Scientific Models & References
1. **Morgan et al. (2020) Subsurface Water-Ice & Thermal Inertia Model:**
   - Apparent Thermal Inertia ($ATI = \sqrt{k \rho c}$, threshold 75 tiu).
   - Diurnal skin depth $z_{\text{skin}} \approx 1.02\text{ cm}$.
   - Consistency Index $C_T$: $+1$ (consistent), $0$ (unresolved), $-1$ (inverted/desiccated).
2. **Impact Morphology & Roughness (Papers 2909 & 2132):**
   - Slope hazard thresholds: $<15^\circ$ Safe Walk, $15^\circ-25^\circ$ Suit Exertion Caution, $>25^\circ$ Impassable Cliff.
   - Hapke macroscopic roughness $\bar{\theta}$ and albedo shadowing impedance.
3. **NASA AMMOS MMGIS Architecture (Paper 2541):**
   - 25 cm/px orbital imagery + 1 m/px DEM.
   - Rover quicklook telemetry: Mastcam, ChemCam LIBS, APXS, REMS, RAD.

---

## 4. Codebase Architecture & Monorepo Structure
- **Package Scope:** Monorepo uses `@ares-path/*` scope (`@ares-path/web`, `@ares-path/shared`).
- **Client Application:** Next.js 14 App Router, MapLibre GL 2.5D/3D Viewport, Recharts, Tailwind CSS.
- **Fail-Safe Offline Mode:** Always maintain local GeoJSON and waypoint definitions to support judging offline.
