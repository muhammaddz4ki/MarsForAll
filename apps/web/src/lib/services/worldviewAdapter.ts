/**
 * Space Apps 2026 Partner Integration: NASA Worldview / GIBS Tile Adapter
 *
 * Generates EPSG:3857 and EPSG:4326 WMTS tile URLs for NASA Worldview Earthdata layers,
 * enabling direct satellite inspection of Earth analogue testbeds.
 */

export interface GibsTileOptions {
  layer: string;
  date: string; // YYYY-MM-DD
  tileMatrixSet?: "GoogleMapsCompatible_Level9" | "GoogleMapsCompatible_Level8" | "250m";
  format?: "image/png" | "image/jpeg";
}

const GIBS_BASE =
  process.env.NEXT_PUBLIC_NASA_GIBS_WMTS_ENDPOINT ||
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi";

/**
 * Builds a valid WMTS tile URL template for MapLibre or Leaflet
 */
export function getGibsTileUrlTemplate(options: GibsTileOptions): string {
  const matrixSet = options.tileMatrixSet || "GoogleMapsCompatible_Level9";
  const formatExt = options.format === "image/png" ? "png" : "jpg";

  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${options.layer}/default/${options.date}/${matrixSet}/{z}/{y}/{x}.${formatExt}`;
}

export const RECOMMENDED_ANALOGUE_GIBS_LAYERS = {
  MODIS_TRUE_COLOR: "MODIS_Terra_CorrectedReflectance_TrueColor",
  VIIRS_TRUE_COLOR: "VIIRS_SNPP_CorrectedReflectance_TrueColor",
  AIRS_SURFACE_TEMP_DAY: "AIRS_L3_Surface_Air_Temperature_Daily_Day",
  SMAP_SOIL_MOISTURE: "SMAP_L4_Analyzed_Surface_Soil_Moisture",
};

