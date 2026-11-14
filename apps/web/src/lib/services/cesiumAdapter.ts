/**
 * Space Apps 2026 Partner Integration: Cesium ion 3D Service Adapter
 *
 * Provides connection parameters and layer definitions for Cesium ion 3D terrain,
 * photogrammetric meshes, and custom Martian ellipsoids.
 */

export interface CesiumIonConfig {
  accessToken: string;
  defaultAssetId?: number;
  serverUrl?: string;
}

export function getCesiumIonConfig(): CesiumIonConfig {
  return {
    accessToken: process.env.NEXT_PUBLIC_CESIUM_ION_ACCESS_TOKEN || "",
    serverUrl: "https://api.cesium.com",
  };
}

export interface MarsCesiumLayer {
  id: string;
  name: string;
  assetId?: number;
  type: "terrain" | "imagery" | "3dtiles";
  url?: string;
  description: string;
}

export const MARS_CESIUM_LAYERS: MarsCesiumLayer[] = [
  {
    id: "gale_crater_hrsc_dtm",
    name: "Gale Crater HRSC 1m DTM 3D Surface",
    type: "terrain",
    description: "High-resolution stereo camera 3D elevation mesh for Mount Sharp traverses.",
  },
  {
    id: "hirise_boxwork_ortho",
    name: "Curiosity 2025 Boxwork 25cm/px Orthophoto",
    type: "imagery",
    description: "Sub-meter orbital imagery of the polygonal mineral ridge fracture network.",
  },
];

