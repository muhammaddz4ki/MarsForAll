/**
 * Scientific Map Layer Definitions for Mount Sharp (Aeolis Mons), Gale Crater
 *
 * Implements the 4 core scientific layers specified by NASA Space Apps Challenge 2026:
 * 1. Optical & Geologic Units (USGS / HiRISE Boxwork, Clay, Sulfate)
 * 2. Topographic & Mobility Hazard (1m DEM, Slope Gradient Masks <15°, 15-25°, >25°)
 * 3. Thermal & Subsurface (TES/THEMIS ATI & Morgan et al. 2020 CT Index)
 * 4. Radiation & Space Weather (RAD surface dose mSv/sol, REMS atmospheric telemetry)
 */

export interface ScientificLegendItem {
  label: string;
  color: string;
  description: string;
}

export interface MartianLayerDef {
  id: string;
  name: string;
  category: "optical_geology" | "topography_hazard" | "thermal_subsurface" | "radiation_environment";
  description: string;
  defaultVisible: boolean;
  opacity: number;
  legend: ScientificLegendItem[];
  sourceCitation: {
    dataset: string;
    instrumentOrMission: string;
    attributionText: string;
    sourceUrl: string;
  };
  tileUrl?: string;
  geojsonSource?: string;
}

export const MARTIAN_SCIENTIFIC_LAYERS: MartianLayerDef[] = [
  {
    id: "layer_optical_geologic",
    name: "Optical Basemap & USGS Geologic Units",
    category: "optical_geology",
    description:
      "HiRISE 25 cm/px visible mosaic blended with USGS Planetary Geologic Mapping units. Highlights 2025 Curiosity boxwork mineral veins, Glen Torridon clay troughs, and sulfate strata.",
    defaultVisible: true,
    opacity: 0.9,
    legend: [
      { label: "Boxwork Mineral Veins", color: "#f59e0b", description: "Polygonal fracture ridges with sulfate-cement fills" },
      { label: "Clay-Bearing Strata (Torridon)", color: "#10b981", description: "Lacustrine phyllosilicates / smectite mudstones" },
      { label: "Hematite Ridge (Vera Rubin)", color: "#ec4899", description: "Resistant crystalline iron oxide caprock" },
      { label: "Capping Sandstone (Greenheugh)", color: "#8b5cf6", description: "Amazonian aeolian dune cross-bed unconformity" },
      { label: "Alluvial Fan (Bradbury Plains)", color: "#64748b", description: "Basaltic gravel pavement touchdown floor" },
    ],
    sourceCitation: {
      dataset: "USGS Scientific Investigations Map 3355 & HiRISE PDS Mosaic",
      instrumentOrMission: "NASA MRO HiRISE / USGS Planetary Geologic Mapping",
      attributionText: "USGS-NASA Planetary Geologic Mapping Program & University of Arizona HiRISE",
      sourceUrl: "https://planetarymaps.usgs.gov/",
    },
    tileUrl: "https://planetarymaps.usgs.gov/mosaic/Mars/HRSC_MOLA_Blend/HRSC_MOLA_Blend_global/{z}/{x}/{y}.png",
  },
  {
    id: "layer_topographic_hazard",
    name: "1m DEM Elevation & Slope Mobility Hazard Mask",
    category: "topography_hazard",
    description:
      "High-Resolution Stereo Camera (HRSC) & HiRISE 1m/px elevation contours and terrain hazard color-coding for astronaut suit safety.",
    defaultVisible: true,
    opacity: 0.75,
    legend: [
      { label: "Safe Walk (<15°)", color: "#22c55e", description: "Nominal metabolic expenditure, low slippage risk" },
      { label: "Suit Exertion Caution (15°-25°)", color: "#eab308", description: "Elevated O2 consumption, anchor rigging recommended" },
      { label: "Impassable Cliff Hazard (>25°)", color: "#ef4444", description: "Strict bypass required; high boulder-fall & tumble risk" },
    ],
    sourceCitation: {
      dataset: "Gale Crater High-Resolution Digital Elevation Model (1m/px)",
      instrumentOrMission: "ESA Mars Express HRSC & NASA MRO HiRISE",
      attributionText: "DLR / NASA Planetary Data System (PDS) Cartography and Imaging Node",
      sourceUrl: "https://pds-imaging.jpl.nasa.gov/",
    },
  },
  {
    id: "layer_thermal_subsurface",
    name: "TES/THEMIS Apparent Thermal Inertia & Subsurface Ice (CT)",
    category: "thermal_subsurface",
    description:
      "MGS Thermal Emission Spectrometer (TES) & Mars Odyssey THEMIS Apparent Thermal Inertia (ATI) with Morgan et al. (2020) Subsurface Consistency Scoring.",
    defaultVisible: false,
    opacity: 0.8,
    legend: [
      { label: "CT = +1 (Ice/Hydration Consistent)", color: "#38bdf8", description: "Low-TI mantle over high-TI indurated or ice-cemented layer (<1 skin depth)" },
      { label: "CT = 0 (Unresolved / Single Layer)", color: "#94a3b8", description: "Uniform thermal half-space or deep overburden (>3 skin depths)" },
      { label: "CT = -1 (Inverted / Desiccated)", color: "#f97316", description: "High-TI crust over porous low-TI desiccated subsoil" },
      { label: "ATI > 450 tiu (Dense Rock / Veins)", color: "#6366f1", description: "Crystalline bedrock & mineralized boxwork ridges" },
    ],
    sourceCitation: {
      dataset: "Subsurface Water-Ice & Thermal Inertia Model (Morgan et al. 2020)",
      instrumentOrMission: "MGS TES & Mars Odyssey THEMIS",
      attributionText: "Morgan et al. / Nature Astronomy / ASU Mars Space Flight Facility",
      sourceUrl: "https://doi.org/10.1038/s41550-020-01290-7",
    },
  },
  {
    id: "layer_radiation_weather",
    name: "Gale RAD Surface Radiation & REMS Microclimate",
    category: "radiation_environment",
    description:
      "MSL Radiation Assessment Detector (RAD) dosimetry (mSv/sol) with Rover Environmental Monitoring Station (REMS) dust opacity and diurnal thermal swings.",
    defaultVisible: false,
    opacity: 0.7,
    legend: [
      { label: "Nominal Background (0.55 - 0.65 mSv/sol)", color: "#3b82f6", description: "Protected basin floor with thicker atmospheric shielding" },
      { label: "Moderate Ridge Exposure (0.65 - 0.75 mSv/sol)", color: "#f59e0b", description: "Elevated ridges with decreased column density" },
      { label: "High Exposure / SEP Alert (>0.75 mSv/sol)", color: "#dc2626", description: "Solar energetic particle risk; limit continuous EVA duration" },
    ],
    sourceCitation: {
      dataset: "Curiosity MSL RAD Dosimetry & REMS Atmospheric Logs",
      instrumentOrMission: "NASA MSL Curiosity Rover / SwRI / CAB (CSIC-INTA)",
      attributionText: "NASA AMMOS MMGIS & Southwest Research Institute (SwRI)",
      sourceUrl: "https://github.com/NASA-AMMOS/MMGIS",
    },
  },
];

