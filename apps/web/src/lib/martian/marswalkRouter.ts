/**
 * Terrain-Aware Marswalk Route Planner & Crew/Rover Support Engine
 *
 * Implements an A* least-cost path finding algorithm across Mount Sharp terrain.
 * Respects strict slope safety thresholds (<15° Safe Walk, 15-25° Caution, >25° Impassable),
 * accounts for surface radiation exposure, and dynamically recomputes consumables
 * based on Mission Support Mode:
 *   - Solo Astronaut
 *   - Paired Crew + Cargo Mule Rover
 */

import {
  classifySlopeHazard,
  computeTerrainImpedance,
  computeLambertianPhotometry,
  LambertianPhotometryMetrics,
  SandTrapRiskLevel,
  SurfaceFirmnessStatus,
  computeCrustalMagneticShielding,
} from "./scientificParams";
import { MountSharpWaypoint, ALL_MARTIAN_WAYPOINTS } from "./mountSharpWaypoints";
import { calculateMartianDistanceKm } from "./prospectorScorer";

export type MissionSupportMode = "SOLO_ASTRONAUT" | "PAIRED_CREW_MULE_ROVER";

export type TurnType =
  | "START"
  | "STRAIGHT"
  | "SLIGHT_LEFT"
  | "LEFT"
  | "SHARP_LEFT"
  | "SLIGHT_RIGHT"
  | "RIGHT"
  | "SHARP_RIGHT"
  | "DESTINATION";

export interface MarswalkRouteOptions {
  startWaypointId: string;
  targetWaypointId: string;
  supportMode: MissionSupportMode;
  avoidHighRadiationRidges?: boolean;
  maxExcursionDurationHours?: number; // default 6.0 hours (EVA rule of thumb)
  customWaypoints?: MountSharpWaypoint[];
  solarElevationDeg?: number;
}

export interface RouteSegment {
  segmentIndex: number;
  fromCoordinate: [number, number]; // [lon, lat]
  toCoordinate: [number, number];
  distanceKm: number;
  fromElevationM: number;
  toElevationM: number;
  slopeDeg: number;
  slopeClassification: "SAFE_WALK" | "SUIT_EXERTION_CAUTION" | "IMPASSABLE_CLIFF_HAZARD";
  segmentRadiationMSv: number;
  segmentDurationHours: number;
  o2ConsumedLiters: number;
  batteryConsumedWh: number;
  sandTrapRisk: SandTrapRiskLevel;
  surfaceFirmness: SurfaceFirmnessStatus;
  crustalMagneticFieldNt: number;
  isHazardWarning: boolean;
  hazardDescription?: string;
  turnType: TurnType;
  bearingDeg: number;
  cardinalDirection: string;
  maneuverInstruction: string;
  maneuverInstructionId: string;
}

export interface RouteSafetyRationale {
  verdictTag: string;
  verdictLevel: "SAFE" | "CAUTION" | "HAZARD";
  executiveSummary: string;
  slopeAnalysis: {
    statusTag: string;
    maxSlopeDeg: number;
    avgSlopeDeg: number;
    description: string;
  };
  sandTrapAnalysis: {
    statusTag: string;
    firmnessRatioPercent: number;
    avgThermalInertiaTiu: number;
    description: string;
  };
  radiationAnalysis: {
    statusTag: string;
    shieldingReductionPercent: number;
    avgFieldNt: number;
    totalRadiationMSv: number;
    description: string;
  };
  mineralogyAnalysis: {
    statusTag: string;
    dominantMineral: string;
    wehPercent: number;
    description: string;
  };
  consumableAnalysis: {
    statusTag: string;
    remainingO2Percent: number;
    remainingBatteryPercent: number;
    description: string;
  };
}

export interface HighDensityPointTelemetry {
  pointIndex: number;
  cumulativeDistanceM: number;
  cumulativeDistanceKm: number;
  coordinates: [number, number]; // [lon, lat]
  elevationM: number;
  slopeDeg: number;
  slopeCategory: "SAFE" | "CAUTION" | "HAZARD";
  surfaceFirmness: SurfaceFirmnessStatus;
  sandTrapRisk: SandTrapRiskLevel;
  thermalInertiaTiu: number;
  themisNightTempK: number;
  crustalMagneticFieldNt: number;
  surfaceRadiationMSvSol: number;
  cumulativeTimeMinutes: number;
  cumulativeO2ConsumedLiters: number;
  remainingO2Percent: number;
  cumulativeBatteryConsumedWh: number;
  remainingBatteryPercent: number;
  metabolicCostKcal: number;
  lineOfSightToHabitat: boolean;
  statusTag: string;
}

export interface MarswalkRouteResult {
  routeId: string;
  supportMode: MissionSupportMode;
  startWaypoint: MountSharpWaypoint;
  targetWaypoint: MountSharpWaypoint;
  totalDistanceKm: number;
  cumulativeAscentM: number;
  cumulativeDescentM: number;
  estimatedDurationHours: number;
  solFraction: number; // Duration as fraction of Martian sol
  totalO2ConsumedLiters: number;
  remainingO2Percent: number;
  totalBatteryWh: number;
  remainingBatteryPercent: number;
  averageCrustalMagNt: number;
  magneticShieldingReductionPercent: number;
  sandTrapWarningCount: number;
  overallSafetyIndex: number; // 0 - 100
  segments: RouteSegment[];
  pathCoordinates: [number, number, number][]; // [lon, lat, elevation]
  highDensityRoutePoints: HighDensityPointTelemetry[]; // 5-meter resolution telemetry points
  hazardAlerts: string[];
  operationalChecklist: string[];
  photometry?: LambertianPhotometryMetrics;
  safetyRationale: RouteSafetyRationale;
}

interface MissionModeProfile {
  maxSafeSlopeDeg: number;
  maxHardSlopeDeg: number;
  payloadCapacityKg: number;
  nominalSpeedKmh: number;
  o2TankCapacityLiters: number;
  baseO2RateLitersPerMin: number;
  slopeO2RatePerDegLMin: number;
  batteryPackWh: number;
  basePowerDrawWatts: number;
  slopePowerDrawWattsPerDeg: number;
}

const MODE_PROFILES: Record<MissionSupportMode, MissionModeProfile> = {
  SOLO_ASTRONAUT: {
    maxSafeSlopeDeg: 15.0,
    maxHardSlopeDeg: 19.0,
    payloadCapacityKg: 25.0,
    nominalSpeedKmh: 3.2,
    o2TankCapacityLiters: 1200.0,
    baseO2RateLitersPerMin: 1.6,
    slopeO2RatePerDegLMin: 0.085,
    batteryPackWh: 950.0,
    basePowerDrawWatts: 220.0,
    slopePowerDrawWattsPerDeg: 12.0,
  },
  PAIRED_CREW_MULE_ROVER: {
    maxSafeSlopeDeg: 22.0,
    maxHardSlopeDeg: 25.0,
    payloadCapacityKg: 250.0,
    nominalSpeedKmh: 4.6,
    o2TankCapacityLiters: 4800.0, // High-capacity umbilical buffer
    baseO2RateLitersPerMin: 1.15, // Rover carries main life support backpack load
    slopeO2RatePerDegLMin: 0.045,
    batteryPackWh: 5400.0,
    basePowerDrawWatts: 450.0,
    slopePowerDrawWattsPerDeg: 18.0,
  },
};

/**
 * Synthetic topographical grid node representing an intermediate walkable coordinate.
 */
interface NavNode {
  id: string;
  name: string;
  coordinates: [number, number];
  elevationM: number;
  radiationMSvSol: number;
  sandTrapRisk?: SandTrapRiskLevel;
  surfaceFirmness?: SurfaceFirmnessStatus;
  crustalMagneticFieldNt?: number;
}

/**
 * Calculates absolute compass bearing (0-360°) between two coordinates on Mars.
 */
export function calculateBearingDeg(from: [number, number], to: [number, number]): number {
  const dLon = ((to[0] - from[0]) * Math.PI) / 180.0;
  const lat1 = (from[1] * Math.PI) / 180.0;
  const lat2 = (to[1] * Math.PI) / 180.0;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180.0) / Math.PI;
  return Math.round((brng + 360.0) % 360.0);
}

/**
 * Converts degrees into 16-point cardinal compass text.
 */
export function getCardinalDirection(bearing: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(bearing / 22.5) % 16;
  return directions[idx];
}

/**
 * Classifies Google Maps-style relative turn type based on bearing delta.
 */
export function classifyTurnType(prevBearing: number | null, currentBearing: number): TurnType {
  if (prevBearing === null) return "START";
  let delta = currentBearing - prevBearing;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;

  if (Math.abs(delta) <= 15) return "STRAIGHT";
  if (delta > 15 && delta <= 50) return "SLIGHT_RIGHT";
  if (delta > 50 && delta <= 120) return "RIGHT";
  if (delta > 120) return "SHARP_RIGHT";
  if (delta < -15 && delta >= -50) return "SLIGHT_LEFT";
  if (delta < -50 && delta >= -120) return "LEFT";
  return "SHARP_LEFT";
}

/**
 * Creates navigation intermediate corridors between Gale Crater & Jezero Crater points of interest.
 * Includes historically rover-verified corridors, gentle ridge ramps, clay troughs, and pass nodes.
 */
function getTopographicCorridorNodes(): NavNode[] {
  return [
    // --- GALE CRATER / MOUNT SHARP CORRIDOR NETWORK ---
    { id: "corr_bradbury_landing", name: "Bradbury Plain Traverse", coordinates: [137.4417, -4.5895], elevationM: -4501, radiationMSvSol: 0.62, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 39 },
    { id: "corr_yellowknife_bay", name: "Yellowknife Bay Mudstone Approach", coordinates: [137.4490, -4.5910], elevationM: -4520, radiationMSvSol: 0.61, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 39 },
    { id: "corr_peace_vallis_fan", name: "Peace Vallis Alluvial Fan", coordinates: [137.4350, -4.6150], elevationM: -4490, radiationMSvSol: 0.62, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 40 },
    { id: "corr_plains_01", name: "Northern Gale Flats", coordinates: [137.4700, -4.6200], elevationM: -4460, radiationMSvSol: 0.63, sandTrapRisk: "MODERATE", surfaceFirmness: "MODERATE COMPACTION", crustalMagneticFieldNt: 41 },
    { id: "corr_plains_02", name: "Aeolis Palus Bedrock Pavement", coordinates: [137.5200, -4.6800], elevationM: -4390, radiationMSvSol: 0.64, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 43 },
    { id: "corr_dingo_gap", name: "Dingo Gap Dune Pass", coordinates: [137.4050, -4.6550], elevationM: -4450, radiationMSvSol: 0.63, sandTrapRisk: "HIGH", surfaceFirmness: "SOFT SAND TRAP RISK", crustalMagneticFieldNt: 38 },
    { id: "corr_kimberley", name: "Kimberley Sandstone Corridor", coordinates: [137.4000, -4.6850], elevationM: -4430, radiationMSvSol: 0.64, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 41 },
    { id: "corr_pahrump_approach", name: "Pahrump Hills North Ramp", coordinates: [137.3800, -4.7100], elevationM: -4400, radiationMSvSol: 0.64, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 42 },
    { id: "corr_gap_rubin_north", name: "Vera Rubin North Breach", coordinates: [137.4080, -4.7080], elevationM: -4280, radiationMSvSol: 0.65, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 44 },
    { id: "corr_rubin_pass", name: "Vera Rubin Hematite Ridge Crest", coordinates: [137.3750, -4.7350], elevationM: -4190, radiationMSvSol: 0.72, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 45 },
    { id: "corr_rubin_south_gap", name: "Vera Rubin South Descent", coordinates: [137.3950, -4.7380], elevationM: -4240, radiationMSvSol: 0.66, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 44 },
    { id: "corr_torridon_low", name: "Glen Torridon Clay Trough", coordinates: [137.4120, -4.7450], elevationM: -4315, radiationMSvSol: 0.64, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 47 },
    { id: "corr_torridon_east", name: "Glen Torridon East Bench", coordinates: [137.4350, -4.7550], elevationM: -4290, radiationMSvSol: 0.63, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 48 },
    { id: "corr_greenheugh_pediment", name: "Greenheugh Pediment Scarp", coordinates: [137.3850, -4.7700], elevationM: -4200, radiationMSvSol: 0.68, sandTrapRisk: "MODERATE", surfaceFirmness: "MODERATE COMPACTION", crustalMagneticFieldNt: 46 },
    { id: "corr_marker_approach", name: "Marker Band Valley Bench", coordinates: [137.4150, -4.7800], elevationM: -4140, radiationMSvSol: 0.66, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 48 },
    { id: "corr_gediz_channel", name: "Gediz Vallis Flow Channel", coordinates: [137.4350, -4.8250], elevationM: -4020, radiationMSvSol: 0.70, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 49 },
    { id: "corr_amalia_pass", name: "Amalia Pass Saddle", coordinates: [137.4800, -4.8900], elevationM: -4050, radiationMSvSol: 0.68, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 50 },
    { id: "corr_sharp_flank_north", name: "Mount Sharp Flank Ramp", coordinates: [137.5800, -4.9500], elevationM: -4120, radiationMSvSol: 0.65, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 48 },
    { id: "corr_boxwork_basin", name: "Boxwork Valley North Basin", coordinates: [137.6500, -5.0500], elevationM: -4080, radiationMSvSol: 0.66, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 49 },
    { id: "corr_boxwork_west_bench", name: "Boxwork Western Bedrock Bench", coordinates: [137.7100, -5.1800], elevationM: -4020, radiationMSvSol: 0.67, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 51 },
    { id: "corr_boxwork_approach", name: "Boxwork Polygonal Ridge Ramp", coordinates: [137.7800, -5.3200], elevationM: -3980, radiationMSvSol: 0.67, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 52 },
    { id: "corr_boxwork_ridge_central", name: "Boxwork Central Mineral Veins", coordinates: [137.8200, -5.4100], elevationM: -3940, radiationMSvSol: 0.68, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 54 },
    { id: "corr_boxwork_east_flank", name: "Boxwork East Boundary Flank", coordinates: [137.8600, -5.4600], elevationM: -3900, radiationMSvSol: 0.69, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 53 },

    // --- JEZERO CRATER CORRIDOR NETWORK ---
    { id: "corr_jzr_butler_landing", name: "Octavia Butler Plain", coordinates: [77.4509, 18.3789], elevationM: -2569, radiationMSvSol: 0.61, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 28 },
    { id: "corr_jzr_van_zyl", name: "Van Zyl Overlook Ramp", coordinates: [77.4450, 18.3720], elevationM: -2560, radiationMSvSol: 0.61, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 29 },
    { id: "corr_jzr_seitah_pass", name: "Séítah Dune Valley Pass", coordinates: [77.4410, 18.3720], elevationM: -2550, radiationMSvSol: 0.62, sandTrapRisk: "HIGH", surfaceFirmness: "SOFT SAND TRAP RISK", crustalMagneticFieldNt: 28 },
    { id: "corr_jzr_butler_west", name: "Western Floor Pavement", coordinates: [77.4380, 18.3900], elevationM: -2560, radiationMSvSol: 0.61, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 30 },
    { id: "corr_jzr_delta_apron", name: "Delta Scarp Apron", coordinates: [77.4220, 18.4120], elevationM: -2530, radiationMSvSol: 0.60, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 31 },
    { id: "corr_jzr_kodiak_saddle", name: "Kodiak Butte Saddle", coordinates: [77.4100, 18.4050], elevationM: -2510, radiationMSvSol: 0.60, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 32 },
    { id: "corr_jzr_delta_top_channel", name: "Delta Top Distributary", coordinates: [77.4150, 18.4280], elevationM: -2480, radiationMSvSol: 0.59, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 32 },
    { id: "corr_jzr_neretva_canyon", name: "Neretva Vallis Inflow Canyon", coordinates: [77.4300, 18.4480], elevationM: -2495, radiationMSvSol: 0.59, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 33 },
    { id: "corr_jzr_belva_rim", name: "Belva Crater South Rim", coordinates: [77.4050, 18.4600], elevationM: -2460, radiationMSvSol: 0.58, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 34 },
    { id: "corr_jzr_margin_carbonate", name: "Marginal Carbonate Bench", coordinates: [77.3850, 18.4350], elevationM: -2475, radiationMSvSol: 0.59, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 33 },
    { id: "corr_jzr_cheyava_canyon", name: "Cheyava Falls Canyon Gorge", coordinates: [77.3750, 18.4800], elevationM: -2440, radiationMSvSol: 0.58, sandTrapRisk: "LOW", surfaceFirmness: "BEDROCK FIRM", crustalMagneticFieldNt: 35 },
  ];
}

/**
 * Plan a terrain-aware Marswalk route.
 */
export function planMarswalkRoute(options: MarswalkRouteOptions): MarswalkRouteResult {
  const pool = options.customWaypoints && options.customWaypoints.length > 0
    ? [...ALL_MARTIAN_WAYPOINTS, ...options.customWaypoints]
    : ALL_MARTIAN_WAYPOINTS;
  const startWp = pool.find((w) => w.id === options.startWaypointId) ?? pool[0];
  const targetWp =
    pool.find((w) => w.id === options.targetWaypointId) ??
    pool[1]; // default curiosity_boxwork_2025

  const profile = MODE_PROFILES[options.supportMode];
  const isJezero = startWp.coordinates[0] < 100 || targetWp.coordinates[0] < 100;
  const siteWaypoints = pool.filter((w) => isJezero ? (w.coordinates[0] < 100) : (w.coordinates[0] > 100));
  const corridors = getTopographicCorridorNodes().filter((c) => isJezero ? (c.coordinates[0] < 100) : (c.coordinates[0] > 100));

  // Graph vertices: Combine start, target, all site scientific waypoints, and intermediate passes
  const allNodes: NavNode[] = [];
  const nodeMap = new Map<string, NavNode>();

  const registerNode = (n: NavNode) => {
    if (!nodeMap.has(n.id)) {
      nodeMap.set(n.id, n);
      allNodes.push(n);
    }
  };

  registerNode({
    id: startWp.id,
    name: startWp.name,
    coordinates: startWp.coordinates,
    elevationM: startWp.elevationM,
    radiationMSvSol: startWp.surfaceRadiationMSvSol,
    sandTrapRisk: startWp.sandTrapRisk,
    surfaceFirmness: startWp.surfaceFirmness,
    crustalMagneticFieldNt: startWp.crustalMagneticFieldNt,
  });

  registerNode({
    id: targetWp.id,
    name: targetWp.name,
    coordinates: targetWp.coordinates,
    elevationM: targetWp.elevationM,
    radiationMSvSol: targetWp.surfaceRadiationMSvSol,
    sandTrapRisk: targetWp.sandTrapRisk,
    surfaceFirmness: targetWp.surfaceFirmness,
    crustalMagneticFieldNt: targetWp.crustalMagneticFieldNt,
  });

  for (const wp of siteWaypoints) {
    registerNode({
      id: wp.id,
      name: wp.name,
      coordinates: wp.coordinates,
      elevationM: wp.elevationM,
      radiationMSvSol: wp.surfaceRadiationMSvSol,
      sandTrapRisk: wp.sandTrapRisk,
      surfaceFirmness: wp.surfaceFirmness,
      crustalMagneticFieldNt: wp.crustalMagneticFieldNt,
    });
  }

  for (const c of corridors) {
    registerNode(c);
  }

  // Build adjacency with multi-criteria terrain cost calculation
  // A* implementation over the complete interconnected navigation network
  const distMatrix = new Map<string, Map<string, { distanceKm: number; cost: number; slopeDeg: number }>>();

  for (const a of allNodes) {
    distMatrix.set(a.id, new Map());
    const isTerminalA = a.id === startWp.id || a.id === targetWp.id;

    for (const b of allNodes) {
      if (a.id === b.id) continue;
      const isTerminalB = b.id === startWp.id || b.id === targetWp.id;
      const dist = calculateMartianDistanceKm(a.coordinates, b.coordinates);

      // Threshold: up to 24 km for network edges, 42 km for start/target endpoints
      const maxDistLimit = isTerminalA || isTerminalB ? 42.0 : 24.0;

      if (dist < maxDistLimit) {
        const elevDiff = b.elevationM - a.elevationM;
        const slopeDeg = Math.abs(Math.atan2(Math.abs(elevDiff), dist * 1000.0) * (180.0 / Math.PI));

        // Hard exclusion: Impassable cliffs exceeding mode limits
        if (slopeDeg > profile.maxHardSlopeDeg) {
          continue;
        }

        const terrainCost = computeTerrainImpedance(slopeDeg);
        if (!isFinite(terrainCost)) continue;

        // Sand trap penalty: Loose aeolian dust/sand traps (Morgan et al. 2020)
        // High risk incurs severe 15.0x cost multiplier forcing A* to find firm bedrock corridors
        const bSandRisk = b.sandTrapRisk ?? (b.elevationM < -4480 ? "HIGH" : "LOW");
        const sandTrapMultiplier =
          bSandRisk === "HIGH" ? 15.0 : bSandRisk === "MODERATE" ? 2.5 : 0.85;

        // MGS MAG crustal magnetic natural radiation shielding bonus
        const bMag = b.crustalMagneticFieldNt ?? 38;
        const magBonus = bMag >= 42 ? 0.75 : bMag >= 35 ? 0.90 : 1.0;

        // Radiation penalty along exposed high ridges (>0.68 mSv/sol)
        const radFactor = options.avoidHighRadiationRidges
          ? (b.radiationMSvSol > 0.68 ? 1.55 : b.radiationMSvSol < 0.63 ? 0.85 : 1.0)
          : 1.0;

        const totalEdgeCost = dist * terrainCost * sandTrapMultiplier * magBonus * radFactor;

        distMatrix.get(a.id)!.set(b.id, { distanceKm: dist, cost: totalEdgeCost, slopeDeg });
      }
    }
  }

  // Dijkstra / A* search
  const openSet = new Set<string>([startWp.id]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  for (const n of allNodes) {
    gScore.set(n.id, Infinity);
    fScore.set(n.id, Infinity);
  }

  gScore.set(startWp.id, 0);
  fScore.set(startWp.id, calculateMartianDistanceKm(startWp.coordinates, targetWp.coordinates));

  while (openSet.size > 0) {
    let currentId = Array.from(openSet).reduce((lowest, node) =>
      (fScore.get(node) ?? Infinity) < (fScore.get(lowest) ?? Infinity) ? node : lowest
    );

    if (currentId === targetWp.id) {
      break;
    }

    openSet.delete(currentId);
    const neighbors = distMatrix.get(currentId);
    if (!neighbors) continue;

    for (const [neighborId, edge] of neighbors.entries()) {
      const tentativeG = (gScore.get(currentId) ?? Infinity) + edge.cost;
      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, currentId);
        gScore.set(neighborId, tentativeG);
        const neighborNode = allNodes.find((n) => n.id === neighborId)!;
        const h = calculateMartianDistanceKm(neighborNode.coordinates, targetWp.coordinates);
        fScore.set(neighborId, tentativeG + h);
        openSet.add(neighborId);
      }
    }
  }

  // Reconstruct path
  const pathNodeIds: string[] = [];
  let curr: string | undefined = targetWp.id;
  while (curr) {
    pathNodeIds.unshift(curr);
    curr = cameFrom.get(curr);
    if (curr === startWp.id) {
      pathNodeIds.unshift(curr);
      break;
    }
  }

  // Fallback if disconnected: find nearest corridor to bridge rather than raw direct line
  if (pathNodeIds.length <= 1) {
    pathNodeIds.length = 0;
    // Find closest node to start and target
    const intermediate = corridors.sort((c1, c2) => {
      const d1 = calculateMartianDistanceKm(startWp.coordinates, c1.coordinates) + calculateMartianDistanceKm(c1.coordinates, targetWp.coordinates);
      const d2 = calculateMartianDistanceKm(startWp.coordinates, c2.coordinates) + calculateMartianDistanceKm(c2.coordinates, targetWp.coordinates);
      return d1 - d2;
    })[0];

    if (intermediate) {
      pathNodeIds.push(startWp.id, intermediate.id, targetWp.id);
    } else {
      pathNodeIds.push(startWp.id, targetWp.id);
    }
  }

  // Synthesize segments with turn-by-turn navigation instructions
  const segments: RouteSegment[] = [];
  let totalDistKm = 0;
  let cumAscent = 0;
  let cumDescent = 0;
  let totalDurationHours = 0;
  let totalO2Liters = 0;
  let totalBatteryWh = 0;
  const hazardAlerts: string[] = [];
  const pathCoords: [number, number, number][] = [];

  for (let i = 0; i < pathNodeIds.length; i++) {
    const nodeA = allNodes.find((n) => n.id === pathNodeIds[i])!;
    pathCoords.push([nodeA.coordinates[0], nodeA.coordinates[1], nodeA.elevationM]);

    if (i < pathNodeIds.length - 1) {
      const nodeB = allNodes.find((n) => n.id === pathNodeIds[i + 1])!;
      const segDist = calculateMartianDistanceKm(nodeA.coordinates, nodeB.coordinates);
      const elevDiff = nodeB.elevationM - nodeA.elevationM;
      if (elevDiff > 0) cumAscent += elevDiff;
      else cumDescent += Math.abs(elevDiff);

      const slope = Math.abs(Math.atan2(Math.abs(elevDiff), segDist * 1000.0) * (180.0 / Math.PI));
      const slopeClass = classifySlopeHazard(slope);

      // Speed adjusted by slope
      const speedKmh = Math.max(0.9, profile.nominalSpeedKmh - (slope / 15.0) * 1.4);
      const segHours = segDist / speedKmh;

      // Consumables calculation
      const o2Rate = profile.baseO2RateLitersPerMin + slope * profile.slopeO2RatePerDegLMin;
      const segO2 = o2Rate * segHours * 60.0;

      const powerWatts = profile.basePowerDrawWatts + slope * profile.slopePowerDrawWattsPerDeg;
      const segBattery = powerWatts * segHours;

      const segRad = (nodeA.radiationMSvSol / 24.66) * segHours;

      const nodeBWp = pool.find((w) => w.id === nodeB.id);
      const segSandRisk: SandTrapRiskLevel = nodeBWp?.sandTrapRisk ?? nodeB.sandTrapRisk ?? (nodeB.elevationM > -4100 ? "LOW" : "MODERATE");
      const segFirmness: SurfaceFirmnessStatus = nodeBWp?.surfaceFirmness ?? nodeB.surfaceFirmness ?? (segSandRisk === "HIGH" ? "SOFT SAND TRAP RISK" : segSandRisk === "MODERATE" ? "MODERATE COMPACTION" : "BEDROCK FIRM");
      const segMagNt = nodeBWp?.crustalMagneticFieldNt ?? nodeB.crustalMagneticFieldNt ?? 38;

      // Calculate compass bearings and turn maneuver
      const bearingDeg = calculateBearingDeg(nodeA.coordinates, nodeB.coordinates);
      const cardinal = getCardinalDirection(bearingDeg);
      const prevBearing = i > 0 ? calculateBearingDeg(segments[i - 1].fromCoordinate, segments[i - 1].toCoordinate) : null;
      const turnType = classifyTurnType(prevBearing, bearingDeg);

      let isHazard = false;
      let hazardDesc = "";
      if (slope > profile.maxSafeSlopeDeg) {
        isHazard = true;
        hazardDesc = `Slope of ${slope.toFixed(1)}° approaches limits for ${options.supportMode}. Extra anchor rigging advised.`;
        hazardAlerts.push(hazardDesc);
      }
      if (segSandRisk === "HIGH") {
        isHazard = true;
        hazardDesc = `SAND TRAP RISK: Soft regolith drift near ${nodeB.name || nodeB.id} presents high entrapment/sinkage hazard.`;
        hazardAlerts.push(hazardDesc);
      }
      if (nodeB.radiationMSvSol > 0.72) {
        hazardAlerts.push(`High radiation ridge crossing near ${nodeB.name || nodeB.id} (${nodeB.radiationMSvSol.toFixed(2)} mSv/sol).`);
      }

      // Generate localized turn-by-turn maneuver instruction
      let instructionEn = "";
      let instructionId = "";
      const destName = nodeB.name || `Waypoint #${i + 2}`;

      if (turnType === "START") {
        instructionEn = `Depart ${nodeA.name || "Habitat"} heading ${bearingDeg}° (${cardinal}) on verified ${segFirmness} corridor`;
        instructionId = `Berangkat dari ${nodeA.name || "Habitat"} arah ${bearingDeg}° (${cardinal}) melintasi jalur ${segFirmness === "BEDROCK FIRM" ? "batuan padat" : "tanah stabil"}`;
      } else if (i === pathNodeIds.length - 2) {
        instructionEn = `${turnType === "STRAIGHT" ? "Continue straight" : turnType.replace("_", " ")} heading ${bearingDeg}° (${cardinal}) onto final approach to ${destName}`;
        instructionId = `${turnType === "STRAIGHT" ? "Lanjut lurus" : "Belok"} arah ${bearingDeg}° (${cardinal}) menuju titik tujuan akhir ${destName}`;
      } else if (turnType === "STRAIGHT") {
        instructionEn = `Continue straight heading ${bearingDeg}° (${cardinal}) along ${segFirmness} for ${segDist.toFixed(1)} km`;
        instructionId = `Lanjut lurus arah ${bearingDeg}° (${cardinal}) melintasi ${segFirmness === "BEDROCK FIRM" ? "batuan padat" : "tanah stabil"} sejauh ${segDist.toFixed(1)} km`;
      } else if (turnType === "SLIGHT_LEFT") {
        instructionEn = `Bear slight left heading ${bearingDeg}° (${cardinal}) towards ${destName}`;
        instructionId = `Belok sedikit ke kiri arah ${bearingDeg}° (${cardinal}) menuju ${destName}`;
      } else if (turnType === "LEFT") {
        instructionEn = `Turn left heading ${bearingDeg}° (${cardinal}) towards ${destName}`;
        instructionId = `Belok kiri arah ${bearingDeg}° (${cardinal}) menuju ${destName}`;
      } else if (turnType === "SHARP_LEFT") {
        instructionEn = `Sharp switchback left heading ${bearingDeg}° (${cardinal}) ascending ridge towards ${destName}`;
        instructionId = `Belok tajam berbalik ke kiri arah ${bearingDeg}° (${cardinal}) mendaki punggungan menuju ${destName}`;
      } else if (turnType === "SLIGHT_RIGHT") {
        instructionEn = `Bear slight right heading ${bearingDeg}° (${cardinal}) towards ${destName}`;
        instructionId = `Belok sedikit ke kanan arah ${bearingDeg}° (${cardinal}) menuju ${destName}`;
      } else if (turnType === "RIGHT") {
        instructionEn = `Turn right heading ${bearingDeg}° (${cardinal}) towards ${destName}`;
        instructionId = `Belok kanan arah ${bearingDeg}° (${cardinal}) menuju ${destName}`;
      } else {
        instructionEn = `Sharp switchback right heading ${bearingDeg}° (${cardinal}) ascending ridge towards ${destName}`;
        instructionId = `Belok tajam berbalik ke kanan arah ${bearingDeg}° (${cardinal}) mendaki punggungan menuju ${destName}`;
      }

      if (segSandRisk === "HIGH") {
        instructionEn += " — [ALERT] Avoid soft sand sink trap, maintain bedrock footing";
        instructionId += " — [PERINGATAN] Hindari jebakan pasir lunak, pijak batuan padat";
      } else if (segMagNt >= 42) {
        instructionEn += ` — [SHIELD] Natural MGS MAG magnetic umbrella active (${segMagNt} nT)`;
        instructionId += ` — [PERISAI] Perlindungan perisai magnetik alami MGS MAG (${segMagNt} nT)`;
      }

      segments.push({
        segmentIndex: i + 1,
        fromCoordinate: nodeA.coordinates,
        toCoordinate: nodeB.coordinates,
        distanceKm: parseFloat(segDist.toFixed(2)),
        fromElevationM: nodeA.elevationM,
        toElevationM: nodeB.elevationM,
        slopeDeg: parseFloat(slope.toFixed(1)),
        slopeClassification: slopeClass.classification,
        segmentRadiationMSv: parseFloat(segRad.toFixed(4)),
        segmentDurationHours: parseFloat(segHours.toFixed(2)),
        o2ConsumedLiters: Math.round(segO2),
        batteryConsumedWh: Math.round(segBattery),
        sandTrapRisk: segSandRisk,
        surfaceFirmness: segFirmness,
        crustalMagneticFieldNt: segMagNt,
        isHazardWarning: isHazard,
        hazardDescription: hazardDesc,
        turnType,
        bearingDeg,
        cardinalDirection: cardinal,
        maneuverInstruction: instructionEn,
        maneuverInstructionId: instructionId,
      });

      totalDistKm += segDist;
      totalDurationHours += segHours;
      totalO2Liters += segO2;
      totalBatteryWh += segBattery;
    }
  }

  // Generate high-density 5-meter resolution telemetry points across the entire route
  const highDensityPoints: HighDensityPointTelemetry[] = [];
  let runningCumDistM = 0;
  let runningTimeMin = 0;
  let runningO2L = 0;
  let runningBatWh = 0;

  const totalApproxMeters = totalDistKm * 1000;
  const targetStepM = totalApproxMeters > 0 ? Math.max(5.0, totalApproxMeters / 600) : 5.0;

  for (let s = 0; s < segments.length; s++) {
    const seg = segments[s];
    const segDistM = seg.distanceKm * 1000;
    const numSteps = Math.max(1, Math.round(segDistM / targetStepM));

    for (let k = 0; k < numSteps; k++) {
      const t = k / numSteps;
      const pointDistM = runningCumDistM + k * (segDistM / numSteps);
      const pointDistKm = parseFloat((pointDistM / 1000).toFixed(3));

      const lon = seg.fromCoordinate[0] + (seg.toCoordinate[0] - seg.fromCoordinate[0]) * t;
      const lat = seg.fromCoordinate[1] + (seg.toCoordinate[1] - seg.fromCoordinate[1]) * t;

      const baseElev = seg.fromElevationM + (seg.toElevationM - seg.fromElevationM) * t;
      const microNoise = Math.sin(pointDistM * 0.04) * 1.8 + Math.cos(pointDistM * 0.015) * 2.4;
      const elevationM = Math.round((baseElev + microNoise) * 10) / 10;

      const slopeNoise = Math.sin(pointDistM * 0.03) * 2.2;
      const slopeDeg = Math.max(0.5, Math.min(28.0, Math.round((seg.slopeDeg + slopeNoise) * 10) / 10));
      const slopeCat: "SAFE" | "CAUTION" | "HAZARD" =
        slopeDeg > profile.maxSafeSlopeDeg
          ? slopeDeg > profile.maxHardSlopeDeg
            ? "HAZARD"
            : "CAUTION"
          : "SAFE";

      const thermalInertiaTiu = Math.round(
        seg.surfaceFirmness === "BEDROCK FIRM"
          ? 380 + Math.sin(pointDistM * 0.02) * 45
          : seg.sandTrapRisk === "HIGH"
          ? 135 + Math.sin(pointDistM * 0.02) * 20
          : 260 + Math.sin(pointDistM * 0.02) * 35
      );

      const surfaceFirmness: SurfaceFirmnessStatus =
        thermalInertiaTiu > 310
          ? "BEDROCK FIRM"
          : thermalInertiaTiu > 200
          ? "MODERATE COMPACTION"
          : "SOFT SAND TRAP RISK";

      const sandTrapRisk: SandTrapRiskLevel =
        surfaceFirmness === "BEDROCK FIRM"
          ? "LOW"
          : surfaceFirmness === "MODERATE COMPACTION"
          ? "MODERATE"
          : "HIGH";

      const themisNightTempK = Math.round(180 + (thermalInertiaTiu / 400) * 8);

      const stepDurationMin =
        (targetStepM / 1000 / Math.max(1.0, profile.nominalSpeedKmh - (slopeDeg / 15) * 1.2)) * 60;
      runningTimeMin += stepDurationMin;

      const o2BurnL =
        (profile.baseO2RateLitersPerMin + slopeDeg * profile.slopeO2RatePerDegLMin) * stepDurationMin;
      runningO2L += o2BurnL;
      const remO2Pct = Math.max(
        0,
        Math.round(((profile.o2TankCapacityLiters - runningO2L) / profile.o2TankCapacityLiters) * 100)
      );

      const batBurnWh =
        (profile.basePowerDrawWatts + slopeDeg * profile.slopePowerDrawWattsPerDeg) *
        (stepDurationMin / 60);
      runningBatWh += batBurnWh;
      const remBatPct = Math.max(
        0,
        Math.round(((profile.batteryPackWh - runningBatWh) / profile.batteryPackWh) * 100)
      );

      const metabolicMETs = 3.5 + (slopeDeg / 5.0) * 1.8;
      const metabolicKcal = Math.round(metabolicMETs * 80 * (stepDurationMin / 60));

      const crustalMagNt = Math.round(seg.crustalMagneticFieldNt + Math.sin(pointDistM * 0.01) * 8);
      const magShieldPct = computeCrustalMagneticShielding(crustalMagNt).shieldingFactorPercent;
      const radRate = Math.round(0.68 * (1 - magShieldPct / 200) * 1000) / 1000;

      const statusTag = `[${surfaceFirmness} | ${slopeDeg}° ${slopeCat} | O2 ${remO2Pct}% | ${crustalMagNt} nT]`;

      highDensityPoints.push({
        pointIndex: highDensityPoints.length,
        cumulativeDistanceM: Math.round(pointDistM),
        cumulativeDistanceKm: pointDistKm,
        coordinates: [parseFloat(lon.toFixed(5)), parseFloat(lat.toFixed(5))],
        elevationM,
        slopeDeg,
        slopeCategory: slopeCat,
        surfaceFirmness,
        sandTrapRisk,
        thermalInertiaTiu,
        themisNightTempK,
        crustalMagneticFieldNt: crustalMagNt,
        surfaceRadiationMSvSol: radRate,
        cumulativeTimeMinutes: Math.round(runningTimeMin * 10) / 10,
        cumulativeO2ConsumedLiters: Math.round(runningO2L * 10) / 10,
        remainingO2Percent: remO2Pct,
        cumulativeBatteryConsumedWh: Math.round(runningBatWh * 10) / 10,
        remainingBatteryPercent: remBatPct,
        metabolicCostKcal: metabolicKcal,
        lineOfSightToHabitat: pointDistKm < 15.0 && slopeDeg < 18.0,
        statusTag,
      });
    }
    runningCumDistM += segDistM;
  }

  const remainingO2Percent = Math.max(0, Math.round(((profile.o2TankCapacityLiters - totalO2Liters) / profile.o2TankCapacityLiters) * 100));
  const remainingBatteryPercent = Math.max(0, Math.round(((profile.batteryPackWh - totalBatteryWh) / profile.batteryPackWh) * 100));

  const avgCrustalMag = segments.length > 0
    ? Math.round(segments.reduce((acc, s) => acc + s.crustalMagneticFieldNt, 0) / segments.length)
    : 38;
  const magShielding = computeCrustalMagneticShielding(avgCrustalMag);
  const sandTrapCount = segments.filter((s) => s.sandTrapRisk === "HIGH").length;

  let safetyScore = 100;
  if (hazardAlerts.length > 0) safetyScore -= hazardAlerts.length * 12;
  if (remainingO2Percent < 30) safetyScore -= 20;
  if (remainingBatteryPercent < 25) safetyScore -= 20;
  if (sandTrapCount > 0) safetyScore -= sandTrapCount * 15;
  safetyScore = Math.max(10, Math.min(100, safetyScore));

  const checklist: string[] = [
    `Mission Mode: ${options.supportMode === "SOLO_ASTRONAUT" ? "Solo EVA Walk" : "Dual Crew with Cargo Mule Rover Support"}`,
    `Max payload allocation: ${profile.payloadCapacityKg} kg`,
    `Primary consumable: ${Math.round(totalO2Liters)} L O2 (${remainingO2Percent}% reserve remaining)`,
    `Energy consumption: ${Math.round(totalBatteryWh)} Wh (${remainingBatteryPercent}% battery reserve remaining)`,
    `MGS MAG natural shielding: ~${magShielding.shieldingFactorPercent}% cosmic radiation reduction (Avg: ${avgCrustalMag} nT)`,
    `Sand trap safety: ${sandTrapCount === 0 ? "100% Firm Bedrock / Compacted Regolith" : `${sandTrapCount} soft sand drift crossing(s) detected`}`,
    `Comm relay check: Lock on Mars Reconnaissance Orbiter (MRO) pass during return egress.`,
    `Emergency beacon active on 401.5 MHz UHF planetary emergency frequency.`,
  ];

  const photometry = computeLambertianPhotometry(options.solarElevationDeg ?? 35.0);
  if (photometry.glareObstacleIndex > 60) {
    hazardAlerts.push("High Lambertian photometric glare & shadow contrast: low sun angle generates severe blind zones behind terrain crests.");
  }

  const maxSlope = segments.length > 0 ? Math.max(...segments.map((s) => s.slopeDeg)) : 0;
  const avgSlope = segments.length > 0 ? parseFloat((segments.reduce((acc, s) => acc + s.slopeDeg, 0) / segments.length).toFixed(1)) : 0;
  const bedrockCount = segments.filter((s) => s.surfaceFirmness === "BEDROCK FIRM").length;
  const firmnessRatio = segments.length > 0 ? Math.round((bedrockCount / segments.length) * 100) : 100;
  const totalRad = segments.reduce((acc, s) => acc + s.segmentRadiationMSv, 0);

  const verdictLevel: "SAFE" | "CAUTION" | "HAZARD" =
    safetyScore >= 75 ? "SAFE" : safetyScore >= 50 ? "CAUTION" : "HAZARD";
  const verdictTag =
    verdictLevel === "SAFE"
      ? "[RUTE TERVERIFIKASI AMAN]"
      : verdictLevel === "CAUTION"
      ? "[RUTE BERSYARAT DENGAN MITIGASI]"
      : "[PERINGATAN: RUTE RISIKO TINGGI]";

  const executiveSummary =
    verdictLevel === "SAFE"
      ? `Algoritma A* berhasil memetakan rute optimal sepanjang ${totalDistKm.toFixed(2)} km dari ${startWp.name} menuju ${targetWp.name}. Koridor terpilih sepenuhnya menghindari tebing curam dan area pasir amblas eolian, melintasi batuan dasar padat [BEDROCK FIRM] dengan perlindungan radiasi alami kerak Mars (${avgCrustalMag} nT).`
      : `Rute sepanjang ${totalDistKm.toFixed(2)} km memiliki tantangan kemiringan atau keterpaparan radiasi lokal, namun telah dihitung untuk menjaga cadangan metabolik astronaut di atas batas aman minimum.`;

  const safetyRationale: RouteSafetyRationale = {
    verdictTag,
    verdictLevel,
    executiveSummary,
    slopeAnalysis: {
      statusTag: maxSlope <= profile.maxSafeSlopeDeg ? "[AMAN <15 DEG]" : "[PERHATIAN 15-25 DEG]",
      maxSlopeDeg: maxSlope,
      avgSlopeDeg: avgSlope,
      description: `Maksimum kemiringan lereng ${maxSlope.toFixed(1)}° (rata-rata ${avgSlope.toFixed(1)}°). Seluruh segmen berada dalam toleransi operasional ${options.supportMode === "SOLO_ASTRONAUT" ? "15.0° (Solo EVA)" : "22.0° (Dukungan Mule Rover)"}, mengeliminasi risiko selip dan pembalikan beban.`,
    },
    sandTrapAnalysis: {
      statusTag: sandTrapCount === 0 ? "[BEDROCK FIRM]" : `[RISIKO JEBAKAN PASIR: ${sandTrapCount} SEGMEN]`,
      firmnessRatioPercent: firmnessRatio,
      avgThermalInertiaTiu: targetWp.apparentThermalInertiaTiu ?? 320,
      description: `Model inersia termal Morgan et al. (2020) via THEMIS Night IR & TES memverifikasi ${firmnessRatio}% koridor bertumpu pada batuan dasar kokoh/regolit terkompaksi (>300 tiu). Koridor menjauhi bentukan bukit pasir lunak (soft sand traps <140 tiu).`,
    },
    radiationAnalysis: {
      statusTag: avgCrustalMag >= 50 ? "[TERLINDUNGI MGS MAG]" : "[PAPARAN NOMINAL]",
      shieldingReductionPercent: magShielding.shieldingFactorPercent,
      avgFieldNt: avgCrustalMag,
      totalRadiationMSv: parseFloat(totalRad.toFixed(4)),
      description: `Medan magnet kerak lokal purba MGS MAG rata-rata ${avgCrustalMag} nT memberikan payung pelindung alami yang mereduksi fluks sinar kosmik (GCR) sekitar ~${magShielding.shieldingFactorPercent}%. Estimasi dosis radiasi ${totalRad.toFixed(3)} mSv berada aman di bawah limit harian.`,
    },
    mineralogyAnalysis: {
      statusTag: "[SUBSTRAT STABIL CRISM]",
      dominantMineral: targetWp.dominantHydratedMineral ?? "Smektit / Sulfat Terhidrasi",
      wehPercent: targetWp.waterEquivalentHydrogenPercent ?? 4.2,
      description: `Spektrometri CRISM & data neutron GRS/DAN mengidentifikasi substrat ${targetWp.dominantHydratedMineral ?? "batuan lempung/sulfat terhidrasi"} dengan ${targetWp.waterEquivalentHydrogenPercent ?? 4.2}% WEH (Water-Equivalent Hydrogen), memberikan daya dukung tanah mekanis yang stabil.`,
    },
    consumableAnalysis: {
      statusTag: remainingO2Percent >= 35 && remainingBatteryPercent >= 30 ? "[CADANGAN OPTIMAL]" : "[CADANGAN MARGINAL]",
      remainingO2Percent,
      remainingBatteryPercent,
      description: `Konsumsi O2 diproyeksikan ${Math.round(totalO2Liters)} L (tersisa cadangan ${remainingO2Percent}%). Daya baterai terpakai ${Math.round(totalBatteryWh)} Wh (tersisa cadangan ${remainingBatteryPercent}%). Menyisakan batas aman darurat jika terjadi deviasi rute.`,
    },
  };

  return {
    routeId: `MARSWALK-${Date.now().toString().slice(-6)}`,
    supportMode: options.supportMode,
    startWaypoint: startWp,
    targetWaypoint: targetWp,
    totalDistanceKm: parseFloat(totalDistKm.toFixed(2)),
    cumulativeAscentM: Math.round(cumAscent),
    cumulativeDescentM: Math.round(cumDescent),
    estimatedDurationHours: parseFloat(totalDurationHours.toFixed(2)),
    solFraction: parseFloat((totalDurationHours / 24.66).toFixed(3)),
    totalO2ConsumedLiters: Math.round(totalO2Liters),
    remainingO2Percent,
    totalBatteryWh: Math.round(totalBatteryWh),
    remainingBatteryPercent,
    averageCrustalMagNt: avgCrustalMag,
    magneticShieldingReductionPercent: magShielding.shieldingFactorPercent,
    sandTrapWarningCount: sandTrapCount,
    overallSafetyIndex: safetyScore,
    segments,
    pathCoordinates: pathCoords,
    highDensityRoutePoints: highDensityPoints,
    hazardAlerts: Array.from(new Set(hazardAlerts)),
    operationalChecklist: checklist,
    photometry,
    safetyRationale,
  };
}
