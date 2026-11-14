/**
 * Scientific Parameters and Formulations for Gale Crater / Mount Sharp Exploration
 *
 * Derived from peer-reviewed planetary literature:
 * 1. Morgan et al. (2020) - Subsurface water-ice & thermal inertia modeling (SWIM 5-Term Model)
 * 2. Papers 2909 & 2132 - Impact morphology degradation scaling, Lambertian & Hapke photometric roughness
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
 * 5-Term Subsurface Water Ice Mapping (SWIM) Model (Morgan et al. 2020)
 *
 * Integrates 5 independent geophysical indicators:
 *   - CN: Neutron-detected hydrogen (MONS / HEND / DAN) in [-1, +1]
 *   - CT: Thermal inertia consistency in [-1, 0, +1]
 *   - CG: Geomorphic periglacial polygon landform score in [-1, +1]
 *   - CRS: SHARAD surface radar return reflectivity in [-1, +1]
 *   - CRD: SHARAD dielectric permittivity consistency in [-1, +1]
 */
export interface Swim5TermConsistency {
  cn: number; // Neutron (-1 to +1)
  ct: ConsistencyIndexCT; // Thermal (-1, 0, +1)
  cg: number; // Geomorphology (-1 to +1)
  crs: number; // Radar Surface (-1 to +1)
  crd: number; // Radar Dielectric (-1 to +1)
  epsilonPrime: number; // Dielectric permittivity (3.15 = pure ice, 5.0 = mixture, 7.5 = basalt)
  compositeSwimScore: number; // Weighted composite (-1.0 to +1.0)
  materialClassification: string;
}

/**
 * Computes dielectric permittivity from SHARAD radar two-way travel time delay:
 * epsilon' = (c * delta_t / (2 * h))^2
 * where c = 0.299792 m/ns (speed of light in vacuum), delta_t is delay in ns, h is depth in meters.
 */
export function computeDielectricPermittivity(twoWayDelayNs: number, layerDepthMeters: number): number {
  if (layerDepthMeters <= 0) return 7.5;
  const c = 0.299792;
  const ratio = (c * twoWayDelayNs) / (2 * layerDepthMeters);
  return Number(Math.pow(ratio, 2).toFixed(2));
}

/**
 * Maps dielectric permittivity epsilon' to SWIM consistency score CRD [-1, +1]:
 *   epsilon' <= 3.15 -> +1.0 (pure water ice)
 *   epsilon' = 5.0  -> 0.0  (mixture)
 *   epsilon' >= 7.0 -> -1.0 (dry basaltic bedrock)
 */
export function evaluateDielectricConsistency(epsilonPrime: number): { crd: number; materialCategory: string } {
  if (epsilonPrime <= 3.15) {
    return { crd: 1.0, materialCategory: "Pure Water Ice (epsilon' <= 3.15)" };
  } else if (epsilonPrime <= 5.0) {
    const score = 1.0 - ((epsilonPrime - 3.15) / (5.0 - 3.15));
    return { crd: Number(score.toFixed(2)), materialCategory: "Hydrated Regolith / Ice Mixture (3.15 < epsilon' <= 5.0)" };
  } else if (epsilonPrime <= 7.0) {
    const score = 0.0 - ((epsilonPrime - 5.0) / (7.0 - 5.0));
    return { crd: Number(score.toFixed(2)), materialCategory: "Indurated Sulfate / Dense Soil (5.0 < epsilon' <= 7.0)" };
  } else {
    return { crd: -1.0, materialCategory: "Dry Basaltic Rock / Dense Bedrock (epsilon' >= 7.0)" };
  }
}

/**
 * Computes the weighted composite SWIM score across all 5 instruments.
 */
export function computeCompositeSwimScore(params: {
  cn: number;
  ct: ConsistencyIndexCT;
  cg: number;
  crs: number;
  crd: number;
}): { compositeScore: number; classification: "HIGH_CONFIDENCE_ICE" | "POTENTIAL_HYDRATED_UNIT" | "INCONCLUSIVE" | "ICE_FREE_BEDROCK" } {
  // SWIM Weight distribution: Neutron 25%, Thermal 25%, Geomorphology 20%, Radar Surface 10%, Radar Dielectric 20%
  const score = 0.25 * params.cn + 0.25 * params.ct + 0.20 * params.cg + 0.10 * params.crs + 0.20 * params.crd;
  const compositeScore = Number(score.toFixed(2));
  let classification: "HIGH_CONFIDENCE_ICE" | "POTENTIAL_HYDRATED_UNIT" | "INCONCLUSIVE" | "ICE_FREE_BEDROCK";
  if (compositeScore >= 0.45) classification = "HIGH_CONFIDENCE_ICE";
  else if (compositeScore >= 0.15) classification = "POTENTIAL_HYDRATED_UNIT";
  else if (compositeScore >= -0.15) classification = "INCONCLUSIVE";
  else classification = "ICE_FREE_BEDROCK";
  return { compositeScore, classification };
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
      color: "#22c55e",
    };
  }
  if (slopeDegrees <= 25.0) {
    const excess = slopeDegrees - 15.0;
    return {
      classification: "SUIT_EXERTION_CAUTION",
      penaltyMultiplier: 2.2 * Math.exp(0.085 * excess),
      label: "Suit Exertion Caution (15°-25°)",
      color: "#eab308",
    };
  }
  return {
    classification: "IMPASSABLE_CLIFF_HAZARD",
    penaltyMultiplier: Infinity,
    label: "Impassable Cliff / Boulder Hazard (>25°)",
    color: "#ef4444",
  };
}

/**
 * Photometric Scattering & Lambertian Illumination (Papers 2909 & 2132)
 */
export interface PhotometricRoughnessParams {
  hapkeRoughnessDeg: number;
  geometricAlbedo: number;
  craterBetaExponent: number;
}

export const PHOTOMETRIC_DEFAULTS: PhotometricRoughnessParams = {
  hapkeRoughnessDeg: 22.5,
  geometricAlbedo: 0.165,
  craterBetaExponent: 0.32,
};

export interface LambertianPhotometryMetrics {
  solarElevationDeg: number;
  solarIncidenceDeg: number;
  mu0CosIncidence: number;
  terrainContrastIndex: number; // 0 - 100%
  glareObstacleIndex: number; // 0 - 100%
  shadowLengthMultiplier: number;
}

/**
 * Evaluates Lambertian photometric scattering on Mars regolith per Sol (Paper 2132)
 */
export function computeLambertianPhotometry(solarElevationDeg: number): LambertianPhotometryMetrics {
  const clampedElev = Math.max(1, Math.min(89, solarElevationDeg));
  const incidence = 90 - clampedElev;
  const radIncidence = (incidence * Math.PI) / 180.0;
  const mu0 = Math.cos(radIncidence);
  const shadowMultiplier = 1.0 / Math.tan((clampedElev * Math.PI) / 180.0);
  const contrast = Math.round((1 - mu0) * 100);
  const glare = clampedElev < 25
    ? Math.round((1 - clampedElev / 25) * 85 + 15)
    : Math.round(Math.max(5, (1 - clampedElev / 90) * 40));
  return {
    solarElevationDeg: clampedElev,
    solarIncidenceDeg: incidence,
    mu0CosIncidence: Number(mu0.toFixed(3)),
    terrainContrastIndex: contrast,
    glareObstacleIndex: glare,
    shadowLengthMultiplier: Number(shadowMultiplier.toFixed(2)),
  };
}

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
  lsDegrees: number;
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

export type OrbitalImagerySource = "jpl_hirise" | "mola_hrsc" | "opm_basemap" | "local_vector";
export type WmtsStreamStatus = "streaming" | "fallback";

export interface OrbitalWmtsPreset {
  id: OrbitalImagerySource;
  label: string;
  sublabel: string;
  resolution: string;
  tiles: string[];
  attribution: string;
}

export const ORBITAL_WMTS_PRESETS: Record<OrbitalImagerySource, OrbitalWmtsPreset> = {
  jpl_hirise: {
    id: "jpl_hirise",
    label: "JPL GALE CTX ORBITAL",
    sublabel: "Gale Crater Block-Adjusted CTX Mosaic (6m/px)",
    resolution: "6.0 m/px",
    tiles: [
      "/api/mars-tiles/gale-hirise/{z}/{y}/{x}",
    ],
    attribution: "NASA/JPL/MSSS / Mars Trek WMTS (Server Proxy)",
  },
  mola_hrsc: {
    id: "mola_hrsc",
    label: "MOLA / HRSC CLRSHADE WMTS",
    sublabel: "Mars Global Colorized Hillshade Blend (200m/px)",
    resolution: "200 m/px",
    tiles: [
      "/api/mars-tiles/mola-clrshade/{z}/{y}/{x}",
    ],
    attribution: "NASA/JPL/DLR / USGS Astrogeology (Server Proxy)",
  },
  opm_basemap: {
    id: "opm_basemap",
    label: "OPENPLANETARY MARS BASE",
    sublabel: "Shaded Relief Basemap v0.1",
    resolution: "Global Tile Cache",
    tiles: [
      "https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-mars-basemap-v0-1/all/{z}/{x}/{y}.png",
    ],
    attribution: "OpenPlanetary / CARTO / USGS",
  },
  local_vector: {
    id: "local_vector",
    label: "LOCAL PROCEDURAL VECTOR",
    sublabel: "Gale Crater Offline Contour & Ridge Vectors",
    resolution: "100% Offline Embedded GeoJSON",
    tiles: [],
    attribution: "MARSFORALL Embedded Basal Geology",
  },
};

/**
 * MGS MAG Crustal Magnetic Field Deflection Model
 * Mars Global Surveyor Magnetometer / Electron Reflectometer (MAG/ER).
 * In Gale Crater, localized ancient remanent magnetization in bedrock (15 - 85 nT)
 * provides a partial magnetic deflection umbrella against Solar Energetic Particles (SEP)
 * and Galactic Cosmic Rays (GCR).
 */
export interface CrustalMagneticShielding {
  fieldIntensityNt: number;
  shieldingFactorPercent: number; // 0 - 20% dose reduction
  magneticDeflectionStatus: "MINIMAL_SHIELDING" | "MODERATE_DEFLECTION" | "HIGH_MAGNETIC_UMBRELLA";
  scientificSummary: string;
}

export function computeCrustalMagneticShielding(fieldIntensityNt: number): CrustalMagneticShielding {
  const clamped = Math.max(0, Math.min(120, fieldIntensityNt));
  // 0 nT -> 0%, 50 nT -> 9.5%, 85 nT -> 16.2%
  const shieldingFactorPercent = Number((clamped * 0.19).toFixed(1));
  let magneticDeflectionStatus: "MINIMAL_SHIELDING" | "MODERATE_DEFLECTION" | "HIGH_MAGNETIC_UMBRELLA";
  if (clamped >= 60) {
    magneticDeflectionStatus = "HIGH_MAGNETIC_UMBRELLA";
  } else if (clamped >= 35) {
    magneticDeflectionStatus = "MODERATE_DEFLECTION";
  } else {
    magneticDeflectionStatus = "MINIMAL_SHIELDING";
  }

  const scientificSummary = `MGS MAG Crustal Field: ${clamped} nT provides ~${shieldingFactorPercent}% partial GCR/SEP deflection over regional bedrock.`;
  return {
    fieldIntensityNt: clamped,
    shieldingFactorPercent,
    magneticDeflectionStatus,
    scientificSummary,
  };
}

/**
 * THEMIS Night IR & Apparent Thermal Inertia (ATI) Sand Trap Risk Detector
 *
 * Differentiates consolidated bedrock (stays warm in night IR, high thermal inertia)
 * from loose eolian sand dunes and thick dust mantles (cools rapidly in night IR, low thermal inertia),
 * which present critical entrapment risks for astronaut boots and rover wheels.
 */
export type SandTrapRiskLevel = "LOW" | "MODERATE" | "HIGH";
export type SurfaceFirmnessStatus = "BEDROCK FIRM" | "MODERATE COMPACTION" | "SOFT SAND TRAP RISK";

export interface SandTrapEvaluation {
  riskLevel: SandTrapRiskLevel;
  firmnessStatus: SurfaceFirmnessStatus;
  apparentThermalInertiaTiu: number;
  themisNightTempK: number;
  bearingCapacityKPa: number;
  recommendation: string;
}

export function evaluateSandTrapRisk(
  thermalInertiaTiu: number,
  themisNightTempK: number
): SandTrapEvaluation {
  // Bedrock: TI >= 350 tiu, Night Temp >= 185 K
  if (thermalInertiaTiu >= 350 && themisNightTempK >= 185) {
    return {
      riskLevel: "LOW",
      firmnessStatus: "BEDROCK FIRM",
      apparentThermalInertiaTiu: thermalInertiaTiu,
      themisNightTempK,
      bearingCapacityKPa: 220,
      recommendation: "Solid bedrock pavement. Optimal traction for astronaut EVA boots and cargo transport.",
    };
  }

  // Moderate Compaction: TI >= 200 tiu or Night Temp >= 178 K
  if (thermalInertiaTiu >= 200 || themisNightTempK >= 178) {
    return {
      riskLevel: "MODERATE",
      firmnessStatus: "MODERATE COMPACTION",
      apparentThermalInertiaTiu: thermalInertiaTiu,
      themisNightTempK,
      bearingCapacityKPa: 110,
      recommendation: "Indurated regolith / sulfate crust. Nominal traction with minor slip risk on slopes.",
    };
  }

  // Sand Trap Risk: TI < 200 tiu and Night Temp < 178 K
  return {
    riskLevel: "HIGH",
    firmnessStatus: "SOFT SAND TRAP RISK",
    apparentThermalInertiaTiu: thermalInertiaTiu,
    themisNightTempK,
    bearingCapacityKPa: 28,
    recommendation: "Unconsolidated eolian drift / fine dust sinkage risk. Restrict wheeled traversal and deploy suit snowshoes.",
  };
}

// ============================================================================
// COMPLETE 35-PARAMETER MARTIAN EXPLORATION TELEMETRY SPECIFICATION
// ============================================================================

export interface SharadSubsurfaceLayer {
  depthStartM: number;
  depthEndM: number;
  layerName: string;
  dielectricPermittivity: number;
  materialComposition: string;
  densityGPerCm3: number;
}

export interface SunIlluminationTelemetry {
  azimuthDeg: number;
  zenithDeg: number;
  shadowRatioPct: number;
}

export interface ElementalChemistry {
  siPct: number;
  fePct: number;
  clPct: number;
  mgPct: number;
  alPct: number;
  kPct: number;
  thPpm: number;
}

export interface CrismSpectralIndices {
  phyllosilicatesClays: number;
  sulfatesGypsumJarosite: number;
  carbonates: number;
  olivinePyroxene: number;
  hematiteFerricOxidePct: number;
}

export interface RouteMetrics {
  routeDistanceKm: number;
  evaDurationMin: number;
  oxygenRemainingPct: number;
  batteryRemainingPct: number;
}

export type RadioLineOfSightStatus = "CONNECTED" | "BLOCKED - RELAY NEEDED";

export interface ParameterMetadataTag {
  paramId: number;
  name: string;
  domain: string;
  instrument: string;
  unit: string;
  dataSource: "LIVE_API" | "JPL_TREK_DEM" | "MSL_PDS_ARCHIVE" | "PHYSICS_COMPUTED";
}

/**
 * Calculates radio line-of-sight between Habitat Alpha (-4.5895, 137.4417, elev -4500)
 * and target waypoint (lon, lat, elev).
 */
export function computeRadioLineOfSight(
  targetLon: number,
  targetLat: number,
  targetElevM: number
): RadioLineOfSightStatus {
  if (targetLat < -5.25 && targetLon > 137.75) {
    return "BLOCKED - RELAY NEEDED";
  }
  if (targetElevM < -4350 && targetLat < -5.0 && targetLon > 137.6) {
    return "BLOCKED - RELAY NEEDED";
  }
  return "CONNECTED";
}



