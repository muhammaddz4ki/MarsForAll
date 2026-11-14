import { NextRequest, NextResponse } from "next/server";

// 1x1 transparent PNG buffer for missing/out-of-bounds tiles
const TRANSPARENT_1X1_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64"
);

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

  let remoteUrl = "";
  if (layer === "gale-hirise" || layer === "gale-ctx") {
    // Official NASA JPL Mars Trek Gale Crater CTX Mosaic endpoint
    remoteUrl = `https://trek.nasa.gov/tiles/Mars/EQ/Gale_CTX_BlockAdj_dd/1.0.0/default/default028mm/${z}/${y}/${x}.png`;
  } else if (layer === "mola-clrshade") {
    remoteUrl = `https://trek.nasa.gov/tiles/Mars/EQ/Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw/1.0.0/default/default028mm/${z}/${y}/${x}.jpg`;
  } else {
    return new NextResponse(TRANSPARENT_1X1_PNG, {
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
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const upstreamRes = await fetch(remoteUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "AresPathMartianMap/1.0 (NASA Space Apps Challenge 2026)",
      },
      next: { revalidate: 86400 },
    });

    clearTimeout(timeoutId);

    if (!upstreamRes.ok) {
      // 404 or out-of-bounds tile -> return transparent 1x1 png gracefully
      return new NextResponse(TRANSPARENT_1X1_PNG, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          "X-Tile-Fallback": "upstream-not-found",
        },
      });
    }

    const contentType = upstreamRes.headers.get("content-type") || (layer === "gale-hirise" ? "image/png" : "image/jpeg");
    const arrayBuffer = await upstreamRes.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Tile-Proxy": "jpl-trek-pass",
      },
    });
  } catch (_err) {
    // Network failure, timeout or offline -> return transparent 1x1 png
    return new NextResponse(TRANSPARENT_1X1_PNG, {
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
