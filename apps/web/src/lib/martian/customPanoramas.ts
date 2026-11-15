/**
 * MARSFORALL // Custom 360° Panorama Registry & Waypoint Bridge
 *
 * Integrates local JPEG 360 panoramas placed in /panoramas/ with Martian GIS coordinates.
 * Supports persistent localStorage custom waypoints created via the interactive map UI.
 */

import { MountSharpWaypoint, MissionSiteId } from "./mountSharpWaypoints";

export interface Custom360PanoramaEntry {
  id: string;
  filename: string;
  title: string;
  site: MissionSiteId;
  coordinates: [number, number]; // [lon, lat]
  elevationM: number;
  sol: number;
  description: string;
  category: "boxwork_formation" | "mineral_vein" | "clay_trough" | "ridge_escarpment" | "habitat_landing" | "hazard_zone" | "custom_user_pov";
  headingOffsetDeg?: number;
  credit?: string;
  isUserCreated?: boolean;
}

export const DEFAULT_360_PANORAMAS: Custom360PanoramaEntry[] = [
  {
    id: "pano_boxwork_sol4180",
    filename: "sol4180_boxwork_equirectangular_2k.jpg",
    title: "Sol 4180: Penemuan Urat Mineral Boxwork 2025",
    site: "gale_crater",
    coordinates: [137.3820, -4.7315],
    elevationM: -3840,
    sol: 4180,
    description: "POV 360° permukaan Mount Sharp memperlihatkan jaringan kisi-kisi poligonal urat mineral sulfat (Boxwork) yang membentang 10-20 kilometer, terbentuk dari sirkulasi fluida hidrotermal purba.",
    category: "boxwork_formation",
    headingOffsetDeg: 240,
    credit: "Curiosity Mastcam Equirectangular Surface Projection (USGS Astrogeology / NASA JPL Raw Archive)",
  },
  {
    id: "pano_glen_torridon_sol2300",
    filename: "sol2300_glen_torridon_360.jpg",
    title: "Sol 2300: Glen Torridon Clay Trough",
    site: "gale_crater",
    coordinates: [137.3912, -4.7456],
    elevationM: -4120,
    sol: 2300,
    description: "Lembah sedimen kaya mineral lempung smektit (phyllosilicates) di kaki Mount Sharp yang menjadi bukti lingkungan basah paleodanau purba yang ramah kehidupan.",
    category: "clay_trough",
    headingOffsetDeg: 195,
    credit: "Curiosity Mastcam-34 Surface Mosaic (NASA/JPL-Caltech/MSSS)",
  },
  {
    id: "pano_vera_rubin_sol1800",
    filename: "sol1800_vera_rubin_360.jpg",
    title: "Sol 1800: Punggungan Hematit Vera Rubin Ridge",
    site: "gale_crater",
    coordinates: [137.3885, -4.7521],
    elevationM: -4050,
    sol: 1800,
    description: "Tebing tinggi resisten erosi kaya akan mineral hematit kristal abu-abu, terbentuk pada zona transisi air tanah purba bersuhu hangat.",
    category: "ridge_escarpment",
    headingOffsetDeg: 215,
    credit: "Curiosity Mastcam High-Resolution Panorama (NASA/JPL-Caltech/MSSS)",
  },
  {
    id: "pano_bradbury_landing_sol0",
    filename: "sol0_bradbury_landing_360.jpg",
    title: "Sol 0: Bradbury Landing & Pemandangan Awal Mount Sharp",
    site: "gale_crater",
    coordinates: [137.4417, -4.5895],
    elevationM: -4501,
    sol: 0,
    description: "Titik pendaratan bersejarah Curiosity di dasar Kawah Gale, memperlihatkan dataran kerikil aluvial dan siluet lereng bertingkat Aeolis Mons di kejauhan.",
    category: "habitat_landing",
    headingOffsetDeg: 180,
    credit: "Curiosity Mastcam First Touchdown Mosaic (NASA/JPL-Caltech/MSSS)",
  },
];

const LOCAL_STORAGE_KEY = "mars_custom_360_waypoints";

/**
 * Loads custom 360 panorama entries stored in browser localStorage.
 */
export function getSavedUser360Panoramas(): Custom360PanoramaEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_e) {
    return [];
  }
}

/**
 * Returns all active 360 panorama entries (defaults + user created).
 */
export function getAll360PanoramaEntries(site?: MissionSiteId): Custom360PanoramaEntry[] {
  const userEntries = getSavedUser360Panoramas();
  const all = [...DEFAULT_360_PANORAMAS, ...userEntries];
  if (!site) return all;
  return all.filter((entry) => entry.site === site);
}

/**
 * Saves a new custom 360 panorama waypoint into localStorage.
 */
export function saveCustom360Panorama(entry: Custom360PanoramaEntry): Custom360PanoramaEntry[] {
  if (typeof window === "undefined") return DEFAULT_360_PANORAMAS;
  try {
    const existing = getSavedUser360Panoramas();
    const updated = [
      ...existing.filter((item) => item.id !== entry.id),
      { ...entry, isUserCreated: true },
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    return [...DEFAULT_360_PANORAMAS, ...updated];
  } catch (_e) {
    return DEFAULT_360_PANORAMAS;
  }
}

/**
 * Deletes a user-created 360 panorama waypoint.
 */
export function deleteCustom360Panorama(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSavedUser360Panoramas();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (_e) {}
}

/**
 * Converts a Custom360PanoramaEntry into a fully-typed MountSharpWaypoint
 * compatible with AresMapViewer, ProspectorPanel, and SurfacePovModal.
 */
export function convertToMountSharpWaypoint(entry: Custom360PanoramaEntry): MountSharpWaypoint {
  const isGale = entry.site === "gale_crater";

  return {
    id: entry.id,
    name: entry.title,
    coordinates: entry.coordinates,
    elevationM: entry.elevationM,
    category: entry.category,
    geologicUnit: entry.category === "boxwork_formation"
      ? "Boxwork Mineral Vein Ridge Unit (Curiosity 2025)"
      : "Martian Surface Strata (Gale / Jezero)",
    stratigraphicAge: "Hesperian",
    apparentThermalInertiaTiu: 385,
    consistencyIndexCT: 0,
    meanSlopeDeg: 8.5,
    maxSlopeDeg: 14.2,
    roughnessHapkeThetaDeg: 21.0,
    craterDensityBeta: 0.24,
    surfaceRadiationMSvSol: 0.68,
    windExposureRisk: "moderate",
    crustalMagneticFieldNt: isGale ? 72 : 18,
    themisNightTempK: 184,
    sandTrapRisk: "LOW",
    surfaceFirmness: "BEDROCK FIRM",
    waterEquivalentHydrogenPercent: 4.8,
    dominantHydratedMineral: entry.category === "boxwork_formation" ? "Polyhydrated Sulfates" : "Smectite Clays",
    mineralogy: {
      sulfatePercent: entry.category === "boxwork_formation" ? 45 : 20,
      hematitePercent: 12,
      phyllosilicateClayPercent: 18,
      silicaPercent: 28,
      perchloratePercent: 0.4,
    },
    evaSuitTraversable: true,
    muleRoverTraversable: true,
    scientificPriority: 4,
    briefDescription: entry.description,
    // Custom 360 metadata tags
    has360Pov: true,
    panoramaUrl: entry.filename.startsWith("http") || entry.filename.startsWith("/") || entry.filename.startsWith("data:")
      ? entry.filename
      : `/panoramas/${entry.filename}`,
    customPanoramaUrl: entry.filename.startsWith("http") || entry.filename.startsWith("/") || entry.filename.startsWith("data:")
      ? entry.filename
      : `/panoramas/${entry.filename}`,
    panoramaFilename: entry.filename,
    headingOffsetDeg: entry.headingOffsetDeg ?? 0,
    roverRawImage: {
      sol: entry.sol,
      camera: "MASTCAM-100",
      targetName: entry.title,
      elevationAngleDeg: 0,
      pointingAzimuthDeg: entry.headingOffsetDeg ?? 0,
      imageUrl: entry.filename.startsWith("http") || entry.filename.startsWith("/") || entry.filename.startsWith("data:")
        ? entry.filename
        : `/panoramas/${entry.filename}`,
      caption: entry.description,
      sourceCredit: entry.credit || "USGS Astrogeology / JPL Mars Trek",
    },
  };
}

/**
 * Returns all 360 waypoints as MountSharpWaypoint objects.
 */
export function get360WaypointsAsMountSharp(site?: MissionSiteId): MountSharpWaypoint[] {
  return getAll360PanoramaEntries(site).map(convertToMountSharpWaypoint);
}
