# rules.md — Architectural Governance & Compliance
**Project:** MARSFORALL // GALE-01  
**Authority:** Project Owner & Planetary GIS Architect  
**Status:** ACTIVE & STRICTLY ENFORCED  

---

## 1. BRANDING & COMPLIANCE MANDATES
- **STRICT PROHIBITION:** NO NASA MEATBALL, WORM, OR OFFICIAL AGENCY SEALS.
- **OFFICIAL BADGE:** `MARSFORALL // GALE-01` (`/images/marsforall-badge.svg`).
- **ATTRIBUTION PROTOCOL:** Credit all NASA/JPL/USGS/ESA datasets in plain text only.

---

## 2. DESIGN SYSTEM STANDARDS
- **Zero Gradients:** All UI components, charts, map overlays, cards, and buttons MUST use solid flat colors.
- **Zero Emojis:** Replace all emojis with crisp monochrome inline SVG icons or square-bracketed status badges (`[SAFE]`, `[CAUTION]`, `[HAZARD]`, `[BEDROCK FIRM]`, `[SOFT SAND TRAP RISK]`).
- **Contrast & Borders:** Use 1px solid borders (`border-slate-800`, `border-slate-700`) with matte dark surfaces (`#07090e`, `#0b0f17`, `#111827`, `#161e2e`) or clean high-contrast light surfaces.
- **Scientific Typography:** Monospaced tabular numerals (`font-mono tabular-nums`) with explicit units for all scientific telemetry.

---

## 3. FIVE OPERATIONAL NASA SCIENTIFIC LAYERS
1. `OPTIK`: HiRISE 25cm/px + CTX 6m/px + USGS Astrogeology Geologic Units.
2. `TOPOGRAFI`: HRSC/HiRISE 1m DTM Slope Gradient Mask (<15°, 15-25°, >25°) & meter-scale roughness.
3. `TERMAL`: THEMIS Night IR & TES Thermal Inertia — Sand Trap Detector (`[BEDROCK FIRM]` vs `[SOFT SAND TRAP RISK]`).
4. `SAINS / MINERAL`: CRISM 18m/px Hydrated Minerals & GRS/MONS/DAN Water-Equivalent Hydrogen (`WEH %`).
5. `KESELAMATAN`: MGS MAG Crustal Magnetic Field intensity (`nT`) & MSL RAD surface dosimetry + REMS microclimate.

---

## 4. MISSION SIMULATION MODULES
- **Prospector Multi-Layer Fusion Engine:** Synthesizes 5-term SWIM water-ice indicators, MGS MAG natural magnetic deflection, and regolith bearing strength.
- **Earth Analogue Similarity Matcher:** Real-time multi-criteria decision analysis (MCDA) linking Gale Crater to Devon Island, Death Valley, Río Tinto, and Atacama.
- **Marswalk A* Router:** Safety-optimized routing with consumable forecasting for Solo Astronaut and Paired Crew + Cargo Mule Rover modes.
- **Curiosity Historical Traverse Overlay:** Bradbury Landing Ellipse to 2025 Boxwork Formations traverse path with interactive toggle.

---

## 5. STRICT PERFORMANCE & BUNDLE OPTIMIZATION POLICY
- **Dynamic Code Splitting:** Lazy-load Three.js (`SurfacePovModal`), Recharts (`MarswalkPlannerPanel`), and secondary modals via `next/dynamic` (`ssr: false`).
- **Component Memoization:** Wrap `AresMapViewer`, `ProspectorPanel`, `ScientificLayersPanel`, `VisorHudOverlay`, and `AnalogueMatcherPanel` in `React.memo` to eliminate redundant renders during pan/zoom and slider updates.
- **Slider Smoothness:** Isolate Earth Analogue MCDA calculation with `useDeferredValue` ensuring 60 FPS slider manipulation.
- **WebGL GPU Cap:** Bound pixel ratio to `Math.min(window.devicePixelRatio, 1.5)`, optimize terrain geometry (80x80 segments), and throttle raycasting to ~30Hz (32ms).
- **Server-Side In-Memory Cache:** 300-tile in-memory LRU cache on `/api/mars-tiles` (<2ms response) and 15-minute TTL cache on `/api/curiosity-photos` and `/api/space-weather`.

---

## 6. STRICT I18N SYNC POLICY (THE 5-LANGUAGE RULE)
Every time a new feature, UI component, panel, button, or text label is added or modified in the project, the AI Agent MUST automatically update all 5 localization dictionaries (`en.json`, `id.json`, `es.json`, `fr.json`, `zh.json`) simultaneously. No UI string shall be hardcoded in the components. All texts must use `next-intl` translations (`useTranslations`). The AI Agent must never complete a UI task without verifying that all 5 JSON files are 100% synced with the new keys.
