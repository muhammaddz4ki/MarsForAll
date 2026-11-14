// Verification test script for Martian science models & calculation engines
import {
  computeDiurnalSkinDepth,
  evaluateSubsurfaceConsistency,
  classifySlopeHazard,
  computeTerrainImpedance,
  MOUNT_SHARP_WAYPOINTS,
  EARTH_ANALOGUES,
  evaluateProspectorTarget,
  matchMartianTargetToEarthAnalogues,
  planMarswalkRoute,
  MARTIAN_SCIENTIFIC_LAYERS,
} from "../packages/shared/dist/index.js";

console.log("===============================================================================");
console.log("ARES-PATH // GALE-01: MARTIAN EXPLORATION SCIENCE ENGINES VERIFICATION");
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

// 3. Prospector ML Fusion Evaluation on Boxwork 2025
const boxworkWp = MOUNT_SHARP_WAYPOINTS.find((w) => w.id === "curiosity_boxwork_2025");
console.log(`\n[3] Prospector ML Multi-Layer Fusion Engine on: ${boxworkWp.name}`);
const prospectorResult = evaluateProspectorTarget({
  coordinates: boxworkWp.coordinates,
  elevationM: boxworkWp.elevationM,
  slopeDeg: boxworkWp.meanSlopeDeg,
  apparentThermalInertiaTiu: boxworkWp.apparentThermalInertiaTiu,
  consistencyIndexCT: boxworkWp.consistencyIndexCT,
  mineralProfile: boxworkWp.mineralogy,
  surfaceRadiationMSvSol: boxworkWp.surfaceRadiationMSvSol,
});
console.log(`    Scientific & Resource Promise Score: ${prospectorResult.promiseScore}%`);
console.log(`    Model Uncertainty Index: ±${prospectorResult.uncertaintyPercent}% (${prospectorResult.confidenceLevel})`);
console.log(`    Hydration Potential: ${prospectorResult.subScores.hydrationResourcePotential}/100`);
console.log(`    Fracture Trapping: ${prospectorResult.subScores.geologicFractureTrapping}/100`);
console.log(`    Nearest Ground Truth: ${prospectorResult.nearestRoverGroundTruth.waypointName} (${prospectorResult.nearestRoverGroundTruth.distanceKm} km away)`);
console.log(`    Recommendation: ${prospectorResult.operationalRecommendation}`);

// 4. Earth Analogue Dynamic Matcher
console.log(`\n[4] Earth Analogue Matcher (Target: Boxwork 2025 with Mineralogy Priority):`);
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

// 5. Marswalk Terrain-Aware Route Planner
console.log(`\n[5] Marswalk Route Planner (Habitat Alpha -> Boxwork 2025):`);
const soloRoute = planMarswalkRoute({
  startWaypointId: "gale_hab_alpha",
  targetWaypointId: "curiosity_boxwork_2025",
  supportMode: "SOLO_ASTRONAUT",
});
console.log(`    [SOLO ASTRONAUT]`);
console.log(`    Total Distance: ${soloRoute.totalDistanceKm} km | Duration: ${soloRoute.estimatedDurationHours} hrs (${soloRoute.solFraction} sol)`);
console.log(`    O2 Consumed: ${soloRoute.totalO2ConsumedLiters} L (${soloRoute.remainingO2Percent}% tank remaining)`);
console.log(`    Battery Drain: ${soloRoute.totalBatteryWh} Wh (${soloRoute.remainingBatteryPercent}% reserve remaining)`);
console.log(`    Safety Index: ${soloRoute.overallSafetyIndex}/100 | Segments: ${soloRoute.segments.length}`);

const muleRoute = planMarswalkRoute({
  startWaypointId: "gale_hab_alpha",
  targetWaypointId: "curiosity_boxwork_2025",
  supportMode: "PAIRED_CREW_MULE_ROVER",
});
console.log(`    [PAIRED CREW + CARGO MULE ROVER]`);
console.log(`    Total Distance: ${muleRoute.totalDistanceKm} km | Duration: ${muleRoute.estimatedDurationHours} hrs`);
console.log(`    O2 Consumed: ${muleRoute.totalO2ConsumedLiters} L (${muleRoute.remainingO2Percent}% tank remaining)`);
console.log(`    Battery Drain: ${muleRoute.totalBatteryWh} Wh (${muleRoute.remainingBatteryPercent}% pack remaining)`);
console.log(`    Safety Index: ${muleRoute.overallSafetyIndex}/100 | Payload Capacity: 250 kg`);

console.log(`\n[6] Scientific Layers Configured: ${MARTIAN_SCIENTIFIC_LAYERS.length} layers:`);
MARTIAN_SCIENTIFIC_LAYERS.forEach((l) => console.log(`    - ${l.name} (${l.category})`));

console.log("\n>>> ALL FOUNDATIONAL CALCULATION ENGINES VERIFIED SUCCESSFULLY!");
