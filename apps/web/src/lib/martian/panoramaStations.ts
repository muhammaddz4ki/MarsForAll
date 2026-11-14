export interface PanoramaStationSource {
  name: string;
  url: string;
  credit: string;
}

export interface NeighborStationInfo {
  targetStation: number;
  sol: number;
  title: string;
  azimuthDeg: number;
  distanceM: number;
}

export interface PanoramaStation {
  id: string;
  station: number;
  sol: number;
  title: string;
  location: string;
  headingOffsetDeg: number;
  relativeCoords: { x: number; z: number }; // Tactical coordinates in meters relative to landing site
  description: string;
  sources: PanoramaStationSource[]; // Natural True Color
  enhancedSources?: PanoramaStationSource[]; // Enhanced Geological False-Color Stretch
}

export const PANORAMA_STATIONS: Record<"jezero" | "gale", PanoramaStation[]> = {
  jezero: [
    {
      id: "jzr_stn_00",
      station: 0,
      sol: 3,
      title: "Octavia E. Butler Landing Site",
      location: "Octavia E. Butler Site, Jezero Crater",
      headingOffsetDeg: 0,
      relativeCoords: { x: 0, z: 0 },
      description: "First Mastcam-Z 360° panoramic view of the basaltic crater floor following successful landing.",
      sources: [
        {
          name: "NASA_IMAGES_BUTLER_PIA24424_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA24424/PIA24424~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Octavia E. Butler Landing Site - Natural Color)",
        },
        {
          name: "NASA_IMAGES_BUTLER_PIA24424_ORIG",
          url: "https://images-assets.nasa.gov/image/PIA24424/PIA24424~orig.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Mastcam-Z High-Res Master)",
        },
        {
          name: "NASA_IMAGES_BUTLER_PIA24424_MED",
          url: "https://images-assets.nasa.gov/image/PIA24424/PIA24424~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Web Optimized)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_BUTLER_PIA24425_ENHANCED",
          url: "https://images-assets.nasa.gov/image/PIA24425/PIA24425~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Enhanced Color Contrast)",
        },
        {
          name: "NASA_IMAGES_BUTLER_PIA24264_STRETCH",
          url: "https://images-assets.nasa.gov/image/PIA24264/PIA24264~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (First High-Res Mastcam-Z 360°)",
        },
      ],
    },
    {
      id: "jzr_stn_01",
      station: 1,
      sol: 53,
      title: "Van Zyl Overlook & Ingenuity Airfield",
      location: "Van Zyl Overlook, Jezero Crater",
      headingOffsetDeg: 45,
      relativeCoords: { x: 180, z: -120 },
      description: "Elevated rocky promontory overlooking Wright Brothers Field during the historic first flights of Ingenuity.",
      sources: [
        {
          name: "NASA_IMAGES_VAN_ZYL_PIA24663_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA24663/PIA24663~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Van Zyl Overlook 360° Panorama)",
        },
        {
          name: "NASA_IMAGES_VAN_ZYL_PIA24663_MED",
          url: "https://images-assets.nasa.gov/image/PIA24663/PIA24663~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Van Zyl Web Panorama)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_VAN_ZYL_PIA24663_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA24663/PIA24663~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Geological Surface Stretch)",
        },
      ],
    },
    {
      id: "jzr_stn_02",
      station: 2,
      sol: 74,
      title: "Séítah Olivine-Cumulate Outcrop",
      location: "South Séítah, Jezero Crater",
      headingOffsetDeg: 130,
      relativeCoords: { x: -320, z: -450 },
      description: "Layered igneous bedrock and coarse olivine ripples forming the fractured floor of South Séítah.",
      sources: [
        {
          name: "NASA_IMAGES_SEITAH_PIA24837_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA24837/PIA24837~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Séítah Olivine Cumulate 360° - Natural)",
        },
        {
          name: "NASA_IMAGES_SEITAH_PIA24837_MED",
          url: "https://images-assets.nasa.gov/image/PIA24837/PIA24837~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Séítah Web Panorama)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_SEITAH_PIA24836_ENHANCED",
          url: "https://images-assets.nasa.gov/image/PIA24836/PIA24836~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Séítah Enhanced False-Color Geologic)",
        },
      ],
    },
    {
      id: "jzr_stn_03",
      station: 3,
      sol: 750,
      title: "Three Forks Ancient River Delta Front",
      location: "Three Forks, Jezero Delta Front",
      headingOffsetDeg: 285,
      relativeCoords: { x: 840, z: -1250 },
      description: "Towering mudstone and sandstone bottomset beds deposited by ancient river flow into Lake Jezero.",
      sources: [
        {
          name: "NASA_IMAGES_DELTA_PIA25828_MED",
          url: "https://images-assets.nasa.gov/image/PIA25828/PIA25828~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Three Forks Delta Front 360° - Natural)",
        },
        {
          name: "NASA_IMAGES_DELTA_PIA25328_MED",
          url: "https://images-assets.nasa.gov/image/PIA25328/PIA25328~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Delta Front Scarp Panorama)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_DELTA_PIA25829_ENHANCED",
          url: "https://images-assets.nasa.gov/image/PIA25829/PIA25829~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Three Forks Enhanced Spectral Stretch)",
        },
      ],
    },
  ],
  gale: [
    {
      id: "msl_stn_00",
      station: 0,
      sol: 0,
      title: "Bradbury Landing & Mount Sharp",
      location: "Bradbury Landing, Gale Crater",
      headingOffsetDeg: 180,
      relativeCoords: { x: 0, z: 0 },
      description: "Curiosity arrival vantage point showing gravel plains and distant layered foothills of Aeolis Mons.",
      sources: [
        {
          name: "NASA_IMAGES_BRADBURY_PIA16101_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA16101/PIA16101~large.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Bradbury Landing & Mount Sharp - Natural)",
        },
        {
          name: "NASA_IMAGES_BRADBURY_PIA16101_MED",
          url: "https://images-assets.nasa.gov/image/PIA16101/PIA16101~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Bradbury Web Panorama)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_CURIOSITY_PIA16074_MED",
          url: "https://images-assets.nasa.gov/image/PIA16074/PIA16074~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Curiosity 360° White-Balanced Vista)",
        },
      ],
    },
    {
      id: "msl_stn_01",
      station: 1,
      sol: 1800,
      title: "Vera Rubin Ridge Hematite Vista",
      location: "Vera Rubin Ridge, Mount Sharp, Gale Crater",
      headingOffsetDeg: 215,
      relativeCoords: { x: -450, z: 890 },
      description: "Prominent resistant topographic ridge rich in crystalline gray hematite formed in groundwater environments.",
      sources: [
        {
          name: "NASA_IMAGES_VERA_RUBIN_PIA22207_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA22207/PIA22207~large.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Vera Rubin Ridge Surface Panorama - Natural)",
        },
        {
          name: "NASA_IMAGES_VERA_RUBIN_PIA22207_MED",
          url: "https://images-assets.nasa.gov/image/PIA22207/PIA22207~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Vera Rubin Ridge Web Panorama)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_VERA_RUBIN_PIA22209_ENHANCED",
          url: "https://images-assets.nasa.gov/image/PIA22209/PIA22209~large.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Vera Rubin White-Balanced Geological Stretch)",
        },
      ],
    },
    {
      id: "msl_stn_02",
      station: 2,
      sol: 2300,
      title: "Glen Torridon Clay Trough",
      location: "Glen Torridon, Mount Sharp, Gale Crater",
      headingOffsetDeg: 195,
      relativeCoords: { x: -780, z: 1420 },
      description: "Expansive phyllosilicate-rich clay trough preserving evidence of habitable ancient lakebed deposits.",
      sources: [
        {
          name: "NASA_IMAGES_GLEN_TORRIDON_PIA23378_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA23378/PIA23378~large.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Glen Torridon Clay Trough Panorama - Natural)",
        },
        {
          name: "NASA_IMAGES_GLEN_TORRIDON_PIA23378_MED",
          url: "https://images-assets.nasa.gov/image/PIA23378/PIA23378~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Glen Torridon Web Panorama)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_GLEN_TORRIDON_PIA23378_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA23378/PIA23378~large.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Glen Torridon High-Definition Mastcam)",
        },
      ],
    },
    {
      id: "msl_stn_03",
      station: 3,
      sol: 4180,
      title: "Mount Sharp Boxwork Formations (2025)",
      location: "Boxwork Mineral Ridge, Mount Sharp, Gale Crater",
      headingOffsetDeg: 240,
      relativeCoords: { x: -1250, z: 2380 },
      description: "Extensive polygonal mineral fracture network formed by deep hydrothermal fluid circulation.",
      sources: [
        {
          name: "NASA_IMAGES_BOXWORK_PIA26559_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA26559/PIA26559~large.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Curiosity 360-Degree Boxwork Ridge - Natural)",
        },
        {
          name: "NASA_IMAGES_BOXWORK_PIA26559_MED",
          url: "https://images-assets.nasa.gov/image/PIA26559/PIA26559~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Boxwork Ridge Web Panorama)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_BOXWORK_PIA26560_ENHANCED",
          url: "https://images-assets.nasa.gov/image/PIA26560/PIA26560~large.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Boxwork Formations Contrast-Enhanced)",
        },
      ],
    },
  ],
};

/**
 * Calculates deterministic neighbor station tactical azimuth and ground distance
 * for ground-projected circular hotspot markers (matching FU Berlin jezero/360/4N).
 */
export function getNeighborStations(
  site: "jezero" | "gale",
  currentStationIdx: number
): NeighborStationInfo[] {
  const stations = PANORAMA_STATIONS[site];
  const current = stations[currentStationIdx] || stations[0];
  const neighbors: NeighborStationInfo[] = [];

  stations.forEach((stn, idx) => {
    if (idx === currentStationIdx) return;
    const dx = stn.relativeCoords.x - current.relativeCoords.x;
    const dz = stn.relativeCoords.z - current.relativeCoords.z;
    const distanceM = Math.round(Math.sqrt(dx * dx + dz * dz));

    // Azimuth in degrees from North (0° = North, 90° = East, 180° = South, 270° = West)
    // In our coordinate space: x is East (+), z is North (+)
    const rawAngleRad = Math.atan2(dx, dz);
    let azimuthDeg = Math.round((rawAngleRad * 180) / Math.PI);
    if (azimuthDeg < 0) azimuthDeg += 360;

    neighbors.push({
      targetStation: idx,
      sol: stn.sol,
      title: stn.title,
      azimuthDeg,
      distanceM,
    });
  });

  return neighbors;
}
