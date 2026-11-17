import { NextRequest, NextResponse } from "next/server";
import {
  MOUNT_SHARP_WAYPOINTS,
  JEZERO_CRATER_WAYPOINTS,
  CURIOSITY_HISTORICAL_TRAVERSE,
  PERSEVERANCE_HISTORICAL_TRAVERSE,
} from "@/lib/martian/mountSharpWaypoints";
import { MARS_EQUATORIAL_RADIUS_METERS } from "@/lib/martian/mmgisSpatialAnalysis";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const requestedSite = searchParams.get("site");

  const wmtsCatalog = [
    {
      id: "viking-mdim21",
      name: "Mars Viking MDIM 2.1 Colorized Global Mosaic",
      category: "global_basemap",
      resolution: "232 m/px",
      minzoom: 0,
      maxzoom: 7,
      tileUrlTemplate: "/api/mars-tiles/viking-mdim21/{z}/{y}/{x}",
      attribution: "NASA / JPL / USGS Astrogeology Science Center",
      format: "image/jpeg",
    },
    {
      id: "gale-ctx",
      name: "Gale Crater CTX Controlled Orthomosaic",
      category: "crater_ortho",
      resolution: "6.0 m/px",
      minzoom: 0,
      maxzoom: 12,
      tileUrlTemplate: "/api/mars-tiles/gale-ctx/{z}/{y}/{x}",
      attribution: "NASA / JPL-Caltech / MSSS / Mars Trek",
      format: "image/png",
    },
    {
      id: "jezero-ctx",
      name: "Jezero Crater CTX Controlled Orthomosaic",
      category: "crater_ortho",
      resolution: "6.0 m/px",
      minzoom: 0,
      maxzoom: 12,
      tileUrlTemplate: "/api/mars-tiles/jezero-ctx/{z}/{y}/{x}",
      attribution: "NASA / JPL-Caltech / MSSS / Mars Trek",
      format: "image/png",
    },
    {
      id: "mola-clrshade",
      name: "MOLA / HRSC Elevation Hillshade Blend",
      category: "topography_color",
      resolution: "200 m/px",
      minzoom: 0,
      maxzoom: 8,
      tileUrlTemplate: "/api/mars-tiles/mola-clrshade/{z}/{y}/{x}",
      attribution: "NASA / GSFC / DLR / USGS Astrogeology",
      format: "image/jpeg",
    },
    {
      id: "themis-night-ir",
      name: "THEMIS Night Thermal Infrared Mosaic",
      category: "thermal_inertia",
      resolution: "100 m/px",
      minzoom: 0,
      maxzoom: 8,
      tileUrlTemplate: "/api/mars-tiles/themis-night-ir/{z}/{y}/{x}",
      attribution: "NASA / ASU / Mars Odyssey THEMIS Team",
      format: "image/jpeg",
    },
  ];

  const missionGale = {
    siteId: "gale_crater",
    codename: "SITE-01: GALE CRATER / MOUNT SHARP",
    rover: "MSL Curiosity",
    landingSol: 0,
    maxSol: 4180,
    initialCoordinates: {
      center: [137.40, -4.74],
      defaultZoom: 12.2,
      minZoom: 1.2,
      maxZoom: 18,
      pitch: 45,
      bearing: -15,
    },
    landingSite: {
      name: "Bradbury Landing",
      coordinates: [137.4417, -4.5895],
      elevationM: -4501,
    },
    keyGeomorphicFocus: "Mount Sharp (Aeolis Mons) Boxwork Fracture Ridges & Sulfate Unit",
    waypoints: MOUNT_SHARP_WAYPOINTS,
    traverseCheckpoints: CURIOSITY_HISTORICAL_TRAVERSE,
  };

  const missionJezero = {
    siteId: "jezero_crater",
    codename: "SITE-02: JEZERO CRATER DELTA",
    rover: "Mars 2020 Perseverance",
    landingSol: 0,
    maxSol: 1220,
    initialCoordinates: {
      center: [77.4509, 18.3789],
      defaultZoom: 12.2,
      minZoom: 1.2,
      maxZoom: 18,
      pitch: 45,
      bearing: 0,
    },
    landingSite: {
      name: "Octavia E. Butler Landing",
      coordinates: [77.4509, 18.3789],
      elevationM: -2569,
    },
    keyGeomorphicFocus: "Western Fan Delta, Neretva Vallis Inflow, & Cheyava Falls",
    waypoints: JEZERO_CRATER_WAYPOINTS,
    traverseCheckpoints: PERSEVERANCE_HISTORICAL_TRAVERSE,
  };

  const config = {
    schema: "NASA-AMMOS MMGIS Open Mission Configuration v1.0",
    marsProjection: {
      code: "IAU_2000:49900",
      type: "Spherical Martian Datum",
      equatorialRadiusMeters: MARS_EQUATORIAL_RADIUS_METERS,
    },
    wmtsLayers: wmtsCatalog,
    missions: requestedSite === "jezero"
      ? { jezero: missionJezero }
      : requestedSite === "gale"
      ? { gale: missionGale }
      : { gale: missionGale, jezero: missionJezero },
  };

  return NextResponse.json(config, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
