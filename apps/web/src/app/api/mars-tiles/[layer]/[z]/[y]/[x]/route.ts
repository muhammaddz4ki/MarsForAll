import { NextRequest, NextResponse } from "next/server";

// 1x1 transparent PNG buffer for missing/out-of-bounds tiles
const TRANSPARENT_1X1_PNG = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64"
  )
);

interface CachedTile {
  buffer: Uint8Array;
  contentType: string;
}

// In-Memory LRU Tile Cache (Cap at 500 tiles in Node.js server RAM ~25-35MB max)
const MAX_LRU_TILES = 500;
const tileCache = new Map<string, CachedTile>();

function getCachedTile(key: string): CachedTile | undefined {
  const item = tileCache.get(key);
  if (item) {
    // Refresh recency for LRU
    tileCache.delete(key);
    tileCache.set(key, item);
  }
  return item;
}

function setCachedTile(key: string, item: CachedTile) {
  if (tileCache.size >= MAX_LRU_TILES) {
    const oldestKey = tileCache.keys().next().value;
    if (oldestKey) tileCache.delete(oldestKey);
  }
  tileCache.set(key, item);
}

interface RouteParams {
  params: {
    layer: string;
    z: string;
    y: string;
    x: string;
  };
}

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { layer, z, y, x } = params;
  const isDirectTrek = request.nextUrl.searchParams.get("raw") === "trek";

  const numZ = parseInt(z, 10);
  const numY = parseInt(y, 10);
  const numX = parseInt(x, 10);

  let trekZ = numZ;
  let trekX = numX;
  let trekY = numY;
  let lonDeg = 0;
  let latDeg = 0;

  if (!isDirectTrek) {
    // MapLibre Web Mercator (z, x, y) -> NASA Mars Trek Equirectangular (default028mm) conversion
    // Note: in our route folder segment [layer]/[z]/[y]/[x]:
    // numX represents the horizontal tile column (x), numY represents vertical tile row (y)
    lonDeg = ((numX + 0.5) / Math.pow(2, numZ)) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * (numY + 0.5)) / Math.pow(2, numZ);
    latDeg = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

    trekZ = Math.max(0, Math.min(numZ - 1, 13));
    const maxCols = Math.pow(2, trekZ + 1);
    const maxRows = Math.pow(2, trekZ);

    trekX = Math.floor(((lonDeg + 180) / 360) * maxCols);
    trekY = Math.floor(((90 - latDeg) / 180) * maxRows);

    trekX = Math.max(0, Math.min(trekX, maxCols - 1));
    trekY = Math.max(0, Math.min(trekY, maxRows - 1));
  } else {
    lonDeg = (trekX / Math.pow(2, trekZ + 1)) * 360 - 180;
    latDeg = 90 - (trekY / Math.pow(2, trekZ)) * 180;
  }

  const cacheKey = `${layer}/${trekZ}/${trekY}/${trekX}`;

  // Serve from In-Memory LRU Cache instantly (< 2ms) without touching NASA upstream
  const cached = getCachedTile(cacheKey);
  if (cached) {
    return new NextResponse(cached.buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": cached.contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Tile-Cache": "HIT",
      },
    });
  }

  let remoteUrl = "";
  let isCtx = false;
  let ext = "jpg";

  // Layer mapping dictionary with explicit maxZoom support
  const LAYER_MAP: Record<string, { id: string; ext: "jpg" | "png"; maxZoom: number }> = {
    "viking-mdim21": { id: "Mars_Viking_MDIM21_ClrMosaic_global_232m", ext: "jpg", maxZoom: 7 },
    viking: { id: "Mars_Viking_MDIM21_ClrMosaic_global_232m", ext: "jpg", maxZoom: 7 },
    "mola-clrshade": { id: "Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw", ext: "jpg", maxZoom: 7 },
    mola: { id: "Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw", ext: "jpg", maxZoom: 7 },
    "mola-dem": { id: "Mars_MGS_MOLA_DEM_mosaic_global_463m", ext: "jpg", maxZoom: 7 },
    "mola-slope": { id: "Mars_MGS_MOLA_Slope_Map", ext: "jpg", maxZoom: 7 },
    "mola-roughness": { id: "Mars_MGS_MOLA_Roughness_0.6km", ext: "jpg", maxZoom: 7 },
    "mola-hillshade": { id: "MOLA_hillshade_64ppd", ext: "jpg", maxZoom: 7 },
    "themis-day-ir": { id: "Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v2", ext: "jpg", maxZoom: 8 },
    "themis-day": { id: "Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v2", ext: "jpg", maxZoom: 8 },
    "themis-night-ir": { id: "Mars_MO_THEMIS-IR-Night_mosaic_global_100m_v2", ext: "jpg", maxZoom: 8 },
    "themis-night": { id: "Mars_MO_THEMIS-IR-Night_mosaic_global_100m_v2", ext: "jpg", maxZoom: 8 },
    "themis-ti": { id: "THEMIS_Thermal_Inertia_Mosaic_100m", ext: "jpg", maxZoom: 8 },
    "tes-ti": { id: "TES_Thermal_Inertia", ext: "jpg", maxZoom: 7 },
    "tes-dust": { id: "TES_Dust_Cover_Index", ext: "jpg", maxZoom: 7 },
    "tes-albedo": { id: "TES_Lambert_Albedo", ext: "jpg", maxZoom: 7 },
    "gale-ctx": { id: "Gale_CTX_BlockAdj_dd", ext: "png", maxZoom: 12 },
    "gale-hirise": { id: "Gale_CTX_BlockAdj_dd", ext: "png", maxZoom: 12 },
    "hirise-gale": { id: "Gale_CTX_BlockAdj_dd", ext: "png", maxZoom: 12 },
    "gale-ortho-25cm": { id: "MSL_Gale_Orthophoto_Mosaic_25cm_v3", ext: "png", maxZoom: 13 },
    "gale-dtm-1m": { id: "MSL_Gale_HiRISE_DTM_1m", ext: "png", maxZoom: 13 },
    "jezero-ctx": { id: "Jezero_CTX_BlockAdj_dd", ext: "png", maxZoom: 12 },
    "mgs-mag": { id: "MGS_Crustal_Magnetism_Radial_Field", ext: "jpg", maxZoom: 7 },
    "omega-clays": { id: "OMEGA_Phyllosilicates_Map", ext: "png", maxZoom: 7 },
    "crism-clays": { id: "OMEGA_Phyllosilicates_Map", ext: "png", maxZoom: 7 },
    "tes-sulfate": { id: "TES_Sulfate_Abundance", ext: "jpg", maxZoom: 7 },
    "tes-carbonate": { id: "TES_Carbonate_Abundance", ext: "jpg", maxZoom: 7 },
    "tes-olivine": { id: "TES_Olivine_Abundance", ext: "jpg", maxZoom: 7 },
    "tes-hematite": { id: "TES_Hematite_Abundance", ext: "jpg", maxZoom: 7 },
    "mons-weh": { id: "MONS_Water_Equivalent_Hydrogen", ext: "jpg", maxZoom: 7 },
    "grs-iron": { id: "MO_GRS_Iron_Concentration", ext: "jpg", maxZoom: 7 },
    "usgs-geology": { id: "USGS_SIM3292_Global_Geologic_Map_of_Mars", ext: "jpg", maxZoom: 7 },
    "mro-gravity": { id: "MRO_GMM3_Free_Air_Gravity_Map", ext: "jpg", maxZoom: 7 },
  };

  let targetMaxZoom = 12;
  if (LAYER_MAP[layer]) {
    const target = LAYER_MAP[layer];
    targetMaxZoom = target.maxZoom;
    isCtx = target.ext === "png";
    ext = target.ext;
  } else if (
    layer.startsWith("Mars_") ||
    layer.startsWith("THEMIS_") ||
    layer.startsWith("TES_") ||
    layer.startsWith("MGS_") ||
    layer.startsWith("MSL_") ||
    layer.startsWith("USGS_") ||
    layer.startsWith("MRO_") ||
    layer.startsWith("OMEGA_") ||
    layer.startsWith("MONS_") ||
    layer.startsWith("MO_")
  ) {
    targetMaxZoom = layer.includes("CTX") || layer.includes("HiRISE") ? 12 : 7;
    ext = layer.includes("HiRISE") || layer.includes("CTX") || layer.includes("Orthophoto") ? "png" : "jpg";
    isCtx = ext === "png";
  } else {
    return new NextResponse(TRANSPARENT_1X1_PNG as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
        "X-Tile-Fallback": "invalid-layer",
      },
    });
  }

  // Clamp trekZ to the maximum zoom level supported by the target dataset
  if (trekZ > targetMaxZoom) {
    trekZ = targetMaxZoom;
    const maxCols = Math.pow(2, trekZ + 1);
    const maxRows = Math.pow(2, trekZ);
    trekX = Math.max(0, Math.min(Math.floor(((lonDeg + 180) / 360) * maxCols), maxCols - 1));
    trekY = Math.max(0, Math.min(Math.floor(((90 - latDeg) / 180) * maxRows), maxRows - 1));
  }

  const layerId = LAYER_MAP[layer]?.id || layer;
  remoteUrl = `https://trek.nasa.gov/tiles/Mars/EQ/${layerId}/1.0.0/default/default028mm/${trekZ}/${trekY}/${trekX}.${ext}`;

  let upstreamRes: Response | null = null;

  try {
    // Attempt 1: Primary fetch with 12000ms timeout
    const fetchWithTimeout = async (url: string, timeoutMs: number) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "MarsForAll/1.0 (NASA Space Apps Challenge 2026; Team MarsForAll)",
          },
          next: { revalidate: 86400 },
        });
        return res;
      } catch (_err) {
        return null;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Primary fetch with 8000ms timeout for reliable NASA JPL upstream access
    upstreamRes = await fetchWithTimeout(remoteUrl, 8000);

    // If an orbital layer is non-200, only fallback to global Viking if it's NOT a high-resolution CTX/HiRISE layer
    // (Falling back to Viking for CTX would replace crisp surface rocks with a blurry orange low-res tile)
    if ((!upstreamRes || !upstreamRes.ok) && !isCtx && layer !== "viking-mdim21" && layer !== "viking") {
      const vZ = Math.max(0, Math.min(trekZ, 7));
      const vCols = Math.pow(2, vZ + 1);
      const vRows = Math.pow(2, vZ);
      const vX = Math.max(0, Math.min(Math.floor(((lonDeg + 180) / 360) * vCols), vCols - 1));
      const vY = Math.max(0, Math.min(Math.floor(((90 - latDeg) / 180) * vRows), vRows - 1));
      const fallbackVikingUrl = `https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/${vZ}/${vY}/${vX}.jpg`;
      const fbRes = await fetchWithTimeout(fallbackVikingUrl, 5000);
      if (fbRes && fbRes.ok) {
        upstreamRes = fbRes;
      }
    }

    if (!upstreamRes || !upstreamRes.ok) {
      // Return transparent 1x1 png gracefully
      return new NextResponse(TRANSPARENT_1X1_PNG as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
          "X-Tile-Fallback": "upstream-not-found",
        },
      });
    }

    const contentType =
      upstreamRes.headers.get("content-type") ||
      (layer.includes("hirise") || layer.includes("ctx")
        ? "image/png"
        : "image/jpeg");
    const arrayBuffer = await upstreamRes.arrayBuffer();
    const uint8Arr = new Uint8Array(arrayBuffer);

    // Save into server LRU cache
    setCachedTile(cacheKey, { buffer: uint8Arr, contentType });

    return new NextResponse(uint8Arr as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
        "X-Tile-Proxy": "jpl-trek-pass",
        "X-Tile-Cache": "MISS",
      },
    });
  } catch (_err) {
    // Network failure, timeout or offline -> return transparent 1x1 png
    return new NextResponse(TRANSPARENT_1X1_PNG as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
        "X-Tile-Fallback": "network-timeout",
      },
    });
  }
}
