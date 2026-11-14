/**
 * Scientific & Operational Map Layer Definitions for Mount Sharp (Aeolis Mons), Gale Crater
 *
 * Implements the 5 Integrated Operational Layers from the NASA Mars Trek Catalog:
 * 1. OPTIK (HiRISE 25cm/px + CTX 5m/px + USGS Geology)
 * 2. TOPOGRAFI (MOLA / HiRISE 1m Stereo DTM Slope & Roughness)
 * 3. TERMAL (THEMIS Night IR & TES Inertia — Sand Trap Detector)
 * 4. SAINS / MINERAL (CRISM 18m Hydrated Minerals & GRS/MONS WEH)
 * 5. KESELAMATAN (MGS MAG Crustal Magnetic Field + RAD/REMS)
 */

export interface ScientificLegendItem {
  label: string;
  color: string;
  description: string;
}

export interface MartianLayerDef {
  id: string;
  name: string;
  category: "optical_geology" | "topography_hazard" | "thermal_subsurface" | "science_mineral" | "safety_magnetic";
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
    name: "Layer 1: Optical & USGS Geologic Units",
    category: "optical_geology",
    description:
      "HiRISE 25 cm/px & CTX 6 m/px orbital mosaic blended with USGS Planetary Geologic Mapping units. Visual surface survey for identifying boulder fields, small scarps, and Noachian/Hesperian/Amazonian stratigraphic contacts.",
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
      instrumentOrMission: "NASA MRO HiRISE / CTX & USGS Planetary Geology",
      attributionText: "USGS-NASA Planetary Geologic Mapping Program & University of Arizona HiRISE",
      sourceUrl: "https://planetarymaps.usgs.gov/",
    },
    tileUrl: "https://planetarymaps.usgs.gov/mosaic/Mars/HRSC_MOLA_Blend/HRSC_MOLA_Blend_global/{z}/{x}/{y}.png",
  },
  {
    id: "layer_topographic_hazard",
    name: "Layer 2: Topographic Slope & 1m DTM Hazard Mask",
    category: "topography_hazard",
    description:
      "MOLA, HRSC, and HiRISE 1m/px stereo digital elevation model (DTM). Classifies terrain slope gradients (<15° Safe, 15°–25° Caution, >25° Cliff Hazard) and meter-scale surface roughness.",
    defaultVisible: true,
    opacity: 0.75,
    legend: [
      { label: "Safe Walk (<15°)", color: "#22c55e", description: "Nominal metabolic expenditure, optimal boot/wheel traction" },
      { label: "Suit Exertion Caution (15°-25°)", color: "#eab308", description: "Elevated O2 consumption, loose scree slip risk" },
      { label: "Impassable Cliff Hazard (>25°)", color: "#ef4444", description: "Strict bypass required; rollover and falling rock danger" },
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
    name: "Layer 3: THEMIS Night IR & Sand Trap Detector",
    category: "thermal_subsurface",
    description:
      "THEMIS Night Infrared temperature (K) and TES Apparent Thermal Inertia (tiu). Differentiates firm bedrock (warm at night, high inertia) from soft sand traps and deep dust deposits (cold at night, high sinkage hazard).",
    defaultVisible: false,
    opacity: 0.8,
    legend: [
      { label: "[BEDROCK FIRM] (ATI > 350 tiu, >185 K)", color: "#0284c7", description: "Indurated rock pavement; maximum bearing strength" },
      { label: "[MODERATE COMPACTION] (200-350 tiu)", color: "#eab308", description: "Consolidated sulfate regolith crust; standard traversal" },
      { label: "[SOFT SAND TRAP RISK] (ATI < 200 tiu, <178 K)", color: "#ea580c", description: "Unconsolidated eolian drift; critical entrapment hazard" },
      { label: "CT = +1 (Subsurface Hydration)", color: "#38bdf8", description: "Morgan et al. 2020 low-TI mantle over high-TI substrate" },
    ],
    sourceCitation: {
      dataset: "THEMIS Night IR & TES Apparent Thermal Inertia Model",
      instrumentOrMission: "NASA 2001 Mars Odyssey THEMIS & MGS TES",
      attributionText: "ASU Mars Space Flight Facility & Morgan et al. (Nature Astronomy)",
      sourceUrl: "https://doi.org/10.1038/s41550-020-01290-7",
    },
  },
  {
    id: "layer_science_mineral",
    name: "Layer 4: CRISM Hydrated Minerals & GRS WEH",
    category: "science_mineral",
    description:
      "MRO Compact Reconnaissance Imaging Spectrometer for Mars (CRISM 18m/px) and Odyssey GRS/MONS Water-Equivalent Hydrogen (WEH %). Highlights primary astronaut scientific extraction targets.",
    defaultVisible: false,
    opacity: 0.85,
    legend: [
      { label: "High Hydration (WEH > 6.0%)", color: "#06b6d4", description: "Polyhydrated sulfates and hydrous vein networks" },
      { label: "Phyllosilicate Clay Zone (4.5-6.0%)", color: "#10b981", description: "Smectite clays in ancient lacustrine mudstone" },
      { label: "Crystalline Hematite (Fe2O3)", color: "#f43f5e", description: "Secondary groundwater diagenetic precipitate" },
      { label: "Basaltic Mafic Sand (WEH < 3.5%)", color: "#64748b", description: "Anhydrous olivine/pyroxene eolian sand sheets" },
    ],
    sourceCitation: {
      dataset: "CRISM Targeted Hyperspectral & Mars Odyssey GRS Mapping",
      instrumentOrMission: "NASA MRO CRISM & Mars Odyssey GRS/MONS",
      attributionText: "JHU-APL / NASA Planetary Data System Geosciences Node",
      sourceUrl: "https://crism.jhuapl.edu/",
    },
  },
  {
    id: "layer_safety_magnetic",
    name: "Layer 5: MGS MAG Crustal Magnetic & RAD Environment",
    category: "safety_magnetic",
    description:
      "Mars Global Surveyor (MGS) Magnetometer crustal magnetic field anomalies (nT) providing natural deflection of cosmic radiation, synthesized with MSL RAD dosimeter readings and REMS atmospheric conditions.",
    defaultVisible: false,
    opacity: 0.75,
    legend: [
      { label: "High Crustal Field (>60 nT)", color: "#8b5cf6", description: "Strong natural magnetic deflection umbrella (~12-16% dose reduction)" },
      { label: "Moderate Crustal Field (35-60 nT)", color: "#3b82f6", description: "Localized remanent magnetization in ancient Noachian crust" },
      { label: "Nominal Background RAD (<0.65 mSv/sol)", color: "#10b981", description: "Safe astronaut EVA exposure envelope" },
      { label: "Elevated RAD / SEP Alert (>0.75 mSv/sol)", color: "#dc2626", description: "Decreased shielding; restrict continuous surface excursion" },
    ],
    sourceCitation: {
      dataset: "MGS MAG/ER Magnetic Crustal Field & MSL RAD Dosimetry",
      instrumentOrMission: "NASA MGS MAG & MSL Curiosity RAD / REMS",
      attributionText: "NASA Goddard Space Flight Center, SwRI & CAB (CSIC-INTA)",
      sourceUrl: "https://pds-ppi.igpp.ucla.edu/",
    },
  },
];
