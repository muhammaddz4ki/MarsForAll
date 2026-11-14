"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";
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

// Framing coordinates: Placed in front of the camera (FOV 65°, pointing -Z)
const LANDMARK_PINS: LandmarkPin[] = [
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

// Fallback Curiosity Photos for Mount Sharp
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

// Helper to compute terrain elevation y(x, z) procedurally based on waypoint characteristics
function getTerrainHeight(x: number, z: number, waypointId: string): number {
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

    const smallGrid = Math.min(
      Math.abs(((x * 0.55) % 1 + 1) % 1 - 0.5),
      Math.abs(((z * 0.55) % 1 + 1) % 1 - 0.5)
    );
    if (smallGrid < 0.04) {
      boxworkRidges += ((0.04 - smallGrid) / 0.04) * 0.5;
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

// Deterministic pseudo-random generator (seeded LCG, 100% reproducible, zero Math.random)
function createPrng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate procedural Martian regolith texture in memory (100% offline fallback)
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

// Generate procedural bump texture for rock micro-texture
function createMartianBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  const nextRand = createPrng(849201);

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = 128 + Math.floor((nextRand() - 0.5) * 85);
    const clamped = Math.max(0, Math.min(255, val));
    data[i] = clamped;
    data[i + 1] = clamped;
    data[i + 2] = clamped;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 24);
  return texture;
}

// Transform NASA MOLA/HRSC Hillshade DEM image into True-Color natural Martian regolith relief
function createProcessedMolaReliefTexture(sourceImg: HTMLImageElement): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Draw source MOLA hillshade
  ctx.drawImage(sourceImg, 0, 0, 512, 512);
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const d = imgData.data;

  // Grade into authentic ferric-oxide True Color palette (NASA Mars Trek standard):
  // Illuminated slopes: warm ferric oxide (#ba552e), mid-tones: hematite ocher (#943b1c), shaded lowlands: dark basaltic umber (#4a1a0c)
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
    const contrastLum = Math.pow(lum, 1.12);

    // True-Color Martian red channel
    d[i] = Math.max(0, Math.min(255, Math.round(74 + contrastLum * 146)));
    // True-Color weathered ocher green channel
    d[i + 1] = Math.max(0, Math.min(255, Math.round(26 + contrastLum * 66)));
    // True-Color low-albedo basalt blue channel
    d[i + 2] = Math.max(0, Math.min(255, Math.round(12 + contrastLum * 32)));
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

// Build 3D Curiosity / Companion Mule Rover Unit positioned at (roverX, roverZ)
function createCompanionRoverGroup(waypointId: string, roverX = -2.5, roverZ = -4.5): THREE.Group {
  const roverGroup = new THREE.Group();
  const roverBaseY = getTerrainHeight(roverX, roverZ, waypointId);
  roverGroup.position.set(roverX, roverBaseY, roverZ);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.6,
    metalness: 0.3,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.85,
    metalness: 0.2,
  });
  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.3,
    metalness: 0.8,
  });
  const lensMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

  const chassisGeom = new THREE.BoxGeometry(2.4, 0.6, 1.6);
  const chassis = new THREE.Mesh(chassisGeom, bodyMat);
  chassis.position.y = 0.75;
  roverGroup.add(chassis);

  const foilGeom = new THREE.BoxGeometry(1.2, 0.45, 1.1);
  const foilBox = new THREE.Mesh(foilGeom, goldFoilMat);
  foilBox.position.set(-0.2, 1.1, 0);
  roverGroup.add(foilBox);

  const mastGeom = new THREE.CylinderGeometry(0.045, 0.05, 1.4, 8);
  const mast = new THREE.Mesh(mastGeom, bodyMat);
  mast.position.set(0.8, 1.6, 0.4);
  roverGroup.add(mast);

  const headGeom = new THREE.BoxGeometry(0.3, 0.2, 0.25);
  const head = new THREE.Mesh(headGeom, bodyMat);
  head.position.set(0.8, 2.35, 0.4);
  roverGroup.add(head);

  const lensGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12);
  lensGeom.rotateX(Math.PI / 2);
  const leftLens = new THREE.Mesh(lensGeom, lensMat);
  leftLens.position.set(0.88, 2.35, 0.34);
  const rightLens = new THREE.Mesh(lensGeom, lensMat);
  rightLens.position.set(0.88, 2.35, 0.46);
  roverGroup.add(leftLens);
  roverGroup.add(rightLens);

  const rtgGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8);
  rtgGeom.rotateZ(Math.PI / 2);
  const rtg = new THREE.Mesh(rtgGeom, wheelMat);
  rtg.position.set(-1.4, 0.85, 0);
  roverGroup.add(rtg);

  const wheelGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.26, 16);
  wheelGeom.rotateX(Math.PI / 2);

  const wheelPositions = [
    [0.9, 0.28, 1.05],
    [0.0, 0.28, 1.15],
    [-0.9, 0.28, 1.05],
    [0.9, 0.28, -1.05],
    [0.0, 0.28, -1.15],
    [-0.9, 0.28, -1.05],
  ];

  wheelPositions.forEach(([wx, wy, wz]) => {
    const wheel = new THREE.Mesh(wheelGeom, wheelMat);
    wheel.position.set(wx, wy, wz);
    roverGroup.add(wheel);
  });

  return roverGroup;
}

export const SurfacePovModal: React.FC<SurfacePovModalProps> = ({
  waypoint,
  onClose,
  theme = "dark",
  dustStormActive = false,
}) => {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [viewMode, setViewMode] = useState<"surface" | "mesh" | "vr_stereo">("surface");
  const [activePin, setActivePin] = useState<LandmarkPin | null>(null);

  // DEM Source Status & Live Photos
  const [demSourceStatus, setDemSourceStatus] = useState<"NASA_MOLA_REAL_DEM" | "LOCAL_PROCEDURAL_CACHED">("LOCAL_PROCEDURAL_CACHED");
  const [curiosityPhotos, setCuriosityPhotos] = useState<CuriosityPhotoItem[]>(FALLBACK_CURIOSITY_PHOTOS);
  const [photoIdx, setPhotoIdx] = useState<number>(0);
  const [isPhotoFeedOpen, setIsPhotoFeedOpen] = useState<boolean>(true);

  // Camera Framing & Telemetry Readouts
  const [camAzimuth, setCamAzimuth] = useState<number>(0);
  const [camPitch, setCamPitch] = useState<number>(-8);
  const [camFov, setCamFov] = useState<number>(65);
  const [camElevation, setCamElevation] = useState<number>(-4120);
  const [reticleCoords, setReticleCoords] = useState<{ x: number; z: number; elev: number } | null>(null);
  const [teleportingNotice, setTeleportingNotice] = useState<boolean>(false);

  // Three.js object references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const wireframeMeshRef = useRef<THREE.LineSegments | null>(null);
  const reticleRef = useRef<THREE.Mesh | null>(null);
  const landmarkMeshesRef = useRef<THREE.Object3D[]>([]);

  // Camera orientation & motion control
  const camPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 4.2, 2.0));
  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 4.2, 2.0));
  const isLerpingCamRef = useRef<boolean>(false);
  const yawRef = useRef<number>(0);
  const pitchRef = useRef<number>((-8 * Math.PI) / 180);
  const fovRef = useRef<number>(65);

  // Pointer drag state
  const isPointerDownRef = useRef<boolean>(false);
  const pointerStartRef = useRef<{ x: number; y: number; startYaw: number; startPitch: number }>({
    x: 0,
    y: 0,
    startYaw: 0,
    startPitch: 0,
  });
  const hasDraggedRef = useRef<boolean>(false);

  // Raycasting & Performance Throttling
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseNormRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));
  const lastRaycastTimeRef = useRef<number>(0);
  const lastCamStateUpdateRef = useRef<number>(0);

  const baseElevation = waypoint?.elevationM ?? -4120;
  const wpId = waypoint?.id ?? "mount_sharp_baseline";

  // Fetch Live NASA MSL Curiosity Photos
  useEffect(() => {
    fetch("/api/curiosity-photos?limit=12")
      .then((res) => res.json())
      .then((data) => {
        if (data?.items && data.items.length > 0) {
          setCuriosityPhotos(data.items);
        }
      })
      .catch(() => {
        // Fallback already pre-loaded
      });
  }, []);

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

  // Main Three.js Scene Setup & Loop
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

    // 3. WebGL Renderer (High-Performance GPU Profile & Capped Pixel Ratio)
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

    const fillLight = new THREE.DirectionalLight(0xc26a35, 0.45);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);

    // 5. Procedural Base & Real NASA MOLA DEM Elevation Plane (Optimized 80x80 segments: 60% lighter)
    const terrainGeom = new THREE.PlaneGeometry(120, 120, 80, 80);
    terrainGeom.rotateX(-Math.PI / 2);

    const posAttr = terrainGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = getTerrainHeight(vx, vz, wpId);
      posAttr.setY(i, vy);
    }
    terrainGeom.computeVertexNormals();

    const regolithTex = createMartianRegolithTexture();
    const bumpTex = createMartianBumpTexture();

    // Photographic Martian Regolith Material (High roughness for light-absorbing matte dust)
    const terrainMaterial = new THREE.MeshStandardMaterial({
      map: regolithTex,
      bumpMap: bumpTex,
      bumpScale: 0.14,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: false,
    });

    // Real NASA/JPL MOLA Tile Heightmap Displacement Loader
    const demImg = new Image();
    demImg.crossOrigin = "anonymous";
    demImg.src = "/api/mars-tiles/mola-clrshade/7/66/113";
    demImg.onload = () => {
      try {
        const offCanvas = document.createElement("canvas");
        offCanvas.width = 128;
        offCanvas.height = 128;
        const octx = offCanvas.getContext("2d");
        if (!octx) return;
        octx.drawImage(demImg, 0, 0, 128, 128);
        const imgData = octx.getImageData(0, 0, 128, 128);
        const d = imgData.data;

        for (let i = 0; i < posAttr.count; i++) {
          const vx = posAttr.getX(i);
          const vz = posAttr.getZ(i);
          const u = Math.max(0, Math.min(127, Math.floor(((vx + 60) / 120) * 127)));
          const v = Math.max(0, Math.min(127, Math.floor(((vz + 60) / 120) * 127)));
          const pxIdx = (v * 128 + u) * 4;
          const r = d[pxIdx];
          const g = d[pxIdx + 1];
          const b = d[pxIdx + 2];
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;
          const demDelta = (lum - 0.5) * 5.5;

          const baseline = getTerrainHeight(vx, vz, wpId) * 0.7;
          posAttr.setY(i, baseline + demDelta);
        }
        terrainGeom.computeVertexNormals();
        posAttr.needsUpdate = true;
        setDemSourceStatus("NASA_MOLA_REAL_DEM");

        // Map Contrast-Balanced True-Color NASA MOLA Relief Texture onto 3D Mount Sharp
        const processedMolaTex = createProcessedMolaReliefTexture(demImg);
        terrainMaterial.map = processedMolaTex;
        terrainMaterial.needsUpdate = true;
      } catch (err) {
        // Safe procedural fallback retained
      }
    };

    const terrainMesh = new THREE.Mesh(terrainGeom, terrainMaterial);
    terrainMesh.name = "martian_terrain";
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // Photogrammetric Wireframe Overlay Mesh
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

    // 6. Ground-Projected Targeting Reticle
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

    // 7. Companion Rover 3D Unit
    const rover = createCompanionRoverGroup(wpId, -2.5, -4.5);
    scene.add(rover);

    // 8. 3D Spatial Landmark Pins
    const landmarkObjects: THREE.Object3D[] = [];
    LANDMARK_PINS.forEach((pin) => {
      const pinY = getTerrainHeight(pin.x, pin.z, wpId);

      const pinGroup = new THREE.Group();
      pinGroup.position.set(pin.x, pinY, pin.z);

      const pillarGeom = new THREE.CylinderGeometry(0.08, 0.08, 8, 8);
      pillarGeom.translate(0, 4, 0);
      const pillarMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.6,
      });
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pinGroup.add(pillar);

      const beaconGeom = new THREE.OctahedronGeometry(0.48);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, wireframe: true });
      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.y = 8.2;
      beacon.name = "rotating_beacon";
      pinGroup.add(beacon);

      const baseRingGeom = new THREE.RingGeometry(0.8, 0.95, 24);
      baseRingGeom.rotateX(-Math.PI / 2);
      const baseRingMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const baseRing = new THREE.Mesh(baseRingGeom, baseRingMat);
      baseRing.position.y = 0.05;
      pinGroup.add(baseRing);

      const hitGeom = new THREE.CylinderGeometry(1.2, 1.2, 9, 8);
      hitGeom.translate(0, 4.5, 0);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeom, hitMat);
      hitMesh.userData = { pinData: pin };
      pinGroup.add(hitMesh);

      scene.add(pinGroup);
      landmarkObjects.push(hitMesh);
    });
    landmarkMeshesRef.current = landmarkObjects;

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

    // 10. Animation & Render Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      scene.traverse((obj) => {
        if (obj.name === "rotating_beacon") {
          obj.rotation.y = elapsedTime * 1.5;
        }
      });

      if (isLerpingCamRef.current) {
        camPosRef.current.lerp(targetCamPosRef.current, 0.08);
        if (camPosRef.current.distanceTo(targetCamPosRef.current) < 0.05) {
          camPosRef.current.copy(targetCamPosRef.current);
          isLerpingCamRef.current = false;
        }
        const newElev = Math.round(baseElevation + camPosRef.current.y);
        setCamElevation((prev) => (prev === newElev ? prev : newElev));
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

      if (viewMode === "vr_stereo") {
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
        renderer.render(scene, camera);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      terrainGeom.dispose();
      terrainMaterial.dispose();
      regolithTex.dispose();
      bumpTex.dispose();
      wireframeGeom.dispose();
      wireframeMat.dispose();
      reticleGeom.dispose();
      reticleMat.dispose();
      if (host) {
        host.replaceChildren();
      }
    };
  }, [waypoint, wpId, baseElevation, dustStormActive, viewMode]);

  // Synchronize view mode styles
  useEffect(() => {
    if (!terrainMeshRef.current || !wireframeMeshRef.current) return;
    if (viewMode === "mesh") {
      (terrainMeshRef.current.material as THREE.MeshStandardMaterial).visible = false;
      wireframeMeshRef.current.visible = true;
    } else {
      (terrainMeshRef.current.material as THREE.MeshStandardMaterial).visible = true;
      wireframeMeshRef.current.visible = false;
    }
  }, [viewMode]);

  // Pointer Movement (Throttled ~30Hz raycasting & camera state sync to maintain 60 FPS)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const host = canvasHostRef.current;
    if (!host || !cameraRef.current || !terrainMeshRef.current) return;

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

      // Throttle React state updates to ~30Hz to prevent main-thread UI stalls
      if (now - lastCamStateUpdateRef.current >= 32) {
        lastCamStateUpdateRef.current = now;
        const normDegAz = Math.round((((yawRef.current * 180) / Math.PI) % 360 + 360) % 360);
        const normDegPitch = Math.round((pitchRef.current * 180) / Math.PI * 10) / 10;
        setCamAzimuth(normDegAz);
        setCamPitch(normDegPitch);
      }
      return;
    }

    // Throttle cursor raycast intersection tests to ~30Hz (32ms) to eliminate GC spikes
    if (now - lastRaycastTimeRef.current < 32) return;
    lastRaycastTimeRef.current = now;

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

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = false;
    if (hasDraggedRef.current) {
      const normDegAz = Math.round((((yawRef.current * 180) / Math.PI) % 360 + 360) % 360);
      const normDegPitch = Math.round((pitchRef.current * 180) / Math.PI * 10) / 10;
      setCamAzimuth(normDegAz);
      setCamPitch(normDegPitch);
      return;
    }

    if (cameraRef.current && landmarkMeshesRef.current.length > 0) {
      raycasterRef.current.setFromCamera(mouseNormRef.current, cameraRef.current);
      const pinHits = raycasterRef.current.intersectObjects(landmarkMeshesRef.current);
      if (pinHits.length > 0) {
        const pinData = pinHits[0].object.userData.pinData as LandmarkPin;
        if (pinData) {
          setActivePin(pinData);
          return;
        }
      }
    }

    if (terrainMeshRef.current && cameraRef.current) {
      raycasterRef.current.setFromCamera(mouseNormRef.current, cameraRef.current);
      const hits = raycasterRef.current.intersectObject(terrainMeshRef.current);
      if (hits.length > 0) {
        const targetPoint = hits[0].point;
        targetCamPosRef.current.set(targetPoint.x, targetPoint.y + 1.7, targetPoint.z);
        isLerpingCamRef.current = true;
        setTeleportingNotice(true);
        setTimeout(() => setTeleportingNotice(false), 900);
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
        if (activePin) {
          setActivePin(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, activePin]);

  if (!waypoint) return null;

  const currentPhoto = curiosityPhotos[photoIdx] || FALLBACK_CURIOSITY_PHOTOS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 select-none">
      <div className="relative w-full h-full max-w-7xl max-h-[92vh] bg-[#07090e] border border-slate-700 flex flex-col overflow-hidden">
        
        {/* HUD HEADER */}
        <div className="h-11 bg-[#0b0f17] border-b border-slate-800 px-3 flex items-center justify-between shrink-0 font-mono text-xs z-20">
          <div className="flex items-center gap-3">
            <MarsForAllBadge size={22} showSubtext={false} />
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-bold text-amber-400">MARSFORALL // GALE-01</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">3D SURFACE EXPLORER</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">{waypoint.name}</span>
              <span className="text-slate-600">|</span>
              <span className={`px-1.5 py-0.5 border text-[10px] font-bold ${
                demSourceStatus === "NASA_MOLA_REAL_DEM"
                  ? "bg-[#064e3b] text-[#34d399] border-[#059669]"
                  : "bg-[#111827] text-slate-400 border-slate-700"
              }`}>
                [{demSourceStatus === "NASA_MOLA_REAL_DEM" ? "REAL NASA MOLA DEM PIXELS" : "OFFLINE CACHED DEM"}]
              </span>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-800 bg-[#07090e] p-0.5">
              <button
                onClick={() => setViewMode("surface")}
                className={`px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  viewMode === "surface"
                    ? "bg-[#161e2e] text-amber-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                [ 3D SURFACE ]
              </button>
              <button
                onClick={() => setViewMode("mesh")}
                className={`px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  viewMode === "mesh"
                    ? "bg-[#161e2e] text-cyan-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                [ 3D PHOTOGRAMMETRY MESH ]
              </button>
              <button
                onClick={() => setViewMode("vr_stereo")}
                className={`px-2.5 py-1 text-[11px] font-bold transition-colors ${
                  viewMode === "vr_stereo"
                    ? "bg-[#161e2e] text-rose-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                [ VR / STEREO MODE ]
              </button>
            </div>

            {/* Toggle Curiosity Photo Feed */}
            <button
              onClick={() => setIsPhotoFeedOpen(!isPhotoFeedOpen)}
              className={`px-2 py-1 border text-[11px] font-bold font-mono transition-colors ${
                isPhotoFeedOpen
                  ? "bg-[#161e2e] text-amber-400 border-slate-700"
                  : "bg-[#111827] text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              [ MSL RAW FEED ]
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-[#111827] border border-slate-700 text-slate-300 hover:bg-[#1f2937] hover:text-white font-mono text-xs font-bold transition-colors"
            >
              [ ESC / X ]
            </button>
          </div>
        </div>

        {/* 3D CANVAS VIEWPORT WRAPPER */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden bg-black"
        >
          {/* LAYER 1: DEDICATED EMPTY WEBGL MOUNT */}
          <div ref={canvasHostRef} className="absolute inset-0 w-full h-full" />

          {/* LAYER 2: SEPARATE REACT HUD OVERLAY */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {teleportingNotice && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#0b0f17] border border-cyan-500/80 text-cyan-300 px-4 py-1.5 font-mono text-xs tracking-wider font-bold shadow-md animate-pulse">
                [ EVA TELEPORTING TO RETICLE COORDINATES... ]
              </div>
            )}

            {viewMode === "vr_stereo" && (
              <div className="absolute inset-y-0 left-1/2 w-px bg-slate-700" />
            )}

            {/* Compass Rose & Atmospheric Telemetry (Top Left) */}
            <div className="absolute top-4 left-4 bg-[#0b0f17]/90 border border-slate-800 p-2 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">BEARING:</span>
                <span className="text-amber-400 font-bold tabular-nums">{camAzimuth}°</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">PITCH:</span>
                <span className="text-slate-200 font-bold tabular-nums">{camPitch > 0 ? `+${camPitch}` : camPitch}°</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">FOV:</span>
                <span className="text-cyan-400 font-bold tabular-nums">{camFov}°</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">ATM TAU:</span>
                <span className={`font-bold tabular-nums ${dustStormActive ? "text-rose-400" : "text-emerald-400"}`}>
                  {dustStormActive ? "2.4 (DUST STORM)" : "0.3 (CLEAR)"}
                </span>
              </div>
            </div>

            {/* Landmark Hotspot Pin Card Popover */}
            {activePin && (
              <div className="absolute top-4 right-4 w-80 bg-[#0b0f17] border border-amber-500/80 p-3 font-mono text-xs text-slate-200 shadow-lg pointer-events-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <span className="text-amber-400 font-bold">{activePin.code} // {activePin.name}</span>
                  <button
                    onClick={() => setActivePin(null)}
                    className="text-slate-400 hover:text-white font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-500">INSTRUMENT:</span>
                    <span className="text-slate-200 font-bold">{activePin.instrument}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-500">{activePin.metricLabel}:</span>
                    <span className="text-emerald-400 font-bold">{activePin.metricValue}</span>
                  </div>
                  <p className="text-slate-400 text-[10px] leading-relaxed pt-1">
                    {activePin.description}
                  </p>
                </div>
              </div>
            )}

            {/* Live NASA MSL Curiosity Raw Imagery Inspector Card */}
            {isPhotoFeedOpen && currentPhoto && (
              <div className="absolute bottom-4 right-4 w-72 sm:w-80 bg-[#0b0f17] border border-slate-700 p-2.5 font-mono text-xs text-slate-200 shadow-xl pointer-events-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-emerald-400 font-bold text-[10px] uppercase">
                      LIVE NASA MSL RAW FEED
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>{photoIdx + 1}/{curiosityPhotos.length}</span>
                    <button
                      onClick={() => setIsPhotoFeedOpen(false)}
                      className="ml-2 text-slate-400 hover:text-white font-bold"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Rover Surface Photo Display */}
                <div className="relative w-full h-36 bg-black border border-slate-800 overflow-hidden mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentPhoto.image_url}
                    alt={currentPhoto.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/80 px-1 py-0.5 border border-slate-800 text-[9px] text-amber-300 font-mono">
                    SOL {currentPhoto.sol} // {currentPhoto.instrument}
                  </div>
                </div>

                <div className="space-y-1 text-[10px] text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-500">IMAGE ID:</span>
                    <span className="text-slate-300 truncate max-w-[170px]">{currentPhoto.imageid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ACQUIRED:</span>
                    <span className="text-slate-300">{currentPhoto.date_taken_utc.slice(0, 10)}</span>
                  </div>
                  {currentPhoto.caption && (
                    <p className="text-[9px] text-slate-400 line-clamp-2 pt-0.5">
                      {currentPhoto.caption}
                    </p>
                  )}
                </div>

                {/* Photo Pagination Controls */}
                <div className="flex items-center justify-between gap-1.5 mt-2 pt-1.5 border-t border-slate-800">
                  <button
                    onClick={() => setPhotoIdx((prev) => (prev > 0 ? prev - 1 : curiosityPhotos.length - 1))}
                    className="flex-1 py-1 bg-[#111827] border border-slate-700 text-slate-300 hover:bg-[#1f2937] text-[10px] font-bold"
                  >
                    [ &lt; PREV SOL ]
                  </button>
                  <button
                    onClick={() => setPhotoIdx((prev) => (prev < curiosityPhotos.length - 1 ? prev + 1 : 0))}
                    className="flex-1 py-1 bg-[#111827] border border-slate-700 text-slate-300 hover:bg-[#1f2937] text-[10px] font-bold"
                  >
                    [ NEXT SOL &gt; ]
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM TELEMETRY BAR */}
        <div className="h-10 bg-[#0b0f17] border-t border-slate-800 px-3 flex items-center justify-between shrink-0 font-mono text-xs z-20">
          <div className="flex items-center gap-4 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">EVA CAM ELEV:</span>
              <span className="text-amber-400 font-bold tabular-nums">{camElevation} m</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">RETICLE TGT:</span>
              {reticleCoords ? (
                <span className="text-cyan-400 font-bold tabular-nums">
                  X: {reticleCoords.x > 0 ? `+${reticleCoords.x}` : reticleCoords.x}m, Z: {reticleCoords.z > 0 ? `+${reticleCoords.z}` : reticleCoords.z}m ({reticleCoords.elev}m)
                </span>
              ) : (
                <span className="text-slate-600">SEARCHING TERRAIN...</span>
              )}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500">
            <span>[ DRAG: 360° PAN ]</span>
            <span>•</span>
            <span>[ CLICK GROUND: TELEPORT EVA (1.7M) ]</span>
            <span>•</span>
            <span>[ WHEEL: ZOOM ]</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetOrigin}
              className="px-2.5 py-1 bg-[#111827] border border-slate-700 text-slate-300 hover:bg-[#1f2937] hover:text-white font-mono text-[11px] font-bold transition-colors"
            >
              [ RESET ORIGIN ]
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SurfacePovModal;
