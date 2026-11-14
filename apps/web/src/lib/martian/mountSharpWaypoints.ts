/**
 * Mount Sharp (Aeolis Mons) & Gale Crater Waypoint Registry
 *
 * Coordinates centered at Gale Crater (Lat: -5.4453°, Lon: 137.8414°).
 * Features Curiosity rover traverses, 2025 Boxwork discoveries, and candidate astronaut traverses.
 */

import { ConsistencyIndexCT } from "./scientificParams.js";

export type WaypointCategory =
  | "boxwork_formation"
  | "mineral_vein"
  | "clay_trough"
  | "ridge_escarpment"
  | "habitat_landing"
  | "hazard_zone";

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

  // Topographic & Mobility Hazards
  meanSlopeDeg: number;
  maxSlopeDeg: number;
  roughnessHapkeThetaDeg: number;
  craterDensityBeta: number;

  // Radiation & Atmospheric Environment
  surfaceRadiationMSvSol: number; // MSL RAD measured dose
  windExposureRisk: "low" | "moderate" | "high";

  // Geochemical & In-Situ Rover Ground Truth
  mineralogy: {
    sulfatePercent: number;
    hematitePercent: number;
    phyllosilicateClayPercent: number;
    silicaPercent: number;
    perchloratePercent: number;
  };
  roverGroundTruth?: {
    instrument: "APXS" | "ChemCam" | "Mastcam" | "SAM";
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
    name: "Ares Habitat Site Alpha (Bradbury Plains)",
    category: "habitat_landing",
    coordinates: [137.4417, -4.5895],
    elevationM: -4501,
    geologicUnit: "Gale Floor Alluvial Fan Unit (Peace Vallis sediment)",
    stratigraphicAge: "Hesperian",
    apparentThermalInertiaTiu: 310,
    consistencyIndexCT: 0,
    meanSlopeDeg: 2.1,
    maxSlopeDeg: 4.8,
    roughnessHapkeThetaDeg: 16.2,
    craterDensityBeta: 0.22,
    surfaceRadiationMSvSol: 0.62,
    windExposureRisk: "low",
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
    consistencyIndexCT: 1, // +1: low-TI mantling over dense cemented veins
    estimatedBuriedIceDepthM: 0.45,
    meanSlopeDeg: 11.4,
    maxSlopeDeg: 19.8,
    roughnessHapkeThetaDeg: 28.5,
    craterDensityBeta: 0.35,
    surfaceRadiationMSvSol: 0.68,
    windExposureRisk: "moderate",
    mineralogy: {
      sulfatePercent: 48,
      hematitePercent: 14,
      phyllosilicateClayPercent: 18,
      silicaPercent: 32,
      perchloratePercent: 0.8,
    },
    roverGroundTruth: {
      instrument: "ChemCam",
      solInvestigated: 4180,
      targetName: "Aeolis Boxwork Ridge",
      keyFinding: "Network of polygonal mineral ridges formed as groundwater crystallized minerals into deep bedrock cracks. High polyhydrated sulfate retention.",
    },
    evaSuitTraversable: true,
    muleRoverTraversable: true,
    scientificPriority: 5,
    briefDescription: "Crucial 2025 scientific discovery: crystalline mineral veins preserving ancient subsurface hydrothermal pathways and water-ice signatures.",
  },
  {
    id: "vera_rubin_ridge",
    name: "Vera Rubin Ridge (Hematite Escarpment)",
    category: "ridge_escarpment",
    coordinates: [137.3821, -4.7214],
    elevationM: -4205,
    geologicUnit: "Murray Formation / Vera Rubin Member (Hematite-rich lacustrine mudstone)",
    stratigraphicAge: "Hesperian",
    apparentThermalInertiaTiu: 560,
    consistencyIndexCT: 0,
    meanSlopeDeg: 17.5,
    maxSlopeDeg: 27.2,
    roughnessHapkeThetaDeg: 26.0,
    craterDensityBeta: 0.28,
    surfaceRadiationMSvSol: 0.74,
    windExposureRisk: "high",
    mineralogy: {
      sulfatePercent: 16,
      hematitePercent: 38,
      phyllosilicateClayPercent: 22,
      silicaPercent: 40,
      perchloratePercent: 0.3,
    },
    roverGroundTruth: {
      instrument: "Mastcam",
      solInvestigated: 1812,
      targetName: "Puchilibu Scarp",
      keyFinding: "Grey crystalline hematite laminations. High structural hardness; severe slope hazard on northern scarp.",
    },
    evaSuitTraversable: false, // slope caution > 25° sections
    muleRoverTraversable: false,
    scientificPriority: 4,
    briefDescription: "High-standing bedrock ridge composed of erosion-resistant hematite cement, offering key markers of acidic oxidation transitions.",
  },
  {
    id: "glen_torridon_trough",
    name: "Glen Torridon Clay-Bearing Trough",
    category: "clay_trough",
    coordinates: [137.3985, -4.7562],
    elevationM: -4310,
    geologicUnit: "Jura & Knockfarril Hill Members (Smectite phyllosilicate shale)",
    stratigraphicAge: "Hesperian",
    apparentThermalInertiaTiu: 230,
    consistencyIndexCT: 1,
    estimatedBuriedIceDepthM: 0.85,
    meanSlopeDeg: 6.2,
    maxSlopeDeg: 12.1,
    roughnessHapkeThetaDeg: 17.8,
    craterDensityBeta: 0.19,
    surfaceRadiationMSvSol: 0.64,
    windExposureRisk: "low",
    mineralogy: {
      sulfatePercent: 8,
      hematitePercent: 9,
      phyllosilicateClayPercent: 54,
      silicaPercent: 48,
      perchloratePercent: 0.2,
    },
    roverGroundTruth: {
      instrument: "SAM",
      solInvestigated: 2380,
      targetName: "Kilmarie Drill Hole",
      keyFinding: "Abundant smectite clays preserving organic chemical signatures and habitable aqueous conditions.",
    },
    evaSuitTraversable: true,
    muleRoverTraversable: true,
    scientificPriority: 5,
    briefDescription: "Broad valley rich in clay minerals from an ancient calm lake; ideal terrain for ground traverses and hydrated resource sampling.",
  },
  {
    id: "greenheugh_pediment",
    name: "Greenheugh Pediment & Capping Unconformity",
    category: "ridge_escarpment",
    coordinates: [137.3624, -4.7681],
    elevationM: -4150,
    geologicUnit: "Stimson Sandstone (Aeolian dune cross-bedding capping unit)",
    stratigraphicAge: "Amazonian",
    apparentThermalInertiaTiu: 420,
    consistencyIndexCT: -1, // -1: dense sandstone cap overlying softer clay mudstone
    meanSlopeDeg: 23.5,
    maxSlopeDeg: 32.0,
    roughnessHapkeThetaDeg: 31.2,
    craterDensityBeta: 0.41,
    surfaceRadiationMSvSol: 0.79,
    windExposureRisk: "high",
    mineralogy: {
      sulfatePercent: 14,
      hematitePercent: 12,
      phyllosilicateClayPercent: 10,
      silicaPercent: 62,
      perchloratePercent: 0.5,
    },
    roverGroundTruth: {
      instrument: "ChemCam",
      solInvestigated: 2704,
      targetName: "Edinburgh Escarpment",
      keyFinding: "Angular unconformity with ventifact-carved boulders and impassable sand dunes forcing rover turnaround.",
    },
    evaSuitTraversable: false,
    muleRoverTraversable: false,
    scientificPriority: 4,
    briefDescription: "Steep-sided plateau capped by ancient petrified sand dunes; represents a critical mobility barrier requiring strict bypass routing.",
  },
  {
    id: "gediz_vallis_ridge",
    name: "Gediz Vallis Debris Ridge & Boulder Chute",
    category: "hazard_zone",
    coordinates: [137.4208, -4.8115],
    elevationM: -3990,
    geologicUnit: "Late-stage fluvial/debris flow conglomerate boulders",
    stratigraphicAge: "Amazonian",
    apparentThermalInertiaTiu: 510,
    consistencyIndexCT: 0,
    meanSlopeDeg: 19.8,
    maxSlopeDeg: 28.5,
    roughnessHapkeThetaDeg: 29.8,
    craterDensityBeta: 0.38,
    surfaceRadiationMSvSol: 0.71,
    windExposureRisk: "high",
    mineralogy: {
      sulfatePercent: 28,
      hematitePercent: 18,
      phyllosilicateClayPercent: 14,
      silicaPercent: 41,
      perchloratePercent: 0.6,
    },
    roverGroundTruth: {
      instrument: "Mastcam",
      solInvestigated: 3920,
      targetName: "Gediz Canyon Overlook",
      keyFinding: "Car-sized boulders transported by violent water-rich debris flows after Mount Sharp had already formed.",
    },
    evaSuitTraversable: false,
    muleRoverTraversable: false,
    scientificPriority: 4,
    briefDescription: "Deep channel carved by water and mud flows carrying boulders from the upper peak; unstable loose talus hazard.",
  },
  {
    id: "marker_band_valley",
    name: "Marker Band Ripple Strata",
    category: "mineral_vein",
    coordinates: [137.4082, -4.7951],
    elevationM: -4110,
    geologicUnit: "Sulfate Transition Unit (Rippled dark hard layer)",
    stratigraphicAge: "Hesperian",
    apparentThermalInertiaTiu: 430,
    consistencyIndexCT: 1,
    estimatedBuriedIceDepthM: 0.6,
    meanSlopeDeg: 8.5,
    maxSlopeDeg: 14.2,
    roughnessHapkeThetaDeg: 20.4,
    craterDensityBeta: 0.24,
    surfaceRadiationMSvSol: 0.66,
    windExposureRisk: "moderate",
    mineralogy: {
      sulfatePercent: 36,
      hematitePercent: 16,
      phyllosilicateClayPercent: 20,
      silicaPercent: 39,
      perchloratePercent: 0.4,
    },
    roverGroundTruth: {
      instrument: "Mastcam",
      solInvestigated: 3600,
      targetName: "Canaima Ripples",
      keyFinding: "Distinct rippled rock textures created by waves in a shallow lake billions of years ago.",
    },
    evaSuitTraversable: true,
    muleRoverTraversable: true,
    scientificPriority: 5,
    briefDescription: "Wave-rippled strata indicating prolonged surface water interactions; prime terrain for sampling and safe traversals.",
  },
];
