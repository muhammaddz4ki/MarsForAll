import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface SpaceWeatherTelemetry {
  speAlertLevel: "NOMINAL" | "WATCH" | "WARNING";
  gcrDoseRateUGyDay: number; // MSL RAD surface dosimetry (µGy/day)
  doseRateMSvHr: number;     // Equivalent astronaut EVA dose rate (mSv/hr)
  uvIndexLevel: "MODERATE" | "HIGH" | "EXTREME";
  solarParticleEventsLast30Days: number;
  lastEventDate?: string;
  source: "LIVE_NASA_DONKI_API" | "CALIBRATED_RAD_MSL_ARCHIVE";
  attribution: string;
  timestamp: string;
}

// Calibrated Gale Crater surface radiation baseline from MSL RAD (Hassler et al. 2014, Zeitlin et al. 2019)
const BASELINE_GALE_RADIATION: SpaceWeatherTelemetry = {
  speAlertLevel: "NOMINAL",
  gcrDoseRateUGyDay: 232.0, // Calibrated average MSL RAD surface Galactic Cosmic Ray dose
  doseRateMSvHr: 0.0265,    // ~0.64 mSv/sol nominal EVA absorption
  uvIndexLevel: "HIGH",     // Thin 740 Pa Martian CO2 atmosphere lacks ozone filtration
  solarParticleEventsLast30Days: 0,
  lastEventDate: "2024-05-20T18:00:00Z",
  source: "CALIBRATED_RAD_MSL_ARCHIVE",
  attribution: "NASA MSL Radiation Assessment Detector (RAD) Gale Crater Baseline",
  timestamp: new Date().toISOString(),
};

// In-Memory TTL Cache (15 minutes) for NASA DONKI Space Weather
let cachedWeather: { data: SpaceWeatherTelemetry; cachedAt: number } | null = null;
const WEATHER_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
  const now = Date.now();
  if (cachedWeather && now - cachedWeather.cachedAt < WEATHER_TTL_MS) {
    return NextResponse.json(cachedWeather.data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
        "X-Memory-Cache": "HIT",
      },
    });
  }

  // NASA DONKI (Database of Notifications, Knowledge, Information) Space Weather
  const donkiUrl = "https://api.nasa.gov/DONKI/SEP?api_key=DEMO_KEY";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const upstream = await fetch(donkiUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MarsForAll/1.0 (NASA Space Apps Challenge 2026; Team MarsForAll)",
        Accept: "application/json",
      },
      next: { revalidate: 1800 },
    });

    clearTimeout(timeoutId);

    if (!upstream.ok) {
      throw new Error(`NASA DONKI HTTP ${upstream.status}`);
    }

    const events = await upstream.json();
    const count = Array.isArray(events) ? events.length : 0;

    let alertLevel: "NOMINAL" | "WATCH" | "WARNING" = "NOMINAL";
    let gcrMultiplier = 1.0;

    if (count >= 3) {
      alertLevel = "WARNING";
      gcrMultiplier = 2.4;
    } else if (count >= 1) {
      alertLevel = "WATCH";
      gcrMultiplier = 1.35;
    }

    const telemetry: SpaceWeatherTelemetry = {
      speAlertLevel: alertLevel,
      gcrDoseRateUGyDay: Math.round(232.0 * gcrMultiplier * 10) / 10,
      doseRateMSvHr: Math.round(0.0265 * gcrMultiplier * 1000) / 1000,
      uvIndexLevel: alertLevel === "WARNING" ? "EXTREME" : "HIGH",
      solarParticleEventsLast30Days: count,
      lastEventDate: count > 0 && events[0]?.eventTime ? events[0].eventTime : undefined,
      source: "LIVE_NASA_DONKI_API",
      attribution: "NASA Space Weather Database of Notifications, Knowledge, Information (DONKI) & MSL RAD",
      timestamp: new Date().toISOString(),
    };

    // Save into 15-minute in-memory cache
    cachedWeather = { data: telemetry, cachedAt: Date.now() };

    return NextResponse.json(telemetry, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
        "X-Memory-Cache": "MISS",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ...BASELINE_GALE_RADIATION,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=900, stale-while-revalidate=86400",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
