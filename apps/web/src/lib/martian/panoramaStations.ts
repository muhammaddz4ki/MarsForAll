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
      description: "First Mastcam-Z 360° cylindrical panorama of the basaltic crater floor following successful landing.",
      sources: [
        {
          name: "NASA_IMAGES_BUTLER_PIA24264_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA24264/PIA24264~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Mastcam-Z First 360° Panorama - Natural Color)",
        },
        {
          name: "NASA_IMAGES_BUTLER_PIA24264_ORIG",
          url: "https://images-assets.nasa.gov/image/PIA24264/PIA24264~orig.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Mastcam-Z High-Res Master)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_BUTLER_PIA24264_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA24264/PIA24264~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Enhanced Geological False-Color Stretch)",
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
          credit: "NASA/JPL-Caltech/ASU/MSSS (Van Zyl Overlook 360° Panorama - Natural)",
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
      sol: 1175,
      title: "Bright Angel & Neretva Vallis",
      location: "Bright Angel Inflow, Jezero Crater",
      headingOffsetDeg: 130,
      relativeCoords: { x: -320, z: -450 },
      description: "Light-toned rock outcrop and ancient river spillway entering the northern rim of Jezero Crater.",
      sources: [
        {
          name: "NASA_IMAGES_BRIGHT_ANGEL_PIA26369_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA26369/PIA26369~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Bright Angel 360° Panorama - Natural)",
        },
        {
          name: "NASA_IMAGES_BRIGHT_ANGEL_PIA26369_MED",
          url: "https://images-assets.nasa.gov/image/PIA26369/PIA26369~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Bright Angel Web Panorama)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_BRIGHT_ANGEL_PIA26369_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA26369/PIA26369~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Bright Angel Enhanced False-Color Geologic)",
        },
      ],
    },
    {
      id: "jzr_stn_03",
      station: 3,
      sol: 1337,
      title: "Rio Chiquito Delta Margin",
      location: "Rio Chiquito, Jezero Delta Front",
      headingOffsetDeg: 285,
      relativeCoords: { x: 840, z: -1250 },
      description: "Fine-grained deltaic mudstones and river channel deposit margins at the western Jezero fan.",
      sources: [
        {
          name: "NASA_IMAGES_RIO_CHIQUITO_PIA26474_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA26474/PIA26474~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Rio Chiquito 360° Panorama - Natural)",
        },
        {
          name: "NASA_IMAGES_RIO_CHIQUITO_PIA26474_MED",
          url: "https://images-assets.nasa.gov/image/PIA26474/PIA26474~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Rio Chiquito Web Panorama)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_RIO_CHIQUITO_PIA26474_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA26474/PIA26474~large.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Rio Chiquito Enhanced Spectral Stretch)",
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
          name: "NASA_IMAGES_BRADBURY_PIA16101_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA16101/PIA16101~large.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Bradbury White-Balanced Geological Stretch)",
        },
      ],
    },
    {
      id: "msl_stn_01",
      station: 1,
      sol: 2137,
      title: "Vera Rubin Ridge Hematite Vista",
      location: "Vera Rubin Ridge, Mount Sharp, Gale Crater",
      headingOffsetDeg: 215,
      relativeCoords: { x: -450, z: 890 },
      description: "Prominent resistant topographic ridge rich in crystalline gray hematite formed in groundwater environments.",
      sources: [
        {
          name: "NASA_IMAGES_VERA_RUBIN_PIA22545_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA22545/PIA22545~large.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Vera Rubin Ridge 360° Panorama - Natural)",
        },
        {
          name: "NASA_IMAGES_VERA_RUBIN_PIA22545_MED",
          url: "https://images-assets.nasa.gov/image/PIA22545/PIA22545~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Vera Rubin Ridge Web Panorama)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_VERA_RUBIN_PIA22545_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA22545/PIA22545~large.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Vera Rubin White-Balanced Geological Stretch)",
        },
      ],
    },
    {
      id: "msl_stn_02",
      station: 2,
      sol: 1310,
      title: "Naukluft Plateau & Glen Torridon Basin",
      location: "Naukluft Plateau, Mount Sharp, Gale Crater",
      headingOffsetDeg: 195,
      relativeCoords: { x: -780, z: 1420 },
      description: "Full-circle Martian vista from the wind-carved sandstone plateau overlooking the Glen Torridon clay trough.",
      sources: [
        {
          name: "NASA_IMAGES_NAUKLUFT_PIA20332_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA20332/PIA20332~large.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Naukluft Plateau 360° Panorama - Natural)",
        },
        {
          name: "NASA_IMAGES_NAUKLUFT_PIA20332_MED",
          url: "https://images-assets.nasa.gov/image/PIA20332/PIA20332~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Naukluft Web Panorama)",
        },
      ],
      enhancedSources: [
        {
          name: "NASA_IMAGES_NAUKLUFT_PIA20332_LARGE",
          url: "https://images-assets.nasa.gov/image/PIA20332/PIA20332~large.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Naukluft High-Definition Mastcam)",
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
