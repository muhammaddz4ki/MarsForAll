import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface CuriosityPhotoItem {
  imageid: string;
  sol: number;
  instrument: string;
  image_url: string;
  date_taken_utc: string;
  title: string;
  caption?: string;
  dataSource:
    | "LIVE_NASA_MSL_API"
    | "CACHED_MOUNT_SHARP_ARCHIVE"
    | "LIVE_NASA_M2020_API"
    | "CACHED_JEZERO_ARCHIVE";
}

// Valid Mount Sharp (Gale Crater) Curiosity raw imagery archive fallback for offline resilience
const MOUNT_SHARP_FALLBACK_PHOTOS: CuriosityPhotoItem[] = [
  {
    imageid: "4180MR1098200010403010C00_DXXX",
    sol: 4180,
    instrument: "MAST_RIGHT",
    image_url: "https://mars.nasa.gov/msl-raw-images/msss/04180/mcam/4180MR1098200010403010C00_DXXX.jpg",
    date_taken_utc: "2024-05-09T14:22:10.000Z",
    title: "Sol 4180: Mount Sharp Boxwork Mineral Ridge Outcrop",
    caption: "High-resolution mosaic of polygonal sulfate vein lattices discovered on Aeolis Mons strata.",
    dataSource: "CACHED_MOUNT_SHARP_ARCHIVE",
  },
  {
    imageid: "3800MR1085100010302008C00_DXXX",
    sol: 3800,
    instrument: "MAST_LEFT",
    image_url: "https://mars.nasa.gov/msl-raw-images/msss/03800/mcam/3800MR1085100010302008C00_DXXX.jpg",
    date_taken_utc: "2023-04-15T09:18:44.000Z",
    title: "Sol 3800: Gediz Vallis Catastrophic Debris Ridge",
    caption: "Boulder-strewn channel carved by late-stage catastrophic debris flows down Mount Sharp.",
    dataSource: "CACHED_MOUNT_SHARP_ARCHIVE",
  },
  {
    imageid: "2300ML0012100010201004C00_DXXX",
    sol: 2300,
    instrument: "NAV_LEFT_B",
    image_url: "https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/02300/soas/rdr/navcam/NRB_601831821EDR_F0740924NCAM00595M_.JPG",
    date_taken_utc: "2019-01-26T17:40:12.000Z",
    title: "Sol 2300: Glen Torridon Clay-Bearing Unit",
    caption: "Expansive view of phyllosilicate smectite trough between Vera Rubin Ridge and Mount Sharp.",
    dataSource: "CACHED_MOUNT_SHARP_ARCHIVE",
  },
  {
    imageid: "1800MR0950000010100802C00_DXXX",
    sol: 1800,
    instrument: "MAST_RIGHT",
    image_url: "https://mars.nasa.gov/msl-raw-images/msss/01800/mcam/1800MR0950000010100802C00_DXXX.jpg",
    date_taken_utc: "2017-08-30T11:05:01.000Z",
    title: "Sol 1800: Vera Rubin Ridge Gray Hematite Escarpment",
    caption: "Erosion-resistant bedrock cap rich in crystalline ferric oxide hematite.",
    dataSource: "CACHED_MOUNT_SHARP_ARCHIVE",
  },
  {
    imageid: "0750MR0032000010001502C00_DXXX",
    sol: 750,
    instrument: "MAST_LEFT",
    image_url: "https://mars.nasa.gov/msl-raw-images/msss/00750/mcam/0750MR0032000010001502C00_DXXX.jpg",
    date_taken_utc: "2014-09-19T13:45:22.000Z",
    title: "Sol 750: Pahrump Hills Murray Formation Basal Strata",
    caption: "Finely laminated lacustrine mudstone forming the geologic foundation of Mount Sharp.",
    dataSource: "CACHED_MOUNT_SHARP_ARCHIVE",
  },
  {
    imageid: "0125MR0008000010000501C00_DXXX",
    sol: 125,
    instrument: "MAST_RIGHT",
    image_url: "https://mars.nasa.gov/msl-raw-images/msss/00125/mcam/0125MR0008000010000501C00_DXXX.jpg",
    date_taken_utc: "2012-12-14T08:30:15.000Z",
    title: "Sol 125: Yellowknife Bay First Powder Drill Site",
    caption: "Mudstone bedrock drill holes (John Klein & Cumberland) confirming ancient habitable lake environment.",
    dataSource: "CACHED_MOUNT_SHARP_ARCHIVE",
  },
];

// Valid Jezero Crater Perseverance (Mars 2020) raw imagery archive fallback for offline resilience
const JEZERO_FALLBACK_PHOTOS: CuriosityPhotoItem[] = [
  {
    imageid: "M2020_1220_PIA26369",
    sol: 1220,
    instrument: "MCZ_RIGHT",
    image_url: "https://photojournal.jpl.nasa.gov/jpeg/PIA26369.jpg",
    date_taken_utc: "2024-07-18T16:40:00.000Z",
    title: "Sol 1220: Cheyava Falls Leopard Spots Redox Outcrop",
    caption: "Perseverance Mastcam-Z multi-spectral closeup of calcium sulfate veins surrounded by millimeter-scale iron-phosphate reaction rims ('leopard spots') in Neretva Vallis.",
    dataSource: "CACHED_JEZERO_ARCHIVE",
  },
  {
    imageid: "M2020_0750_PIA25828",
    sol: 750,
    instrument: "MCZ_LEFT",
    image_url: "https://photojournal.jpl.nasa.gov/jpeg/PIA25828.jpg",
    date_taken_utc: "2023-03-30T11:22:15.000Z",
    title: "Sol 750: Three Forks Delta Scarp Exposure",
    caption: "Towering stratified delta front deposits and delta bottomset mudstones deposited by ancient Martian rivers into Lake Jezero.",
    dataSource: "CACHED_JEZERO_ARCHIVE",
  },
  {
    imageid: "M2020_0300_PIA25018",
    sol: 300,
    instrument: "MCZ_RIGHT",
    image_url: "https://photojournal.jpl.nasa.gov/jpeg/PIA25018.jpg",
    date_taken_utc: "2021-12-23T14:15:30.000Z",
    title: "Sol 300: Séítah Olivine Cumulate Bastide Ridge",
    caption: "Layered olivine-pyroxene rich igneous bedrock outcrop surrounded by active eolian ripples in South Séítah.",
    dataSource: "CACHED_JEZERO_ARCHIVE",
  },
  {
    imageid: "M2020_0003_PIA24424",
    sol: 3,
    instrument: "MCZ_LEFT",
    image_url: "https://photojournal.jpl.nasa.gov/jpeg/PIA24424.jpg",
    date_taken_utc: "2021-02-21T18:05:00.000Z",
    title: "Sol 3: Octavia E. Butler Landing Site 360 Panorama",
    caption: "First high-definition dual-camera Mastcam-Z panorama of the flat basaltic floor of Jezero Crater following Sky Crane touchdown.",
    dataSource: "CACHED_JEZERO_ARCHIVE",
  },
];

// In-Memory TTL Cache (15 minutes) for NASA Surface Imagery
interface CachedPhotoPayload {
  data: any;
  cachedAt: number;
}
const PHOTO_CACHE = new Map<string, CachedPhotoPayload>();
const PHOTO_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const missionParam = (searchParams.get("mission") || "curiosity").toLowerCase();
  const isM2020 = missionParam === "m2020" || missionParam === "perseverance";
  const solParam = searchParams.get("sol") || "all";
  const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 24);
  const cacheKey = `${isM2020 ? "m2020" : "curiosity"}_${solParam}_${limit}`;

  // Check in-memory TTL cache first
  const cached = PHOTO_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.cachedAt < PHOTO_TTL_MS) {
    return NextResponse.json(cached.data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
        "X-Memory-Cache": "HIT",
      },
    });
  }

  // 1. Mission Mars 2020 (Perseverance at Jezero Crater)
  if (isM2020) {
    let nasaM2020Url = `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&num=${limit}&page=0&order=sol+desc`;
    if (solParam && solParam !== "all") {
      nasaM2020Url += `&search=${solParam}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const upstream = await fetch(nasaM2020Url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "MarsForAll/1.0 (NASA Space Apps Challenge 2026; Team MarsForAll)",
          Accept: "application/json",
        },
        next: { revalidate: 3600 },
      });

      clearTimeout(timeoutId);

      if (!upstream.ok) {
        throw new Error(`NASA Mars 2020 Raw Images API HTTP ${upstream.status}`);
      }

      const json = await upstream.json();
      const items = json.images || json.items || [];

      if (items.length === 0) {
        return NextResponse.json(
          {
            items: JEZERO_FALLBACK_PHOTOS,
            total: JEZERO_FALLBACK_PHOTOS.length,
            source: "CACHED_JEZERO_ARCHIVE",
            cachedAt: new Date().toISOString(),
          },
          {
            status: 200,
            headers: {
              "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      }

      const cleanPhotos: CuriosityPhotoItem[] = items.slice(0, limit).map((raw: any) => {
        const imgUrl =
          raw.image_files?.full_res ||
          raw.image_files?.large ||
          raw.image_files?.medium ||
          raw.https_url ||
          raw.url;
        const instrument = raw.camera?.instrument || raw.instrument || "MASTCAM-Z";
        const sol = raw.sol ?? 1220;
        return {
          imageid: raw.imageid || `M2020_${sol}_${raw.id || Math.random().toString(36).slice(2, 8)}`,
          sol,
          instrument,
          image_url: imgUrl,
          date_taken_utc: raw.date_taken_utc || raw.date_taken || new Date().toISOString(),
          title: raw.title || `Sol ${sol}: Perseverance Rover Jezero Surface Raw Image`,
          caption: raw.caption
            ? raw.caption.replace(/<[^>]*>?/gm, "").slice(0, 180) + "..."
            : undefined,
          dataSource: "LIVE_NASA_M2020_API",
        };
      });

      const payload = {
        items: cleanPhotos,
        total: cleanPhotos.length,
        source: "LIVE_NASA_M2020_API",
        fetchedAt: new Date().toISOString(),
      };

      PHOTO_CACHE.set(cacheKey, { data: payload, cachedAt: Date.now() });

      return NextResponse.json(payload, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          "Access-Control-Allow-Origin": "*",
          "X-Memory-Cache": "MISS",
        },
      });
    } catch {
      return NextResponse.json(
        {
          items: JEZERO_FALLBACK_PHOTOS,
          total: JEZERO_FALLBACK_PHOTOS.length,
          source: "CACHED_JEZERO_ARCHIVE",
          offlineNotice: "NASA Mars 2020 Raw Images upstream unreachable. Operating in local Jezero Crater archive mode.",
          cachedAt: new Date().toISOString(),
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  }

  // 2. Mission MSL (Curiosity at Gale Crater)
  let nasaUrl = `https://mars.nasa.gov/api/v1/raw_image_items/?order=sol+desc&per_page=${limit}&page=0&condition_1=msl:mission`;
  if (solParam && solParam !== "all") {
    nasaUrl += `&condition_2=${solParam}:sol:in`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const upstream = await fetch(nasaUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MarsForAll/1.0 (NASA Space Apps Challenge 2026; Team MarsForAll)",
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    });

    clearTimeout(timeoutId);

    if (!upstream.ok) {
      throw new Error(`NASA MSL Raw Images API HTTP ${upstream.status}`);
    }

    const json = await upstream.json();
    const items = json.items || [];

    if (items.length === 0) {
      return NextResponse.json(
        {
          items: MOUNT_SHARP_FALLBACK_PHOTOS,
          total: MOUNT_SHARP_FALLBACK_PHOTOS.length,
          source: "CACHED_MOUNT_SHARP_ARCHIVE",
          cachedAt: new Date().toISOString(),
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    const cleanPhotos: CuriosityPhotoItem[] = items.map((raw: any) => ({
      imageid: raw.imageid || `MSL_${raw.sol}_${raw.id}`,
      sol: raw.sol,
      instrument: raw.instrument || "MASTCAM",
      image_url: raw.https_url || raw.url,
      date_taken_utc: raw.date_taken || raw.created_at,
      title: raw.title || `Sol ${raw.sol}: Curiosity Rover Surface Raw Image`,
      caption: raw.description ? raw.description.replace(/<[^>]*>?/gm, "").slice(0, 180) + "..." : undefined,
      dataSource: "LIVE_NASA_MSL_API",
    }));

    const payload = {
      items: cleanPhotos,
      total: cleanPhotos.length,
      source: "LIVE_NASA_MSL_API",
      fetchedAt: new Date().toISOString(),
    };

    // Store in 15-minute in-memory cache
    PHOTO_CACHE.set(cacheKey, { data: payload, cachedAt: Date.now() });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
        "X-Memory-Cache": "MISS",
      },
    });
  } catch {
    return NextResponse.json(
      {
        items: MOUNT_SHARP_FALLBACK_PHOTOS,
        total: MOUNT_SHARP_FALLBACK_PHOTOS.length,
        source: "CACHED_MOUNT_SHARP_ARCHIVE",
        offlineNotice: "NASA Raw Images upstream unreachable. Operating in local Gale Crater archive mode.",
        cachedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
