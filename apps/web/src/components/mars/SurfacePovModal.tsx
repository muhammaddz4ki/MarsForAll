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

// Deterministic pseudo-random generator
function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// High-resolution Martian satellite rock & regolith texture with sharp MOLA elevation contour lines
function createMartianReliefContourTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const nextRand = createPrng(418042);

  // 1. Base ferric-oxide dark rock gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
  bgGrad.addColorStop(0, "#7c2d12");
  bgGrad.addColorStop(0.5, "#9a3412");
  bgGrad.addColorStop(1, "#6c230e");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Linear eolian sand ripples & strata fractures
  ctx.strokeStyle = "#431407";
  ctx.lineWidth = 1.5;
  for (let y = 0; y < 1024; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 32) {
      const dy = Math.sin(x * 0.04) * 6 + (nextRand() - 0.5) * 4;
      ctx.lineTo(x, y + dy);
    }
    ctx.stroke();
  }

  // 3. Clastic bedrock pebble distribution
  for (let i = 0; i < 800; i++) {
    const px = nextRand() * 1024;
    const py = nextRand() * 1024;
    const pr = nextRand() * 3 + 1;
    ctx.fillStyle = nextRand() > 0.5 ? "#c2410c" : "#3b1104";
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Sharp MOLA topographic elevation contour lines (interval lines with index lines)
  for (let y = 0; y < 1024; y += 48) {
    const isIndex = y % 192 === 0;
    ctx.strokeStyle = isIndex ? "rgba(254, 215, 170, 0.45)" : "rgba(251, 146, 60, 0.22)";
    ctx.lineWidth = isIndex ? 2.0 : 1.0;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 16) {
      const cy = Math.sin(x * 0.015) * 18 + Math.cos(x * 0.035) * 8;
      ctx.lineTo(x, y + cy);
    }
    ctx.stroke();
  }

  // 5. Orthogonal fine topographic coordinate grid (every 128px)
  ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
  ctx.lineWidth = 1;
  for (let p = 0; p <= 1024; p += 128) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, 1024);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(1024, p);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

// Procedural Zenith Atmosphere Sky Cap Texture
function createSkyCapTexture(dustStormActive: boolean, variant: "natural" | "enhanced"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const isEnhanced = variant === "enhanced";
    const centerColor = isEnhanced ? "#1e293b" : dustStormActive ? "#7c3514" : "#98674d";
    const rimColor = isEnhanced ? "#334155" : dustStormActive ? "#9a441a" : "#b07c5e";

    const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, centerColor);
    grad.addColorStop(0.7, rimColor);
    grad.addColorStop(1, rimColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Procedural Nadir Ground Regolith Cap Texture
function createGroundCapTexture(dustStormActive: boolean, variant: "natural" | "enhanced"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const isEnhanced = variant === "enhanced";
    const centerColor = isEnhanced ? "#05080f" : dustStormActive ? "#1a0803" : "#341e13";
    const rimColor = isEnhanced ? "#090d16" : dustStormActive ? "#260e06" : "#4a2c1d";

    const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, centerColor);
    grad.addColorStop(0.75, rimColor);
    grad.addColorStop(1, rimColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Blend cylindrical 360° rover panorama photo with seamless Martian zenith sky dome and nadir
// Aligns Martian horizon strictly at 50% vertical center (Y = 0 eye level) to eliminate all barrel/bowl distortion
function blendMartianZenithAndNadir(
  sourceImg: HTMLImageElement,
  dustStormActive: boolean,
  variant: "natural" | "enhanced" = "natural"
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  const srcW = sourceImg.naturalWidth || 1920;
  const srcH = sourceImg.naturalHeight || 550;

  // In NASA rover mosaics, horizon is located at ~22% from top (78% ground, 22% sky/mountains)
  const horizonFraction = 0.22;
  const horizonInSource = srcH * horizonFraction;
  const groundInSource = srcH - horizonInSource;

  // Canvas height is sized so horizon is at exactly 50% (vertical center)
  const canvasH = Math.round(groundInSource * 2);
  const canvasW = srcW;
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const isEnhanced = variant === "enhanced";
  const zenithSkyColor = isEnhanced
    ? "#1e293b"
    : dustStormActive
    ? "#8c3b17"
    : "#b07c5e";
  const nadirColor = isEnhanced
    ? "#05080f"
    : dustStormActive
    ? "#1a0803"
    : "#341e13";

  // Draw source image with its horizon placed strictly at canvasH / 2
  const drawY = Math.round(canvasH / 2 - horizonInSource);
  ctx.drawImage(sourceImg, 0, drawY, canvasW, srcH);

  const imgData = ctx.getImageData(0, 0, canvasW, canvasH);
  const data = imgData.data;

  // 1. Sample average valid sky color
  let sampleSkyR = 0, sampleSkyG = 0, sampleSkyB = 0, sampleCount = 0;
  const sampleStartY = Math.max(0, drawY + Math.round(srcH * 0.05));
  const sampleEndY = Math.min(canvasH, drawY + Math.round(srcH * 0.25));
  for (let y = sampleStartY; y < sampleEndY; y += 4) {
    for (let x = 0; x < canvasW; x += 8) {
      const idx = (y * canvasW + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (r > 60 && g > 40 && r > b) {
        sampleSkyR += r;
        sampleSkyG += g;
        sampleSkyB += b;
        sampleCount++;
      }
    }
  }

  const avgSkyR = sampleCount > 30 ? Math.round(sampleSkyR / sampleCount) : (isEnhanced ? 40 : dustStormActive ? 140 : 205);
  const avgSkyG = sampleCount > 30 ? Math.round(sampleSkyG / sampleCount) : (isEnhanced ? 55 : dustStormActive ? 85 : 150);
  const avgSkyB = sampleCount > 30 ? Math.round(sampleSkyB / sampleCount) : (isEnhanced ? 80 : dustStormActive ? 45 : 120);

  // Atmospheric Zenith Sky tone
  const zenithR = isEnhanced ? 30 : dustStormActive ? 124 : 140;
  const zenithG = isEnhanced ? 41 : dustStormActive ? 53 : 95;
  const zenithB = isEnhanced ? 59 : dustStormActive ? 20 : 70;

  // 2. For each column x, scan down to find where valid sky begins, and smoothly fill all pixels above it
  const scanLimitY = Math.min(canvasH, drawY + Math.round(srcH * 0.45));
  for (let x = 0; x < canvasW; x++) {
    let firstSkyY = -1;
    let colSkyR = avgSkyR;
    let colSkyG = avgSkyG;
    let colSkyB = avgSkyB;

    for (let y = drawY; y < scanLimitY; y++) {
      const idx = (y * canvasW + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (r > 55 && g > 35 && r > b) {
        firstSkyY = y;
        const deeperY = Math.min(scanLimitY - 1, y + 4);
        const dIdx = (deeperY * canvasW + x) * 4;
        colSkyR = data[dIdx];
        colSkyG = data[dIdx + 1];
        colSkyB = data[dIdx + 2];
        break;
      }
    }

    const fillToY = firstSkyY >= 0 ? firstSkyY + 3 : drawY + 10;
    for (let y = 0; y < fillToY; y++) {
      const idx = (y * canvasW + x) * 4;
      const t = y / Math.max(1, fillToY);
      data[idx] = Math.round(zenithR + (colSkyR - zenithR) * t);
      data[idx + 1] = Math.round(zenithG + (colSkyG - zenithG) * t);
      data[idx + 2] = Math.round(zenithB + (colSkyB - zenithB) * t);
      data[idx + 3] = 255;
    }
  }

  // 3. Bottom Nadir & black cutout patch (bottom 50%)
  const groundR = isEnhanced ? 20 : 74;
  const groundG = isEnhanced ? 24 : 44;
  const groundB = isEnhanced ? 35 : 29;
  for (let y = Math.round(canvasH * 0.5); y < canvasH; y++) {
    for (let x = 0; x < canvasW; x++) {
      const idx = (y * canvasW + x) * 4;
      if (data[idx] < 20 && data[idx + 1] < 20 && data[idx + 2] < 20) {
        data[idx] = groundR;
        data[idx + 1] = groundG;
        data[idx + 2] = groundB;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

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

      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = "lowpass";
      this.filterNode.frequency.setValueAtTime(260, this.ctx.currentTime);
      this.filterNode.Q.setValueAtTime(2.2, this.ctx.currentTime);

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
    } catch (_e) {}
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

  // 3D Terrain Vertical Exaggeration (1.0x to 3.0x, default 1.5x)
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(1.5);

  // Active Collapsible Left Drawer ("none" = 100% full-bleed clean view)
  type ActiveDrawerType = "none" | "stations" | "raw_feed" | "info";
  const [activeDrawer, setActiveDrawer] = useState<ActiveDrawerType>("none");

  // Multi-Station Tour State
  const stationList = PANORAMA_STATIONS[siteKey];
  const initialStnParam = typeof window !== "undefined"
    ? parseInt(new URLSearchParams(window.location.search).get("stn") || new URLSearchParams(window.location.search).get("station") || "0", 10)
    : 0;
  const initialStnClamped = isNaN(initialStnParam) ? 0 : Math.max(0, Math.min(stationList.length - 1, initialStnParam));
  const [activeStationIdx, setActiveStationIdx] = useState<number>(initialStnClamped);
  const [stationJumpingNotice, setStationJumpingNotice] = useState<boolean>(false);
  const activeStationIdxRef = useRef<number>(initialStnClamped);
  useEffect(() => {
    activeStationIdxRef.current = activeStationIdx;
  }, [activeStationIdx]);

  useEffect(() => {
    setActiveStationIdx(initialStnClamped);
  }, [isJezero, initialStnClamped]);

  // Split-Screen Compare Mode (Natural vs Enhanced Geological Color)
  const [isCompareActive, setIsCompareActive] = useState<boolean>(false);
  const [compareSplitPercent, setCompareSplitPercent] = useState<number>(50);
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
  const [camPitch, setCamPitch] = useState<number>(-3);
  const [camFov, setCamFov] = useState<number>(52);
  const [camElevation, setCamElevation] = useState<number>(-4120);
  const [reticleCoords, setReticleCoords] = useState<{ x: number; z: number; elev: number } | null>(null);
  const [teleportingNotice, setTeleportingNotice] = useState<boolean>(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const panoMeshNaturalRef = useRef<THREE.Group | null>(null);
  const panoMeshEnhancedRef = useRef<THREE.Group | null>(null);
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
  const pitchRef = useRef<number>((-3 * Math.PI) / 180);
  const fovRef = useRef<number>(52);

  // Load and blend cylindrical 360° station panorama textures (1:1 Natural Aspect Ratio)
  const loadStationPanorama = useCallback(
    (stationOrUrl?: number | string) => {
      const site = isJezero ? "jezero" : "gale";
      const customUrl =
        typeof stationOrUrl === "string"
          ? stationOrUrl
          : waypoint?.panoramaUrl || (waypoint as any)?.customPanoramaUrl;

      const naturalSrc = customUrl
        ? customUrl
        : `/api/panorama-proxy?site=${site}&station=${typeof stationOrUrl === "number" ? stationOrUrl : activeStationIdxRef.current}&variant=natural`;

      // 1. Natural Color Texture
      const naturalImg = new Image();
      naturalImg.crossOrigin = "anonymous";
      naturalImg.src = naturalSrc;
      naturalImg.onload = () => {
        try {
          const blendedTex = blendMartianZenithAndNadir(naturalImg, dustStormActive, "natural");
          if (panoMeshNaturalRef.current) {
            const cyl = panoMeshNaturalRef.current.getObjectByName("pano_cylinder") as THREE.Mesh | undefined;
            if (cyl) {
              const mat = cyl.material as THREE.MeshBasicMaterial;
              if (mat.map) mat.map.dispose();
              mat.map = blendedTex;
              mat.needsUpdate = true;
            }
            const sky = panoMeshNaturalRef.current.getObjectByName("pano_sky_cap") as THREE.Mesh | undefined;
            const ground = panoMeshNaturalRef.current.getObjectByName("pano_ground_cap") as THREE.Mesh | undefined;
            if (cyl && sky && ground && naturalImg.naturalWidth && naturalImg.naturalHeight) {
              const canvasAspect = naturalImg.naturalWidth / ((naturalImg.naturalHeight * 0.78) * 2);
              const targetH = Math.max(200, (2 * Math.PI * 60) / Math.max(1.8, Math.min(4.5, canvasAspect)));
              cyl.scale.set(-1, targetH / 200, 1);
              sky.position.y = targetH / 2;
              ground.position.y = -targetH / 2;
            }
          }
        } catch (_err) {}
      };

      // 2. Enhanced Geological Color Texture
      const enhancedImg = new Image();
      enhancedImg.crossOrigin = "anonymous";
      enhancedImg.src = customUrl
        ? customUrl
        : `/api/panorama-proxy?site=${site}&station=${typeof stationOrUrl === "number" ? stationOrUrl : activeStationIdxRef.current}&variant=enhanced`;
      enhancedImg.onload = () => {
        try {
          const blendedTex = blendMartianZenithAndNadir(enhancedImg, dustStormActive, "enhanced");
          if (panoMeshEnhancedRef.current) {
            const cyl = panoMeshEnhancedRef.current.getObjectByName("pano_cylinder") as THREE.Mesh | undefined;
            if (cyl) {
              const mat = cyl.material as THREE.MeshBasicMaterial;
              if (mat.map) mat.map.dispose();
              mat.map = blendedTex;
              mat.needsUpdate = true;
            }
            const sky = panoMeshEnhancedRef.current.getObjectByName("pano_sky_cap") as THREE.Mesh | undefined;
            const ground = panoMeshEnhancedRef.current.getObjectByName("pano_ground_cap") as THREE.Mesh | undefined;
            if (cyl && sky && ground && enhancedImg.naturalWidth && enhancedImg.naturalHeight) {
              const canvasAspect = enhancedImg.naturalWidth / ((enhancedImg.naturalHeight * 0.78) * 2);
              const targetH = Math.max(200, (2 * Math.PI * 60) / Math.max(1.8, Math.min(4.5, canvasAspect)));
              cyl.scale.set(-1, targetH / 200, 1);
              sky.position.y = targetH / 2;
              ground.position.y = -targetH / 2;
            }
          }
        } catch (_err) {}
      };
    },
    [isJezero, dustStormActive, waypoint]
  );

  // Handle station jump
  const handleSelectStation = useCallback(
    (idx: number) => {
      const list = PANORAMA_STATIONS[siteKey];
      const clamped = Math.max(0, Math.min(list.length - 1, idx));
      setActiveStationIdx(clamped);
      const stn = list[clamped];
      if (stn?.headingOffsetDeg !== undefined) {
        yawRef.current = (stn.headingOffsetDeg * Math.PI) / 180;
        setCamAzimuth(Math.round(stn.headingOffsetDeg));
      }
      pitchRef.current = (-3 * Math.PI) / 180;
      setCamPitch(-3);
      setStationJumpingNotice(true);
      setTimeout(() => setStationJumpingNotice(false), 1200);
      loadStationPanorama(clamped);
    },
    [siteKey, loadStationPanorama]
  );

  // Update 3D Terrain Vertical Exaggeration Scale
  useEffect(() => {
    if (terrainMeshRef.current) {
      terrainMeshRef.current.scale.set(1, verticalExaggeration / 1.5, 1);
    }
    if (wireframeMeshRef.current) {
      wireframeMeshRef.current.scale.set(1, verticalExaggeration / 1.5, 1);
    }
  }, [verticalExaggeration]);

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
    const currentStn = stationList[activeStationIdxRef.current] || stationList[0];
    yawRef.current = (currentStn.headingOffsetDeg * Math.PI) / 180;
    pitchRef.current = (-3 * Math.PI) / 180;
    fovRef.current = 52;
    if (cameraRef.current) {
      cameraRef.current.fov = 52;
      cameraRef.current.updateProjectionMatrix();
    }
    setCamAzimuth(Math.round(currentStn.headingOffsetDeg));
    setCamPitch(-3);
    setCamFov(52);
  }, [wpId, stationList]);

  // Three.js Scene Setup & Render Loop
  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || !waypoint) return;

    const width = host.clientWidth || window.innerWidth;
    const height = host.clientHeight || window.innerHeight;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const skyClearColor = dustStormActive ? 0x240e06 : 0xb07c5e;
    const fogColor = dustStormActive ? 0x6b2e10 : 0xb07c5e;
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

    // 5. 360° Cylindrical Panorama Groups (Natural & Enhanced)
    // Radius 60 matches the natural human ground scale on Mars.
    // The cylinder geometry maintains 100% flat horizon with zero bowl curvature.
    const cylGeom = new THREE.CylinderGeometry(60, 60, 200, 64, 1, true);
    cylGeom.scale(-1, 1, 1);

    const skyCapGeom = new THREE.CircleGeometry(60, 64);
    skyCapGeom.rotateX(Math.PI / 2);

    const groundCapGeom = new THREE.CircleGeometry(60, 64);
    groundCapGeom.rotateX(-Math.PI / 2);

    // Natural Color Panorama Group
    const panoGroupNatural = new THREE.Group();
    panoGroupNatural.name = "rover_360_natural";
    panoGroupNatural.position.copy(camPosRef.current);

    const panoMatNatural = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const cylMeshNatural = new THREE.Mesh(cylGeom, panoMatNatural);
    cylMeshNatural.name = "pano_cylinder";
    panoGroupNatural.add(cylMeshNatural);

    const skyTexNatural = createSkyCapTexture(dustStormActive, "natural");
    const skyMatNatural = new THREE.MeshBasicMaterial({
      map: skyTexNatural,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const skyMeshNatural = new THREE.Mesh(skyCapGeom, skyMatNatural);
    skyMeshNatural.name = "pano_sky_cap";
    skyMeshNatural.position.y = 100;
    panoGroupNatural.add(skyMeshNatural);

    const groundTexNatural = createGroundCapTexture(dustStormActive, "natural");
    const groundMatNatural = new THREE.MeshBasicMaterial({
      map: groundTexNatural,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const groundMeshNatural = new THREE.Mesh(groundCapGeom, groundMatNatural);
    groundMeshNatural.name = "pano_ground_cap";
    groundMeshNatural.position.y = -100;
    panoGroupNatural.add(groundMeshNatural);

    scene.add(panoGroupNatural);
    panoMeshNaturalRef.current = panoGroupNatural;

    // Enhanced Geological False-Color Panorama Group
    const panoGroupEnhanced = new THREE.Group();
    panoGroupEnhanced.name = "rover_360_enhanced";
    panoGroupEnhanced.position.copy(camPosRef.current);
    panoGroupEnhanced.visible = false;

    const panoMatEnhanced = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const cylMeshEnhanced = new THREE.Mesh(cylGeom, panoMatEnhanced);
    cylMeshEnhanced.name = "pano_cylinder";
    panoGroupEnhanced.add(cylMeshEnhanced);

    const skyTexEnhanced = createSkyCapTexture(dustStormActive, "enhanced");
    const skyMatEnhanced = new THREE.MeshBasicMaterial({
      map: skyTexEnhanced,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const skyMeshEnhanced = new THREE.Mesh(skyCapGeom, skyMatEnhanced);
    skyMeshEnhanced.name = "pano_sky_cap";
    skyMeshEnhanced.position.y = 100;
    panoGroupEnhanced.add(skyMeshEnhanced);

    const groundTexEnhanced = createGroundCapTexture(dustStormActive, "enhanced");
    const groundMatEnhanced = new THREE.MeshBasicMaterial({
      map: groundTexEnhanced,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const groundMeshEnhanced = new THREE.Mesh(groundCapGeom, groundMatEnhanced);
    groundMeshEnhanced.name = "pano_ground_cap";
    groundMeshEnhanced.position.y = -100;
    panoGroupEnhanced.add(groundMeshEnhanced);

    scene.add(panoGroupEnhanced);
    panoMeshEnhancedRef.current = panoGroupEnhanced;

    // Load initial panorama textures
    const initialSource =
      waypoint?.panoramaUrl || (waypoint as any)?.customPanoramaUrl || activeStationIdxRef.current;
    loadStationPanorama(initialSource);

    if (waypoint?.headingOffsetDeg !== undefined) {
      yawRef.current = (waypoint.headingOffsetDeg * Math.PI) / 180;
      setCamAzimuth(Math.round(waypoint.headingOffsetDeg));
    }

    // 6. 3D Terrain Geometry with Sharp MOLA Contour Relief Texture (100% Free of Camo Oranye)
    const terrainGeom = new THREE.PlaneGeometry(120, 120, 80, 80);
    terrainGeom.rotateX(-Math.PI / 2);
    const posAttr = terrainGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      posAttr.setY(i, getTerrainHeight(vx, vz, wpId));
    }
    terrainGeom.computeVertexNormals();

    const reliefContourTex = createMartianReliefContourTexture();
    const terrainMaterial = new THREE.MeshStandardMaterial({
      map: reliefContourTex,
      roughness: 0.88,
      metalness: 0.05,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(terrainGeom, terrainMaterial);
    terrainMesh.name = "martian_terrain";
    terrainMesh.scale.set(1, 1.0, 1);
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
    wireframeMesh.scale.set(1, 1.0, 1);
    wireframeMesh.visible = false;
    scene.add(wireframeMesh);
    wireframeMeshRef.current = wireframeMesh;

    // 7. Ground-Projected Targeting Reticle
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

    // 8. Ground-Projected Circular Station Hotspots Group
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

      // Rotate outer ground hotspot rings
      groundHotspotsGroup.traverse((obj) => {
        if (obj.name === "ground_hotspot_ring_outer") {
          obj.rotation.z = elapsedTime * 0.45;
        }
      });

      // Hotspots visibility: hide automatically when user looks up into the sky (> +5° pitch)
      const isLookingAtGround = pitchRef.current <= (5 * Math.PI) / 180;
      groundHotspotsGroup.visible =
        viewModeRef.current === "panorama_360" && isLookingAtGround;

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

      // Rendering: Split Compare vs VR Stereo (True 360 Panorama) vs Standard
      if (viewModeRef.current === "panorama_360" && isCompareActiveRef.current) {
        const sw = renderer.domElement.clientWidth;
        const sh = renderer.domElement.clientHeight;
        const splitX = Math.round((compareSplitPercent / 100) * sw);

        renderer.setScissorTest(true);

        // Left Viewport: Natural Color
        renderer.setScissor(0, 0, splitX, sh);
        renderer.setViewport(0, 0, sw, sh);
        if (panoMeshNaturalRef.current) panoMeshNaturalRef.current.visible = true;
        if (panoMeshEnhancedRef.current) panoMeshEnhancedRef.current.visible = false;
        renderer.render(scene, camera);

        // Right Viewport: Enhanced Geological Color
        renderer.setScissor(splitX, 0, sw - splitX, sh);
        renderer.setViewport(0, 0, sw, sh);
        if (panoMeshNaturalRef.current) panoMeshNaturalRef.current.visible = false;
        if (panoMeshEnhancedRef.current) panoMeshEnhancedRef.current.visible = true;
        renderer.render(scene, camera);

        renderer.setScissorTest(false);
      } else if (viewModeRef.current === "vr_stereo") {
        // VR Stereoscopic Mode: renders True Rover 360° Panorama
        const sw = renderer.domElement.clientWidth;
        const sh = renderer.domElement.clientHeight;
        const halfW = sw / 2;

        if (panoMeshNaturalRef.current) panoMeshNaturalRef.current.visible = true;
        if (panoMeshEnhancedRef.current) panoMeshEnhancedRef.current.visible = false;

        renderer.setScissorTest(true);

        // Left Eye
        renderer.setScissor(0, 0, halfW, sh);
        renderer.setViewport(0, 0, halfW, sh);
        camera.aspect = halfW / sh;
        camera.updateProjectionMatrix();
        camera.position.x = camPosRef.current.x - 0.032;
        renderer.render(scene, camera);

        // Right Eye
        renderer.setScissor(halfW, 0, halfW, sh);
        renderer.setViewport(halfW, 0, halfW, sh);
        camera.aspect = halfW / sh;
        camera.updateProjectionMatrix();
        camera.position.x = camPosRef.current.x + 0.032;
        renderer.render(scene, camera);

        camera.position.copy(camPosRef.current);
        renderer.setScissorTest(false);
      } else {
        if (viewModeRef.current === "panorama_360") {
          if (panoMeshNaturalRef.current) panoMeshNaturalRef.current.visible = true;
          if (panoMeshEnhancedRef.current) panoMeshEnhancedRef.current.visible = false;
        }
        renderer.render(scene, camera);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      cylGeom.dispose();
      skyCapGeom.dispose();
      groundCapGeom.dispose();
      panoMatNatural.dispose();
      panoMatEnhanced.dispose();
      skyMatNatural.dispose();
      groundMatNatural.dispose();
      skyMatEnhanced.dispose();
      groundMatEnhanced.dispose();
      skyTexNatural.dispose();
      groundTexNatural.dispose();
      skyTexEnhanced.dispose();
      groundTexEnhanced.dispose();
      terrainGeom.dispose();
      terrainMaterial.dispose();
      reliefContourTex.dispose();
      wireframeGeom.dispose();
      wireframeMat.dispose();
      reticleGeom.dispose();
      reticleMat.dispose();
      if (host) {
        host.replaceChildren();
      }
    };
  }, [waypoint, wpId, baseElevation, dustStormActive, compareSplitPercent]);

  // Re-build Ground Hotspots: Positioned firmly at ground level y = -18, radius = 34
  useEffect(() => {
    const group = groundHotspotsGroupRef.current;
    if (!group) return;

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

    // 1. Nadir Hotspot Ring Directly Below Rover on Ground (y = -18)
    const nadirRingGroup = new THREE.Group();
    nadirRingGroup.position.set(0, -18.0, 0);

    const nadirRingGeom = new THREE.RingGeometry(2.2, 2.8, 32);
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
    nadirSprite.position.set(0, 1.8, 0);
    nadirRingGroup.add(nadirSprite);
    group.add(nadirRingGroup);

    // 2. Projected Ground Hotspot Rings for Neighboring Stations (y = -18, groundDist = 34)
    neighbors.forEach((nbr) => {
      const rad = (nbr.azimuthDeg * Math.PI) / 180;
      const groundDist = 34.0;
      const gx = Math.sin(rad) * groundDist;
      const gz = -Math.cos(rad) * groundDist;
      const gy = -18.0;

      const hotspotGroup = new THREE.Group();
      hotspotGroup.position.set(gx, gy, gz);

      const outerRingGeom = new THREE.RingGeometry(2.0, 2.6, 32);
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

      const innerRingGeom = new THREE.RingGeometry(0.7, 1.1, 24);
      innerRingGeom.rotateX(-Math.PI / 2);
      const innerRingMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      });
      const innerRing = new THREE.Mesh(innerRingGeom, innerRingMat);
      hotspotGroup.add(innerRing);

      const labelText = `[ JUMP -> SOL ${nbr.sol}: STN-0${nbr.targetStation + 1} (~${nbr.distanceM}m) ]`;
      const labelSprite = createTextSprite(labelText, "#0b0f17", "#38bdf8", "#0284c7");
      labelSprite.position.set(0, 2.2, 0);
      hotspotGroup.add(labelSprite);

      // Hit cylinder target
      const hitGeom = new THREE.CylinderGeometry(3.6, 3.6, 5.0, 16);
      hitGeom.translate(0, 2.5, 0);
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

    if (viewMode === "panorama_360" || viewMode === "vr_stereo") {
      panoMeshNaturalRef.current.visible = true;
      terrainMeshRef.current.visible = false;
      wireframeMeshRef.current.visible = false;
      if (groundGroup) groundGroup.visible = viewMode === "panorama_360";
    } else if (viewMode === "mesh") {
      panoMeshNaturalRef.current.visible = false;
      if (panoMeshEnhancedRef.current) panoMeshEnhancedRef.current.visible = false;
      (terrainMeshRef.current.material as THREE.MeshStandardMaterial).visible = false;
      terrainMeshRef.current.visible = true;
      wireframeMeshRef.current.visible = true;
      if (groundGroup) groundGroup.visible = false;
    } else {
      // 3D SURFACE mode
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

      const sens = 0.003;
      yawRef.current = pointerStartRef.current.startYaw - dx * sens;
      // Realistic tactical rover pitch bounds: -26° (looking down at tracks) to +20° (looking up at rim)
      const minPitch = (-26 * Math.PI) / 180;
      const maxPitch = (20 * Math.PI) / 180;
      pitchRef.current = Math.max(
        minPitch,
        Math.min(maxPitch, pointerStartRef.current.startPitch + dy * sens)
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

    if (viewMode !== "panorama_360" && viewMode !== "vr_stereo" && terrainMeshRef.current && cameraRef.current) {
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

      if (viewModeRef.current !== "panorama_360" && viewModeRef.current !== "vr_stereo" && terrainMeshRef.current) {
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
    const delta = e.deltaY * 0.04;
    // Keep FOV between 35° (optical telephoto) and 65° (natural human vista, zero fish-eye barrel distortion)
    const newFov = Math.max(35, Math.min(65, fovRef.current + delta));
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
      {/* 1. HUD TOP HEADER (h-9, Full-Width) */}
      <header className="h-9 bg-[#0b0f17]/95 border-b border-slate-800 px-3 flex items-center justify-between shrink-0 font-mono text-xs z-30">
        <div className="flex items-center gap-3 overflow-hidden">
          <MarsForAllBadge size={20} showSubtext={false} />
          <div className="flex items-center gap-2 text-slate-300 truncate text-[11px]">
            <span className="font-bold text-amber-400 whitespace-nowrap">
              {isJezero ? "MARSFORALL // JEZERO" : "MARSFORALL"}
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold whitespace-nowrap">
              {waypoint?.has360Pov || waypoint?.panoramaUrl
                ? `${waypoint.name} [360° POV]`
                : `STN-0${activeStationIdx + 1}: ${currentStation.title} (SOL ${currentStation.sol})`}
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
        {/* COLLAPSIBLE LEFT ICON RAIL (w-11 = 44px) */}
        <nav className="w-11 h-full bg-[#0b0f17]/95 border-r border-slate-800 flex flex-col items-center py-2 z-30 shrink-0 select-none">
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

          {/* Tool 4: Split-Screen Compare Mode */}
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

          {/* Tool 7: Mission Info */}
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

        {/* COLLAPSIBLE LEFT DRAWER */}
        {activeDrawer !== "none" && (
          <aside className="absolute left-11 top-0 bottom-0 w-80 bg-[#0b0f17]/95 border-r border-slate-800 z-30 shadow-2xl flex flex-col font-mono text-xs">
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

              {/* MISSION INFO DRAWER */}
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
          <div ref={canvasHostRef} className="absolute inset-0 w-full h-full" />

          {/* 3D Vertical Exaggeration Slider Control (Surface & Mesh Modes) */}
          {(viewMode === "surface" || viewMode === "mesh") && (
            <div className="absolute top-4 right-4 z-20 bg-[#0b0f17]/95 border border-slate-700 px-3 py-1.5 font-mono text-[10px] flex items-center gap-2.5 shadow-xl select-none">
              <span className="text-amber-400 font-bold whitespace-nowrap">{t("verticalExaggeration")}:</span>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={verticalExaggeration}
                onChange={(e) => setVerticalExaggeration(parseFloat(e.target.value))}
                className="w-24 accent-amber-500 cursor-pointer"
              />
              <span className="text-slate-200 font-bold tabular-nums whitespace-nowrap w-8 text-right">
                {verticalExaggeration.toFixed(1)}x
              </span>
            </div>
          )}

          {/* Interactive Split-Screen Compare Overlay */}
          {viewMode === "panorama_360" && isCompareActive && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="absolute top-4 left-4 bg-[#0b0f17]/90 border border-slate-700 px-3 py-1 text-[10px] font-bold text-amber-300">
                [ ◀ {t("compareNatural")} ]
              </div>
              <div className="absolute top-4 right-4 bg-[#0b0f17]/90 border border-slate-700 px-3 py-1 text-[10px] font-bold text-cyan-300">
                [ {t("compareEnhanced")} ▶ ]
              </div>
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

          {/* Quick Station Navigation Floating Buttons */}
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

      {/* 4. BOTTOM TELEMETRY BAR (Simetris h-9) */}
      <footer className="h-9 bg-[#0b0f17] border-t border-slate-800 px-3 flex items-center justify-between shrink-0 font-mono text-xs z-30">
        <div className="flex items-center gap-3 text-slate-300 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">{t("evaCamElev")}</span>
            <span className="text-amber-400 font-bold tabular-nums">{camElevation} m</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">{t("reticleTgt")}</span>
            {viewMode === "panorama_360" || viewMode === "vr_stereo" ? (
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

        {/* 360° Tour Station Selector Pills */}
        {(viewMode === "panorama_360" || viewMode === "vr_stereo") && (
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
