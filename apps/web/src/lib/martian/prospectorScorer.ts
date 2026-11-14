/**
 * "Prospector" ML Multi-Layer Fusion Engine
 *
 * Inspired by petrophysical and seismic exploration multi-attribute fusion workflows (e.g. SLB / oil & gas).
 * Synthesizes orbital spectroscopy, apparent thermal inertia (ATI & CT), high-resolution DEM slope gradients,
 * and in-situ rover ground-truth calibration into:
 *   1. Scientific & Resource Promise Score (0 - 100%)
 *   2. Model Uncertainty Index (±%)
 */

import {
  THERMAL_INERTIA_DEFAULTS,
  classifySlopeHazard,
  ConsistencyIndexCT,
} from "./scientificParams";
import { MountSharpWaypoint, MOUNT_SHARP_WAYPOINTS } from "./mountSharpWaypoints";

export interface ProspectorInputQuery {
  coordinates: [number, number]; // [lon, lat]
  elevationM: number;
  slopeDeg: number;
  apparentThermalInertiaTiu: number;
  consistencyIndexCT: ConsistencyIndexCT;
  mineralProfile: {
    sulfatePercent: number;
    hematitePercent: number;
    phyllosilicateClayPercent: number;
    silicaPercent: number;
    perchloratePercent: number;
  };
  surfaceRadiationMSvSol: number;
  dustCoverIndexTau?: number; // 0.0 - 1.0 (higher = more obscured by atmospheric/airfall dust)
}

export interface ProspectorEvaluationResult {
  promiseScore: number; // 0 - 100%
  uncertaintyPercent: number; // ±% (e.g., ± 14.5%)
  confidenceLevel: "HIGH" | "MODERATE" | "RECONNAISSANCE_ONLY";
  subScores: {
    hydrationResourcePotential: number; // 0 - 100
    geologicFractureTrapping: number; // 0 - 100
    evaTerrainAccessibility: number; // 0 - 100
    inSituCalibrationScore: number; // 0 - 100
  };
  nearestRoverGroundTruth: {
    waypointId: string;
    waypointName: string;
    distanceKm: number;
    instrument: string;
    targetName: string;
    keyFinding: string;
  };
  scientificRationale: string[];
  operationalRecommendation: "PRIORITY_SAMPLING_SITE" | "SECONDARY_EXPLORATION" | "HAZARD_BYPASS_REQUIRED";
}

/**
 * Great-circle aerocentric distance approximation between two Martian coordinates in kilometers.
 * Mars mean radius R_mars = 3389.5 km.
 */
export function calculateMartianDistanceKm(coordA: [number, number], coordB: [number, number]): number {
  const R = 3389.5;
  const rad = Math.PI / 180.0;
  const dLat = (coordB[1] - coordA[1]) * rad;
  const dLon = (coordB[0] - coordA[0]) * rad;
  const lat1 = coordA[1] * rad;
  const lat2 = coordB[1] * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Executes the Prospector Multi-Layer Fusion assessment.
 */
export function evaluateProspectorTarget(query: ProspectorInputQuery): ProspectorEvaluationResult {
  const dustTau = query.dustCoverIndexTau ?? 0.35;

  // 1. Hydration & Resource Potential (40% weight)
  // Higher sulfate + clay indicates hydrated mineral salts / polyhydrated sulfates
  const hydrationRaw =
    query.mineralProfile.sulfatePercent * 1.1 +
    query.mineralProfile.phyllosilicateClayPercent * 1.3 +
    query.mineralProfile.hematitePercent * 0.4;
  const hydrationClamped = Math.min(100, Math.max(0, hydrationRaw));

  // Thermal Inertia Consistency adjustment (Morgan et al. 2020)
  // CT = +1 boosts hydration probability (indicates low-TI mantle over high-density cement/ice)
  // CT = -1 penalizes (indicates desiccated porous underlayer)
  let thermalMultiplier = 1.0;
  if (query.consistencyIndexCT === 1) {
    thermalMultiplier = 1.25;
  } else if (query.consistencyIndexCT === -1) {
    thermalMultiplier = 0.75;
  }
  const hydrationScore = Math.min(100, Math.round(hydrationClamped * thermalMultiplier));

  // 2. Geologic Fracture Trapping & Boxwork Likelihood (30% weight)
  // Boxwork requires hard fracture-cementing minerals (high TI > 400 tiu, moderate-to-high sulfates)
  const tiNormalized = Math.min(1.0, Math.max(0.0, (query.apparentThermalInertiaTiu - 100) / 500));
  const fractureTrappingScore = Math.min(
    100,
    Math.round((tiNormalized * 55 + (query.mineralProfile.sulfatePercent / 50) * 45))
  );

  // 3. EVA Terrain Accessibility Score (20% weight)
  const slopeHazard = classifySlopeHazard(query.slopeDeg);
  let accessibilityScore = 100;
  if (slopeHazard.classification === "SUIT_EXERTION_CAUTION") {
    accessibilityScore = Math.max(30, Math.round(100 - (query.slopeDeg - 15) * 6.5));
  } else if (slopeHazard.classification === "IMPASSABLE_CLIFF_HAZARD") {
    accessibilityScore = 5;
  }

  // 4. In-Situ Calibration & Distance Penalty
  // Find closest ground-truth waypoint from Curiosity MSL
  let closestWp = MOUNT_SHARP_WAYPOINTS[0];
  let minDistanceKm = Infinity;

  for (const wp of MOUNT_SHARP_WAYPOINTS) {
    const dist = calculateMartianDistanceKm(query.coordinates, wp.coordinates);
    if (dist < minDistanceKm) {
      minDistanceKm = dist;
      closestWp = wp;
    }
  }

  // Calibration score drops with distance from ground-truth rover calibration
  const calibrationScore = Math.max(15, Math.min(100, Math.round(100 * Math.exp(-minDistanceKm / 4.5))));

  // Overall Composite Promise Score (0 - 100%)
  const rawComposite =
    hydrationScore * 0.38 +
    fractureTrappingScore * 0.32 +
    accessibilityScore * 0.18 +
    calibrationScore * 0.12;

  const promiseScore = Math.max(0, Math.min(100, Math.round(rawComposite)));

  // Model Uncertainty Index (±%)
  // Quantifies resolution gap between orbital telemetry (THEMIS 100m, CRISM 18m) and rover in-situ (0.01m)
  // Distance from ground truth + dust obscuration penalty + slope shadowing
  const baseResolutionGap = 8.0; // 8% baseline sensor footprint variance
  const distanceUncertainty = Math.min(22.0, (minDistanceKm / 10.0) * 15.0);
  const dustUncertainty = dustTau * 12.0;
  const slopeUncertainty = query.slopeDeg > 18.0 ? 5.5 : 1.5;

  const totalUncertainty = Math.min(
    38.0,
    parseFloat((baseResolutionGap + distanceUncertainty + dustUncertainty + slopeUncertainty).toFixed(1))
  );

  const confidenceLevel =
    totalUncertainty <= 14.0 ? "HIGH" : totalUncertainty <= 25.0 ? "MODERATE" : "RECONNAISSANCE_ONLY";

  // Scientific Rationale Assembly
  const rationale: string[] = [];
  if (query.consistencyIndexCT === 1) {
    rationale.push("Morgan et al. (2020) CT=+1 index confirms high thermal inertia substrate beneath thin dust cover, strongly indicative of indurated mineral cement or cemented water-ice.");
  } else if (query.consistencyIndexCT === -1) {
    rationale.push("Thermal stratification shows negative consistency (CT=-1), indicating desiccated porous sub-regolith with depleted near-surface volatiles.");
  }

  if (query.mineralProfile.sulfatePercent > 35) {
    rationale.push(`Enriched sulfate signature (${query.mineralProfile.sulfatePercent}%) mirrors 2025 Curiosity Boxwork vein formation.`);
  }

  if (query.mineralProfile.phyllosilicateClayPercent > 30) {
    rationale.push(`Phyllosilicate clay concentration (${query.mineralProfile.phyllosilicateClayPercent}%) reflects ancient lacustrine habitable mudstones.`);
  }

  if (slopeHazard.classification === "IMPASSABLE_CLIFF_HAZARD") {
    rationale.push(`CRITICAL HAZARD: Slope gradient of ${query.slopeDeg.toFixed(1)}° exceeds astronaut suit safety envelope (>25°).`);
  }

  rationale.push(
    `Sensor resolution gap: Target is ${minDistanceKm.toFixed(2)} km from nearest in-situ ground truth (${closestWp.name}), yielding ±${totalUncertainty}% model uncertainty.`
  );

  let recommendation: "PRIORITY_SAMPLING_SITE" | "SECONDARY_EXPLORATION" | "HAZARD_BYPASS_REQUIRED";
  if (slopeHazard.classification === "IMPASSABLE_CLIFF_HAZARD") {
    recommendation = "HAZARD_BYPASS_REQUIRED";
  } else if (promiseScore >= 70 && totalUncertainty <= 22) {
    recommendation = "PRIORITY_SAMPLING_SITE";
  } else {
    recommendation = "SECONDARY_EXPLORATION";
  }

  return {
    promiseScore,
    uncertaintyPercent: totalUncertainty,
    confidenceLevel,
    subScores: {
      hydrationResourcePotential: hydrationScore,
      geologicFractureTrapping: fractureTrappingScore,
      evaTerrainAccessibility: accessibilityScore,
      inSituCalibrationScore: calibrationScore,
    },
    nearestRoverGroundTruth: {
      waypointId: closestWp.id,
      waypointName: closestWp.name,
      distanceKm: parseFloat(minDistanceKm.toFixed(2)),
      instrument: closestWp.roverGroundTruth?.instrument ?? "APXS",
      targetName: closestWp.roverGroundTruth?.targetName ?? "Unknown",
      keyFinding: closestWp.roverGroundTruth?.keyFinding ?? "Calibrated baseline point",
    },
    scientificRationale: rationale,
    operationalRecommendation: recommendation,
  };
}
