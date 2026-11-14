/**
 * Mount Sharp (Aeolis Mons) & Gale Crater Waypoint Registry
 *
 * Coordinates centered at Gale Crater (Lat: -5.4453°, Lon: 137.8414°).
 * Features Curiosity rover historical traverses, 2025 Boxwork discoveries, and candidate astronaut traverses.
 * Includes full 5-term SWIM subsurface water-ice indicators, MGS MAG crustal magnetic fields,
 * THEMIS Night IR sand trap detections, CRISM hydrated mineralogy, and Curiosity raw imagery links.
 */

import { ConsistencyIndexCT, Swim5TermConsistency, SandTrapRiskLevel, SurfaceFirmnessStatus } from "./scientificParams.js";

export type WaypointCategory =
  | "boxwork_formation"
  | "mineral_vein"
  | "clay_trough"
  | "ridge_escarpment"
  | "habitat_landing"
  | "hazard_zone";

export interface ChemCamOxides {
  sio2: number; // Silicon Dioxide
  feot: number; // Total Iron as FeO
  mgo: number; // Magnesium Oxide
  cao: number; // Calcium Oxide
  al2o3: number; // Aluminum Oxide
  so3: number; // Sulfur Trioxide
}

export interface RoverRawImageData {
  sol: number;
  camera: "MASTCAM-100" | "MASTCAM-34" | "NAVCAM_LEFT" | "HAZCAM_FRONT";
  targetName: string;
  elevationAngleDeg: number;
  pointingAzimuthDeg: number;
  imageUrl: string;
  caption: string;
  sourceCredit: string;
}

export interface MountSharpWaypoint {
  id: string;
  name: string;
  category: WaypointCategory;
  coordinates: [number, number]; // [lon, lat] in Mars decimal degrees (aerocentric)
  elevationM: number; // Mars datum elevation (MOLA / HRSC 1m DTM)
  geologicUnit: string;
  stratigraphicAge: "Noachian" | "Hesperian" | "Amazonian";

  // Thermal & Subsurface Telemetry (Morgan et al. 2020)
  apparentThermalInertiaTiu: number; // MGS TES / Odyssey THEMIS
  consistencyIndexCT: ConsistencyIndexCT;
  estimatedBuriedIceDepthM?: number;

  // 5-Term Subsurface Water Ice Mapping (SWIM) Indicators
  swimIndicators?: Swim5TermConsistency;

  // ChemCam Major Oxide Rock Chemistry (NASA AMMOS MMGIS Paper 2541, Fig. 2)
  chemCamOxides?: ChemCamOxides;

  // Real NASA/JPL Rover Surface Imagery
  roverRawImage?: RoverRawImageData;

  // Topographic & Mobility Hazards
  meanSlopeDeg: number;
  maxSlopeDeg: number;
  roughnessHapkeThetaDeg: number;
  craterDensityBeta: number;

  // Radiation & Atmospheric Environment
  surfaceRadiationMSvSol: number; // MSL RAD measured dose
  windExposureRisk: "low" | "moderate" | "high";

  // MGS MAG Crustal Magnetic Field (nT) & Natural Shielding
  crustalMagneticFieldNt: number;

  // THEMIS Night IR & Sand Trap Detector
  themisNightTempK: number;
  sandTrapRisk: SandTrapRiskLevel;
  surfaceFirmness: SurfaceFirmnessStatus;

  // CRISM Hydrated Mineralogy & GRS/MONS WEH
  waterEquivalentHydrogenPercent: number;
  dominantHydratedMineral: string;

  // Geochemical & In-Situ Rover Ground Truth
  mineralogy: {
    sulfatePercent: number;
    hematitePercent: number;
    phyllosilicateClayPercent: number;
    silicaPercent: number;
    perchloratePercent: number;
  };
  roverGroundTruth?: {
    instrument: "APXS" | "ChemCam" | "Mastcam" | "SAM" | "Hazcam" | "Navcam";
    solInvestigated: number;
    targetName: string;
    keyFinding: string;
  };

  // Human Marswalk Operational Metadata
  evaSuitTraversable: boolean;
  muleRoverTraversable: boolean;
  scientificPriority: 1 | 2 | 3 | 4 | 5; // 5 = highest
  briefDescription: string;
}

export const MOUNT_SHARP_WAYPOINTS: MountSharpWaypoint[] = [
  {
    id: "gale_hab_alpha",
    name: "MarsForAll Habitat Alpha (Bradbury Plains)",
    category: "habitat_landing",
    coordinates: [137.4417, -4.5895],
    elevationM: -4501,
    geologicUnit: "Gale Floor Alluvial Fan Unit (Peace Vallis sediment)",
    stratigraphicAge: "Hesperian",
    apparentThermalInertiaTiu: 310,
    consistencyIndexCT: 0,
    swimIndicators: {
      cn: 0.10,
      ct: 0,
      cg: -0.10,
      crs: 0.15,
      crd: -0.70,
      epsilonPrime: 7.10,
      compositeSwimScore: -0.12,
      materialClassification: "Basaltic Regolith Alluvial Floor",
    },
    chemCamOxides: {
      sio2: 44.5,
      feot: 19.2,
      mgo: 11.2,
      cao: 8.8,
      al2o3: 10.5,
      so3: 5.8,
    },
    roverRawImage: {
      sol: 2,
      camera: "MASTCAM-34",
      targetName: "Bradbury Landing Touchdown Panorama",
      elevationAngleDeg: -4.2,
      pointingAzimuthDeg: 135,
      imageUrl: "https://photojournal.jpl.nasa.gov/jpeg/PIA16051.jpg",
      caption: "Curiosity first high-resolution Mastcam panorama of Bradbury Landing alluvial gravels.",
      sourceCredit: "NASA / JPL-Caltech / MSSS",
    },
    meanSlopeDeg: 2.1,
    maxSlopeDeg: 4.8,
    roughnessHapkeThetaDeg: 16.2,
    craterDensityBeta: 0.22,
    surfaceRadiationMSvSol: 0.62,
    windExposureRisk: "low",
    crustalMagneticFieldNt: 28,
    themisNightTempK: 184,
    sandTrapRisk: "LOW",
    surfaceFirmness: "BEDROCK FIRM",
    waterEquivalentHydrogenPercent: 3.2,
    dominantHydratedMineral: "Basaltic Plagioclase / Low-Hydration Regolith",
    mineralogy: {
      sulfatePercent: 12,
      hematitePercent: 8,
      phyllosilicateClayPercent: 15,
      silicaPercent: 44,
      perchloratePercent: 0.4,
    },
    roverGroundTruth: {
      instrument: "APXS",
      solInvestigated: 2,
      targetName: "Bradbury Base Calibration",
      keyFinding: "Fine-grained basaltic regolith pavement, stable touchdown substrate.",
    },
    evaSuitTraversable: true,
    muleRoverTraversable: true,
    scientificPriority: 3,
    briefDescription: "Primary pressurized habitat landing zone. Flat, low-slope terrain with clear line-of-sight to communications relays.",
  },
  {
    id: "curiosity_boxwork_2025",
    name: "Mount Sharp Boxwork Formations (Curiosity 2025 Site)",
    category: "boxwork_formation",
    coordinates: [137.8414, -5.4453],
    elevationM: -3912,
    geologicUnit: "Sulfate-Bearing Boxwork Network Unit (Fracture-fill cementation)",
    stratigraphicAge: "Hesperian",
    apparentThermalInertiaTiu: 485,
    consistencyIndexCT: 1,
    estimatedBuriedIceDepthM: 0.45,
    swimIndicators: {
      cn: 0.72,
      ct: 1,
      cg: 0.85,
      crs: 0.60,
      crd: 0.78,
      epsilonPrime: 3.48,
      compositeSwimScore: 0.73,
      materialClassification: "Polyhydrated Sulfate Lattice & Subsurface Hydration",
    },
    chemCamOxides: {
      sio2: 36.2,
      feot: 11.5,
      mgo: 6.8,
      cao: 12.1,
      al2o3: 5.0,
      so3: 28.4,
    },
    roverRawImage: {
      sol: 4180,
      camera: "MASTCAM-100",
      targetName: "Aeolis Boxwork Web Ridge Mosaic",
      elevationAngleDeg: 8.5,
      pointingAzimuthDeg: 162,
      imageUrl: "https://photojournal.jpl.nasa.gov/jpeg/PIA26377.jpg",
      caption: "Intricate polygonal mineral ridges where subsurface groundwater crystallized minerals into ancient bedrock fissures.",
      sourceCredit: "NASA / JPL-Caltech / MSSS",
    },
    meanSlopeDeg: 11.4,
    maxSlopeDeg: 19.8,
    roughnessHapkeThetaDeg: 28.5,
    craterDensityBeta: 0.35,
    surfaceRadiationMSvSol: 0.71,
    windExposureRisk: "moderate",
    crustalMagneticFieldNt: 72,
    themisNightTempK: 196,
    sandTrapRisk: "LOW",
    surfaceFirmness: "BEDROCK FIRM",
    waterEquivalentHydrogenPercent: 6.8,
    dominantHydratedMineral: "Polyhydrated Calcium-Magnesium Sulfates",
    mineralogy: {
      sulfatePercent: 48,
      hematitePercent: 12,
      phyllosilicateClayPercent: 18,
      silicaPercent: 20,
      perchloratePercent: 0.8,
    },
    roverGroundTruth: {
      instrument: "ChemCam",
      solInvestigated: 4180,
      targetName: "Aeolis Ridge Blade Target",
      keyFinding: "High calcium-sulfate cementation along polygonal fracture planes, indicative of extensive hydrothermal groundwater circulation.",
    },
    evaSuitTraversable: true,
    muleRoverTraversable: false,
    scientificPriority: 5,
    briefDescription: "Prime scientific objective for 2026. Intricate polygonal blade networks spanning hundreds of meters, preserving ancient groundwater mineralization.",
  },
  {
    id: "vera_rubin_ridge",
    name: "Vera Rubin Hematite Ridge",
    category: "ridge_escarpment",
    coordinates: [137.3800, -4.7500],
    elevationM: -4200,
    geologicUnit: "Hematite-Capped Lacustrine Strata (Murray Formation)",
    stratigraphicAge: "Hesperian",
    apparentThermalInertiaTiu: 430,
    consistencyIndexCT: 0,
    swimIndicators: {
      cn: 0.35,
      ct: 0,
      cg: 0.20,
      crs: 0.45,
      crd: -0.20,
      epsilonPrime: 5.60,
      compositeSwimScore: 0.12,
      materialClassification: "Dense Crystalline Hematite Caprock",
    },
    chemCamOxides: {
      sio2: 41.0,
      feot: 28.5,
      mgo: 5.2,
      cao: 6.1,
      al2o3: 8.4,
      so3: 7.2,
    },
    roverRawImage: {
      sol: 1809,
      camera: "MASTCAM-100",
      targetName: "Vera Rubin Ridge Escarpment",
      elevationAngleDeg: 12.0,
      pointingAzimuthDeg: 215,
      imageUrl: "https://photojournal.jpl.nasa.gov/jpeg/PIA22207.jpg",
      caption: "Vera Rubin Ridge stands out as an erosion-resistant topographic high enriched in crystalline gray hematite.",
      sourceCredit: "NASA / JPL-Caltech / MSSS",
    },
    meanSlopeDeg: 14.8,
    maxSlopeDeg: 23.5,
    roughnessHapkeThetaDeg: 24.1,
    craterDensityBeta: 0.31,
    surfaceRadiationMSvSol: 0.68,
    windExposureRisk: "high",
    crustalMagneticFieldNt: 64,
    themisNightTempK: 192,
    sandTrapRisk: "LOW",
    surfaceFirmness: "BEDROCK FIRM",
    waterEquivalentHydrogenPercent: 4.5,
    dominantHydratedMineral: "Crystalline Hematite (Gray Hematite Cap)",
    mineralogy: {
      sulfatePercent: 18,
      hematitePercent: 42,
      phyllosilicateClayPercent: 14,
      silicaPercent: 24,
      perchloratePercent: 0.3,
    },
    roverGroundTruth: {
      instrument: "Mastcam",
      solInvestigated: 1809,
      targetName: "Stoer Hematite Drill Site",
      keyFinding: "Hard, erosion-resistant gray hematite diagenesis over fine-grained lacustrine mudstone.",
    },
    evaSuitTraversable: true,
    muleRoverTraversable: true,
    scientificPriority: 4,
    briefDescription: "Prominent northeast-trending ridge characterized by intense crystalline hematite spectral signatures, offering a commanding vista of Gale Crater.",
  },
  {
    id: "glen_torridon_trough",
    name: "Glen Torridon Smectite Clay Valley",
    category: "clay_trough",
    coordinates: [137.3900, -4.8500],
    elevationM: -4150,
    geologicUnit: "Clay-Bearing Valley Unit (Jura / Knockfarril Hill Member)",
    stratigraphicAge: "Hesperian",
    apparentThermalInertiaTiu: 260,
    consistencyIndexCT: 1,
    estimatedBuriedIceDepthM: 0.8,
    swimIndicators: {
      cn: 0.65,
      ct: 1,
      cg: 0.40,
      crs: 0.30,
      crd: 0.55,
      epsilonPrime: 4.10,
      compositeSwimScore: 0.58,
      materialClassification: "Hydrated Phyllosilicate Clay Mudstone",
    },
    chemCamOxides: {
      sio2: 52.1,
      feot: 14.2,
      mgo: 7.8,
      cao: 4.5,
      al2o3: 13.8,
      so3: 4.1,
    },
    roverRawImage: {
      sol: 2610,
      camera: "MASTCAM-100",
      targetName: "Glen Torridon Clay Trough Bedrock",
      elevationAngleDeg: -2.0,
      pointingAzimuthDeg: 95,
      imageUrl: "https://photojournal.jpl.nasa.gov/jpeg/PIA23623.jpg",
      caption: "Glen Torridon contains the strongest orbital signatures of clay minerals (phyllosilicates) found anywhere on Mount Sharp.",
      sourceCredit: "NASA / JPL-Caltech / MSSS",
    },
    meanSlopeDeg: 6.2,
    maxSlopeDeg: 11.0,
    roughnessHapkeThetaDeg: 18.0,
    craterDensityBeta: 0.18,
    surfaceRadiationMSvSol: 0.64,
    windExposureRisk: "low",
    crustalMagneticFieldNt: 35,
    themisNightTempK: 178,
    sandTrapRisk: "MODERATE",
    surfaceFirmness: "MODERATE COMPACTION",
    waterEquivalentHydrogenPercent: 5.9,
    dominantHydratedMineral: "Fe/Mg Smectite Clay (Nontronite Mudstone)",
    mineralogy: {
      sulfatePercent: 10,
      hematitePercent: 12,
      phyllosilicateClayPercent: 48,
      silicaPercent: 28,
      perchloratePercent: 0.2,
    },
    roverGroundTruth: {
      instrument: "SAM",
      solInvestigated: 2420,
      targetName: "Kilmarie Mudstone Core",
      keyFinding: "High yield of indigenous organic sulfur compounds evolved from smectite clay-rich mudstones.",
    },
    evaSuitTraversable: true,
    muleRoverTraversable: true,
    scientificPriority: 4,
    briefDescription: "Protected lowland trough with high concentration of potassium- and iron-bearing phyllosilicates, ideal for rover and suit mobility.",
  },
  {
    id: "greenheugh_pediment",
    name: "Greenheugh Pediment Unconformity",
    category: "ridge_escarpment",
    coordinates: [137.3600, -4.7800],
    elevationM: -4050,
    geologicUnit: "Gediz Vallis Sandstone Unconformity (Stimson Formation)",
    stratigraphicAge: "Amazonian",
    apparentThermalInertiaTiu: 380,
    consistencyIndexCT: 0,
    swimIndicators: {
      cn: 0.15,
      ct: 0,
      cg: 0.10,
      crs: 0.25,
      crd: -0.40,
      epsilonPrime: 6.40,
      compositeSwimScore: 0.02,
      materialClassification: "Dry Cross-Bedded Dune Sandstone",
    },
    chemCamOxides: {
      sio2: 48.0,
      feot: 18.0,
      mgo: 8.5,
      cao: 7.2,
      al2o3: 9.8,
      so3: 6.0,
    },
    roverRawImage: {
      sol: 2720,
      camera: "NAVCAM_LEFT",
      targetName: "Greenheugh Pediment Scarp Ascent",
      elevationAngleDeg: 15.4,
      pointingAzimuthDeg: 275,
      imageUrl: "https://photojournal.jpl.nasa.gov/jpeg/PIA23835.jpg",
      caption: "Curiosity climbed a record 31-degree slope onto the Greenheugh Pediment caprock.",
      sourceCredit: "NASA / JPL-Caltech / MSSS",
    },
    meanSlopeDeg: 18.5,
    maxSlopeDeg: 31.0,
    roughnessHapkeThetaDeg: 32.0,
    craterDensityBeta: 0.42,
    surfaceRadiationMSvSol: 0.74,
    windExposureRisk: "high",
    crustalMagneticFieldNt: 41,
    themisNightTempK: 188,
    sandTrapRisk: "LOW",
    surfaceFirmness: "BEDROCK FIRM",
    waterEquivalentHydrogenPercent: 3.8,
    dominantHydratedMineral: "Cross-Bedded Amazonian Sandstone Cap",
    mineralogy: {
      sulfatePercent: 15,
      hematitePercent: 10,
      phyllosilicateClayPercent: 8,
      silicaPercent: 62,
      perchloratePercent: 0.5,
    },
    roverGroundTruth: {
      instrument: "Hazcam",
      solInvestigated: 2720,
      targetName: "Pediment Scarp Overhang",
      keyFinding: "Amazonian wind-blown sandstones unconformably overlying tilted Hesperian mudstones; severe wheel-slip corridor.",
    },
    evaSuitTraversable: false,
    muleRoverTraversable: false,
    scientificPriority: 3,
    briefDescription: "Steep scarp capped by cross-bedded Amazonian eolian sandstones. High slope gradient (>25°) renders direct suit traversal hazardous.",
  },
  {
    id: "gediz_vallis_ridge",
    name: "Gediz Vallis Debris Flow Channel",
    category: "hazard_zone",
    coordinates: [137.4800, -5.0500],
    elevationM: -4020,
    geologicUnit: "Debris Flow & Boulder-Choked Alluvium Unit",
    stratigraphicAge: "Amazonian",
    apparentThermalInertiaTiu: 180,
    consistencyIndexCT: -1,
    swimIndicators: {
      cn: 0.25,
      ct: -1,
      cg: 0.50,
      crs: -0.20,
      crd: -0.10,
      epsilonPrime: 5.30,
      compositeSwimScore: -0.15,
      materialClassification: "Loose Eolian Scree & Desiccated Debris",
    },
    chemCamOxides: {
      sio2: 42.1,
      feot: 22.0,
      mgo: 9.4,
      cao: 7.0,
      al2o3: 8.9,
      so3: 9.5,
    },
    roverRawImage: {
      sol: 4100,
      camera: "MASTCAM-100",
      targetName: "Gediz Vallis Sulfur Field",
      elevationAngleDeg: -3.5,
      pointingAzimuthDeg: 210,
      imageUrl: "https://photojournal.jpl.nasa.gov/jpeg/PIA26315.jpg",
      caption: "Curiosity cracked open a rock in Gediz Vallis revealing rare yellow elemental sulfur crystals.",
      sourceCredit: "NASA / JPL-Caltech / MSSS",
    },
    meanSlopeDeg: 21.2,
    maxSlopeDeg: 34.5,
    roughnessHapkeThetaDeg: 36.5,
    craterDensityBeta: 0.48,
    surfaceRadiationMSvSol: 0.76,
    windExposureRisk: "high",
    crustalMagneticFieldNt: 48,
    themisNightTempK: 172,
    sandTrapRisk: "HIGH",
    surfaceFirmness: "SOFT SAND TRAP RISK",
    waterEquivalentHydrogenPercent: 4.8,
    dominantHydratedMineral: "Boulder-Rich Debris Flow Infill & Sulfate Sands",
    mineralogy: {
      sulfatePercent: 32,
      hematitePercent: 14,
      phyllosilicateClayPercent: 12,
      silicaPercent: 38,
      perchloratePercent: 1.2,
    },
    roverGroundTruth: {
      instrument: "APXS",
      solInvestigated: 4100,
      targetName: "Crushed Elemental Sulfur Boulder",
      keyFinding: "Pure elemental sulfur interior within late-stage torrential mudflow boulders.",
    },
    evaSuitTraversable: false,
    muleRoverTraversable: false,
    scientificPriority: 4,
    briefDescription: "Violent catastrophic flood channel. Boulder-strewn terrain and steep talus slopes pose severe entrapment hazards.",
  },
  {
    id: "marker_band_valley",
    name: "Marker Band Lacustrine Ripple Zone",
    category: "mineral_vein",
    coordinates: [137.4100, -4.9200],
    elevationM: -4105,
    geologicUnit: "Marker Band Resistant Bed (Lower Sulfate Unit)",
    stratigraphicAge: "Hesperian",
    apparentThermalInertiaTiu: 360,
    consistencyIndexCT: 1,
    estimatedBuriedIceDepthM: 0.6,
    swimIndicators: {
      cn: 0.48,
      ct: 1,
      cg: 0.35,
      crs: 0.40,
      crd: 0.30,
      epsilonPrime: 4.65,
      compositeSwimScore: 0.41,
      materialClassification: "Rippled Sulfate Bedrock Transition",
    },
    chemCamOxides: {
      sio2: 39.5,
      feot: 16.8,
      mgo: 6.5,
      cao: 10.2,
      al2o3: 5.0,
      so3: 22.0,
    },
    roverRawImage: {
      sol: 3724,
      camera: "MASTCAM-100",
      targetName: "Marker Band Ripple Rocks",
      elevationAngleDeg: -6.0,
      pointingAzimuthDeg: 170,
      imageUrl: "https://photojournal.jpl.nasa.gov/jpeg/PIA25740.jpg",
      caption: "Rippled rock textures formed billions of years ago as waves in a shallow lake stirred up sediment on the lake floor.",
      sourceCredit: "NASA / JPL-Caltech / MSSS",
    },
    meanSlopeDeg: 8.5,
    maxSlopeDeg: 14.2,
    roughnessHapkeThetaDeg: 20.4,
    craterDensityBeta: 0.24,
    surfaceRadiationMSvSol: 0.66,
    windExposureRisk: "moderate",
    crustalMagneticFieldNt: 56,
    themisNightTempK: 182,
    sandTrapRisk: "MODERATE",
    surfaceFirmness: "MODERATE COMPACTION",
    waterEquivalentHydrogenPercent: 5.4,
    dominantHydratedMineral: "Rippled Carbonate/Sulfate Resistant Marker Stratum",
    mineralogy: {
      sulfatePercent: 36,
      hematitePercent: 16,
      phyllosilicateClayPercent: 20,
      silicaPercent: 39,
      perchloratePercent: 0.4,
    },
    roverGroundTruth: {
      instrument: "ChemCam",
      solInvestigated: 3724,
      targetName: "Marker Band Wave Ripples",
      keyFinding: "Rippled rock textures created within shallow ancient lake waves; high sulfate transition phase.",
    },
    evaSuitTraversable: true,
    muleRoverTraversable: true,
    scientificPriority: 4,
    briefDescription: "Extremely hard, resistant dark layer featuring unmistakable wave-ripple marks formed under an ancient lake.",
  },
];

/**
 * Historical Traverse of NASA MSL Curiosity Rover across Gale Crater & Mount Sharp
 * Spanning Bradbury Landing (Sol 0) to 2025 Boxwork Formations (Sol 4180+)
 */
export interface CuriosityTraversePoint {
  id: string;
  name: string;
  sol: number;
  coordinates: [number, number]; // [lon, lat]
  elevationM: number;
  milestone: string;
  keyFinding: string;
}

export const CURIOSITY_HISTORICAL_TRAVERSE: CuriosityTraversePoint[] = [
  {
    id: "sol_0_touchdown",
    name: "Bradbury Landing Touchdown",
    sol: 0,
    coordinates: [137.4417, -4.5895],
    elevationM: -4501,
    milestone: "Touchdown inside Gale Crater landing ellipse via Sky Crane.",
    keyFinding: "Alluvial gravel pavement confirming fluvial transport from crater rim.",
  },
  {
    id: "sol_125_yellowknife",
    name: "Yellowknife Bay (John Klein)",
    sol: 125,
    coordinates: [137.4520, -4.5905],
    elevationM: -4520,
    milestone: "First powder drill sampling on Mars (John Klein & Cumberland).",
    keyFinding: "Sheepbed mudstone proving an ancient habitable freshwater lake with neutral pH.",
  },
  {
    id: "sol_750_pahrump",
    name: "Pahrump Hills (Murray Formation)",
    sol: 750,
    coordinates: [137.4050, -4.6800],
    elevationM: -4450,
    milestone: "Arrival at the foundational basal strata of Mount Sharp.",
    keyFinding: "Laminated lacustrine mudstone indicating hundreds of meters of lake sediment accumulation.",
  },
  {
    id: "sol_1800_verarubin",
    name: "Vera Rubin Hematite Ridge",
    sol: 1800,
    coordinates: [137.3800, -4.7500],
    elevationM: -4200,
    milestone: "Ascent of resistant northeast-trending caprock ridge.",
    keyFinding: "Crystalline gray hematite precipitated by ancient groundwater redox gradients.",
  },
  {
    id: "sol_2300_torridon",
    name: "Glen Torridon Clay Trough",
    sol: 2300,
    coordinates: [137.3900, -4.8500],
    elevationM: -4150,
    milestone: "Exploration of highest orbital clay spectral absorption zone.",
    keyFinding: "Abundant smectite clays preserving organic sulfur compounds in mudstone.",
  },
  {
    id: "sol_3800_gediz",
    name: "Gediz Vallis Debris Flow",
    sol: 3800,
    coordinates: [137.4800, -5.0500],
    elevationM: -4020,
    milestone: "Traversing catastrophic boulder-rich debris flow channel.",
    keyFinding: "First discovery of pure yellow elemental sulfur crystals on Mars.",
  },
  {
    id: "sol_4180_boxwork",
    name: "Mount Sharp Boxwork Network",
    sol: 4180,
    coordinates: [137.8414, -5.4453],
    elevationM: -3912,
    milestone: "Curiosity 2025 discovery of extensive mineral vein lattice.",
    keyFinding: "Intricate polygonal calcium-sulfate fracture ridges from deep hydrothermal circulation.",
  },
];

/**
 * Bradbury Landing Ellipse Coordinates (20 km x 7 km Ellipse)
 * Centered at [137.4417, -4.5895] with a -25° WNW-ESE orientation.
 */
function generateLandingEllipse(): [number, number][] {
  const centerLon = 137.4417;
  const centerLat = -4.5895;
  const a = 0.165; // semi-major in degrees (~10 km)
  const b = 0.058; // semi-minor in degrees (~3.5 km)
  const angleRad = (-25 * Math.PI) / 180.0;
  const coords: [number, number][] = [];
  const points = 36;

  for (let i = 0; i <= points; i++) {
    const theta = (i * 2 * Math.PI) / points;
    const x0 = a * Math.cos(theta);
    const y0 = b * Math.sin(theta);
    const rotX = x0 * Math.cos(angleRad) - y0 * Math.sin(angleRad);
    const rotY = x0 * Math.sin(angleRad) + y0 * Math.cos(angleRad);
    coords.push([
      Number((centerLon + rotX).toFixed(6)),
      Number((centerLat + rotY).toFixed(6)),
    ]);
  }
  return coords;
}

export const BRADBURY_LANDING_ELLIPSE: [number, number][] = generateLandingEllipse();
