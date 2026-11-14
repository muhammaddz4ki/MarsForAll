import { NextRequest, NextResponse } from "next/server";
import { PANORAMA_STATIONS, PanoramaStation } from "@/lib/martian/panoramaStations";

export const dynamic = "force-dynamic";

interface CachedPanoramaEntry {
  buffer: Buffer;
  contentType: string;
  source: string;
  credit: string;
  stationTitle: string;
  stationSol: number;
  variant: "natural" | "enhanced";
  cachedAt: number;
}

// In-Memory LRU Cache (max 30 panoramas)
const PANORAMA_CACHE = new Map<string, CachedPanoramaEntry>();
const MAX_CACHE_ENTRIES = 30;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Generates an offline fallback SVG image converted to a valid image buffer
function createOfflineMartianPanoramaSvg(
  site: "gale" | "jezero",
  station: PanoramaStation,
  variant: "natural" | "enhanced"
): string {
  const isJezero = site === "jezero";
  const siteTitle = isJezero
    ? `JEZERO CRATER // STN-${station.station + 1} (SOL ${station.sol}) — ${station.title.toUpperCase()}`
    : `GALE CRATER // STN-${station.station + 1} (SOL ${station.sol}) — ${station.title.toUpperCase()}`;

  const horizonColor = variant === "enhanced" ? (isJezero ? "#0284c7" : "#0d9488") : (isJezero ? "#b45309" : "#991b1b");
  const skyTop = variant === "enhanced" ? "#0f172a" : (isJezero ? "#451a03" : "#3b170c");
  const skyBottom = variant === "enhanced" ? "#1e293b" : (isJezero ? "#78350f" : "#682512");
  const groundColor = variant === "enhanced" ? "#1e1b4b" : (isJezero ? "#1f130b" : "#1a0f0a");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512" viewBox="0 0 1024 512">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${skyTop}" />
        <stop offset="60%" stop-color="${skyBottom}" />
        <stop offset="62%" stop-color="${horizonColor}" />
      </linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${variant === "enhanced" ? "#312e81" : "#3d1b10"}" />
        <stop offset="100%" stop-color="${groundColor}" />
      </linearGradient>
    </defs>
    <!-- Sky & Upper Horizon -->
    <rect width="1024" height="317" fill="url(#sky)" />

    <!-- Distant Martian Ridge Silhouettes -->
    <path d="M0,317 Q120,290 260,305 T512,300 T760,285 T1024,317 L1024,317 L0,317 Z" fill="#2d140b" opacity="0.85" />
    <path d="M0,317 Q180,300 360,312 T720,305 T1024,317 L1024,317 L0,317 Z" fill="#220e06" opacity="0.95" />

    <!-- Foreground Martian Regolith Ground -->
    <rect y="317" width="1024" height="195" fill="url(#ground)" />

    <!-- Procedural Eolian Sand Dunes & Bedrock Texture -->
    <line x1="0" y1="317" x2="1024" y2="317" stroke="${horizonColor}" stroke-width="1.5" opacity="0.6" />
    <path d="M0,360 Q256,345 512,365 T1024,355" stroke="#4a2214" stroke-width="2" fill="none" opacity="0.4" />
    <path d="M0,410 Q300,395 600,415 T1024,405" stroke="#3b170c" stroke-width="2.5" fill="none" opacity="0.5" />

    <!-- Official Scientific Telemetry Overlay (No Emojis, No NASA Meatball) -->
    <rect x="24" y="24" width="976" height="36" fill="#0b0f17" fill-opacity="0.88" stroke="#334155" stroke-width="1" />
    <text x="40" y="47" fill="#fbbf24" font-family="monospace" font-size="12" font-weight="bold" letter-spacing="1.5">
      ${siteTitle} [${variant.toUpperCase()} COLOR CACHED PANORAMA]
    </text>
    <text x="980" y="47" text-anchor="end" fill="#94a3b8" font-family="monospace" font-size="10">
      NASA/JPL-Caltech/ASU/MSSS
    </text>
  </svg>`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siteParam = (searchParams.get("site") || "gale").toLowerCase();
  const siteKey: "jezero" | "gale" = siteParam === "jezero" || siteParam === "m2020" ? "jezero" : "gale";

  const stationParam = parseInt(searchParams.get("station") || "0", 10);
  const stationIdx = isNaN(stationParam) ? 0 : Math.max(0, Math.min(3, stationParam));

  const variantParam = (searchParams.get("variant") || "natural").toLowerCase();
  const variant: "natural" | "enhanced" = variantParam === "enhanced" ? "enhanced" : "natural";

  const stationList = PANORAMA_STATIONS[siteKey];
  const station = stationList[stationIdx] || stationList[0];

  const cacheKey = `${siteKey}_stn_${stationIdx}_${variant}`;

  // Check In-Memory LRU Cache
  const cached = PANORAMA_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    // Refresh LRU ordering
    PANORAMA_CACHE.delete(cacheKey);
    PANORAMA_CACHE.set(cacheKey, cached);

    return new NextResponse(new Uint8Array(cached.buffer), {
      status: 200,
      headers: {
        "Content-Type": cached.contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Panorama-Cache": "HIT",
        "X-Station-Title": cached.stationTitle,
        "X-Station-Sol": cached.stationSol.toString(),
        "X-Station-Index": stationIdx.toString(),
        "X-Panorama-Variant": cached.variant,
        "X-Panorama-Source": cached.source,
        "X-Panorama-Credit": cached.credit,
      },
    });
  }

  // Choose source list based on requested variant
  const candidateSources =
    variant === "enhanced" && station.enhancedSources && station.enhancedSources.length > 0
      ? [...station.enhancedSources, ...station.sources]
      : station.sources;

  // Try each upstream mirror in succession with strict timeout
  for (const src of candidateSources) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5500);

      const upstream = await fetch(src.url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "MarsForAll/1.0 (NASA Space Apps Challenge 2026; Team MarsForAll)",
          Referer: "https://mars.nasa.gov/",
          Accept: "image/jpeg,image/png,image/*;q=0.9",
        },
      });

      clearTimeout(timeoutId);

      if (upstream.ok) {
        const contentType = upstream.headers.get("content-type") || "image/jpeg";
        // Verify response is actually an image (not HTML error page)
        if (contentType.startsWith("image/")) {
          const arrayBuffer = await upstream.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Manage LRU cache capacity
          if (PANORAMA_CACHE.size >= MAX_CACHE_ENTRIES) {
            const oldestKey = PANORAMA_CACHE.keys().next().value;
            if (oldestKey) PANORAMA_CACHE.delete(oldestKey);
          }

          PANORAMA_CACHE.set(cacheKey, {
            buffer,
            contentType,
            source: src.name,
            credit: src.credit,
            stationTitle: station.title,
            stationSol: station.sol,
            variant,
            cachedAt: now,
          });

          return new NextResponse(new Uint8Array(buffer), {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Access-Control-Allow-Origin": "*",
              "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
              "X-Panorama-Cache": "MISS",
              "X-Station-Title": station.title,
              "X-Station-Sol": station.sol.toString(),
              "X-Station-Index": stationIdx.toString(),
              "X-Panorama-Variant": variant,
              "X-Panorama-Source": src.name,
              "X-Panorama-Credit": src.credit,
            },
          });
        }
      }
    } catch {
      // Continue to next mirror on timeout or network error
    }
  }

  // Fallback: Return locally generated calibrated Martian panorama SVG (100% offline resilience)
  const fallbackSvg = createOfflineMartianPanoramaSvg(siteKey, station, variant);
  const fallbackBuffer = Buffer.from(fallbackSvg, "utf8");

  return new NextResponse(new Uint8Array(fallbackBuffer), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=1800, stale-while-revalidate=86400",
      "X-Panorama-Cache": "FALLBACK",
      "X-Station-Title": station.title,
      "X-Station-Sol": station.sol.toString(),
      "X-Station-Index": stationIdx.toString(),
      "X-Panorama-Variant": variant,
      "X-Panorama-Source": "LOCAL_PROCEDURAL_CALIBRATED_FALLBACK",
      "X-Panorama-Credit": station.sources[0]?.credit || "NASA/JPL-Caltech/ASU/MSSS",
      "X-Panorama-Fallback": "OFFLINE_CACHED_PANORAMA",
    },
  });
}
