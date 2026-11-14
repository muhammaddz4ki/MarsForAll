/**
 * Earth Analogue Testbed Registry & Telemetry
 *
 * Grounded in planetary analogue missions (NASA Spaceward Bound, FMARS, AMASE).
 * Enriched with NASA Worldview GIBS and OpenStreetMap Overpass API signatures.
 */

export interface EarthAnalogueSite {
  id: string;
  name: string;
  region: string;
  country: string;
  coordinates: [number, number]; // [lon, lat] in WGS84
  elevationM: number;

  // Analogue physical characteristics
  apparentThermalInertiaTiu: number;
  meanSlopeDeg: number;
  roughnessHapkeEquivalentDeg: number;
  mineralogyProfile: {
    sulfateIndex: number; // 0-1
    hematiteIronIndex: number; // 0-1
    clayPhyllosilicateIndex: number; // 0-1
    halitePerchlorateIndex: number; // 0-1
  };
  aridityRadiationScore: number; // 0-100 (100 = extreme UV / hyper-arid)

  // Satellite & GIS Integration (Space Apps 2026 partner offers)
  nasaWorldviewLayer: {
    layerId: string;
    productTitle: string;
    sensor: string;
    recommendedDate: string;
  };
  overpassQuerySignature: {
    amenityOrLanduse: string[];
    surfaceTypes: string[];
    geologicalFeatures: string[];
  };

  // Scientific Analogue Justification
  martianCorrespondence: string;
  bestFitWaypoints: string[]; // ids from MountSharpWaypoint
  fieldCampaignReference: string;
}

export const EARTH_ANALOGUES: EarthAnalogueSite[] = [
  {
    id: "atacama_yungay",
    name: "Yungay Hyper-Arid Core, Atacama Desert",
    region: "Antofagasta",
    country: "Chile",
    coordinates: [-69.8700, -24.0800],
    elevationM: 980,
    apparentThermalInertiaTiu: 185,
    meanSlopeDeg: 4.5,
    roughnessHapkeEquivalentDeg: 18.0,
    mineralogyProfile: {
      sulfateIndex: 0.65,
      hematiteIronIndex: 0.35,
      clayPhyllosilicateIndex: 0.20,
      halitePerchlorateIndex: 0.95,
    },
    aridityRadiationScore: 98,
    nasaWorldviewLayer: {
      layerId: "MODIS_Terra_CorrectedReflectance_TrueColor",
      productTitle: "Terra / MODIS Corrected Reflectance",
      sensor: "MODIS",
      recommendedDate: "2024-03-15",
    },
    overpassQuerySignature: {
      amenityOrLanduse: ["desert", "bare_rock", "salt_flat"],
      surfaceTypes: ["sand", "gravel", "duricrust"],
      geologicalFeatures: ["caliche_crust", "nitrate_salt_plain"],
    },
    martianCorrespondence:
      "Global standard for Mars hyper-aridity, hygroscopic perchlorate/nitrate salts, and extreme UV surface sterilization akin to Gale Crater floor.",
    bestFitWaypoints: ["gale_hab_alpha", "curiosity_boxwork_2025"],
    fieldCampaignReference: "NASA Spaceward Bound Atacama & ASTEP Life in the Atacama (LITA)",
  },
  {
    id: "haughton_crater",
    name: "Haughton Impact Crater, Devon Island",
    region: "Nunavut",
    country: "Canada",
    coordinates: [-89.6833, 75.3833],
    elevationM: 220,
    apparentThermalInertiaTiu: 580,
    meanSlopeDeg: 14.8,
    roughnessHapkeEquivalentDeg: 25.5,
    mineralogyProfile: {
      sulfateIndex: 0.40,
      hematiteIronIndex: 0.25,
      clayPhyllosilicateIndex: 0.45,
      halitePerchlorateIndex: 0.15,
    },
    aridityRadiationScore: 72,
    nasaWorldviewLayer: {
      layerId: "VIIRS_SNPP_CorrectedReflectance_TrueColor",
      productTitle: "Suomi NPP / VIIRS Surface True Color",
      sensor: "VIIRS",
      recommendedDate: "2023-07-20",
    },
    overpassQuerySignature: {
      amenityOrLanduse: ["scree", "glacier", "tundra"],
      surfaceTypes: ["breccia", "permafrost", "shattered_dolomite"],
      geologicalFeatures: ["impact_crater_rim", "hydrothermal_chimney", "polygon_ground"],
    },
    martianCorrespondence:
      "Shocked impact breccias, impact melt sheets, permafrost ground ice (CT = +1 analogue), and relict hydrothermal fracture veins.",
    bestFitWaypoints: ["curiosity_boxwork_2025", "marker_band_valley"],
    fieldCampaignReference: "NASA Haughton-Mars Project (HMP) / Flashline Mars Arctic Research Station (FMARS)",
  },
  {
    id: "death_valley_mars_hill",
    name: "Mars Hill & Badwater Alluvial Complex, Death Valley",
    region: "California",
    country: "United States",
    coordinates: [-116.8200, 36.2300],
    elevationM: -82,
    apparentThermalInertiaTiu: 440,
    meanSlopeDeg: 21.0,
    roughnessHapkeEquivalentDeg: 29.0,
    mineralogyProfile: {
      sulfateIndex: 0.50,
      hematiteIronIndex: 0.40,
      clayPhyllosilicateIndex: 0.30,
      halitePerchlorateIndex: 0.60,
    },
    aridityRadiationScore: 84,
    nasaWorldviewLayer: {
      layerId: "Landsat_WLS_ETM",
      productTitle: "Landsat / ETM Surface Reflectance",
      sensor: "ETM+",
      recommendedDate: "2024-05-10",
    },
    overpassQuerySignature: {
      amenityOrLanduse: ["alluvial_fan", "badlands", "cliff"],
      surfaceTypes: ["desert_pavement", "basalt_talus", "evaporite_mud"],
      geologicalFeatures: ["fault_scarp", "ventifact_field", "salt_heave"],
    },
    martianCorrespondence:
      "Varnish-coated basaltic desert pavements, steep debris slope channels (identical to Gediz Vallis), and salt-heaved polygon crusts.",
    bestFitWaypoints: ["gediz_vallis_ridge", "greenheugh_pediment", "vera_rubin_ridge"],
    fieldCampaignReference: "NASA Mars Exploration Rover (MER) & MSL Instrument Calibration Field Trials",
  },
  {
    id: "rio_tinto",
    name: "Río Tinto Gossan & Sulfate Basin",
    region: "Andalusia",
    country: "Spain",
    coordinates: [-6.5500, 37.7000],
    elevationM: 320,
    apparentThermalInertiaTiu: 360,
    meanSlopeDeg: 9.2,
    roughnessHapkeEquivalentDeg: 21.0,
    mineralogyProfile: {
      sulfateIndex: 0.92,
      hematiteIronIndex: 0.88,
      clayPhyllosilicateIndex: 0.35,
      halitePerchlorateIndex: 0.05,
    },
    aridityRadiationScore: 60,
    nasaWorldviewLayer: {
      layerId: "Sentinel2_L2A_Surface_Reflectance",
      productTitle: "ESA Sentinel-2 Surface Mineral Indices",
      sensor: "MSI",
      recommendedDate: "2024-06-01",
    },
    overpassQuerySignature: {
      amenityOrLanduse: ["quarry", "water_course", "mineral_vein"],
      surfaceTypes: ["ironstone", "jarosite_crust", "red_mud"],
      geologicalFeatures: ["gossan_outcrop", "acidic_leachate_terrace", "pyrite_vein"],
    },
    martianCorrespondence:
      "Premier terrestrial analogue for Martian iron oxide (hematite, goethite) and jarosite sulfate mineralization observed at Vera Rubin Ridge and Mount Sharp base.",
    bestFitWaypoints: ["vera_rubin_ridge", "curiosity_boxwork_2025", "glen_torridon_trough"],
    fieldCampaignReference: "MARTE (Mars Astrobiology Research and Technology Experiment) / NASA Ames",
  },
];

