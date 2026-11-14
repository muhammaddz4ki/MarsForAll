# GitHub Copilot Instructions — MARSFORALL // GALE-01

Project: MARSFORALL // GALE-01 (NASA Space Apps Challenge 2026)
Target: Mount Sharp (Aeolis Mons), Gale Crater, Mars (-5.4453°, 137.8414°)

1. Strict Branding & Compliance:
   - ZERO official NASA logos or agency seals.
   - Use `/images/marsforall-badge.svg` and `MarsForAllBadge.tsx`.
   - Text-only attributions for NASA/JPL/USGS/ESA data sources.

2. Strict UI Constraints:
   - ZERO gradients in CSS/Tailwind (no bg-gradient-*, linear-gradient, radial-gradient).
   - ZERO emojis anywhere in UI text, labels, or buttons. Use monochrome SVG icons or structured status tags like `[SAFE]`, `[BEDROCK FIRM]`, `[SOFT SAND TRAP RISK]`.
   - Dark matte solid palette (#07090e, #0b0f17, #111827) with crisp 1px solid borders.
   - Numerical values must use font-mono tabular-nums.

3. Five Planetary Science Layers:
   - Layer 1: Optical & Geologic Units (HiRISE 25cm/px, CTX 6m/px, USGS Geology).
   - Layer 2: Topographic Hazard (MOLA/HRSC/HiRISE 1m DTM, Slope Masks <15°, 15-25°, >25°).
   - Layer 3: Thermal & Subsurface Sand Trap Detector (THEMIS Night IR & TES Inertia).
   - Layer 4: Science & Hydrated Minerals (CRISM 18m/px phyllosilicates/sulfates & GRS WEH %).
   - Layer 5: Safety & Radiation (MGS MAG Crustal Magnetic Field nT & MSL RAD/REMS).

4. Curiosity Historical Traverse:
   - Bradbury Landing Ellipse to 2025 Boxwork Formations path overlay.

5. Strict i18n Sync Policy (The 5-Language Rule):
   - Whenever UI elements or text strings are added or modified, update all 5 localization dictionaries (`en.json`, `id.json`, `es.json`, `fr.json`, `zh.json`) simultaneously.
   - Use `next-intl` translations (`useTranslations`). Zero untranslated or missing keys allowed across the 5 languages.
