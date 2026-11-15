import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface MarsOdeProduct {
  productId: string;
  instrument: "CRISM" | "SHARAD";
  description: string;
  browseImageUrl?: string;
  dataProductUrl?: string;
  centerLon: number;
  centerLat: number;
  acquisitionDate?: string;
  source: "LIVE_MARS_ODE_REST" | "CALIBRATED_ARCHIVE";
}

export interface MarsOdeResponse {
  queryType: "crism" | "sharad";
  products: MarsOdeProduct[];
  totalFound: number;
  source: string;
  timestamp: string;
}

// In-Memory Cache (30 minutes)
interface OdeCacheEntry {
  data: MarsOdeResponse;
  cachedAt: number;
}
const ODE_CACHE = new Map<string, OdeCacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 mins

// Calibrated Gale Crater SHARAD radargrams fallback
const SHARAD_GALE_FALLBACK: MarsOdeProduct[] = [
  {
    productId: "s_00832001_rdr",
    instrument: "SHARAD",
    description: "MRO SHARAD 20-MHz Subsurface Radar Sounder Profile across Gale Crater Northern Rim and Mount Sharp",
    browseImageUrl: "https://ode.rsl.wustl.edu/mars/data/mro-m-sharad-3-edr-v1/mrosh_0001/browse/rdr/s_008320/s_00832001_br.jpg",
    dataProductUrl: "https://ode.rsl.wustl.edu/mars/product?p=s_00832001_rdr",
    centerLon: 137.44,
    centerLat: -4.59,
    acquisitionDate: "2008-04-12",
    source: "CALIBRATED_ARCHIVE",
  },
  {
    productId: "s_01248002_rdr",
    instrument: "SHARAD",
    description: "MRO SHARAD Radargram transect penetrating Aeolis Mons layered sulfate-clay lacustrine strata",
    browseImageUrl: "https://ode.rsl.wustl.edu/mars/data/mro-m-sharad-3-edr-v1/mrosh_0001/browse/rdr/s_012480/s_01248002_br.jpg",
    dataProductUrl: "https://ode.rsl.wustl.edu/mars/product?p=s_01248002_rdr",
    centerLon: 137.52,
    centerLat: -5.02,
    acquisitionDate: "2009-03-24",
    source: "CALIBRATED_ARCHIVE",
  },
];

// Calibrated Gale Crater CRISM products fallback
const CRISM_GALE_FALLBACK: MarsOdeProduct[] = [
  {
    productId: "frt0000b6f1_07_if166l_trr3",
    instrument: "CRISM",
    description: "CRISM Full Resolution Targeted (FRT) observations showing strong smectite clay (Fe/Mg phyllosilicates) signatures in Glen Torridon trough",
    browseImageUrl: "https://ode.rsl.wustl.edu/mars/data/mro-m-crism-3-rdr-targeted-v1/mrocr_2001/browse/trr/2008/07_20/frt0000b6f1/frt0000b6f1_07_sr166l_trr3.png",
    dataProductUrl: "https://ode.rsl.wustl.edu/mars/product?p=frt0000b6f1_07",
    centerLon: 137.39,
    centerLat: -4.85,
    acquisitionDate: "2008-07-20",
    source: "CALIBRATED_ARCHIVE",
  },
  {
    productId: "frt0000c2e2_07_if166l_trr3",
    instrument: "CRISM",
    description: "CRISM Polyhydrated Sulfate & Crystalline Hematite detection across Vera Rubin Ridge and Boxwork flank",
    browseImageUrl: "https://ode.rsl.wustl.edu/mars/data/mro-m-crism-3-rdr-targeted-v1/mrocr_2001/browse/trr/2008/11_14/frt0000c2e2/frt0000c2e2_07_sr166l_trr3.png",
    dataProductUrl: "https://ode.rsl.wustl.edu/mars/product?p=frt0000c2e2_07",
    centerLon: 137.38,
    centerLat: -4.75,
    acquisitionDate: "2008-11-14",
    source: "CALIBRATED_ARCHIVE",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const typeParam = (searchParams.get("type") || "sharad").toLowerCase();
  const queryType = typeParam === "crism" ? "crism" : "sharad";

  const lon = parseFloat(searchParams.get("lon") || "137.44");
  const lat = parseFloat(searchParams.get("lat") || "-4.59");
  const delta = 0.6;

  const minLon = parseFloat((lon - delta).toFixed(4));
  const maxLon = parseFloat((lon + delta).toFixed(4));
  const minLat = parseFloat((lat - delta).toFixed(4));
  const maxLat = parseFloat((lat + delta).toFixed(4));

  const cacheKey = `${queryType}_${minLon}_${maxLon}_${minLat}_${maxLat}`;
  const cached = ODE_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return NextResponse.json(cached.data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
        "X-ODE-Cache": "HIT",
      },
    });
  }

  const odeUrl =
    queryType === "crism"
      ? `https://oderest.rsl.wustl.edu/live2/?query=product&results=m&proj=c0&output=JSON&ihid=MRO&iid=CRISM&westernlon=${minLon}&easternlon=${maxLon}&minlat=${minLat}&maxlat=${maxLat}`
      : `https://oderest.rsl.wustl.edu/live2/?query=product&results=f&output=JSON&ihid=MRO&iid=SHARAD&pt=RDR&westernlon=${minLon}&easternlon=${maxLon}&minlat=${minLat}&maxlat=${maxLat}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const upstream = await fetch(odeUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MarsForAll/1.0 (NASA Space Apps Challenge 2026; Team MarsForAll)",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    clearTimeout(timeoutId);

    if (!upstream.ok) {
      throw new Error(`Mars ODE REST HTTP ${upstream.status}`);
    }

    const json = await upstream.json();
    const productsArray =
      json?.ODEResults?.Products?.Product ||
      json?.ODEResults?.Products ||
      [];

    const rawList = Array.isArray(productsArray) ? productsArray : [productsArray];

    const cleanProducts: MarsOdeProduct[] = rawList
      .filter((p: any) => p && (p.pdsid || p.Product_id || p.ProductId))
      .slice(0, 6)
      .map((p: any) => {
        const pid = p.pdsid || p.Product_id || p.ProductId;
        let browse = p.Browse_url || p.browse_url || p.BrowseUrl;

        // If files array contains a browse image ending with _br.jpg
        if (!browse && Array.isArray(p.Product_files?.Product_file)) {
          const brFile = p.Product_files.Product_file.find((f: any) =>
            typeof f?.URL === "string" && (f.URL.endsWith("_br.jpg") || f.URL.endsWith(".png"))
          );
          if (brFile) browse = brFile.URL;
        }

        return {
          productId: pid,
          instrument: queryType === "crism" ? "CRISM" : "SHARAD",
          description: p.Description || p.Observation_desc || `${queryType.toUpperCase()} MRO Orbital Product at [${lon.toFixed(2)}°, ${lat.toFixed(2)}°]`,
          browseImageUrl: browse,
          dataProductUrl: p.External_url || `https://ode.rsl.wustl.edu/mars/product?p=${pid}`,
          centerLon: parseFloat(p.Center_longitude) || lon,
          centerLat: parseFloat(p.Center_latitude) || lat,
          acquisitionDate: p.UTC_start_time ? p.UTC_start_time.split("T")[0] : undefined,
          source: "LIVE_MARS_ODE_REST",
        };
      });

    if (cleanProducts.length === 0) {
      throw new Error("No ODE products in range");
    }

    const payload: MarsOdeResponse = {
      queryType,
      products: cleanProducts,
      totalFound: cleanProducts.length,
      source: "LIVE_MARS_ODE_REST (Washington University in St. Louis PDS Node)",
      timestamp: new Date().toISOString(),
    };

    ODE_CACHE.set(cacheKey, { data: payload, cachedAt: Date.now() });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
        "X-ODE-Cache": "MISS",
      },
    });
  } catch {
    const fallbackProducts = queryType === "crism" ? CRISM_GALE_FALLBACK : SHARAD_GALE_FALLBACK;
    const fallbackPayload: MarsOdeResponse = {
      queryType,
      products: fallbackProducts,
      totalFound: fallbackProducts.length,
      source: "CALIBRATED_ARCHIVE (MRO Science Operations Center)",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(fallbackPayload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
        "X-ODE-Fallback": "ACTIVE",
      },
    });
  }
}
