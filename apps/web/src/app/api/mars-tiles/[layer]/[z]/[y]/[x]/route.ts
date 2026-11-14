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

  if (layer === "viking-mdim21" || layer === "viking") {
    // NASA JPL Mars Trek Viking MDIM 2.1 Colorized Global Mosaic (232m/px)
    remoteUrl = `https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/${trekZ}/${trekY}/${trekX}.jpg`;
  } else if (layer === "mola-clrshade" || layer === "mola") {
    // NASA MOLA + HRSC Colorized Shaded Relief Hillshade
    remoteUrl = `https://trek.nasa.gov/tiles/Mars/EQ/Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw/1.0.0/default/default028mm/${trekZ}/${trekY}/${trekX}.jpg`;
  } else if (layer === "themis-day-ir" || layer === "themis-day") {
    // NASA 2001 Mars Odyssey THEMIS Daytime IR Global Mosaic (100m/px)
    remoteUrl = `https://trek.nasa.gov/tiles/Mars/EQ/Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v2/1.0.0/default/default028mm/${trekZ}/${trekY}/${trekX}.jpg`;
  } else if (layer === "themis-night-ir" || layer === "themis-night") {
    // NASA 2001 Mars Odyssey THEMIS Nighttime IR Global Mosaic (Thermal Inertia, 100m/px)
    remoteUrl = `https://trek.nasa.gov/tiles/Mars/EQ/Mars_MO_THEMIS-IR-Night_mosaic_global_100m_v2/1.0.0/default/default028mm/${trekZ}/${trekY}/${trekX}.jpg`;
  } else if (layer === "gale-ctx" || layer === "gale-hirise" || layer === "hirise-gale") {
    isCtx = true;
    remoteUrl = `https://trek.nasa.gov/tiles/Mars/EQ/Gale_CTX_BlockAdj_dd/1.0.0/default/default028mm/${trekZ}/${trekY}/${trekX}.png`;
  } else if (layer === "jezero-ctx") {
    isCtx = true;
    remoteUrl = `https://trek.nasa.gov/tiles/Mars/EQ/Jezero_CTX_BlockAdj_dd/1.0.0/default/default028mm/${trekZ}/${trekY}/${trekX}.png`;
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
