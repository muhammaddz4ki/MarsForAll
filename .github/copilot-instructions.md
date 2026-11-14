# GitHub Copilot Instructions — ARES-PATH // GALE-01

## Mission Scope
This project is an entry for the NASA Space Apps Challenge 2026: "Interplanetary Survival Guide: Martian Map".
Target Location: Mount Sharp (Aeolis Mons), Gale Crater, Mars (`Lat: -5.4453°, Lon: 137.8414°`).
Key Objective: Hyperlocalized astronaut excursion routing, ML resource prospecting, and 2025 Curiosity rover boxwork mineral vein analysis.

## Mandatory Coding & Styling Constraints
1. **Strict Zero-NASA-Logo Policy:**
   - Do NOT suggest, import, or generate official NASA insignia or worm logos.
   - Use `/images/ares-path-badge.svg` and factual text-based citations.
2. **Strict Zero-Gradients Policy:**
   - Never use Tailwind `bg-gradient-*`, `from-*`, `via-*`, `to-*`, CSS `linear-gradient`, or CSS `radial-gradient`.
   - Never use blurry box-shadow glows or filter blurs.
   - Use flat matte solid colors (`#07090e`, `#0b0f17`, `#111827`, `#161e2e`) with sharp `1px` borders (`border-slate-800`).
3. **Strict Zero-Emojis Policy:**
   - Never suggest or use Unicode emojis in labels, button text, headers, or alerts.
   - Use monochrome inline SVG icons (`strokeWidth="1.5"` to `"2"`, `currentColor`) or bracketed status text (e.g., `[SAFE]`, `[CAUTION]`, `[HAZARD]`).
4. **Monospace Tabular Data:**
   - Format all numeric displays with `font-mono tabular-nums` and explicit units (`m`, `km`, `deg`, `tiu`, `mSv/sol`, `L/min`, `kg`, `kPa`).
5. **Scientific Rigor:**
   - Thermal & Subsurface: Morgan et al. (2020) ATI baseline 75 tiu and Consistency Index $C_T \in \{+1, 0, -1\}$.
   - Slope Hazards: $<15^\circ$ Safe Walk, $15^\circ-25^\circ$ Suit Exertion Caution, $>25^\circ$ Impassable Cliff.
   - Route Planning: A* least-cost trajectory comparing Solo Astronaut vs. Paired Crew + Cargo Mule Rover modes.
   - Offline Resilience: Maintain embedded local GeoJSON datasets as primary fail-safe data.
