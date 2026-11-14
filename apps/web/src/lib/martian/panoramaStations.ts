export interface PanoramaStation {
  id: string;
  station: number;
  sol: number;
  title: string;
  location: string;
  headingOffsetDeg: number;
  relativeCoords: { x: number; z: number }; // Radar coordinates in meters relative to landing site
  description: string;
  sources: {
    name: string;
    url: string;
    credit: string;
  }[];
}

export const PANORAMA_STATIONS: Record<"jezero" | "gale", PanoramaStation[]> = {
  jezero: [
    {
      id: "jzr_stn_00",
      station: 0,
      sol: 3,
      title: "Octavia E. Butler Landing Site Panorama",
      location: "Octavia E. Butler Site, Jezero Crater",
      headingOffsetDeg: 0,
      relativeCoords: { x: 0, z: 0 },
      description: "First Mastcam-Z 360° panoramic view of the basaltic crater floor following successful landing.",
      sources: [
        {
          name: "ASU_MASTCAM_Z_BUTLER_360",
          url: "https://mastcamz.asu.edu/wp-content/uploads/2026/01/Mastcam-Z_360_Butler_Landing_1_Sols03-11_R0_natural_10x-1536x426.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Mastcam-Z Sol 3 Butler Landing 360°)",
        },
        {
          name: "NASA_IMAGES_BUTLER_PIA24424",
          url: "https://images-assets.nasa.gov/image/PIA24424/PIA24424~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Octavia E. Butler Landing Site)",
        },
      ],
    },
    {
      id: "jzr_stn_01",
      station: 1,
      sol: 53,
      title: "Van Zyl Overlook & Ingenuity Flight Zone 360°",
      location: "Van Zyl Overlook, Jezero Crater",
      headingOffsetDeg: 45,
      relativeCoords: { x: 180, z: -120 },
      description: "Elevated rocky promontory overlooking Wright Brothers Field during the historic first flights of Ingenuity.",
      sources: [
        {
          name: "NASA_IMAGES_VAN_ZYL_PIA24663",
          url: "https://images-assets.nasa.gov/image/PIA24663/PIA24663~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Van Zyl Overlook 360° Panorama)",
        },
      ],
    },
    {
      id: "jzr_stn_02",
      station: 2,
      sol: 74,
      title: "Séítah Olivine-Cumulate Outcrop 360°",
      location: "South Séítah, Jezero Crater",
      headingOffsetDeg: 130,
      relativeCoords: { x: -320, z: -450 },
      description: "Layered igneous bedrock and coarse olivine ripples forming the fractured floor of South Séítah.",
      sources: [
        {
          name: "NASA_IMAGES_SEITAH_PIA24837",
          url: "https://images-assets.nasa.gov/image/PIA24837/PIA24837~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Séítah Olivine Cumulate 360°)",
        },
        {
          name: "NASA_IMAGES_SEITAH_PIA25018",
          url: "https://images-assets.nasa.gov/image/PIA25018/PIA25018~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Séítah Bastide Ridge)",
        },
      ],
    },
    {
      id: "jzr_stn_03",
      station: 3,
      sol: 750,
      title: "Three Forks Ancient Delta Front 360°",
      location: "Three Forks, Jezero Delta Front",
      headingOffsetDeg: 285,
      relativeCoords: { x: 840, z: -1250 },
      description: "Towering mudstone and sandstone bottomset beds deposited by ancient river flow into Lake Jezero.",
      sources: [
        {
          name: "NASA_IMAGES_DELTA_PIA25828",
          url: "https://images-assets.nasa.gov/image/PIA25828/PIA25828~medium.jpg",
          credit: "NASA/JPL-Caltech/ASU/MSSS (Three Forks Delta Front 360°)",
        },
      ],
    },
  ],
  gale: [
    {
      id: "msl_stn_00",
      station: 0,
      sol: 0,
      title: "Bradbury Landing & Mount Sharp Panorama",
      location: "Bradbury Landing, Gale Crater",
      headingOffsetDeg: 180,
      relativeCoords: { x: 0, z: 0 },
      description: "Curiosity arrival vantage point showing gravel plains and distant layered foothills of Aeolis Mons.",
      sources: [
        {
          name: "NASA_IMAGES_BRADBURY_PIA16101",
          url: "https://images-assets.nasa.gov/image/PIA16101/PIA16101~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Bradbury Landing & Mount Sharp Panorama)",
        },
        {
          name: "NASA_IMAGES_CURIOSITY_PIA16074",
          url: "https://images-assets.nasa.gov/image/PIA16074/PIA16074~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (All Around Curiosity 360° Vista)",
        },
      ],
    },
    {
      id: "msl_stn_01",
      station: 1,
      sol: 1800,
      title: "Vera Rubin Ridge Hematite Panorama",
      location: "Vera Rubin Ridge, Mount Sharp, Gale Crater",
      headingOffsetDeg: 215,
      relativeCoords: { x: -450, z: 890 },
      description: "Prominent resistant topographic ridge rich in crystalline gray hematite formed in groundwater environments.",
      sources: [
        {
          name: "NASA_IMAGES_VERA_RUBIN_PIA22208",
          url: "https://images-assets.nasa.gov/image/PIA22208/PIA22208~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Vera Rubin Ridge Hematite Panorama)",
        },
      ],
    },
    {
      id: "msl_stn_02",
      station: 2,
      sol: 2300,
      title: "Glen Torridon Clay Trough Panorama",
      location: "Glen Torridon, Mount Sharp, Gale Crater",
      headingOffsetDeg: 195,
      relativeCoords: { x: -780, z: 1420 },
      description: "Expansive phyllosilicate-rich clay trough preserving evidence of habitable ancient lakebed deposits.",
      sources: [
        {
          name: "NASA_IMAGES_GLEN_TORRIDON_PIA23378",
          url: "https://images-assets.nasa.gov/image/PIA23378/PIA23378~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Glen Torridon Clay Trough Panorama)",
        },
      ],
    },
    {
      id: "msl_stn_03",
      station: 3,
      sol: 4180,
      title: "Mount Sharp Boxwork Ridge Outcrop 360°",
      location: "Boxwork Mineral Ridge, Mount Sharp, Gale Crater",
      headingOffsetDeg: 240,
      relativeCoords: { x: -1250, z: 2380 },
      description: "Extensive polygonal mineral fracture network formed by deep hydrothermal fluid circulation.",
      sources: [
        {
          name: "NASA_IMAGES_BOXWORK_PIA26559",
          url: "https://images-assets.nasa.gov/image/PIA26559/PIA26559~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Curiosity 360-Degree Boxwork Ridge)",
        },
        {
          name: "NASA_IMAGES_BOXWORK_PIA26560",
          url: "https://images-assets.nasa.gov/image/PIA26560/PIA26560~medium.jpg",
          credit: "NASA/JPL-Caltech/MSSS (Boxwork Formations at Distance)",
        },
      ],
    },
  ],
};
