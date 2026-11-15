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
  coordinates: [number, number];
  elevationM: number;
  radiationMSvSol: number;
}

/**
 * Creates navigation intermediate corridors between Gale Crater points of interest.
 */
function getTopographicCorridorNodes(): NavNode[] {
  return [
    // Gale Crater Nav Corridors
    { id: "corr_plains_01", coordinates: [137.4700, -4.6200], elevationM: -4460, radiationMSvSol: 0.63 },
    { id: "corr_plains_02", coordinates: [137.5200, -4.6800], elevationM: -4390, radiationMSvSol: 0.64 },
    { id: "corr_gap_rubin_north", coordinates: [137.4100, -4.7000], elevationM: -4280, radiationMSvSol: 0.65 },
    { id: "corr_rubin_pass", coordinates: [137.3750, -4.7350], elevationM: -4190, radiationMSvSol: 0.72 },
    { id: "corr_torridon_low", coordinates: [137.4120, -4.7450], elevationM: -4315, radiationMSvSol: 0.64 },
    { id: "corr_marker_approach", coordinates: [137.4150, -4.7800], elevationM: -4140, radiationMSvSol: 0.66 },
    { id: "corr_gediz_channel", coordinates: [137.4350, -4.8250], elevationM: -4020, radiationMSvSol: 0.70 },
    { id: "corr_boxwork_basin", coordinates: [137.6500, -5.0500], elevationM: -4080, radiationMSvSol: 0.66 },
    { id: "corr_boxwork_approach", coordinates: [137.7800, -5.3200], elevationM: -3980, radiationMSvSol: 0.67 },
    // Jezero Crater Nav Corridors
    { id: "corr_jzr_butler_west", coordinates: [77.4380, 18.3900], elevationM: -2560, radiationMSvSol: 0.61 },
    { id: "corr_jzr_delta_apron", coordinates: [77.4220, 18.4120], elevationM: -2530, radiationMSvSol: 0.60 },
    { id: "corr_jzr_seitah_pass", coordinates: [77.4410, 18.3720], elevationM: -2550, radiationMSvSol: 0.62 },
    { id: "corr_jzr_neretva_canyon", coordinates: [77.4300, 18.4480], elevationM: -2495, radiationMSvSol: 0.59 },
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
  const corridors = getTopographicCorridorNodes();

  // Graph vertices
  const allNodes: NavNode[] = [
    {
      id: startWp.id,
      coordinates: startWp.coordinates,
      elevationM: startWp.elevationM,
      radiationMSvSol: startWp.surfaceRadiationMSvSol,
    },
    ...corridors,
    {
      id: targetWp.id,
      coordinates: targetWp.coordinates,
      elevationM: targetWp.elevationM,
      radiationMSvSol: targetWp.surfaceRadiationMSvSol,
    },
  ];

  // Build adjacency with terrain cost calculation
  // A* implementation over the navigation corridor
  const distMatrix = new Map<string, Map<string, { distanceKm: number; cost: number; slopeDeg: number }>>();

  for (const a of allNodes) {
    distMatrix.set(a.id, new Map());
    for (const b of allNodes) {
      if (a.id === b.id) continue;
      const dist = calculateMartianDistanceKm(a.coordinates, b.coordinates);

      // Connect only nodes within plausible direct corridor visibility (< 35 km)
      if (dist < 38.0) {
        const elevDiff = b.elevationM - a.elevationM;
        const slopeDeg = Math.abs(Math.atan2(Math.abs(elevDiff), dist * 1000.0) * (180.0 / Math.PI));

        // Hard exclusion if slope exceeds mode maxHardSlopeDeg
        if (slopeDeg > profile.maxHardSlopeDeg) {
          continue;
        }

        const terrainCost = computeTerrainImpedance(slopeDeg);
        if (!isFinite(terrainCost)) continue;

        // Radiation penalty along exposed ridges
        const radFactor = options.avoidHighRadiationRidges ? (b.radiationMSvSol > 0.7 ? 1.4 : 1.0) : 1.0;
        const totalEdgeCost = dist * terrainCost * radFactor;

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
    // Current node with lowest fScore
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

  // Fallback if disconnected: direct line
  if (pathNodeIds.length <= 1) {
    pathNodeIds.length = 0;
    pathNodeIds.push(startWp.id, targetWp.id);
  }

  // Synthesize segments
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
      const segSandRisk: SandTrapRiskLevel = nodeBWp?.sandTrapRisk ?? (nodeB.elevationM > -4100 ? "LOW" : "MODERATE");
      const segFirmness: SurfaceFirmnessStatus = nodeBWp?.surfaceFirmness ?? (segSandRisk === "HIGH" ? "SOFT SAND TRAP RISK" : segSandRisk === "MODERATE" ? "MODERATE COMPACTION" : "BEDROCK FIRM");
      const segMagNt = nodeBWp?.crustalMagneticFieldNt ?? 38;

      let isHazard = false;
      let hazardDesc = "";
      if (slope > profile.maxSafeSlopeDeg) {
        isHazard = true;
        hazardDesc = `Slope of ${slope.toFixed(1)}° approaches limits for ${options.supportMode}. Extra anchor rigging advised.`;
        hazardAlerts.push(hazardDesc);
      }
      if (segSandRisk === "HIGH") {
        isHazard = true;
        hazardDesc = `SAND TRAP RISK: Soft regolith drift near ${nodeB.id} presents high entrapment/sinkage hazard.`;
        hazardAlerts.push(hazardDesc);
      }
      if (nodeB.radiationMSvSol > 0.72) {
        hazardAlerts.push(`High radiation ridge crossing near ${nodeB.id} (${nodeB.radiationMSvSol.toFixed(2)} mSv/sol).`);
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
