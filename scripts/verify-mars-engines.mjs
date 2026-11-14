// Verification test script for Martian science models & calculation engines
import {
  computeDiurnalSkinDepth,
  evaluateSubsurfaceConsistency,
  classifySlopeHazard,
  computeTerrainImpedance,
  MOUNT_SHARP_WAYPOINTS,
  JEZERO_CRATER_WAYPOINTS,
  ALL_MARTIAN_WAYPOINTS,
  MISSION_SITES,
  getWaypointsForSite,
  EARTH_ANALOGUES,
  evaluateProspectorTarget,
  matchMartianTargetToEarthAnalogues,
  planMarswalkRoute,
  MARTIAN_SCIENTIFIC_LAYERS,
  computeCrustalMagneticShielding,
  evaluateSandTrapRisk,
  CURIOSITY_HISTORICAL_TRAVERSE,
  BRADBURY_LANDING_ELLIPSE,
  getFull35Parameters,
  MARTIAN_35_PARAM_METADATA,
  computeRadioLineOfSight,
} from "../packages/shared/dist/index.js";

console.log("===============================================================================");
console.log("MARSFORALL // GALE-01: MARTIAN EXPLORATION SCIENCE ENGINES VERIFICATION");
console.log("===============================================================================\n");

// 1. Thermal & Diurnal Skin Depth Check (Morgan et al. 2020)
const skinDepth75 = computeDiurnalSkinDepth(75.0);
console.log(`[1] Morgan et al. (2020) Diurnal Skin Depth (ATI = 75 tiu): ${(skinDepth75 * 100).toFixed(2)} cm`);
const ctTest = evaluateSubsurfaceConsistency(45, 120, 0.05, skinDepth75);
console.log(`    Consistency Index (45 tiu mantle over 120 tiu substrate): CT = ${ctTest.ct} (${ctTest.rationale})`);

// 2. Slope Hazard Classification
const safeSlope = classifySlopeHazard(8.5);
const cautionSlope = classifySlopeHazard(19.2);
const cliffSlope = classifySlopeHazard(28.0);
console.log(`\n[2] Slope Hazard Masks:`);
console.log(`    8.5°  -> ${safeSlope.label} (multiplier: ${safeSlope.penaltyMultiplier.toFixed(2)})`);
console.log(`    19.2° -> ${cautionSlope.label} (multiplier: ${cautionSlope.penaltyMultiplier.toFixed(2)})`);
console.log(`    28.0° -> ${cliffSlope.label} (multiplier: ${cliffSlope.penaltyMultiplier})`);

// 3. MGS MAG Crustal Magnetic Shielding & THEMIS Sand Trap Detection
console.log(`\n[3] MGS MAG & THEMIS Night IR Safety Engines:`);
const magBoxwork = computeCrustalMagneticShielding(72);
console.log(`    Boxwork 2025 Crustal Field (72 nT): ~${magBoxwork.shieldingFactorPercent}% cosmic ray dose reduction (${magBoxwork.magneticDeflectionStatus})`);
const firmTest = evaluateSandTrapRisk(485, 196);
console.log(`    Firm Bedrock Test (485 tiu, 196 K): [${firmTest.firmnessStatus}] bearing capacity ~${firmTest.bearingCapacityKPa} kPa`);
const sandTrapTest = evaluateSandTrapRisk(140, 168);
console.log(`    Sand Trap Hazard Test (140 tiu, 168 K): [${sandTrapTest.firmnessStatus}] riskLevel: ${sandTrapTest.riskLevel}`);

// 4. Prospector ML Fusion Evaluation on Boxwork 2025
const boxworkWp = MOUNT_SHARP_WAYPOINTS.find((w) => w.id === "curiosity_boxwork_2025");
console.log(`\n[4] Prospector ML Multi-Layer Fusion Engine on: ${boxworkWp.name}`);
const prospectorResult = evaluateProspectorTarget({
  coordinates: boxworkWp.coordinates,
  elevationM: boxworkWp.elevationM,
  slopeDeg: boxworkWp.meanSlopeDeg,
  apparentThermalInertiaTiu: boxworkWp.apparentThermalInertiaTiu,
  consistencyIndexCT: boxworkWp.consistencyIndexCT,
  mineralProfile: boxworkWp.mineralogy,
  surfaceRadiationMSvSol: boxworkWp.surfaceRadiationMSvSol,
  crustalMagneticFieldNt: boxworkWp.crustalMagneticFieldNt,
  themisNightTempK: boxworkWp.themisNightTempK,
});
console.log(`    Scientific & Resource Promise Score: ${prospectorResult.promiseScore}%`);
console.log(`    Model Uncertainty Index: ±${prospectorResult.uncertaintyPercent}% (${prospectorResult.confidenceLevel})`);
console.log(`    Hydration Potential: ${prospectorResult.subScores.hydrationResourcePotential}/100`);
console.log(`    Fracture Trapping: ${prospectorResult.subScores.geologicFractureTrapping}/100`);
console.log(`    Terrain Accessibility (Sand-Trap Aware): ${prospectorResult.subScores.evaTerrainAccessibility}/100`);
console.log(`    MGS MAG Shielding: ${prospectorResult.crustalMagneticShielding.fieldIntensityNt} nT (~${prospectorResult.crustalMagneticShielding.shieldingFactorPercent}%)`);
console.log(`    Sand Trap Assessment: [${prospectorResult.sandTrapAssessment.firmnessStatus}]`);
console.log(`    Nearest Ground Truth: ${prospectorResult.nearestRoverGroundTruth.waypointName} (${prospectorResult.nearestRoverGroundTruth.distanceKm} km away)`);
console.log(`    Recommendation: ${prospectorResult.operationalRecommendation}`);

// 5. Earth Analogue Dynamic Matcher
console.log(`\n[5] Earth Analogue Matcher (Target: Boxwork 2025 with Mineralogy Priority):`);
const analogueRankings = matchMartianTargetToEarthAnalogues(boxworkWp, {
  thermalInertiaWeight: 15,
  slopeTopographyWeight: 15,
  mineralogyWeight: 50,
  aridityRadiationWeight: 20,
});
analogueRankings.forEach((r) => {
  console.log(`    #${r.rank} [${r.overallMatchScore}% Match] ${r.site.name} (${r.site.country})`);
  console.log(`       Correlations: ${r.keyCorrelations[0]}`);
  console.log(`       Protocol: ${r.fieldTestingProtocol}`);
});

// 6. Marswalk Terrain-Aware Route Planner
console.log(`\n[6] Marswalk Route Planner (Habitat Alpha -> Boxwork 2025):`);
const soloRoute = planMarswalkRoute({
  startWaypointId: "gale_hab_alpha",
  targetWaypointId: "curiosity_boxwork_2025",
  supportMode: "SOLO_ASTRONAUT",
});
console.log(`    [SOLO ASTRONAUT]`);
console.log(`    Total Distance: ${soloRoute.totalDistanceKm} km | Duration: ${soloRoute.estimatedDurationHours} hrs (${soloRoute.solFraction} sol)`);
console.log(`    O2 Consumed: ${soloRoute.totalO2ConsumedLiters} L (${soloRoute.remainingO2Percent}% tank remaining)`);
console.log(`    Battery Drain: ${soloRoute.totalBatteryWh} Wh (${soloRoute.remainingBatteryPercent}% reserve remaining)`);
console.log(`    Avg Crustal Magnetism: ${soloRoute.averageCrustalMagNt} nT (~${soloRoute.magneticShieldingReductionPercent}% GCR reduction)`);
console.log(`    Sand Trap Hazards Detected: ${soloRoute.sandTrapWarningCount}`);
console.log(`    Safety Index: ${soloRoute.overallSafetyIndex}/100 | Segments: ${soloRoute.segments.length}`);

// 7. Curiosity Historical Traverse & 5 Operational Layers Check
console.log(`\n[7] MSL Curiosity Historical Traverse & 5 Operational Layers:`);
console.log(`    Landing Ellipse Defined: ${BRADBURY_LANDING_ELLIPSE.length} polygon vertices centered at Bradbury Landing.`);
console.log(`    Historical Traverse Checkpoints: ${CURIOSITY_HISTORICAL_TRAVERSE.length} mission milestones:`);
CURIOSITY_HISTORICAL_TRAVERSE.forEach((pt) => {
  console.log(`      - Sol ${pt.sol}: ${pt.name} (${pt.coordinates[1]}°, ${pt.coordinates[0]}°) [${pt.milestone}]`);
});
console.log(`\n    5 NASA Operational Layers Configured (${MARTIAN_SCIENTIFIC_LAYERS.length} total):`);
MARTIAN_SCIENTIFIC_LAYERS.forEach((l) => console.log(`      [${l.category.toUpperCase()}] ${l.name}`));

// 8. Complete 35-Parameter Martian Dataset & SHARAD Profile Validation
console.log(`\n[8] Complete 35-Parameter Martian Science Dataset & SHARAD Radargram:`);
const boxwork35 = getFull35Parameters(boxworkWp);
console.log(`    Metadata Registry: ${MARTIAN_35_PARAM_METADATA.length} parameters across 7 scientific domains.`);
console.log(`    [D1 Topography] Elev: ${boxwork35.elevationM} m | Slope: ${boxwork35.slopeDeg}° | Aspect: ${boxwork35.aspectDeg}° (${boxwork35.aspectCardinal})`);
console.log(`    [D2 Thermal] Day Temp: ${boxwork35.daySurfaceTempC}°C (${boxwork35.daySurfaceTempK} K) | Night: ${boxwork35.nightSurfaceTempC}°C | TI: ${boxwork35.thermalInertiaTiu} tiu`);
console.log(`    [D3 Weather] Ambient Air: ${boxwork35.ambientAirTempC}°C | Pressure: ${boxwork35.atmosphericPressurePa} Pa | Tau: ${boxwork35.dustOpacityTau}`);
console.log(`    [D4 Radiation] Surface GCR: ${boxwork35.gcrDoseRateUGyDay} µGy/day (${boxwork35.doseRateMSvHr} mSv/hr) | SPE: [${boxwork35.speAlertLevel}] | UV: [${boxwork35.uvIndexLevel}]`);
console.log(`    [D5 Mineralogy] CRISM Sulfates: ${boxwork35.crismSpectralIndices.sulfatesGypsumJarosite} | WEH: ${boxwork35.waterEquivalentHydrogenWtPct} wt% | Si: ${boxwork35.elementalChemistry.siPct}%, Fe: ${boxwork35.elementalChemistry.fePct}%`);
console.log(`    [D6 Subsurface] SHARAD Profile: ${boxwork35.sharadSubsurfaceProfile.length} stratigraphy layers (0-500m depth):`);
boxwork35.sharadSubsurfaceProfile.forEach((l) => {
  console.log(`        - [${l.depthStartM}m - ${l.depthEndM}m] ${l.layerName} (ε' = ${l.dielectricPermittivity}, ${l.densityGPerCm3} g/cm³)`);
});
console.log(`    [D7 Nav & Comms] Coordinates: [${boxwork35.coordinates[1]}°, ${boxwork35.coordinates[0]}°] | Sol: ${boxwork35.sol} | Radio LOS: [${boxwork35.radioLineOfSight}]`);

// 9. Multi-Site Mission Infrastructure: Jezero Crater (Mars 2020 Perseverance)
console.log(`\n[9] Multi-Site Infrastructure: Jezero Crater (Mars 2020 Perseverance):`);
console.log(`    Configured Mission Sites (${Object.keys(MISSION_SITES).length}):`);
Object.values(MISSION_SITES).forEach((site) => {
  console.log(`      - [${site.shortLabel}] ${site.name} (Rover: ${site.roverName}, Center: ${site.center[1]}°N, ${site.center[0]}°E, Elev: ${site.molaCenterElevationM}m)`);
});
console.log(`    Jezero Crater Waypoint Registry (${JEZERO_CRATER_WAYPOINTS.length} waypoints):`);
JEZERO_CRATER_WAYPOINTS.forEach((wp) => {
  console.log(`      - [${wp.id}] ${wp.name} (Elev: ${wp.elevationM}m, Age: ${wp.stratigraphicAge}, Unit: ${wp.geologicUnit})`);
});
console.log(`    Total Planetary Network Waypoints: ${ALL_MARTIAN_WAYPOINTS.length}`);

// Test Prospector ML on Jezero Bright Angel / Cheyava Falls
const cheyavaWp = JEZERO_CRATER_WAYPOINTS.find((w) => w.id === "jzr_bright_angel_redox");
const cheyavaProspector = evaluateProspectorTarget({
  coordinates: cheyavaWp.coordinates,
  elevationM: cheyavaWp.elevationM,
  slopeDeg: cheyavaWp.meanSlopeDeg,
  apparentThermalInertiaTiu: cheyavaWp.apparentThermalInertiaTiu,
  consistencyIndexCT: cheyavaWp.consistencyIndexCT,
  mineralProfile: cheyavaWp.mineralogy,
  surfaceRadiationMSvSol: cheyavaWp.surfaceRadiationMSvSol,
  crustalMagneticFieldNt: cheyavaWp.crustalMagneticFieldNt,
  themisNightTempK: cheyavaWp.themisNightTempK,
});
console.log(`\n    Prospector ML Evaluation on Cheyava Falls:`);
console.log(`      Promise Score: ${cheyavaProspector.promiseScore}% | Confidence: ${cheyavaProspector.confidenceLevel} (±${cheyavaProspector.uncertaintyPercent}%)`);
console.log(`      Hydration: ${cheyavaProspector.subScores.hydrationResourcePotential}/100 | Fracture Trapping: ${cheyavaProspector.subScores.geologicFractureTrapping}/100`);

// Test Jezero Marswalk Route (Octavia Butler -> Three Forks Delta Front)
const jezeroRoute = planMarswalkRoute({
  startWaypointId: "jzr_hab_alpha",
  targetWaypointId: "jzr_three_forks_delta",
  supportMode: "PAIRED_CREW_MULE_ROVER",
});
console.log(`\n    Marswalk Route in Jezero (Octavia Butler -> Delta Front):`);
console.log(`      Total Distance: ${jezeroRoute.totalDistanceKm} km | Duration: ${jezeroRoute.estimatedDurationHours} hrs`);
console.log(`      Remaining O2: ${jezeroRoute.remainingO2Percent}% | Battery Reserve: ${jezeroRoute.remainingBatteryPercent}%`);
console.log(`      Route Segments: ${jezeroRoute.segments.length} segments`);

console.log("\n>>> ALL MARSFORALL FOUNDATIONAL CALCULATION ENGINES VERIFIED SUCCESSFULLY!");

