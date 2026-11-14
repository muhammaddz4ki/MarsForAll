"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import * as THREE from "three";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";
import {
  PANORAMA_STATIONS,
  PanoramaStation,
  getNeighborStations,
  NeighborStationInfo,
} from "@/lib/martian/panoramaStations";
import MarsForAllBadge from "../MarsForAllBadge";

interface SurfacePovModalProps {
  waypoint: MountSharpWaypoint | null;
  onClose: () => void;
  theme?: "dark" | "light";
  dustStormActive?: boolean;
}

interface LandmarkPin {
  id: string;
  code: string;
  name: string;
  x: number;
  z: number;
  instrument: string;
  metricLabel: string;
  metricValue: string;
  description: string;
}

export interface CuriosityPhotoItem {
  imageid: string;
  sol: number;
  instrument: string;
  image_url: string;
  date_taken_utc: string;
  title: string;
  caption?: string;
  dataSource?: string;
}

// Landmark Pins for Gale Crater / Mount Sharp (3D Terrain Mode)
const LANDMARK_PINS_GALE: LandmarkPin[] = [
  {
    id: "pin_01",
    code: "PIN-01",
    name: "BOXWORK VEIN OUTCROP",
    x: 4.5,
    z: -8.5,
    instrument: "APXS / CHEMCAM",
    metricLabel: "SULFATE FILL",
    metricValue: "34.2% SO3 / Ca-Sulfate",
    description: "Polygonal ridge network formed by ancient deep subsurface hydrothermal fluid flow in Aeolis Mons strata.",
  },
  {
    id: "pin_02",
    code: "PIN-02",
    name: "CURIOSITY ROVER / COMPANION MULE",
    x: -2.5,
    z: -4.5,
    instrument: "HAZCAM / MOBILITY",
    metricLabel: "REGOLITH SINKAGE",
    metricValue: "3.2 cm basaltic sand",
    description: "Curiosity 50cm cleated aluminum wheel imprint showing regolith bearing capacity and eolian ripple compaction.",
  },
  {
    id: "pin_03",
    code: "PIN-03",
    name: "CHEMCAM LIBS LASER TARGET",
    x: -6.5,
    z: -11.0,
    instrument: "CHEMCAM LIBS",
    metricLabel: "EMISSION SPECTRA",
    metricValue: "High-Si / Al Phyllosilicate",
    description: "Pitted laser-ablation target analyzing clay-sulfate transition zone bedrock with 1064nm optical laser.",
  },
];

// Landmark Pins for Jezero Crater (3D Terrain Mode)
const LANDMARK_PINS_JEZERO: LandmarkPin[] = [
  {
    id: "pin_jzr_01",
    code: "PIN-01",
    name: "CHEYAVA FALLS REDOX VEIN",
    x: 4.5,
    z: -8.5,
    instrument: "SUPERCAM / SHERLOC",
    metricLabel: "LEOPARD SPOT RIMS",
    metricValue: "Vivianite / Fe-Phosphate Halos",
    description: "Millimeter-sized reaction rings with organic signatures along calcium sulfate veins in Neretva Vallis ancient river inflow.",
  },
  {
    id: "pin_jzr_02",
    code: "PIN-02",
    name: "PERSEVERANCE ROVER CHASSIS",
    x: -2.5,
    z: -4.5,
    instrument: "HAZCAM / MOBILITY",
    metricLabel: "BEARING TRACTION",
    metricValue: "Rigid Olivine Pavement",
    description: "Mars 2020 52.5cm curved cleat wheels on flat basaltic unit, zero wheel-spin slip at Octavia E. Butler site.",
  },
  {
    id: "pin_jzr_03",
    code: "PIN-03",
    name: "DELTA FRONT SMECTITE SCARP",
    x: -6.5,
    z: -11.0,
    instrument: "MASTCAM-Z / PIXL",
    metricLabel: "CARBONATE & CLAYS",
    metricValue: "38% Phyllosilicate Mudstone",
    description: "Ancient river delta front bottomset beds preserving fossil bio-signatures from Lake Jezero 3.7 billion years ago.",
  },
];

// Fallback Rover Imagery
const FALLBACK_CURIOSITY_PHOTOS: CuriosityPhotoItem[] = [
  {
    imageid: "4180MR1098200010403010C00_DXXX",
    sol: 4180,
    instrument: "MAST_RIGHT",
    image_url: "https://mars.nasa.gov/msl-raw-images/msss/04180/mcam/4180MR1098200010403010C00_DXXX.jpg",
    date_taken_utc: "2024-05-09",
    title: "Sol 4180: Mount Sharp Boxwork Mineral Ridge Outcrop",
    caption: "High-resolution mosaic of polygonal sulfate vein lattices discovered on Aeolis Mons strata.",
    dataSource: "CACHED_MOUNT_SHARP_ARCHIVE",
  },
  {
    imageid: "3800MR1085100010302008C00_DXXX",
    sol: 3800,
    instrument: "MAST_LEFT",
    image_url: "https://mars.nasa.gov/msl-raw-images/msss/03800/mcam/3800MR1085100010302008C00_DXXX.jpg",
    date_taken_utc: "2023-04-15",
    title: "Sol 3800: Gediz Vallis Catastrophic Debris Ridge",
    caption: "Boulder-strewn channel carved by late-stage catastrophic debris flows down Mount Sharp.",
    dataSource: "CACHED_MOUNT_SHARP_ARCHIVE",
  },
  {
    imageid: "2300ML0012100010201004C00_DXXX",
    sol: 2300,
    instrument: "NAV_LEFT_B",
    image_url: "https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/02300/soas/rdr/navcam/NRB_601831821EDR_F0740924NCAM00595M_.JPG",
    date_taken_utc: "2019-01-26",
    title: "Sol 2300: Glen Torridon Clay-Bearing Unit",
    caption: "Expansive view of phyllosilicate smectite trough between Vera Rubin Ridge and Mount Sharp.",
    dataSource: "CACHED_MOUNT_SHARP_ARCHIVE",
  },
];

const FALLBACK_JEZERO_PHOTOS: CuriosityPhotoItem[] = [
  {
    imageid: "M2020_1220_PIA26369",
    sol: 1220,
    instrument: "MCZ_RIGHT",
    image_url: "https://photojournal.jpl.nasa.gov/jpeg/PIA26369.jpg",
    date_taken_utc: "2024-07-18",
    title: "Sol 1220: Cheyava Falls Leopard Spots Redox Outcrop",
    caption: "Perseverance Mastcam-Z multi-spectral closeup of calcium sulfate veins surrounded by millimeter-scale iron-phosphate reaction rims in Neretva Vallis.",
    dataSource: "CACHED_JEZERO_ARCHIVE",
  },
  {
    imageid: "M2020_0750_PIA25828",
    sol: 750,
    instrument: "MCZ_LEFT",
    image_url: "https://photojournal.jpl.nasa.gov/jpeg/PIA25828.jpg",
    date_taken_utc: "2023-03-30",
    title: "Sol 750: Three Forks Delta Scarp Exposure",
    caption: "Towering stratified delta front deposits and delta bottomset mudstones deposited by ancient Martian rivers into Lake Jezero.",
    dataSource: "CACHED_JEZERO_ARCHIVE",
  },
  {
    imageid: "M2020_0300_PIA25018",
    sol: 300,
    instrument: "MCZ_RIGHT",
    image_url: "https://photojournal.jpl.nasa.gov/jpeg/PIA25018.jpg",
    date_taken_utc: "2021-12-23",
    title: "Sol 300: Séítah Olivine Cumulate Bastide Ridge",
    caption: "Layered olivine-pyroxene rich igneous bedrock outcrop surrounded by active eolian ripples in South Séítah.",
    dataSource: "CACHED_JEZERO_ARCHIVE",
  },
];

// Helper to compute terrain elevation y(x, z) procedurally based on waypoint characteristics
function getTerrainHeight(x: number, z: number, waypointId: string): number {
  if (waypointId === "jzr_three_forks_delta") {
    const deltaSlope = -0.06 * z + 0.02 * x;
    const terrace = Math.floor(z * 0.15) * 0.45;
    const sedimentRipples = Math.sin(0.6 * x + 0.3 * z) * 0.25;
    return deltaSlope + terrace + sedimentRipples;
  }
  if (waypointId === "jzr_seitah_olivine") {
    const duneWaves = Math.sin(0.45 * x - 0.75 * z) * 0.85 + Math.cos(0.25 * x + 0.5 * z) * 0.35;
    return 0.03 * x + duneWaves;
  }
  if (waypointId === "jzr_bright_angel_redox") {
    const channelCut = -Math.cos(x * 0.18) * 1.1 + Math.sin(z * 0.22) * 0.45;
    return 0.02 * z + channelCut;
  }
  if (waypointId === "jzr_hab_alpha") {
    return 0.015 * x - 0.01 * z + Math.sin(x * 0.35) * Math.cos(z * 0.35) * 0.14;
  }

  const isBoxwork = waypointId === "curiosity_boxwork_2025";
  if (isBoxwork) {
    const baseSlope = 0.04 * x - 0.025 * z + Math.sin(x * 0.12) * Math.cos(z * 0.12) * 0.5;
    const scale = 0.22;
    const cellX = Math.abs(((x * scale) % 1 + 1) % 1 - 0.5);
    const cellZ = Math.abs(((z * scale) % 1 + 1) % 1 - 0.5);
    const diag = Math.abs((((x + z) * scale * 0.707) % 1 + 1) % 1 - 0.5);
    const distToEdge = Math.min(cellX, cellZ, diag);

    let boxworkRidges = 0;
    if (distToEdge < 0.065) {
      const ridgeProximity = (0.065 - distToEdge) / 0.065;
      boxworkRidges = ridgeProximity * 1.8 * (0.8 + 0.3 * Math.sin(x * 0.5) * Math.cos(z * 0.5));
    }
    const fineRoughness = Math.sin(x * 2.8) * Math.sin(z * 2.8) * 0.05;
    return baseSlope + boxworkRidges + fineRoughness;
  }

  const regionalSlope = 0.07 * x - 0.04 * z;
  const eolianRipples = Math.sin(0.75 * x + 0.35 * z) * 0.38 + Math.cos(0.35 * x - 0.65 * z) * 0.22;
  const macroHummocks = Math.sin(x * 0.09) * Math.cos(z * 0.09) * 2.1;
  const fineGravel = Math.sin(x * 3.2) * Math.sin(z * 3.2) * 0.04;
  return regionalSlope + eolianRipples + macroHummocks + fineGravel;
}

// Deterministic pseudo-random generator (seeded LCG)
function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Procedural Martian regolith texture for fallback 3D terrain
function createMartianRegolithTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const nextRand = createPrng(418042);
  ctx.fillStyle = "#a84b2c";
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 350; i++) {
    const px = nextRand() * 512;
    const py = nextRand() * 512;
    const pr = nextRand() * 35 + 8;
    ctx.fillStyle = nextRand() > 0.45 ? "#ba5936" : "#87381e";
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (nextRand() - 0.5) * 48;
    data[i] = Math.max(0, Math.min(255, data[i] + grain));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain * 0.65));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain * 0.45));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

// Blend spherical 360° rover panorama photo with smooth Martian zenith sky dome and nadir
function blendMartianZenithAndNadir(
  sourceImg: HTMLImageElement,
  dustStormActive: boolean,
  variant: "natural" | "enhanced" = "natural"
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = sourceImg.naturalWidth || 1536;
  canvas.height = sourceImg.naturalHeight || 768;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.drawImage(sourceImg, 0, 0, canvas.width, canvas.height);

  const isEnhanced = variant === "enhanced";
  const zenithSkyColor = isEnhanced
    ? "#0f172a"
    : dustStormActive
    ? "#6b2e10"
    : "#b87d56";
  const horizonSkyColor = isEnhanced
    ? "#1e293b"
    : dustStormActive
    ? "#8c3b17"
    : "#c78b64";
  const nadirColor = isEnhanced
    ? "#090d16"
    : dustStormActive
    ? "#260e06"
    : "#1a0f0a";

  // 1. Zenith blending: smoothly blend upper 22%
  const zenithHeight = Math.round(canvas.height * 0.22);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, zenithHeight);
  skyGrad.addColorStop(0, zenithSkyColor);
  skyGrad.addColorStop(0.4, horizonSkyColor);
  skyGrad.addColorStop(1, "rgba(184, 125, 86, 0)");

  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, zenithHeight);

  // 2. Nadir blending: smoothly blend bottom 12%
  const nadirStartY = Math.round(canvas.height * 0.88);
  const nadirGrad = ctx.createLinearGradient(0, nadirStartY, 0, canvas.height);
  nadirGrad.addColorStop(0, "rgba(26, 15, 10, 0)");
  nadirGrad.addColorStop(0.5, nadirColor);
  nadirGrad.addColorStop(1, nadirColor);

  ctx.fillStyle = nadirGrad;
  ctx.fillRect(0, nadirStartY, canvas.width, canvas.height - nadirStartY);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

// Generate sharp high-contrast text canvas sprite for ground-projected labels
function createTextSprite(
  text: string,
  bgColor = "#0b0f17",
  textColor = "#facc15",
  borderColor = "#eab308"
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.clearRect(0, 0, 512, 128);

    // Solid matte pill background
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;

    // Draw rounded rectangle
    const x = 8, y = 16, w = 496, h = 96, r = 6;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Monospaced text
    ctx.fillStyle = textColor;
    ctx.font = "bold 26px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 64);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(6.8, 1.7, 1);
  return sprite;
}

// Procedural Mars Wind Acoustic Synthesizer via Web Audio API (NASA InSight APSS Simulation)
class MarsWindSynthesizer {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private gainNode: GainNode | null = null;
  private lfoNode: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  public isPlaying = false;

  start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // 5-second buffer of procedural Brownian noise (deep low-frequency Martian rumble)
      const bufferSize = this.ctx.sampleRate * 5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.8;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      // Low-pass filter mimicking thin CO2 atmosphere (attenuates >280 Hz)
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.setValueAtTime(260, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(2.2, this.ctx.currentTime);

      // Low-frequency oscillator simulating wind gusts (~0.18 Hz)
      this.lfoNode = this.ctx.createOscillator();
      this.lfoNode.type = "sine";
      this.lfoNode.frequency.setValueAtTime(0.18, this.ctx.currentTime);

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(110, this.ctx.currentTime);

      this.lfoNode.connect(this.lfoGain);
      this.lfoGain.connect(this.filterNode.frequency);

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.24, this.ctx.currentTime);

      this.noiseNode.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.noiseNode.start();
      this.lfoNode.start();
      this.isPlaying = true;
    } catch (_e) {
      // AudioContext policy blocked or unsupported
    }
  }

  stop() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      this.noiseNode?.stop();
      this.lfoNode?.stop();
      this.ctx.close();
    } catch (_e) {}
    this.isPlaying = false;
    this.ctx = null;
  }

  toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }
}

export const SurfacePovModal: React.FC<SurfacePovModalProps> = ({
  waypoint,
  onClose,
  theme = "dark",
  dustStormActive = false,
}) => {
  const t = useTranslations("surfacePov");
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const baseElevation = waypoint?.elevationM ?? -4120;
  const wpId = waypoint?.id ?? "mount_sharp_baseline";
  const isJezero = wpId.startsWith("jzr_") || (waypoint?.coordinates && waypoint.coordinates[0] < 100);
  const siteKey: "jezero" | "gale" = isJezero ? "jezero" : "gale";

  type ViewMode = "panorama_360" | "surface" | "mesh" | "vr_stereo";
  const [viewMode, setViewMode] = useState<ViewMode>("panorama_360");
  const [activePin, setActivePin] = useState<LandmarkPin | null>(null);

  // Active Collapsible Left Drawer ("none" = 100% full-bleed clean view)
  type ActiveDrawerType = "none" | "stations" | "raw_feed" | "info";
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawerType>("none");

  // Multi-Station Tour State
  const stationList = PANORAMA_STATIONS[siteKey];
  const [activeStationIdx, setActiveStationIdx] = useState<number>(0);
  const [stationJumpingNotice, setStationJumpingNotice] = useState<boolean>(false);
  const activeStationIdxRef = useRef<number>(0);
  useEffect(() => {
    activeStationIdxRef.current = activeStationIdx;
  }, [activeStationIdx]);

  useEffect(() => {
    setActiveStationIdx(0);
  }, [isJezero]);

  // Split-Screen Compare Mode (Natural vs Enhanced Geological Color)
  const [isCompareActive, setIsCompareActive] = useState<boolean>(false);
  const [compareSplitPercent, setCompareSplitPercent] = useState<number>(50); // 10% to 90%
  const isDraggingCompareRef = useRef<boolean>(false);
  const isCompareActiveRef = useRef<boolean>(false);
  useEffect(() => {
    isCompareActiveRef.current = isCompareActive;
  }, [isCompareActive]);

  // Mars Wind Audio Synthesizer
  const windSynthesizerRef = useRef<MarsWindSynthesizer | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);

  useEffect(() => {
    const synth = new MarsWindSynthesizer();
    windSynthesizerRef.current = synth;
    return () => {
      synth.stop();
    };
  }, []);

  const handleToggleAudio = () => {
    if (!windSynthesizerRef.current) return;
    const playing = windSynthesizerRef.current.toggle();
    setIsAudioPlaying(playing);
  };

  // Live NASA Surface Rover Photos
  const [curiosityPhotos, setCuriosityPhotos] = useState<CuriosityPhotoItem[]>(
    isJezero ? FALLBACK_JEZERO_PHOTOS : FALLBACK_CURIOSITY_PHOTOS
  );
  const [photoIdx, setPhotoIdx] = useState<number>(0);

  // Camera Framing & Telemetry Readouts
  const [camAzimuth, setCamAzimuth] = useState<number>(0);
  const [camPitch, setCamPitch] = useState<number>(-8);
  const [camFov, setCamFov] = useState<number>(65);
  const [camElevation, setCamElevation] = useState<number>(-4120);
  const [reticleCoords, setReticleCoords] = useState<{ x: number; z: number; elev: number } | null>(null);
  const [teleportingNotice, setTeleportingNotice] = useState<boolean>(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const panoMeshNaturalRef = useRef<THREE.Mesh | null>(null);
  const panoMeshEnhancedRef = useRef<THREE.Mesh | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.LineSegments | null>(null);
  const reticleRef = useRef<THREE.Mesh | null>(null);
  const groundHotspotsGroupRef = useRef<THREE.Group | null>(null);
  const groundHotspotHitMeshesRef = useRef<THREE.Object3D[]>([]);

  // Camera Motion Control
  const camPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 4.2, 2.0));
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 4.2, 2.0));
  const isLerpingCamRef = useRef<boolean>(false);
  const yawRef = useRef<number>(0);
  const pitchRef = useRef<number>((-8 * Math.PI) / 180);
  const fovRef = useRef<number>(65);

  // Load and blend spherical station panorama textures (Both Natural and Enhanced)
  const loadStationPanorama = useCallback(
    (stationIdx: number) => {
      const site = isJezero ? "jezero" : "gale";

      // 1. Natural Color Texture
      const naturalImg = new Image();
      naturalImg.crossOrigin = "anonymous";
      naturalImg.src = `/api/panorama-proxy?site=${site}&station=${stationIdx}&variant=natural`;
      naturalImg.onload = () => {
        try {
          const blendedTex = blendMartianZenithAndNadir(naturalImg, dustStormActive, "natural");
          if (panoMeshNaturalRef.current) {
            const mat = panoMeshNaturalRef.current.material as THREE.MeshBasicMaterial;
            if (mat.map) mat.map.dispose();
            mat.map = blendedTex;
            mat.needsUpdate = true;
          }
        } catch (_err) {}
      };

      // 2. Enhanced Geological Color Texture
      const enhancedImg = new Image();
      enhancedImg.crossOrigin = "anonymous";
      enhancedImg.src = `/api/panorama-proxy?site=${site}&station=${stationIdx}&variant=enhanced`;
      enhancedImg.onload = () => {
        try {
          const blendedTex = blendMartianZenithAndNadir(enhancedImg, dustStormActive, "enhanced");
          if (panoMeshEnhancedRef.current) {
            const mat = panoMeshEnhancedRef.current.material as THREE.MeshBasicMaterial;
            if (mat.map) mat.map.dispose();
            mat.map = blendedTex;
            mat.needsUpdate = true;
          }
        } catch (_err) {}
      };
    },
    [isJezero, dustStormActive]
  );

  // Handle station jump
  const handleSelectStation = useCallback(
    (idx: number) => {
      const list = PANORAMA_STATIONS[siteKey];
      const clamped = Math.max(0, Math.min(list.length - 1, idx));
      setActiveStationIdx(clamped);
      setStationJumpingNotice(true);
      setTimeout(() => setStationJumpingNotice(false), 1200);
      loadStationPanorama(clamped);
    },
    [siteKey, loadStationPanorama]
  );

  // Pointer drag state
  const isPointerDownRef = useRef<boolean>(false);
  const pointerStartRef = useRef<{ x: number; y: number; startYaw: number; startPitch: number }>({
    x: 0,
    y: 0,
    startYaw: 0,
    startPitch: 0,
  });
  const hasDraggedRef = useRef<boolean>(false);
  const viewModeRef = useRef<ViewMode>(viewMode);
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  // Raycasting & Performance Throttling
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseNormRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const lastRaycastTimeRef = useRef<number>(0);
  const lastCamStateUpdateRef = useRef<number>(0);

  // Fetch Live NASA Surface Photos
  useEffect(() => {
    const mission = isJezero ? "m2020" : "curiosity";
    fetch(`/api/curiosity-photos?mission=${mission}&limit=12`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.items && data.items.length > 0) {
          setCuriosityPhotos(data.items);
        }
      })
      .catch(() => {});
  }, [isJezero]);

  // Reset camera to initial observation origin
  const handleResetOrigin = useCallback(() => {
    const originZ = 2.0;
    const originX = 0.0;
    const originY = getTerrainHeight(originX, originZ, wpId) + 4.2;
    targetCamPosRef.current.set(originX, originY, originZ);
    isLerpingCamRef.current = true;
    yawRef.current = 0;
    pitchRef.current = (-8 * Math.PI) / 180;
    fovRef.current = 65;
    if (cameraRef.current) {
      cameraRef.current.fov = 65;
      cameraRef.current.updateProjectionMatrix();
    }
    setCamAzimuth(0);
    setCamPitch(-8);
    setCamFov(65);
  }, [wpId]);

  // Three.js Scene Setup & Render Loop
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || !waypoint) return;

    const width = host.clientWidth || window.innerWidth;
    const height = host.clientHeight || window.innerHeight;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const skyClearColor = dustStormActive ? 0x240e06 : 0x3b2316;
    const fogColor = dustStormActive ? 0x6b2e10 : 0x5c3520;
    const fogDensity = dustStormActive ? 0.032 : 0.007;
    scene.background = new THREE.Color(skyClearColor);
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    // 2. Camera Configuration
    const camera = new THREE.PerspectiveCamera(fovRef.current, width / height, 0.1, 450);
    const startZ = 2.0;
    const startX = 0.0;
    const startY = getTerrainHeight(startX, startZ, wpId) + 4.2;
    camPosRef.current.set(startX, startY, startZ);
    targetCamPosRef.current.set(startX, startY, startZ);
    camera.position.copy(camPosRef.current);
    cameraRef.current = camera;
    setCamElevation(Math.round(baseElevation + startY));

    // 3. WebGL Renderer
    const isHighDpi = typeof window !== "undefined" && window.devicePixelRatio > 1.5;
    const renderer = new THREE.WebGLRenderer({
      antialias: !isHighDpi,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = dustStormActive ? 0.85 : 1.25;
    rendererRef.current = renderer;

    host.replaceChildren();
    host.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(
      dustStormActive ? 0x994411 : 0xffd8b8,
      dustStormActive ? 0.45 : 0.95
    );
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      dustStormActive ? 0xd97736 : 0xfff0dd,
      dustStormActive ? 0.5 : 1.7
    );
    sunLight.position.set(35, 45, 25);
    scene.add(sunLight);

    // 5. 360° Spherical Panorama Meshes (Natural & Enhanced)
    const panoGeom = new THREE.SphereGeometry(60, 64, 32);
    panoGeom.scale(-1, 1, 1);

    const panoMatNatural = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const panoMeshNatural = new THREE.Mesh(panoGeom, panoMatNatural);
    panoMeshNatural.name = "rover_360_natural";
    panoMeshNatural.position.copy(camPosRef.current);
    scene.add(panoMeshNatural);
    panoMeshNaturalRef.current = panoMeshNatural;

    const panoMatEnhanced = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const panoMeshEnhanced = new THREE.Mesh(panoGeom, panoMatEnhanced);
    panoMeshEnhanced.name = "rover_360_enhanced";
    panoMeshEnhanced.position.copy(camPosRef.current);
    panoMeshEnhanced.visible = false;
    scene.add(panoMeshEnhanced);
    panoMeshEnhancedRef.current = panoMeshEnhanced;

    // Load initial panorama textures
    loadStationPanorama(activeStationIdxRef.current);

    // 6. Procedural Base Terrain (for 3D Surface / Mesh Mode)
    const terrainGeom = new THREE.PlaneGeometry(120, 120, 80, 80);
    terrainGeom.rotateX(-Math.PI / 2);
    const posAttr = terrainGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      posAttr.setY(i, getTerrainHeight(vx, vz, wpId));
    }
    terrainGeom.computeVertexNormals();

    const regolithTex = createMartianRegolithTexture();
    const terrainMaterial = new THREE.MeshStandardMaterial({
      map: regolithTex,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(terrainGeom, terrainMaterial);
    terrainMesh.name = "martian_terrain";
    terrainMesh.visible = false;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    const wireframeGeom = new THREE.WireframeGeometry(terrainGeom);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
    });
    const wireframeMesh = new THREE.LineSegments(wireframeGeom, wireframeMat);
    wireframeMesh.visible = false;
    scene.add(wireframeMesh);
    wireframeMeshRef.current = wireframeMesh;

    // 7. Ground-Projected Targeting Reticle (for Teleportation in 3D terrain mode)
    const reticleGeom = new THREE.RingGeometry(0.55, 0.72, 32);
    reticleGeom.rotateX(-Math.PI / 2);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const reticleMesh = new THREE.Mesh(reticleGeom, reticleMat);
    reticleMesh.visible = false;
    scene.add(reticleMesh);
    reticleRef.current = reticleMesh;

    // 8. Ground-Projected Circular Station Hotspots (FU Berlin jezero/360/4N standard)
    const groundHotspotsGroup = new THREE.Group();
    groundHotspotsGroup.name = "ground_projected_hotspots";
    scene.add(groundHotspotsGroup);
    groundHotspotsGroupRef.current = groundHotspotsGroup;

    // 9. Resize Handler
    const handleResize = () => {
      if (!host || !rendererRef.current || !cameraRef.current) return;
      const nw = host.clientWidth;
      const nh = host.clientHeight;
      cameraRef.current.aspect = nw / nh;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(nw, nh);
    };
    window.addEventListener("resize", handleResize);

    // 10. Animation & Render Loop (High Performance 60 FPS)
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Pulse ground hotspots ring rotation
      groundHotspotsGroup.traverse((obj) => {
        if (obj.name === "ground_hotspot_ring_outer") {
          obj.rotation.z = elapsedTime * 0.45;
        }
      });

      // Camera Position Lerp
      if (isLerpingCamRef.current) {
        camPosRef.current.lerp(targetCamPosRef.current, 0.08);
        if (camPosRef.current.distanceTo(targetCamPosRef.current) < 0.05) {
          camPosRef.current.copy(targetCamPosRef.current);
          isLerpingCamRef.current = false;
        }
        const newElev = Math.round(baseElevation + camPosRef.current.y);
        setCamElevation((prev) => (prev === newElev ? prev : newElev));
      }

      if (panoMeshNaturalRef.current) {
        panoMeshNaturalRef.current.position.copy(camPosRef.current);
      }
      if (panoMeshEnhancedRef.current) {
        panoMeshEnhancedRef.current.position.copy(camPosRef.current);
      }

      camera.position.copy(camPosRef.current);

      const lookDist = 50;
      const cx = Math.sin(yawRef.current) * Math.cos(pitchRef.current) * lookDist;
      const cy = Math.sin(pitchRef.current) * lookDist;
      const cz = -Math.cos(yawRef.current) * Math.cos(pitchRef.current) * lookDist;
      camera.lookAt(
        camPosRef.current.x + cx,
        camPosRef.current.y + cy,
        camPosRef.current.z + cz
      );

      // Rendering logic: Split Compare vs VR Stereo vs Full Viewport
      if (viewModeRef.current === "panorama_360" && isCompareActiveRef.current) {
        const sw = renderer.domElement.clientWidth;
        const sh = renderer.domElement.clientHeight;
        const splitX = Math.round((compareSplitPercent / 100) * sw);

        renderer.setScissorTest(true);

        // Left Scissor Viewport: Natural Color
        renderer.setScissor(0, 0, splitX, sh);
        renderer.setViewport(0, 0, sw, sh);
        if (panoMeshNaturalRef.current) panoMeshNaturalRef.current.visible = true;
        if (panoMeshEnhancedRef.current) panoMeshEnhancedRef.current.visible = false;
        renderer.render(scene, camera);

        // Right Scissor Viewport: Enhanced Geological Color
        renderer.setScissor(splitX, 0, sw - splitX, sh);
        renderer.setViewport(0, 0, sw, sh);
        if (panoMeshNaturalRef.current) panoMeshNaturalRef.current.visible = false;
        if (panoMeshEnhancedRef.current) panoMeshEnhancedRef.current.visible = true;
        renderer.render(scene, camera);

        renderer.setScissorTest(false);
      } else if (viewModeRef.current === "vr_stereo") {
        const sw = renderer.domElement.clientWidth;
        const sh = renderer.domElement.clientHeight;
        const halfW = sw / 2;

        renderer.setScissorTest(true);

        renderer.setScissor(0, 0, halfW, sh);
        renderer.setViewport(0, 0, halfW, sh);
        camera.aspect = halfW / sh;
        camera.updateProjectionMatrix();
        camera.position.x = camPosRef.current.x - 0.032;
        renderer.render(scene, camera);

        renderer.setScissor(halfW, 0, halfW, sh);
        renderer.setViewport(halfW, 0, halfW, sh);
        camera.aspect = halfW / sh;
        camera.updateProjectionMatrix();
        camera.position.x = camPosRef.current.x + 0.032;
        renderer.render(scene, camera);

        camera.position.copy(camPosRef.current);
        renderer.setScissorTest(false);
      } else {
        if (panoMeshNaturalRef.current) panoMeshNaturalRef.current.visible = true;
        if (panoMeshEnhancedRef.current) panoMeshEnhancedRef.current.visible = false;
        renderer.render(scene, camera);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      panoGeom.dispose();
      panoMatNatural.dispose();
      panoMatEnhanced.dispose();
      terrainGeom.dispose();
      terrainMaterial.dispose();
      regolithTex.dispose();
      wireframeGeom.dispose();
      wireframeMat.dispose();
      reticleGeom.dispose();
      reticleMat.dispose();
      if (host) {
        host.replaceChildren();
      }
    };
  }, [waypoint, wpId, baseElevation, dustStormActive, compareSplitPercent]);

  // Re-build Ground-Projected Station Hotspots whenever active station or site changes
  useEffect(() => {
    const group = groundHotspotsGroupRef.current;
    if (!group) return;

    // Clear previous hotspot children
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
      }
    }
    groundHotspotHitMeshesRef.current = [];

    if (viewMode !== "panorama_360") {
      group.visible = false;
      return;
    }
    group.visible = true;

    const currentStation = stationList[activeStationIdx] || stationList[0];
    const neighbors = getNeighborStations(siteKey, activeStationIdx);

    // 1. Nadir Hotspot Ring Directly Below Rover: [ YOU ARE AT: SOL X ]
    const nadirRingGroup = new THREE.Group();
    nadirRingGroup.position.set(0, -9.0, 0);

    const nadirRingGeom = new THREE.RingGeometry(1.8, 2.3, 32);
    nadirRingGeom.rotateX(-Math.PI / 2);
    const nadirRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const nadirRing = new THREE.Mesh(nadirRingGeom, nadirRingMat);
    nadirRingGroup.add(nadirRing);

    const nadirSprite = createTextSprite(
      `[ YOU ARE AT: SOL ${currentStation.sol} // STN-0${activeStationIdx + 1} ]`,
      "#064e3b",
      "#34d399",
      "#10b981"
    );
    nadirSprite.position.set(0, 1.2, 0);
    nadirRingGroup.add(nadirSprite);
    group.add(nadirRingGroup);

    // 2. Projected Ground Hotspot Rings for Neighboring Stations (FU Berlin standard)
    neighbors.forEach((nbr) => {
      const rad = (nbr.azimuthDeg * Math.PI) / 180;
      const groundDist = 24.0; // Projected circle radius on ground
      const gx = Math.sin(rad) * groundDist;
      const gz = -Math.cos(rad) * groundDist;
      const gy = -7.5; // Surface plane below eye level

      const hotspotGroup = new THREE.Group();
      hotspotGroup.position.set(gx, gy, gz);

      // Concentric target rings on ground
      const outerRingGeom = new THREE.RingGeometry(1.6, 2.1, 32);
      outerRingGeom.rotateX(-Math.PI / 2);
      const outerRingMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      });
      const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
      outerRing.name = "ground_hotspot_ring_outer";
      hotspotGroup.add(outerRing);

      const innerRingGeom = new THREE.RingGeometry(0.5, 0.8, 24);
      innerRingGeom.rotateX(-Math.PI / 2);
      const innerRingMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      });
      const innerRing = new THREE.Mesh(innerRingGeom, innerRingMat);
      hotspotGroup.add(innerRing);

      // Informative monospaced label sprite
      const labelText = `[ JUMP -> SOL ${nbr.sol}: STN-0${nbr.targetStation + 1} (~${nbr.distanceM}m) ]`;
      const labelSprite = createTextSprite(labelText, "#0b0f17", "#38bdf8", "#0284c7");
      labelSprite.position.set(0, 1.8, 0);
      hotspotGroup.add(labelSprite);

      // Raycast hit target cylinder
      const hitGeom = new THREE.CylinderGeometry(2.8, 2.8, 4.0, 16);
      hitGeom.translate(0, 1.5, 0);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.userData = { isGroundHotspot: true, targetStationIdx: nbr.targetStation, nbrData: nbr };
      hotspotGroup.add(hitMesh);

      group.add(hotspotGroup);
      groundHotspotHitMeshesRef.current.push(hitMesh);
    });
  }, [activeStationIdx, siteKey, stationList, viewMode]);

  // Synchronize view mode styles & visibilities
  useEffect(() => {
    if (!terrainMeshRef.current || !wireframeMeshRef.current || !panoMeshNaturalRef.current) return;
    const groundGroup = groundHotspotsGroupRef.current;

    if (viewMode === "panorama_360") {
      panoMeshNaturalRef.current.visible = true;
      terrainMeshRef.current.visible = false;
      wireframeMeshRef.current.visible = false;
      if (groundGroup) groundGroup.visible = true;
    } else if (viewMode === "mesh") {
      panoMeshNaturalRef.current.visible = false;
      if (panoMeshEnhancedRef.current) panoMeshEnhancedRef.current.visible = false;
      (terrainMeshRef.current.material as THREE.MeshStandardMaterial).visible = false;
      terrainMeshRef.current.visible = true;
      wireframeMeshRef.current.visible = true;
      if (groundGroup) groundGroup.visible = false;
    } else {
      panoMeshNaturalRef.current.visible = false;
      if (panoMeshEnhancedRef.current) panoMeshEnhancedRef.current.visible = false;
      (terrainMeshRef.current.material as THREE.MeshStandardMaterial).visible = true;
      terrainMeshRef.current.visible = true;
      wireframeMeshRef.current.visible = false;
      if (groundGroup) groundGroup.visible = false;
    }
  }, [viewMode]);

  // Pointer Interaction Handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const host = canvasHostRef.current;
    if (!host || !cameraRef.current) return;

    // Handle Split Compare Divider Dragging
    if (isDraggingCompareRef.current) {
      const rect = host.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(10, Math.min(90, Math.round((x / rect.width) * 100)));
      setCompareSplitPercent(pct);
      return;
    }

    const rect = host.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouseNormRef.current.set(mouseX, mouseY);

    const now = performance.now();

    if (isPointerDownRef.current) {
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDraggedRef.current = true;
      }

      const sens = 0.0035;
      yawRef.current = pointerStartRef.current.startYaw - dx * sens;
      pitchRef.current = Math.max(
        -1.3,
        Math.min(1.3, pointerStartRef.current.startPitch + dy * sens)
      );

      if (now - lastCamStateUpdateRef.current >= 32) {
        lastCamStateUpdateRef.current = now;
        const normDegAz = Math.round((((yawRef.current * 180) / Math.PI) % 360 + 360) % 360);
        const normDegPitch = Math.round((pitchRef.current * 180) / Math.PI * 10) / 10;
        setCamAzimuth(normDegAz);
        setCamPitch(normDegPitch);
      }
      return;
    }

    if (now - lastRaycastTimeRef.current < 32) return;
    lastRaycastTimeRef.current = now;

    // Raycast in 3D terrain mode for reticle
    if (viewMode !== "panorama_360" && terrainMeshRef.current && cameraRef.current) {
      raycasterRef.current.setFromCamera(mouseNormRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObject(terrainMeshRef.current);

      if (intersects.length > 0 && reticleRef.current) {
        const hit = intersects[0];
        reticleRef.current.visible = true;
        reticleRef.current.position.set(hit.point.x, hit.point.y + 0.04, hit.point.z);
        setReticleCoords({
          x: Math.round(hit.point.x * 10) / 10,
          z: Math.round(hit.point.z * 10) / 10,
          elev: Math.round((baseElevation + hit.point.y) * 10) / 10,
        });
      } else if (reticleRef.current) {
        reticleRef.current.visible = false;
        setReticleCoords(null);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = true;
    hasDraggedRef.current = false;
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startYaw: yawRef.current,
      startPitch: pitchRef.current,
    };
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    isDraggingCompareRef.current = false;

    if (hasDraggedRef.current) {
      const normDegAz = Math.round((((yawRef.current * 180) / Math.PI) % 360 + 360) % 360);
      const normDegPitch = Math.round((pitchRef.current * 180) / Math.PI * 10) / 10;
      setCamAzimuth(normDegAz);
      setCamPitch(normDegPitch);
      return;
    }

    if (cameraRef.current) {
      raycasterRef.current.setFromCamera(mouseNormRef.current, cameraRef.current);

      // 1. Raycast Check Ground Hotspots in 360° Tour (FU Berlin Standard)
      if (viewModeRef.current === "panorama_360" && groundHotspotHitMeshesRef.current.length > 0) {
        const hits = raycasterRef.current.intersectObjects(groundHotspotHitMeshesRef.current);
        if (hits.length > 0) {
          const hitData = hits[0].object.userData;
          if (hitData.isGroundHotspot && typeof hitData.targetStationIdx === "number") {
            handleSelectStation(hitData.targetStationIdx);
            return;
          }
        }
      }

      // 2. Terrain Teleportation in 3D Mode
      if (viewModeRef.current !== "panorama_360" && terrainMeshRef.current) {
        const hits = raycasterRef.current.intersectObject(terrainMeshRef.current);
        if (hits.length > 0) {
          const targetPoint = hits[0].point;
          targetCamPosRef.current.set(targetPoint.x, targetPoint.y + 1.7, targetPoint.z);
          isLerpingCamRef.current = true;
          setTeleportingNotice(true);
          setTimeout(() => setTeleportingNotice(false), 900);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!cameraRef.current) return;
    const delta = e.deltaY * 0.05;
    const newFov = Math.max(30, Math.min(85, fovRef.current + delta));
    fovRef.current = newFov;
    cameraRef.current.fov = newFov;
    cameraRef.current.updateProjectionMatrix();
    setCamFov(Math.round(newFov));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (activeDrawer !== "none") {
          setActiveDrawer("none");
        } else if (activePin) {
          setActivePin(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, activePin, activeDrawer]);

  if (!waypoint) return null;

  const currentStation = stationList[activeStationIdx] || stationList[0];
  const currentPhoto = curiosityPhotos[photoIdx] || (isJezero ? FALLBACK_JEZERO_PHOTOS[0] : FALLBACK_CURIOSITY_PHOTOS[0]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07090e] font-mono select-none overflow-hidden">
      {/* 1. HUD TOP HEADER (h-9, Full-Width, Compact Telemetry) */}
      <header className="h-9 bg-[#0b0f17]/95 border-b border-slate-800 px-3 flex items-center justify-between shrink-0 font-mono text-xs z-30">
        <div className="flex items-center gap-3 overflow-hidden">
          <MarsForAllBadge size={20} showSubtext={false} />
          <div className="flex items-center gap-2 text-slate-300 truncate text-[11px]">
            <span className="font-bold text-amber-400 whitespace-nowrap">
              {isJezero ? "MARSFORALL // JEZERO-02" : "MARSFORALL // GALE-01"}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold whitespace-nowrap">
              STN-0{activeStationIdx + 1}: {currentStation.title} (SOL {currentStation.sol})
            </span>
          </div>
        </div>

        {/* Center Orientation Telemetry */}
        <div className="hidden md:flex items-center gap-3 text-[10px] text-slate-400">
          <span>AZ: <strong className="text-amber-400 tabular-nums">{camAzimuth}°</strong></span>
          <span className="text-slate-700">|</span>
          <span>PITCH: <strong className="text-slate-200 tabular-nums">{camPitch}°</strong></span>
          <span className="text-slate-700">|</span>
          <span>FOV: <strong className="text-cyan-400 tabular-nums">{camFov}°</strong></span>
        </div>

        {/* Right Action Switchers */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center border border-slate-800 bg-[#07090e] p-0.5">
            <button
              onClick={() => {
                setViewMode("panorama_360");
                setIsCompareActive(false);
              }}
              className={`whitespace-nowrap text-[10px] px-2 py-0.5 font-bold transition-colors ${
                viewMode === "panorama_360"
                  ? "bg-[#161e2e] text-emerald-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("modePanorama360")}
            </button>
            <button
              onClick={() => setViewMode("surface")}
              className={`whitespace-nowrap text-[10px] px-2 py-0.5 font-bold transition-colors ${
                viewMode === "surface"
                  ? "bg-[#161e2e] text-amber-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("modeSurface")}
            </button>
            <button
              onClick={() => setViewMode("mesh")}
              className={`whitespace-nowrap text-[10px] px-2 py-0.5 font-bold transition-colors ${
                viewMode === "mesh"
                  ? "bg-[#161e2e] text-cyan-400 border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t("modeMesh")}
            </button>
          </div>

          <button
            onClick={handleResetOrigin}
            className="whitespace-nowrap px-2 py-0.5 bg-[#111827] border border-slate-700 text-slate-300 hover:bg-[#1f2937] hover:text-white text-[10px] font-bold"
            title={t("resetOrigin")}
          >
            {t("resetOrigin")}
          </button>

          <button
            onClick={onClose}
            className="whitespace-nowrap px-2 py-0.5 bg-[#7f1d1d]/80 hover:bg-[#991b1b] border border-[#ef4444] text-[#fca5a5] text-[10px] font-bold"
            title={t("close")}
          >
            {t("close")}
          </button>
        </div>
      </header>

      {/* 2. MAIN 360° WORKSPACE WITH COLLAPSIBLE FU BERLIN ICON RAIL */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        {/* COLLAPSIBLE LEFT ICON RAIL (w-11 = 44px, FU Berlin Planetarium Style) */}
        <nav className="w-11 h-full bg-[#0b0f17]/95 border-r border-slate-800 flex flex-col items-center py-2 z-30 shrink-0 select-none">
          {/* Tool 1: Return to 2D Map */}
          <button
            onClick={onClose}
            title={t("backToMap")}
            className="w-8 h-8 flex items-center justify-center my-0.5 border border-transparent text-slate-400 hover:text-amber-400 hover:bg-[#161e2e] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="w-6 h-[1px] bg-slate-800 my-1" />

          {/* Tool 2: 360° Stations Tour List */}
          <button
            onClick={() => setActiveDrawer((prev) => (prev === "stations" ? "none" : "stations"))}
            title={t("stationList")}
            className={`w-8 h-8 flex items-center justify-center my-0.5 border transition-colors ${
              activeDrawer === "stations"
                ? "bg-emerald-600 text-slate-950 font-bold border-emerald-400"
                : "text-emerald-400 hover:text-emerald-300 hover:bg-[#161e2e] border-transparent"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="10" r="3" />
              <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
            </svg>
          </button>

          {/* Tool 3: Rover Raw Photo Feed */}
          <button
            onClick={() => setActiveDrawer((prev) => (prev === "raw_feed" ? "none" : "raw_feed"))}
            title={isJezero ? t("m2020RawFeed") : t("liveMslRawFeed")}
            className={`w-8 h-8 flex items-center justify-center my-0.5 border transition-colors ${
              activeDrawer === "raw_feed"
                ? "bg-amber-600 text-slate-950 font-bold border-amber-400"
                : "text-amber-400 hover:text-amber-300 hover:bg-[#161e2e] border-transparent"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>

          {/* Tool 4: Split-Screen Compare Mode (Natural vs Enhanced Geological Stretch) */}
          <button
            onClick={() => setIsCompareActive((prev) => !prev)}
            title={t("compareSplit")}
            className={`w-8 h-8 flex items-center justify-center my-0.5 border transition-colors ${
              isCompareActive
                ? "bg-cyan-600 text-slate-950 font-bold border-cyan-400"
                : "text-cyan-400 hover:text-cyan-300 hover:bg-[#161e2e] border-transparent"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
          </button>

          {/* Tool 5: Synthesized InSight Mars Wind Audio */}
          <button
            onClick={handleToggleAudio}
            title={isAudioPlaying ? t("audioPlaying") : t("audioMuted")}
            className={`w-8 h-8 flex items-center justify-center my-0.5 border transition-colors ${
              isAudioPlaying
                ? "bg-[#064e3b] text-[#34d399] border-[#10b981] font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#161e2e] border-transparent"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              {isAudioPlaying ? (
                <>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </>
              ) : (
                <line x1="23" y1="9" x2="17" y2="15" />
              )}
            </svg>
          </button>

          {/* Tool 6: VR Stereoscopic Mode */}
          <button
            onClick={() => setViewMode((prev) => (prev === "vr_stereo" ? "panorama_360" : "vr_stereo"))}
            title={t("modeVr")}
            className={`w-8 h-8 flex items-center justify-center my-0.5 border transition-colors ${
              viewMode === "vr_stereo"
                ? "bg-purple-700 text-slate-100 font-bold border-purple-400"
                : "text-purple-400 hover:text-purple-300 hover:bg-[#161e2e] border-transparent"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 7H3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4l3-3h4l3 3h4a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              <circle cx="7.5" cy="12.5" r="1.5" />
              <circle cx="16.5" cy="12.5" r="1.5" />
            </svg>
          </button>

          <div className="w-6 h-[1px] bg-slate-800 my-1" />

          {/* Tool 7: Mission Info & Attributions */}
          <button
            onClick={() => setActiveDrawer((prev) => (prev === "info" ? "none" : "info"))}
            title={t("infoCredits")}
            className={`w-8 h-8 flex items-center justify-center my-0.5 border transition-colors ${
              activeDrawer === "info"
                ? "bg-slate-700 text-slate-100 font-bold border-slate-500"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#161e2e] border-transparent"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
        </nav>

        {/* COLLAPSIBLE LEFT DRAWER (Only open when activeDrawer !== "none") */}
        {activeDrawer !== "none" && (
          <aside className="absolute left-11 top-0 bottom-0 w-80 bg-[#0b0f17]/95 border-r border-slate-800 z-30 shadow-2xl flex flex-col font-mono text-xs">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-[#07090e] shrink-0">
              <span className="font-bold text-amber-400 uppercase tracking-wider">
                {activeDrawer === "stations" && t("stationList")}
                {activeDrawer === "raw_feed" && (isJezero ? t("m2020RawFeed") : t("liveMslRawFeed"))}
                {activeDrawer === "info" && t("infoCredits")}
              </span>
              <button
                onClick={() => setActiveDrawer("none")}
                className="px-1.5 py-0.5 border border-slate-700 text-slate-400 hover:text-white text-[10px] font-bold"
              >
                ✕
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* STATIONS LIST DRAWER */}
              {activeDrawer === "stations" && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Interactive multi-station 360-degree panorama stations captured by NASA rovers in {isJezero ? "Jezero Crater" : "Gale Crater"}.
                  </p>
                  {stationList.map((stn, idx) => (
                    <div
                      key={stn.id}
                      onClick={() => {
                        handleSelectStation(idx);
                        setActiveDrawer("none");
                      }}
                      className={`p-2.5 border cursor-pointer transition-colors ${
                        activeStationIdx === idx
                          ? "bg-[#161e2e] border-emerald-500 text-emerald-300"
                          : "bg-[#07090e] border-slate-800 text-slate-300 hover:border-slate-600 hover:bg-[#111827]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] pb-1 border-b border-slate-800/80 mb-1.5">
                        <span className="font-bold text-amber-400">STN-0{idx + 1} // SOL {stn.sol}</span>
                        {activeStationIdx === idx && (
                          <span className="px-1 py-0.2 bg-[#064e3b] text-[#34d399] border border-[#10b981] text-[9px] font-bold">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-200 text-xs mb-1">
                        {stn.title}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        {stn.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* RAW PHOTO FEED DRAWER */}
              {activeDrawer === "raw_feed" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                    <span>PHOTO {photoIdx + 1} OF {curiosityPhotos.length}</span>
                    <span className="text-amber-400 font-bold">SOL {currentPhoto.sol}</span>
                  </div>

                  <div className="relative w-full h-44 bg-black border border-slate-800 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentPhoto.image_url}
                      alt={currentPhoto.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute bottom-1 left-1 bg-black/85 px-1 py-0.5 border border-slate-800 text-[9px] text-amber-300">
                      {currentPhoto.instrument}
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400">
                    <div className="text-slate-200 font-bold">{currentPhoto.title}</div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">ID:</span>
                      <span className="text-slate-300 truncate max-w-[190px]">{currentPhoto.imageid}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">ACQUIRED:</span>
                      <span className="text-slate-300">{currentPhoto.date_taken_utc.slice(0, 10)}</span>
                    </div>
                    {currentPhoto.caption && (
                      <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                        {currentPhoto.caption}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setPhotoIdx((prev) => (prev > 0 ? prev - 1 : curiosityPhotos.length - 1))}
                      className="flex-1 py-1.5 bg-[#111827] border border-slate-700 text-slate-300 hover:bg-[#1f2937] text-[10px] font-bold"
                    >
                      {t("prevSol")}
                    </button>
                    <button
                      onClick={() => setPhotoIdx((prev) => (prev < curiosityPhotos.length - 1 ? prev + 1 : 0))}
                      className="flex-1 py-1.5 bg-[#111827] border border-slate-700 text-slate-300 hover:bg-[#1f2937] text-[10px] font-bold"
                    >
                      {t("nextSol")}
                    </button>
                  </div>
                </div>
              )}

              {/* MISSION INFO & CREDITS DRAWER */}
              {activeDrawer === "info" && (
                <div className="space-y-3">
                  <div className="text-slate-200 font-bold text-xs uppercase">
                    NASA JPL & ASU 360° PLANETARY MOSAICS
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Full-spherical equirectangular surface panoramas processed from the Mastcam-Z camera suite on Mars 2020 Perseverance and Mastcam on MSL Curiosity.
                  </p>
                  <div className="p-2 border border-slate-800 bg-[#07090e] space-y-1 text-[10px]">
                    <div className="text-slate-500 font-bold uppercase tracking-wider">OFFICIAL ATTRIBUTION</div>
                    <div className="text-amber-400 font-bold">
                      NASA / JPL-Caltech / ASU / MSSS / FU Berlin Planetarium
                    </div>
                  </div>
                  <div className="p-2 border border-slate-800 bg-[#07090e] space-y-1 text-[10px]">
                    <div className="text-slate-500 font-bold uppercase tracking-wider">MARTIAN SOUNDSCAPE</div>
                    <div className="text-cyan-400 font-bold">
                      InSight Seismometer & Pressure Sensor Mars Wind Acoustics
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* 3. FULL-BLEED 3D / 360° WEBGL VIEWPORT */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden bg-black"
        >
          {/* WebGL Canvas Host */}
          <div ref={canvasHostRef} className="absolute inset-0 w-full h-full" />

          {/* Interactive Split-Screen Compare Overlay */}
          {viewMode === "panorama_360" && isCompareActive && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Left Label: Natural Color */}
              <div className="absolute top-4 left-4 bg-[#0b0f17]/90 border border-slate-700 px-3 py-1 text-[10px] font-bold text-amber-300">
                [ ◀ {t("compareNatural")} ]
              </div>

              {/* Right Label: Enhanced Geological Color */}
              <div className="absolute top-4 right-4 bg-[#0b0f17]/90 border border-slate-700 px-3 py-1 text-[10px] font-bold text-cyan-300">
                [ {t("compareEnhanced")} ▶ ]
              </div>

              {/* Draggable Divider Line */}
              <div
                style={{ left: `${compareSplitPercent}%` }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  isDraggingCompareRef.current = true;
                }}
                className="absolute inset-y-0 w-1 bg-[#facc15] shadow-2xl cursor-ew-resize pointer-events-auto flex items-center justify-center -translate-x-1/2"
              >
                <div className="px-2 py-1 bg-[#07090e] border border-[#facc15] text-[#facc15] font-mono text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shadow-xl">
                  ◀ ❙ ▶
                </div>
              </div>
            </div>
          )}

          {/* Jump Toast Notification */}
          {stationJumpingNotice && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#0b0f17] border border-amber-500 text-amber-300 px-4 py-1.5 font-mono text-xs tracking-wider font-bold shadow-2xl animate-pulse z-30 pointer-events-none">
              {t("stationJumping")} STN-0{activeStationIdx + 1}: SOL {currentStation.sol} — {currentStation.title}
            </div>
          )}

          {/* Ground Reticle Teleporting Notice */}
          {teleportingNotice && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#0b0f17] border border-cyan-500/80 text-cyan-300 px-4 py-1.5 font-mono text-xs tracking-wider font-bold shadow-md animate-pulse z-30 pointer-events-none">
              {t("teleporting")}
            </div>
          )}

          {/* Quick Station Navigation Floating Buttons (Left/Right Chevrons) */}
          {viewMode === "panorama_360" && (
            <>
              <button
                onClick={() => handleSelectStation((activeStationIdx - 1 + stationList.length) % stationList.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 px-2.5 py-3 bg-[#0b0f17]/90 hover:bg-[#161e2e] border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 font-mono text-[10px] font-bold tracking-wider pointer-events-auto transition-colors flex items-center gap-1 shadow-2xl"
                title={t("prevStation")}
              >
                &laquo; STN-0{((activeStationIdx - 1 + stationList.length) % stationList.length) + 1}
              </button>
              <button
                onClick={() => handleSelectStation((activeStationIdx + 1) % stationList.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 px-2.5 py-3 bg-[#0b0f17]/90 hover:bg-[#161e2e] border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 font-mono text-[10px] font-bold tracking-wider pointer-events-auto transition-colors flex items-center gap-1 shadow-2xl"
                title={t("nextStation")}
              >
                STN-0{((activeStationIdx + 1) % stationList.length) + 1} &raquo;
              </button>
            </>
          )}

          {/* Ground Hotspot Interactive Instruction Pill */}
          {viewMode === "panorama_360" && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 bg-[#0b0f17]/90 border border-slate-800 px-3 py-1 font-mono text-[10px] text-slate-400 pointer-events-none flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />
              <span>{t("hintTeleport")}</span>
              <span className="text-slate-600">•</span>
              <span>{t("hintPan")}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM TELEMETRY BAR (Simetris h-9, Zero Overlap) */}
      <footer className="h-9 bg-[#0b0f17] border-t border-slate-800 px-3 flex items-center justify-between shrink-0 font-mono text-xs z-30">
        <div className="flex items-center gap-3 text-slate-300 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">{t("evaCamElev")}</span>
            <span className="text-amber-400 font-bold tabular-nums">{camElevation} m</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">{t("reticleTgt")}</span>
            {viewMode === "panorama_360" ? (
              <span className="text-emerald-400 font-bold tabular-nums">
                [ 360° POV // STN-0{activeStationIdx + 1}: SOL {currentStation.sol} ]
              </span>
            ) : reticleCoords ? (
              <span className="text-cyan-400 font-bold tabular-nums">
                X: {reticleCoords.x > 0 ? `+${reticleCoords.x}` : reticleCoords.x}m, Z: {reticleCoords.z > 0 ? `+${reticleCoords.z}` : reticleCoords.z}m ({reticleCoords.elev}m)
              </span>
            ) : (
              <span className="text-slate-600">{t("searchingTerrain")}</span>
            )}
          </div>
        </div>

        {/* 360° Tour Station Selector Pills (Planetarium Center Bar) */}
        {viewMode === "panorama_360" && (
          <div className="hidden md:flex items-center gap-1 border border-slate-800 bg-[#07090e] p-0.5">
            <span className="text-slate-500 text-[9px] px-1 font-bold">{t("tourStations")}:</span>
            {stationList.map((stn, idx) => (
              <button
                key={stn.id}
                onClick={() => handleSelectStation(idx)}
                className={`px-2 py-0.5 text-[10px] font-mono font-bold transition-colors whitespace-nowrap ${
                  activeStationIdx === idx
                    ? "bg-[#161e2e] text-emerald-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title={`${stn.title} (${stn.location})`}
              >
                STN-0{idx + 1}: SOL {stn.sol}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAudio}
            className={`whitespace-nowrap px-2 py-0.5 border text-[10px] font-bold transition-colors ${
              isAudioPlaying
                ? "bg-[#064e3b] text-[#34d399] border-[#10b981]"
                : "bg-[#111827] text-slate-400 border-slate-700 hover:text-slate-200"
            }`}
          >
            {isAudioPlaying ? t("audioPlaying") : t("audioMuted")}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default SurfacePovModal;
