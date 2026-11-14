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

// Helper to compute terrain elevation y(x, z) procedurally based on waypoint characteristics
function getTerrainHeight(x: number, z: number, waypointId: string): number {
  const isBoxwork = waypointId === "curiosity_boxwork_2025";

  if (isBoxwork) {
    // Regional gentle slope
    const baseSlope = 0.04 * x - 0.025 * z + Math.sin(x * 0.12) * Math.cos(z * 0.12) * 0.5;

    // Sharp polygonal boxwork lattice blade walls
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

    // Secondary fine vein ridges
    const smallGrid = Math.min(
      Math.abs(((x * 0.55) % 1 + 1) % 1 - 0.5),
      Math.abs(((z * 0.55) % 1 + 1) % 1 - 0.5)
    );
    if (smallGrid < 0.04) {
      boxworkRidges += ((0.04 - smallGrid) / 0.04) * 0.5;
    }

    // Basaltic gravel roughness
    const fineRoughness = Math.sin(x * 2.8) * Math.sin(z * 2.8) * 0.05;

    return baseSlope + boxworkRidges + fineRoughness;
  }

  // Mount Sharp slopes / Gediz Vallis / Gale Crater Floor
  const regionalSlope = 0.07 * x - 0.04 * z;
  const eolianRipples = Math.sin(0.75 * x + 0.35 * z) * 0.38 + Math.cos(0.35 * x - 0.65 * z) * 0.22;
  const macroHummocks = Math.sin(x * 0.09) * Math.cos(z * 0.09) * 2.1;
  const fineGravel = Math.sin(x * 3.2) * Math.sin(z * 3.2) * 0.04;

  return regionalSlope + eolianRipples + macroHummocks + fineGravel;
}

// Generate procedural Martian regolith texture in memory (100% offline, zero network latency)
function createMartianRegolithTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Red-ochre martian ground base
  ctx.fillStyle = "#a84b2c";
  ctx.fillRect(0, 0, 512, 512);

  // Mottled patches of weathered iron oxide dust
  for (let i = 0; i < 350; i++) {
    const px = Math.random() * 512;
    const py = Math.random() * 512;
    const pr = Math.random() * 35 + 8;
    ctx.fillStyle = Math.random() > 0.45 ? "#ba5936" : "#87381e";
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dark basaltic grains & noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 48;
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

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 512, 512);

  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = 128 + Math.floor((Math.random() - 0.5) * 85);
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

// Build 3D Curiosity / Companion Mule Rover Unit positioned at (roverX, roverZ)
function createCompanionRoverGroup(waypointId: string, roverX = -2.5, roverZ = -4.5): THREE.Group {
  const roverGroup = new THREE.Group();
  const roverBaseY = getTerrainHeight(roverX, roverZ, waypointId);
  roverGroup.position.set(roverX, roverBaseY, roverZ);

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x64748b, // Titanium slate body
    roughness: 0.6,
    metalness: 0.3,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // Dark cleated aluminum wheels
    roughness: 0.85,
    metalness: 0.2,
  });
  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xb45309, // Multi-layer thermal insulation foil
    roughness: 0.3,
    metalness: 0.8,
  });
  const lensMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

  // Main chassis box
  const chassisGeom = new THREE.BoxGeometry(2.4, 0.6, 1.6);
  const chassis = new THREE.Mesh(chassisGeom, bodyMat);
  chassis.position.y = 0.75;
  roverGroup.add(chassis);

  // Gold foil avionics payload compartment
  const foilGeom = new THREE.BoxGeometry(1.2, 0.45, 1.1);
  const foilBox = new THREE.Mesh(foilGeom, goldFoilMat);
  foilBox.position.set(-0.2, 1.1, 0);
  roverGroup.add(foilBox);

  // Mastcam Remote Sensing Mast (RSM)
  const mastGeom = new THREE.CylinderGeometry(0.045, 0.05, 1.4, 8);
  const mast = new THREE.Mesh(mastGeom, bodyMat);
  mast.position.set(0.8, 1.6, 0.4);
  roverGroup.add(mast);

  // Mastcam camera head
  const headGeom = new THREE.BoxGeometry(0.3, 0.2, 0.25);
  const head = new THREE.Mesh(headGeom, bodyMat);
  head.position.set(0.8, 2.35, 0.4);
  roverGroup.add(head);

  // Mastcam stereo optical lenses
  const lensGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12);
  lensGeom.rotateX(Math.PI / 2);
  const leftLens = new THREE.Mesh(lensGeom, lensMat);
  leftLens.position.set(0.88, 2.35, 0.34);
  const rightLens = new THREE.Mesh(lensGeom, lensMat);
  rightLens.position.set(0.88, 2.35, 0.46);
  roverGroup.add(leftLens);
  roverGroup.add(rightLens);

  // Multi-Mission Radioisotope Thermoelectric Generator (MMRTG)
  const rtgGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 8);
  rtgGeom.rotateZ(Math.PI / 2);
  const rtg = new THREE.Mesh(rtgGeom, wheelMat);
  rtg.position.set(-1.4, 0.85, 0);
  roverGroup.add(rtg);

  // 6 Cleated Rocker-Bogie Wheels
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
  // Dedicated Ref for WebGL Canvas Host Container (STRICTLY NO REACT CHILDREN)
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Tactical view modes: surface (textured), mesh (cyan photogrammetric wireframe), vr_stereo (stereoscopic dual-eye)
  const [viewMode, setViewMode] = useState<"surface" | "mesh" | "vr_stereo">("surface");
  const [activePin, setActivePin] = useState<LandmarkPin | null>(null);

  // Initial Camera Framing: y = 4.2m height, pitch = -8°, yaw = 0° (looking directly at Mount Sharp & Rover)
  const [camAzimuth, setCamAzimuth] = useState<number>(0);
  const [camPitch, setCamPitch] = useState<number>(-8);
  const [camFov, setCamFov] = useState<number>(65);
  const [camElevation, setCamElevation] = useState<number>(-4120);
  const [reticleCoords, setReticleCoords] = useState<{ x: number; z: number; elev: number } | null>(null);
  const [teleportingNotice, setTeleportingNotice] = useState<boolean>(false);

  // References for Three.js state across re-renders
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
  const yawRef = useRef<number>(0); // 0 radians = looking toward -Z
  const pitchRef = useRef<number>((-8 * Math.PI) / 180); // -8 degrees downward angle
  const fovRef = useRef<number>(65);

  // Mouse / Pointer drag state
  const isPointerDownRef = useRef<boolean>(false);
  const pointerStartRef = useRef<{ x: number; y: number; startYaw: number; startPitch: number }>({
    x: 0,
    y: 0,
    startYaw: 0,
    startPitch: 0,
  });
  const hasDraggedRef = useRef<boolean>(false);

  // Raycasting for ground intersection and pins
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseNormRef = useRef<THREE.Vector2>(new THREE.Vector2(-999, -999));

  const baseElevation = waypoint?.elevationM ?? -4120;
  const wpId = waypoint?.id ?? "mount_sharp_baseline";

  // Reset camera to initial observation origin (y = 4.2m height, pitch = -8°, yaw = 0°)
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

    // 1. Scene & Atmosphere Configuration
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Martian Atmosphere Color & Fog: Clear Sky is brighter & warmer (#3b2316 sky, #5c3520 fog)
    const skyClearColor = dustStormActive ? 0x240e06 : 0x3b2316;
    const fogColor = dustStormActive ? 0x6b2e10 : 0x5c3520;
    const fogDensity = dustStormActive ? 0.032 : 0.007;
    scene.background = new THREE.Color(skyClearColor);
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);

    // 2. Camera Configuration: Initial 4.2m height, pitch -8°, facing -Z
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
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = dustStormActive ? 0.85 : 1.25;
    rendererRef.current = renderer;

    // Clear host container safely and append WebGL Canvas
    host.replaceChildren();
    host.appendChild(renderer.domElement);

    // 4. Lighting: Crisp, contrasty Martian directional illumination
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

    // Fill light from northern Aeolis Mons ridge
    const fillLight = new THREE.DirectionalLight(0xc26a35, 0.45);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);

    // 5. Procedural Martian Terrain Geometry (120x120m, 128x128 segments)
    const terrainGeom = new THREE.PlaneGeometry(120, 120, 128, 128);
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

    const terrainMaterial = new THREE.MeshStandardMaterial({
      map: regolithTex,
      bumpMap: bumpTex,
      bumpScale: 0.12,
      roughness: 0.88,
      metalness: 0.08,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(terrainGeom, terrainMaterial);
    terrainMesh.name = "martian_terrain";
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // Photogrammetric Wireframe Overlay Mesh (Cyan Topographic Lattice)
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

    // 6. Ground-Projected Targeting Reticle (Click-to-Teleport)
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

    // 7. Companion Rover 3D Unit positioned at (-2.5, -4.5) directly framed in viewport
    const rover = createCompanionRoverGroup(wpId, -2.5, -4.5);
    scene.add(rover);

    // 8. 3D Spatial Landmark Pins & Vertical Light Beams
    const landmarkObjects: THREE.Object3D[] = [];
    LANDMARK_PINS.forEach((pin) => {
      const pinY = getTerrainHeight(pin.x, pin.z, wpId);

      const pinGroup = new THREE.Group();
      pinGroup.position.set(pin.x, pinY, pin.z);

      // Vertical Light Beam Pillar
      const pillarGeom = new THREE.CylinderGeometry(0.08, 0.08, 8, 8);
      pillarGeom.translate(0, 4, 0);
      const pillarMat = new THREE.MeshBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.6,
      });
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pinGroup.add(pillar);

      // Rotating Octahedron Beacon Crystal
      const beaconGeom = new THREE.OctahedronGeometry(0.48);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, wireframe: true });
      const beacon = new THREE.Mesh(beaconGeom, beaconMat);
      beacon.position.y = 8.2;
      beacon.name = "rotating_beacon";
      pinGroup.add(beacon);

      // Base footprint ring
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

      // Hitbox for raycasting click
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

      // Rotate landmark beacon diamonds
      scene.traverse((obj) => {
        if (obj.name === "rotating_beacon") {
          obj.rotation.y = elapsedTime * 1.5;
        }
      });

      // Smooth camera position lerping (click-to-teleport)
      if (isLerpingCamRef.current) {
        camPosRef.current.lerp(targetCamPosRef.current, 0.08);
        if (camPosRef.current.distanceTo(targetCamPosRef.current) < 0.05) {
          camPosRef.current.copy(targetCamPosRef.current);
          isLerpingCamRef.current = false;
        }
        setCamElevation(Math.round(baseElevation + camPosRef.current.y));
      }
      camera.position.copy(camPosRef.current);

      // Compute look direction from yaw and pitch (where yaw = 0 points towards -Z)
      const lookDist = 50;
      const cx = Math.sin(yawRef.current) * Math.cos(pitchRef.current) * lookDist;
      const cy = Math.sin(pitchRef.current) * lookDist;
      const cz = -Math.cos(yawRef.current) * Math.cos(pitchRef.current) * lookDist;
      camera.lookAt(
        camPosRef.current.x + cx,
        camPosRef.current.y + cy,
        camPosRef.current.z + cz
      );

      // Standard single-viewport vs. stereoscopic dual-eye rendering
      if (viewMode === "vr_stereo") {
        const sw = renderer.domElement.clientWidth;
        const sh = renderer.domElement.clientHeight;
        const halfW = sw / 2;

        renderer.setScissorTest(true);

        // Left Eye (offset -0.032m)
        renderer.setScissor(0, 0, halfW, sh);
        renderer.setViewport(0, 0, halfW, sh);
        camera.aspect = halfW / sh;
        camera.updateProjectionMatrix();
        camera.position.x = camPosRef.current.x - 0.032;
        renderer.render(scene, camera);

        // Right Eye (offset +0.032m)
        renderer.setScissor(halfW, 0, halfW, sh);
        renderer.setViewport(halfW, 0, halfW, sh);
        camera.aspect = halfW / sh;
        camera.updateProjectionMatrix();
        camera.position.x = camPosRef.current.x + 0.032;
        renderer.render(scene, camera);

        // Restore
        camera.position.copy(camPosRef.current);
        renderer.setScissorTest(false);
      } else {
        renderer.render(scene, camera);
      }
    };

    animate();

    // Cleanup on unmount: Safe disposal without conflicting with React DOM tree
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

  // Synchronize tactical view mode styles
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

  // Pointer Movement (Hover Reticle & Drag Pan)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const host = canvasHostRef.current;
    if (!host || !cameraRef.current || !terrainMeshRef.current) return;

    const rect = host.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouseNormRef.current.set(mouseX, mouseY);

    // Pointer Drag Rotation
    if (isPointerDownRef.current) {
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasDraggedRef.current = true;
      }

      // Drag sensitivity
      const sens = 0.0035;
      yawRef.current = pointerStartRef.current.startYaw - dx * sens;
      pitchRef.current = Math.max(
        -1.3,
        Math.min(1.3, pointerStartRef.current.startPitch + dy * sens)
      );

      const normDegAz = Math.round((((yawRef.current * 180) / Math.PI) % 360 + 360) % 360);
      const normDegPitch = Math.round((pitchRef.current * 180) / Math.PI * 10) / 10;
      setCamAzimuth(normDegAz);
      setCamPitch(normDegPitch);
      return;
    }

    // Raycast for Ground Reticle Projection
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

    // If it was a drag, don't execute teleport/pin click
    if (hasDraggedRef.current) return;

    // Check click on landmark pins first
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

    // Ground Click-to-Teleport
    if (terrainMeshRef.current && cameraRef.current) {
      raycasterRef.current.setFromCamera(mouseNormRef.current, cameraRef.current);
      const hits = raycasterRef.current.intersectObject(terrainMeshRef.current);
      if (hits.length > 0) {
        const targetPoint = hits[0].point;
        // Teleport to eye level: 1.7m above clicked terrain point
        targetCamPosRef.current.set(targetPoint.x, targetPoint.y + 1.7, targetPoint.z);
        isLerpingCamRef.current = true;
        setTeleportingNotice(true);
        setTimeout(() => setTeleportingNotice(false), 900);
      }
    }
  };

  // Mouse Wheel Zoom (FOV 30° - 85°)
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

  // Keyboard navigation shortcuts
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 select-none">
      {/* Outer Tactical Viewport Box */}
      <div className="relative w-full h-full max-w-7xl max-h-[92vh] bg-[#07090e] border border-slate-700 flex flex-col overflow-hidden">
        
        {/* HUD HEADER: Mission Badge, Waypoint Meta & Tactical View Mode Switcher */}
        <div className="h-11 bg-[#0b0f17] border-b border-slate-800 px-3 flex items-center justify-between shrink-0 font-mono text-xs z-20">
          <div className="flex items-center gap-3">
            <MarsForAllBadge size={22} showSubtext={false} />
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-bold text-amber-400">MARSFORALL // GALE-01</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">3D SURFACE EXPLORER</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">{waypoint.name}</span>
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

            {/* Close Button */}
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-[#111827] border border-slate-700 text-slate-300 hover:bg-[#1f2937] hover:text-white font-mono text-xs font-bold transition-colors"
            >
              [ ESC / X ]
            </button>
          </div>
        </div>

        {/* 3D CANVAS VIEWPORT WRAPPER (Captures Pointer Events Cleanly) */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden bg-black"
        >
          {/* LAYER 1: DEDICATED EMPTY WEBGL MOUNT (STRICTLY NO REACT CHILDREN) */}
          <div ref={canvasHostRef} className="absolute inset-0 w-full h-full" />

          {/* LAYER 2: SEPARATE REACT HUD OVERLAY (ISOLATED SIBLING DOM) */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {/* Teleporting In-Flight Notification */}
            {teleportingNotice && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#0b0f17] border border-cyan-500/80 text-cyan-300 px-4 py-1.5 font-mono text-xs tracking-wider font-bold shadow-md animate-pulse">
                [ EVA TELEPORTING TO RETICLE COORDINATES... ]
              </div>
            )}

            {/* Center Vertical Divider for Stereoscopic VR Mode */}
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

            {/* Landmark Hotspot Pin Card Popover (Interactive with pointer-events-auto) */}
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
          </div>
        </div>

        {/* BOTTOM TELEMETRY BAR: Zero Overlap & Aligned Grid */}
        <div className="h-10 bg-[#0b0f17] border-t border-slate-800 px-3 flex items-center justify-between shrink-0 font-mono text-xs z-20">
          {/* Slot Kiri: EVA Elevation & Target Reticle Readout */}
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

          {/* Slot Tengah: Navigation Guidance Tips */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] text-slate-500">
            <span>[ DRAG: 360° PAN ]</span>
            <span>•</span>
            <span>[ CLICK GROUND: TELEPORT EVA (1.7M) ]</span>
            <span>•</span>
            <span>[ WHEEL: ZOOM ]</span>
          </div>

          {/* Slot Kanan: Reset Origin Button */}
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
