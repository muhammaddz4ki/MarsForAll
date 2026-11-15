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

  if (!isDirectTrek) {
    // MapLibre Web Mercator (z, x, y) -> NASA Mars Trek Equirectangular (default028mm) conversion
    // Note: in our route folder segment [layer]/[z]/[y]/[x]:
    // numX represents the horizontal tile column (x), numY represents vertical tile row (y)
    const lonDeg = ((numX + 0.5) / Math.pow(2, numZ)) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * (numY + 0.5)) / Math.pow(2, numZ);
    const latDeg = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

    trekZ = Math.max(0, Math.min(numZ - 1, 13));
    const maxCols = Math.pow(2, trekZ + 1);
    const maxRows = Math.pow(2, trekZ);

    trekX = Math.floor(((lonDeg + 180) / 360) * maxCols);
    trekY = Math.floor(((90 - latDeg) / 180) * maxRows);

    trekX = Math.max(0, Math.min(trekX, maxCols - 1));
    trekY = Math.max(0, Math.min(trekY, maxRows - 1));
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

  // Layer mapping dictionary supporting both shorthand aliases and official NASA Layer IDs
  const LAYER_MAP: Record<string, { id: string; ext: "jpg" | "png" }> = {
    "viking-mdim21": { id: "Mars_Viking_MDIM21_ClrMosaic_global_232m", ext: "jpg" },
    viking: { id: "Mars_Viking_MDIM21_ClrMosaic_global_232m", ext: "jpg" },
    "mola-clrshade": { id: "Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw", ext: "jpg" },
    mola: { id: "Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw", ext: "jpg" },
    "mola-dem": { id: "Mars_MGS_MOLA_DEM_mosaic_global_463m", ext: "jpg" },
    "mola-slope": { id: "Mars_MGS_MOLA_Slope_Map", ext: "jpg" },
    "mola-roughness": { id: "Mars_MGS_MOLA_Roughness_0.6km", ext: "jpg" },
    "mola-hillshade": { id: "MOLA_hillshade_64ppd", ext: "jpg" },
    "themis-day-ir": { id: "Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v2", ext: "jpg" },
    "themis-day": { id: "Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v2", ext: "jpg" },
    "themis-night-ir": { id: "Mars_MO_THEMIS-IR-Night_mosaic_global_100m_v2", ext: "jpg" },
    "themis-night": { id: "Mars_MO_THEMIS-IR-Night_mosaic_global_100m_v2", ext: "jpg" },
    "themis-ti": { id: "THEMIS_Thermal_Inertia_Mosaic_100m", ext: "jpg" },
    "tes-ti": { id: "TES_Thermal_Inertia", ext: "jpg" },
    "tes-dust": { id: "TES_Dust_Cover_Index", ext: "jpg" },
    "tes-albedo": { id: "TES_Lambert_Albedo", ext: "jpg" },
    "gale-ctx": { id: "Gale_CTX_BlockAdj_dd", ext: "png" },
    "gale-hirise": { id: "Gale_CTX_BlockAdj_dd", ext: "png" },
    "hirise-gale": { id: "Gale_CTX_BlockAdj_dd", ext: "png" },
    "gale-ortho-25cm": { id: "MSL_Gale_Orthophoto_Mosaic_25cm_v3", ext: "png" },
    "gale-dtm-1m": { id: "MSL_Gale_HiRISE_DTM_1m", ext: "png" },
    "jezero-ctx": { id: "Jezero_CTX_BlockAdj_dd", ext: "png" },
    "mgs-mag": { id: "MGS_Crustal_Magnetism_Radial_Field", ext: "jpg" },
    "omega-clays": { id: "OMEGA_Phyllosilicates_Map", ext: "png" },
    "crism-clays": { id: "OMEGA_Phyllosilicates_Map", ext: "png" },
    "tes-sulfate": { id: "TES_Sulfate_Abundance", ext: "jpg" },
    "tes-carbonate": { id: "TES_Carbonate_Abundance", ext: "jpg" },
    "tes-olivine": { id: "TES_Olivine_Abundance", ext: "jpg" },
    "tes-hematite": { id: "TES_Hematite_Abundance", ext: "jpg" },
    "mons-weh": { id: "MONS_Water_Equivalent_Hydrogen", ext: "jpg" },
    "grs-iron": { id: "MO_GRS_Iron_Concentration", ext: "jpg" },
    "usgs-geology": { id: "USGS_SIM3292_Global_Geologic_Map_of_Mars", ext: "jpg" },
    "mro-gravity": { id: "MRO_GMM3_Free_Air_Gravity_Map", ext: "jpg" },
  };

  if (LAYER_MAP[layer]) {
    const target = LAYER_MAP[layer];
    isCtx = target.ext === "png";
    ext = target.ext;
    remoteUrl = `https://trek.nasa.gov/tiles/Mars/EQ/${target.id}/1.0.0/default/default028mm/${trekZ}/${trekY}/${trekX}.${ext}`;
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
    // Direct official NASA Mars Trek Layer ID
    ext = layer.includes("HiRISE") || layer.includes("CTX") || layer.includes("Orthophoto") ? "png" : "jpg";
    isCtx = ext === "png";
    remoteUrl = `https://trek.nasa.gov/tiles/Mars/EQ/${layer}/1.0.0/default/default028mm/${trekZ}/${trekY}/${trekX}.${ext}`;
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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    let upstreamRes = await fetch(remoteUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MarsForAll/1.0 (NASA Space Apps Challenge 2026; Team MarsForAll)",
      },
      next: { revalidate: 86400 },
    });

    clearTimeout(timeoutId);

    // If CTX is out-of-bounds (404), gracefully fallback to global Viking MDIM 2.1
    if (!upstreamRes.ok && isCtx) {
      const fallbackVikingUrl = `https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/${trekZ}/${trekY}/${trekX}.jpg`;
      try {
        const fbRes = await fetch(fallbackVikingUrl, {
          headers: {
            "User-Agent": "MarsForAll/1.0 (NASA Space Apps Challenge 2026; Team MarsForAll)",
          },
          next: { revalidate: 86400 },
        });
        if (fbRes.ok) {
          upstreamRes = fbRes;
        }
      } catch (_fbErr) {
        // Fallback fetch failed, proceed to transparent tile
      }
    }

    if (!upstreamRes.ok) {
      // Return transparent 1x1 png gracefully
      return new NextResponse(TRANSPARENT_1X1_PNG as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
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
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
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
