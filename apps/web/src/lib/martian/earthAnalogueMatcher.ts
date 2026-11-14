/**
 * Earth Analogue Matcher Engine
 *
 * Real-time multi-criteria decision analysis (MCDA) matching Martian targets
 * on Mount Sharp against terrestrial planetary testbed sites.
 *
 * Supports dynamic user priority sliders:
 *   - Thermal Inertia / Temperature
 *   - Slope / Topographic Gradient
 *   - Regolith & Boxwork Mineralogy
 *   - Aridity & Surface Radiation Proxy
 */

import { EarthAnalogueSite, EARTH_ANALOGUES } from "./earthAnalogues";
import { MountSharpWaypoint } from "./mountSharpWaypoints";

export interface AnalogueWeightSliders {
  thermalInertiaWeight: number; // 0 - 100
  slopeTopographyWeight: number; // 0 - 100
  mineralogyWeight: number; // 0 - 100
  aridityRadiationWeight: number; // 0 - 100
}

export const DEFAULT_ANALOGUE_WEIGHTS: AnalogueWeightSliders = {
  thermalInertiaWeight: 25,
  slopeTopographyWeight: 25,
  mineralogyWeight: 35,
  aridityRadiationWeight: 15,
};

export interface AnalogueMatchRanking {
  site: EarthAnalogueSite;
  overallMatchScore: number; // 0 - 100%
  rank: number;
  dimensionalScores: {
    thermalScore: number; // 0 - 100
    slopeScore: number; // 0 - 100
    mineralogyScore: number; // 0 - 100
    radiationScore: number; // 0 - 100
  };
  keyCorrelations: string[];
  fieldTestingProtocol: string;
}

/**
 * Calculates a Gaussian similarity between two numerical values given a characteristic scale sigma.
 * similarity = exp( - (valA - valB)^2 / (2 * sigma^2) )
 */
function gaussianSimilarity(valA: number, valB: number, sigma: number): number {
  const diff = valA - valB;
  return Math.exp(-(diff * diff) / (2 * sigma * sigma));
}

/**
 * Match a selected Mount Sharp target against all Earth analogues with customizable weights.
 */
export function matchMartianTargetToEarthAnalogues(
  martianTarget: MountSharpWaypoint,
  weights: AnalogueWeightSliders = DEFAULT_ANALOGUE_WEIGHTS
): AnalogueMatchRanking[] {
  const totalWeight =
    weights.thermalInertiaWeight +
    weights.slopeTopographyWeight +
    weights.mineralogyWeight +
    weights.aridityRadiationWeight;

  const wThermal = totalWeight > 0 ? weights.thermalInertiaWeight / totalWeight : 0.25;
  const wSlope = totalWeight > 0 ? weights.slopeTopographyWeight / totalWeight : 0.25;
  const wMineral = totalWeight > 0 ? weights.mineralogyWeight / totalWeight : 0.25;
  const wRad = totalWeight > 0 ? weights.aridityRadiationWeight / totalWeight : 0.25;

  const results: AnalogueMatchRanking[] = EARTH_ANALOGUES.map((site) => {
    // 1. Thermal Inertia Similarity (typical Martian Gale variance sigma ~ 150 tiu)
    const thermalSim = gaussianSimilarity(
      martianTarget.apparentThermalInertiaTiu,
      site.apparentThermalInertiaTiu,
      140.0
    );
    const thermalScore = Math.round(thermalSim * 100);

    // 2. Slope / Topographic Gradient Similarity (sigma ~ 6.0 deg)
    const slopeSim = gaussianSimilarity(martianTarget.meanSlopeDeg, site.meanSlopeDeg, 5.5);
    const slopeScore = Math.round(slopeSim * 100);

    // 3. Mineralogy Profile Similarity
    // Normalize target mineralogy to 0-1 indices
    const targetSulfateNorm = Math.min(1.0, martianTarget.mineralogy.sulfatePercent / 50.0);
    const targetHematiteNorm = Math.min(1.0, martianTarget.mineralogy.hematitePercent / 40.0);
    const targetClayNorm = Math.min(1.0, martianTarget.mineralogy.phyllosilicateClayPercent / 55.0);
    const targetPerchlorateNorm = Math.min(1.0, martianTarget.mineralogy.perchloratePercent / 1.0);

    const sulfateSim = 1.0 - Math.abs(targetSulfateNorm - site.mineralogyProfile.sulfateIndex);
    const hematiteSim = 1.0 - Math.abs(targetHematiteNorm - site.mineralogyProfile.hematiteIronIndex);
    const claySim = 1.0 - Math.abs(targetClayNorm - site.mineralogyProfile.clayPhyllosilicateIndex);
    const perchSim = 1.0 - Math.abs(targetPerchlorateNorm - site.mineralogyProfile.halitePerchlorateIndex);

    const mineralSim = Math.max(0, (sulfateSim * 0.35 + hematiteSim * 0.25 + claySim * 0.25 + perchSim * 0.15));
    const mineralogyScore = Math.round(mineralSim * 100);

    // 4. Aridity / Radiation Proxy Similarity
    // Gale surface radiation (0.6 - 0.8 mSv/sol) is extreme; scaled to terrestrial proxy
    const targetRadProxy = Math.min(100, Math.round((martianTarget.surfaceRadiationMSvSol / 0.8) * 90));
    const radSim = gaussianSimilarity(targetRadProxy, site.aridityRadiationScore, 20.0);
    const radiationScore = Math.round(radSim * 100);

    // Weighted Composite Score
    const composite =
      thermalScore * wThermal +
      slopeScore * wSlope +
      mineralogyScore * wMineral +
      radiationScore * wRad;

    const overallMatchScore = Math.min(100, Math.max(0, Math.round(composite)));

    // Generate analytical correlations
    const correlations: string[] = [];
    if (site.id === "rio_tinto" && targetHematiteNorm > 0.4) {
      correlations.push("High hematite/goethite concordance mirrors Rio Tinto gossan weathering profiles.");
    }
    if (site.id === "haughton_crater" && martianTarget.consistencyIndexCT === 1) {
      correlations.push("Ground ice preservation model (CT=+1) directly matches Haughton permafrost breccias.");
    }
    if (site.id === "atacama_yungay" && martianTarget.mineralogy.perchloratePercent > 0.3) {
      correlations.push("Perchlorate/nitrate salt encrustation and desiccation dynamics validated by Yungay soil cores.");
    }
    if (site.id === "death_valley_mars_hill" && martianTarget.meanSlopeDeg > 15) {
      correlations.push("Steep talus fan morphology and ventifact boulder distribution replicates Death Valley alluvial channels.");
    }
    if (correlations.length === 0) {
      correlations.push(`General morphological correspondence with ${site.region} terrain regime.`);
    }

    let protocol = "";
    if (site.id === "atacama_yungay") {
      protocol = "Recommended testbed for sample acquisition drills & hygroscopic water extraction validation.";
    } else if (site.id === "haughton_crater") {
      protocol = "Recommended testbed for astronaut EVA mobility suits over polygon permafrost & shatter cone terrain.";
    } else if (site.id === "death_valley_mars_hill") {
      protocol = "Recommended testbed for cargo mule rover traction testing on high-slip loose scree slopes.";
    } else {
      protocol = "Recommended testbed for Raman/LIBS spectral library cross-referencing on hydrated sulfates.";
    }

    return {
      site,
      overallMatchScore,
      rank: 0, // Assigned after sorting
      dimensionalScores: {
        thermalScore,
        slopeScore,
        mineralogyScore,
        radiationScore,
      },
      keyCorrelations: correlations,
      fieldTestingProtocol: protocol,
    };
  });

  // Sort descending by overall match score
  results.sort((a, b) => b.overallMatchScore - a.overallMatchScore);

  // Assign ranks
  results.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return results;
}
