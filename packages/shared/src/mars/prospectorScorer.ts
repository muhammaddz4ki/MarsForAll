/**
 * "Prospector" ML Multi-Layer Fusion Engine
 *
 * Inspired by petrophysical and seismic exploration multi-attribute fusion workflows (e.g. SLB / oil & gas).
 * Synthesizes orbital spectroscopy, apparent thermal inertia (ATI & CT), high-resolution DEM slope gradients,
 * the complete 5-term SWIM subsurface water-ice mapping model (Morgan et al. 2020), and in-situ rover calibration.
 */

import {
  THERMAL_INERTIA_DEFAULTS,
  classifySlopeHazard,
  ConsistencyIndexCT,
  Swim5TermConsistency,
  computeCompositeSwimScore,
  evaluateDielectricConsistency,
  computeCrustalMagneticShielding,
  CrustalMagneticShielding,
  evaluateSandTrapRisk,
  SandTrapEvaluation,
} from "./scientificParams.js";
import { MountSharpWaypoint, MOUNT_SHARP_WAYPOINTS } from "./mountSharpWaypoints.js";

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
  dustCoverIndexTau?: number;
  swimOverride?: Swim5TermConsistency;
  crustalMagneticFieldNt?: number;
  themisNightTempK?: number;
}

export interface ProspectorEvaluationResult {
  promiseScore: number; // 0 - 100%
  uncertaintyPercent: number; // ±% (e.g., ± 13.7%)
  confidenceLevel: "HIGH" | "MODERATE" | "RECONNAISSANCE_ONLY";
  subScores: {
    hydrationResourcePotential: number; // 0 - 100
    geologicFractureTrapping: number; // 0 - 100
    evaTerrainAccessibility: number; // 0 - 100
    inSituCalibrationScore: number; // 0 - 100
  };
  swimModel: Swim5TermConsistency;
  crustalMagneticShielding: CrustalMagneticShielding;
  sandTrapAssessment: SandTrapEvaluation;
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
 * Executes the Prospector Multi-Layer Fusion assessment with full 5-term SWIM integration.
 */
export function evaluateProspectorTarget(query: ProspectorInputQuery): ProspectorEvaluationResult {
  const dustTau = query.dustCoverIndexTau ?? 0.35;

  // 1. Hydration & Resource Potential (40% weight)
  const hydrationRaw =
    query.mineralProfile.sulfatePercent * 1.1 +
    query.mineralProfile.phyllosilicateClayPercent * 1.3 +
    query.mineralProfile.hematitePercent * 0.4;
  const hydrationClamped = Math.min(100, Math.max(0, hydrationRaw));

  let thermalMultiplier = 1.0;
  if (query.consistencyIndexCT === 1) {
    thermalMultiplier = 1.25;
  } else if (query.consistencyIndexCT === -1) {
    thermalMultiplier = 0.75;
  }
  const hydrationScore = Math.min(100, Math.round(hydrationClamped * thermalMultiplier));

  // 2. Geologic Fracture Trapping & Boxwork Likelihood (30% weight)
  const tiNormalized = Math.min(1.0, Math.max(0.0, (query.apparentThermalInertiaTiu - 100) / 500));
  const fractureTrappingScore = Math.min(
    100,
    Math.round(tiNormalized * 55 + (query.mineralProfile.sulfatePercent / 50) * 45)
  );

  // 3. EVA Terrain Accessibility Score (20% weight) & Sand Trap Integration
  const slopeHazard = classifySlopeHazard(query.slopeDeg);
  let accessibilityScore = 100;
  if (slopeHazard.classification === "SUIT_EXERTION_CAUTION") {
    accessibilityScore = Math.max(30, Math.round(100 - (query.slopeDeg - 15) * 6.5));
  } else if (slopeHazard.classification === "IMPASSABLE_CLIFF_HAZARD") {
    accessibilityScore = 5;
  }

  // Evaluate Sand Trap condition via THEMIS Night IR & Thermal Inertia
  const defaultNightTemp = query.apparentThermalInertiaTiu >= 350 ? 190 : 175;
  const sandTrapAssessment = evaluateSandTrapRisk(
    query.apparentThermalInertiaTiu,
    query.themisNightTempK ?? defaultNightTemp
  );
  if (sandTrapAssessment.riskLevel === "HIGH") {
    accessibilityScore = Math.max(10, accessibilityScore - 25);
  } else if (sandTrapAssessment.riskLevel === "MODERATE") {
    accessibilityScore = Math.max(20, accessibilityScore - 10);
  }

  // 4. In-Situ Calibration & Distance Penalty
  let closestWp = MOUNT_SHARP_WAYPOINTS[0];
  let minDistanceKm = Infinity;

  for (const wp of MOUNT_SHARP_WAYPOINTS) {
    const dist = calculateMartianDistanceKm(query.coordinates, wp.coordinates);
    if (dist < minDistanceKm) {
      minDistanceKm = dist;
      closestWp = wp;
    }
  }

  const calibrationScore = Math.max(15, Math.min(100, Math.round(100 * Math.exp(-minDistanceKm / 4.5))));

  // Evaluate MGS MAG Crustal Magnetic Field & Natural Shielding
  const effectiveFieldNt = query.crustalMagneticFieldNt ?? closestWp.crustalMagneticFieldNt ?? 30;
  const crustalMagneticShielding = computeCrustalMagneticShielding(effectiveFieldNt);

  // 5. Full 5-Term SWIM Subsurface Water Ice Mapping Model (Morgan et al. 2020)
  let swimModel: Swim5TermConsistency;
  if (query.swimOverride) {
    swimModel = query.swimOverride;
  } else if (closestWp && closestWp.swimIndicators && minDistanceKm < 0.5) {
    swimModel = closestWp.swimIndicators;
  } else {
    // Dynamic synthesis based on local parameters:
    const cnEst = Number((query.mineralProfile.phyllosilicateClayPercent * 0.012 + (query.consistencyIndexCT === 1 ? 0.35 : 0.0) - 0.2).toFixed(2));
    const ctEst = query.consistencyIndexCT;
    const cgEst = Number((tiNormalized * 0.8 - 0.4).toFixed(2));
    const crsEst = Number((tiNormalized * 0.6 - 0.1).toFixed(2));
    const epsPrime = query.consistencyIndexCT === 1 ? 3.65 : query.consistencyIndexCT === -1 ? 7.60 : 5.80;
    const dielectricEval = evaluateDielectricConsistency(epsPrime);
    const compositeRes = computeCompositeSwimScore({
      cn: Math.max(-1, Math.min(1, cnEst)),
      ct: ctEst,
      cg: Math.max(-1, Math.min(1, cgEst)),
      crs: Math.max(-1, Math.min(1, crsEst)),
      crd: dielectricEval.crd,
    });
    swimModel = {
      cn: Math.max(-1, Math.min(1, cnEst)),
      ct: ctEst,
      cg: Math.max(-1, Math.min(1, cgEst)),
      crs: Math.max(-1, Math.min(1, crsEst)),
      crd: dielectricEval.crd,
      epsilonPrime: epsPrime,
      compositeSwimScore: compositeRes.compositeScore,
      materialClassification: dielectricEval.materialCategory,
    };
  }

  // Overall Composite Promise Score (0 - 100%)
  const rawComposite =
    hydrationScore * 0.38 +
    fractureTrappingScore * 0.32 +
    accessibilityScore * 0.18 +
    calibrationScore * 0.12;

  const promiseScore = Math.max(0, Math.min(100, Math.round(rawComposite)));

  // Model Uncertainty Index (±%)
  const baseResolutionGap = 8.0;
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

  rationale.push(
    `SWIM 5-Term Model: CN=${swimModel.cn > 0 ? "+" : ""}${swimModel.cn}, CT=${swimModel.ct > 0 ? "+" : ""}${swimModel.ct}, CG=${swimModel.cg > 0 ? "+" : ""}${swimModel.cg}, CRS=${swimModel.crs > 0 ? "+" : ""}${swimModel.crs}, CRD=${swimModel.crd > 0 ? "+" : ""}${swimModel.crd} (eps'=${swimModel.epsilonPrime}) -> Composite SWIM: ${swimModel.compositeSwimScore > 0 ? "+" : ""}${swimModel.compositeSwimScore} [${swimModel.materialClassification}].`
  );

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

  // Rationale for Sand Trap & MGS MAG
  if (sandTrapAssessment.riskLevel === "HIGH") {
    rationale.push(
      `[CRITICAL TRAVERSAL HAZARD]: Soft sand trap condition (${sandTrapAssessment.firmnessStatus}) detected via low THEMIS Night IR (${sandTrapAssessment.themisNightTempK} K) & TI (${sandTrapAssessment.apparentThermalInertiaTiu} tiu). Bearing capacity ~${sandTrapAssessment.bearingCapacityKPa} kPa.`
    );
  } else if (sandTrapAssessment.firmnessStatus === "BEDROCK FIRM") {
    rationale.push(
      `THEMIS Night IR & TES confirm [BEDROCK FIRM] pavement (${sandTrapAssessment.themisNightTempK} K, ${sandTrapAssessment.apparentThermalInertiaTiu} tiu). Excellent traction with bearing capacity ~${sandTrapAssessment.bearingCapacityKPa} kPa.`
    );
  }

  rationale.push(
    `MGS MAG Crustal Magnetism: Local remanent crustal field is ${crustalMagneticShielding.fieldIntensityNt} nT (${crustalMagneticShielding.magneticDeflectionStatus}), providing ~${crustalMagneticShielding.shieldingFactorPercent}% natural shielding against GCR/SEP radiation.`
  );

  let operationalRecommendation: "PRIORITY_SAMPLING_SITE" | "SECONDARY_EXPLORATION" | "HAZARD_BYPASS_REQUIRED";
  if (slopeHazard.classification === "IMPASSABLE_CLIFF_HAZARD" || sandTrapAssessment.riskLevel === "HIGH") {
    operationalRecommendation = "HAZARD_BYPASS_REQUIRED";
  } else if (promiseScore >= 70 && confidenceLevel !== "RECONNAISSANCE_ONLY") {
    operationalRecommendation = "PRIORITY_SAMPLING_SITE";
  } else {
    operationalRecommendation = "SECONDARY_EXPLORATION";
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
    swimModel,
    crustalMagneticShielding,
    sandTrapAssessment,
    nearestRoverGroundTruth: {
      waypointId: closestWp.id,
      waypointName: closestWp.name,
      distanceKm: parseFloat(minDistanceKm.toFixed(2)),
      instrument: closestWp.roverGroundTruth?.instrument ?? "MSL Payload",
      targetName: closestWp.roverGroundTruth?.targetName ?? "Regional Bedrock",
      keyFinding: closestWp.roverGroundTruth?.keyFinding ?? "Calibrated Gale Crater stratigraphy.",
    },
    scientificRationale: rationale,
    operationalRecommendation,
  };
}
