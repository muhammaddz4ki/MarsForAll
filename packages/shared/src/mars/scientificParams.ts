/**
 * Scientific Parameters and Formulations for Gale Crater / Mount Sharp Exploration
 *
 * Derived from peer-reviewed planetary literature:
 * 1. Morgan et al. (2020) - Subsurface water-ice & thermal inertia modeling (TES/THEMIS)
 * 2. Papers 2909 & 2132 - Impact morphology degradation scaling & Hapke photometric roughness
 * 3. NASA AMMOS MMGIS Architecture (Paper 2541) - Hyperlocalized spatial overlays & instrument telemetry
 */

export interface ThermalInertiaModelConfig {
  /** Critical threshold in tiu (J m^-2 K^-1 s^-1/2) separating unconsolidated dust from indurated/ice-cemented soil */
  thresholdTiu: number;
  /** Martian solar day (sol) in seconds */
  solPeriodSeconds: number;
  /** Typical regolith bulk density in kg/m^3 */
  regolithDensityKgM3: number;
  /** Specific heat capacity of basaltic regolith in J/(kg*K) */
  regolithSpecificHeatJPerKgK: number;
}

export const THERMAL_INERTIA_DEFAULTS: ThermalInertiaModelConfig = {
  thresholdTiu: 75.0, // Morgan et al. 2020 threshold
  solPeriodSeconds: 88775.244, // 24h 39m 35.244s
  regolithDensityKgM3: 1550.0,
  regolithSpecificHeatJPerKgK: 800.0,
};

export type ConsistencyIndexCT = -1 | 0 | 1;

/**
 * Calculates diurnal thermal skin depth (z_skin) in meters.
 * z_skin = I / (rho * c * sqrt(omega))
 * where I is thermal inertia (tiu), omega is rotational frequency = 2*pi / P_sol.
 */
export function computeDiurnalSkinDepth(
  thermalInertiaTiu: number,
  config: ThermalInertiaModelConfig = THERMAL_INERTIA_DEFAULTS
): number {
  const omega = (2 * Math.PI) / config.solPeriodSeconds;
  const volumetricHeatCapacity = config.regolithDensityKgM3 * config.regolithSpecificHeatJPerKgK;
  return thermalInertiaTiu / (volumetricHeatCapacity * Math.sqrt(omega / 2));
}

/**
 * Determines subsurface consistency scoring (CT) according to Morgan et al. (2020):
 *  +1 = Consistent with low-TI mantling over high-TI / ice-cemented layer within diurnal skin depth
 *   0 = Ambiguous / single uniform half-space or unresolved thin boundary (< 1 skin depth)
 *  -1 = Inverted thermal stratification (high-TI crust over low-TI desiccated material)
 */
export function evaluateSubsurfaceConsistency(
  topLayerTiu: number,
  subsurfaceTiu: number,
  mantleDepthMeters: number,
  skinDepthMeters: number
): { ct: ConsistencyIndexCT; rationale: string } {
  if (mantleDepthMeters > 3.0 * skinDepthMeters) {
    return {
      ct: 0,
      rationale: "Overburden exceeds diurnal thermal sensing penetration depth (ambiguous / unresolved).",
    };
  }

  if (topLayerTiu < THERMAL_INERTIA_DEFAULTS.thresholdTiu && subsurfaceTiu >= THERMAL_INERTIA_DEFAULTS.thresholdTiu) {
    return {
      ct: 1,
      rationale: "Low-TI fine regolith mantles high-TI indurated or ice-cemented substrate (+1 consistent).",
    };
  }

  if (topLayerTiu >= THERMAL_INERTIA_DEFAULTS.thresholdTiu && subsurfaceTiu < THERMAL_INERTIA_DEFAULTS.thresholdTiu) {
    return {
      ct: -1,
      rationale: "Inverted thermal profile: high-TI crust over low-TI porous layer (-1 inconsistent).",
    };
  }

  return {
    ct: 0,
    rationale: "Uniform thermal half-space without detectable density/hydration stratification.",
  };
}

/**
 * Terrain mobility hazard classification based on slope gradient.
 */
export type SlopeMobilityClass = "SAFE_WALK" | "SUIT_EXERTION_CAUTION" | "IMPASSABLE_CLIFF_HAZARD";

export function classifySlopeHazard(slopeDegrees: number): {
  classification: SlopeMobilityClass;
  penaltyMultiplier: number;
  label: string;
  color: string;
} {
  if (slopeDegrees < 15.0) {
    return {
      classification: "SAFE_WALK",
      penaltyMultiplier: 1.0 + (slopeDegrees / 15.0) * 0.25,
      label: "Safe Walk (<15°)",
      color: "#22c55e", // green-500
    };
  }
  if (slopeDegrees <= 25.0) {
    // Non-linear physiological suit exertion curve
    const excess = slopeDegrees - 15.0;
    return {
      classification: "SUIT_EXERTION_CAUTION",
      penaltyMultiplier: 2.2 * Math.exp(0.085 * excess),
      label: "Suit Exertion Caution (15°-25°)",
      color: "#eab308", // yellow-500
    };
  }
  return {
    classification: "IMPASSABLE_CLIFF_HAZARD",
    penaltyMultiplier: Infinity,
    label: "Impassable Cliff / Boulder Hazard (>25°)",
    color: "#ef4444", // red-500
  };
}

/**
 * Impact crater degradation scaling and photometric terrain roughness (Papers 2909 & 2132)
 */
export interface PhotometricRoughnessParams {
  /** Hapke mean macroscopic tilt angle in degrees (bar_theta) */
  hapkeRoughnessDeg: number;
  /** Normal albedo (omega_0 single-scattering albedo proxy) */
  geometricAlbedo: number;
  /** Crater degradation scaling exponent (beta ~ 0.32) */
  craterBetaExponent: number;
}

export const PHOTOMETRIC_DEFAULTS: PhotometricRoughnessParams = {
  hapkeRoughnessDeg: 22.5,
  geometricAlbedo: 0.165,
  craterBetaExponent: 0.32,
};

/**
 * Computes terrain impedance factoring in slope, micro-roughness (Hapke bar_theta)
 * and photometric shadow-obscuration risk.
 */
export function computeTerrainImpedance(
  slopeDegrees: number,
  roughness: PhotometricRoughnessParams = PHOTOMETRIC_DEFAULTS
): number {
  const slopeHazard = classifySlopeHazard(slopeDegrees);
  if (!isFinite(slopeHazard.penaltyMultiplier)) {
    return Infinity;
  }
  const roughnessFactor = 1.0 + Math.sin((roughness.hapkeRoughnessDeg * Math.PI) / 180.0) * 0.45;
  const shadowPenalty = roughness.geometricAlbedo < 0.14 ? 1.15 : 1.0;
  return slopeHazard.penaltyMultiplier * roughnessFactor * shadowPenalty;
}

/**
 * NASA AMMOS MMGIS Instrument Telemetry Definitions (Paper 2541)
 */
export interface InstrumentQuicklook {
  instrument: "Mastcam" | "ChemCam" | "APXS" | "REMS" | "RAD";
  status: "nominal" | "active_scan" | "standby" | "alert";
  summary: string;
  primaryMetric: {
    label: string;
    value: string | number;
    unit: string;
  };
  lastSol: number;
}

export interface GaleAtmosphericTelemetry {
  sol: number;
  lsDegrees: number; // Solar longitude (Martian season)
  remsAirTempMinC: number;
  remsAirTempMaxC: number;
  remsGroundTempMinC: number;
  remsGroundTempMaxC: number;
  pressurePa: number;
  windSpeedMps: number;
  dustOpacityTau: number;
  radSurfaceDoseMSvPerSol: number;
  sepRadiationWarning: boolean;
}

