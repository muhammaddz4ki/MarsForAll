"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { useTranslations } from "next-intl";
import { MissionSiteId } from "@/lib/martian/mountSharpWaypoints";

interface MarsGlobeViewerProps {
  currentSite: MissionSiteId;
  onSelectSite: (site: MissionSiteId) => void;
  onExitGlobe: () => void;
  theme?: "dark" | "light";
}

type GlobeTextureMode = "viking" | "mola" | "themis";

interface Landmark {
  id: string;
  name: string;
  tag: string;
  lat: number;
  lon: number;
  elevationM: number;
  siteId?: MissionSiteId;
  description: string;
  geologicUnit: string;
}

const MARTIAN_LANDMARKS: Landmark[] = [
  {
    id: "gale_crater",
    name: "Gale Crater — Mount Sharp (Aeolis Mons)",
    tag: "SITE-01: GALE (MSL)",
    lat: -4.74,
    lon: 137.40,
    elevationM: -4501,
    siteId: "gale_crater",
    description: "Curiosity Rover exploration zone. Ancient fluvio-lacustrine mudstone strata and sulfate boxwork crystal lattices.",
    geologicUnit: "Early Hesperian Sulfate-Bearing Unit & Boxwork Lattice",
  },
  {
    id: "jezero_crater",
    name: "Jezero Crater — Delta Front & Octavia E. Butler Site",
    tag: "SITE-02: JEZERO (M2020)",
    lat: 18.3789,
    lon: 77.4509,
    elevationM: -2569,
    siteId: "jezero_crater",
    description: "Perseverance Rover exploration zone. Ancient river delta front with carbonate-bearing mudstones and redox reaction halos.",
    geologicUnit: "Noachian Deltaic Sandstone & Séítah Olivine Cumulate",
  },
  {
    id: "olympus_mons",
    name: "Olympus Mons",
    tag: "SHIELD VOLCANO",
    lat: 18.65,
    lon: 226.2,
    elevationM: 21287,
    description: "Highest volcano and mountain in the Solar System. Massive basaltic shield volcano with an 80 km wide central caldera complex.",
    geologicUnit: "Amazonian Basaltic Volcanic Caldera & Scarp",
  },
  {
    id: "valles_marineris",
    name: "Valles Marineris",
    tag: "CANYON SYSTEM",
    lat: -13.9,
    lon: 300.8,
    elevationM: -7000,
    description: "Enormous planetary rift system spanning over 4,000 km in length, up to 200 km in width and 7 km deep.",
    geologicUnit: "Hesperian Tectonic Chasmata & Layered Sulfate Wall Rock",
  },
  {
    id: "hellas_planitia",
    name: "Hellas Planitia",
    tag: "IMPACT BASIN",
    lat: -42.7,
    lon: 70.0,
    elevationM: -7152,
    description: "Deepest and oldest giant impact crater basin on Mars (2,300 km diameter), possessing the highest atmospheric pressure on the planet.",
    geologicUnit: "Early Noachian Impact Basin Floor & Eolian Mantle",
  },
];

// Coordinate conversion: converts Martian latitude and longitude to 3D Cartesian coordinates on sphere
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Procedural Equirectangular Mars Texture Generators
function createProceduralVikingCanvas(): HTMLCanvasElement {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Base Martian ferric oxide rust tone
  ctx.fillStyle = "#8c381e";
  ctx.fillRect(0, 0, width, height);

  // Subtle global albedo bands
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#c46849");
  grad.addColorStop(0.3, "#963d20");
  grad.addColorStop(0.5, "#7b2f15");
  grad.addColorStop(0.7, "#994324");
  grad.addColorStop(1, "#c46849");
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1.0;

  // Syrtis Major Dark Basaltic Region (Lon ~70°, Lat ~10°N)
  const xSyrtis = (70 / 360) * width;
  const ySyrtis = ((90 - 10) / 180) * height;
  const rSyrtis = ctx.createRadialGradient(xSyrtis, ySyrtis, 10, xSyrtis, ySyrtis, 130);
  rSyrtis.addColorStop(0, "#2c170d");
  rSyrtis.addColorStop(0.6, "#452214");
  rSyrtis.addColorStop(1, "transparent");
  ctx.fillStyle = rSyrtis;
  ctx.beginPath();
  ctx.arc(xSyrtis, ySyrtis, 130, 0, Math.PI * 2);
  ctx.fill();

  // Sinus Sabaeus / Southern Dark Belt
  ctx.fillStyle = "rgba(40, 20, 12, 0.45)";
  ctx.beginPath();
  ctx.ellipse((100 / 360) * width, ((90 - -15) / 180) * height, 220, 60, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Acidalia Planitia (Northern dark basin, Lon 330°, Lat 50°N)
  ctx.fillStyle = "rgba(45, 24, 15, 0.5)";
  ctx.beginPath();
  ctx.ellipse((330 / 360) * width, ((90 - 50) / 180) * height, 180, 80, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Valles Marineris Canyon Gash (Lon 270° to 310°, Lat -14°)
  ctx.strokeStyle = "#1f1008";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo((260 / 360) * width, ((90 - -12) / 180) * height);
  ctx.quadraticCurveTo(
    (285 / 360) * width,
    ((90 - -16) / 180) * height,
    (315 / 360) * width,
    ((90 - -13) / 180) * height
  );
  ctx.stroke();

  // Olympus Mons Volcano & Caldera (Lon 226°, Lat 19°N)
  const xOly = (226 / 360) * width;
  const yOly = ((90 - 19) / 180) * height;
  const rOly = ctx.createRadialGradient(xOly, yOly, 5, xOly, yOly, 55);
  rOly.addColorStop(0, "#4a2113");
  rOly.addColorStop(0.5, "#a14829");
  rOly.addColorStop(1, "transparent");
  ctx.fillStyle = rOly;
  ctx.beginPath();
  ctx.arc(xOly, yOly, 55, 0, Math.PI * 2);
  ctx.fill();

  // Hellas Basin Bright Dust Reservoir (Lon 70°, Lat -43°)
  const xHel = (70 / 360) * width;
  const yHel = ((90 - -43) / 180) * height;
  const rHel = ctx.createRadialGradient(xHel, yHel, 10, xHel, yHel, 90);
  rHel.addColorStop(0, "#be5c38");
  rHel.addColorStop(0.7, "#a84c2a");
  rHel.addColorStop(1, "transparent");
  ctx.fillStyle = rHel;
  ctx.beginPath();
  ctx.arc(xHel, yHel, 90, 0, Math.PI * 2);
  ctx.fill();

  // North Polar Cap (Planum Boreum - CO2/Water Ice White)
  ctx.fillStyle = "#f1f5f9";
  ctx.beginPath();
  ctx.ellipse(width / 2, 0, width / 2, 45, 0, 0, Math.PI * 2);
  ctx.fill();

  // South Polar Cap (Planum Australe)
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.ellipse(width / 2, height, width / 3, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function createProceduralMolaCanvas(): HTMLCanvasElement {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Hypsometric elevation tint: Northern Lowlands (Blue) vs Southern Highlands (Orange/Red)
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#ffffff"); // North pole ice cap
  grad.addColorStop(0.12, "#1d4ed8"); // Northern lowlands basin
  grad.addColorStop(0.35, "#0284c7"); // Vastitas Borealis
  grad.addColorStop(0.48, "#10b981"); // Equatorial transition
  grad.addColorStop(0.65, "#f59e0b"); // Southern cratered highlands
  grad.addColorStop(0.85, "#dc2626"); // High volcanic plateau
  grad.addColorStop(1, "#ffffff"); // South pole ice cap
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Olympus Mons Peak (Extreme High Elevation - White/Red Peak)
  const xOly = (226 / 360) * width;
  const yOly = ((90 - 19) / 180) * height;
  const rOly = ctx.createRadialGradient(xOly, yOly, 4, xOly, yOly, 60);
  rOly.addColorStop(0, "#ffffff");
  rOly.addColorStop(0.3, "#f43f5e");
  rOly.addColorStop(0.7, "#ea580c");
  rOly.addColorStop(1, "transparent");
  ctx.fillStyle = rOly;
  ctx.beginPath();
  ctx.arc(xOly, yOly, 60, 0, Math.PI * 2);
  ctx.fill();

  // Hellas Basin (Extreme Deep Depression - Deep Indigo/Purple)
  const xHel = (70 / 360) * width;
  const yHel = ((90 - -43) / 180) * height;
  const rHel = ctx.createRadialGradient(xHel, yHel, 10, xHel, yHel, 110);
  rHel.addColorStop(0, "#1e1b4b");
  rHel.addColorStop(0.5, "#1e3a8a");
  rHel.addColorStop(1, "transparent");
  ctx.fillStyle = rHel;
  ctx.beginPath();
  ctx.arc(xHel, yHel, 110, 0, Math.PI * 2);
  ctx.fill();

  // Valles Marineris Canyon Deep Trench
  ctx.strokeStyle = "#1e1b4b";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo((260 / 360) * width, ((90 - -12) / 180) * height);
  ctx.quadraticCurveTo(
    (285 / 360) * width,
    ((90 - -16) / 180) * height,
    (315 / 360) * width,
    ((90 - -13) / 180) * height
  );
  ctx.stroke();

  return canvas;
}

function createProceduralThemisCanvas(): HTMLCanvasElement {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // THEMIS Night IR: Cold low-TI dust (deep purple/blue) vs Warm high-TI bedrock (amber/cyan)
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width, height);

  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#020617");
  grad.addColorStop(0.2, "#1e1b4b");
  grad.addColorStop(0.5, "#312e81");
  grad.addColorStop(0.8, "#1e1b4b");
  grad.addColorStop(1, "#020617");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Warm bedrock thermal anomalies
  ctx.fillStyle = "rgba(6, 182, 212, 0.4)";
  ctx.beginPath();
  ctx.ellipse((70 / 360) * width, ((90 - 10) / 180) * height, 140, 70, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(245, 158, 11, 0.45)";
  ctx.beginPath();
  ctx.ellipse((226 / 360) * width, ((90 - 19) / 180) * height, 70, 70, 0, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

function createProceduralBumpCanvas(): HTMLCanvasElement {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#777777";
  ctx.fillRect(0, 0, width, height);

  // Olympus Mons Bump (High white peak)
  const xOly = (226 / 360) * width;
  const yOly = ((90 - 19) / 180) * height;
  const rOly = ctx.createRadialGradient(xOly, yOly, 2, xOly, yOly, 40);
  rOly.addColorStop(0, "#ffffff");
  rOly.addColorStop(0.4, "#cccccc");
  rOly.addColorStop(1, "#777777");
  ctx.fillStyle = rOly;
  ctx.beginPath();
  ctx.arc(xOly, yOly, 40, 0, Math.PI * 2);
  ctx.fill();

  // Hellas Basin (Deep black depression)
  const xHel = (70 / 360) * width;
  const yHel = ((90 - -43) / 180) * height;
  const rHel = ctx.createRadialGradient(xHel, yHel, 5, xHel, yHel, 50);
  rHel.addColorStop(0, "#111111");
  rHel.addColorStop(0.6, "#444444");
  rHel.addColorStop(1, "#777777");
  ctx.fillStyle = rHel;
  ctx.beginPath();
  ctx.arc(xHel, yHel, 50, 0, Math.PI * 2);
  ctx.fill();

  // Valles Marineris Deep Trench
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo((260 / 360) * width, ((90 - -12) / 180) * height);
  ctx.quadraticCurveTo(
    (285 / 360) * width,
    ((90 - -16) / 180) * height,
    (315 / 360) * width,
    ((90 - -13) / 180) * height
  );
  ctx.stroke();

  return canvas;
}

export const MarsGlobeViewer: React.FC<MarsGlobeViewerProps> = ({
  currentSite,
  onSelectSite,
  onExitGlobe,
  theme = "dark",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("mapViewer");
  const tMmgis = useTranslations("mmgis");

  const [activeTextureMode, setActiveTextureMode] = useState<GlobeTextureMode>("viking");
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [selectedLandmark, setSelectedLandmark] = useState<Landmark | null>(
    MARTIAN_LANDMARKS.find((l) => l.siteId === currentSite) || null
  );

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeMeshRef = useRef<THREE.Mesh | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  const texturesMap = useRef<Record<GlobeTextureMode, THREE.CanvasTexture | null>>({
    viking: null,
    mola: null,
    themis: null,
  });

  const isDragging = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRotation = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize Three.js Scene, Globe Sphere, Atmosphere, and Lighting
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050811");
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Build procedural equirectangular textures
    const vikingCanvas = createProceduralVikingCanvas();
    const molaCanvas = createProceduralMolaCanvas();
    const themisCanvas = createProceduralThemisCanvas();
    const bumpCanvas = createProceduralBumpCanvas();

    const vikingTex = new THREE.CanvasTexture(vikingCanvas);
    const molaTex = new THREE.CanvasTexture(molaCanvas);
    const themisTex = new THREE.CanvasTexture(themisCanvas);
    const bumpTex = new THREE.CanvasTexture(bumpCanvas);

    texturesMap.current = {
      viking: vikingTex,
      mola: molaTex,
      themis: themisTex,
    };

    // 1. Martian Globe Sphere (Radius = 3.0)
    const globeGeo = new THREE.SphereGeometry(3.0, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: vikingTex,
      bumpMap: bumpTex,
      bumpScale: 0.04,
      roughness: 0.88,
      metalness: 0.05,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globeMesh);
    globeMeshRef.current = globeMesh;

    // 2. Martian Atmospheric Limb Glow / Halo
    const atmoGeo = new THREE.SphereGeometry(3.06, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.85, 0.38, 0.12, 1.0) * intensity * 0.9;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // 3. Distant Space Starfield Particles
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      const radius = 30 + Math.random() * 40;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      starPositions[i] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i + 2] = radius * Math.cos(phi);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xcfd8dc, size: 0.15, sizeAttenuation: true });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 4. Lighting Rig
    const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.8);
    sunLight.position.set(7, 3, 6);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x334155, 0.6);
    scene.add(ambientLight);

    // 5. Interactive 3D Pins Group
    const pinsGroup = new THREE.Group();
    MARTIAN_LANDMARKS.forEach((lm) => {
      const pos = latLonToVector3(lm.lat, lm.lon, 3.03);

      // Pin Needle
      const pinGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.22, 12);
      const isSite = Boolean(lm.siteId);
      const pinMat = new THREE.MeshBasicMaterial({
        color: isSite ? (lm.siteId === "gale_crater" ? 0x06b6d4 : 0x10b981) : 0xf59e0b,
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);

      // Position & align cylinder normal to sphere surface
      pinMesh.position.copy(pos);
      pinMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());

      // Pin Head / Marker Sphere
      const headGeo = new THREE.SphereGeometry(0.065, 16, 16);
      const headMat = new THREE.MeshBasicMaterial({
        color: isSite ? 0x38bdf8 : 0xfbbf24,
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.set(0, 0.13, 0);
      pinMesh.add(headMesh);

      // Store landmark metadata directly in user data
      headMesh.userData = { landmark: lm };
      pinMesh.userData = { landmark: lm };

      pinsGroup.add(pinMesh);
    });
    globeMesh.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    // Initial orientation: focus on selected site
    const initLm = MARTIAN_LANDMARKS.find((l) => l.siteId === currentSite) || MARTIAN_LANDMARKS[0];
    const targetLonRad = -(initLm.lon + 180) * (Math.PI / 180);
    globeMesh.rotation.y = targetLonRad;
    globeMesh.rotation.x = (initLm.lat * Math.PI) / 180 * 0.4;

    // Animation & Render Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isAutoRotate && !isDragging.current) {
        globeMesh.rotation.y += 0.0012;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Window Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      globeGeo.dispose();
      globeMat.dispose();
      atmoGeo.dispose();
      atmoMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      vikingTex.dispose();
      molaTex.dispose();
      themisTex.dispose();
      bumpTex.dispose();
    };
  }, []);

  // Update Active Texture Mode on Globe Material
  useEffect(() => {
    if (!globeMeshRef.current) return;
    const mat = globeMeshRef.current.material as THREE.MeshStandardMaterial;
    const tex = texturesMap.current[activeTextureMode];
    if (tex && mat) {
      mat.map = tex;
      mat.needsUpdate = true;
    }
  }, [activeTextureMode]);

  // Orbit / Drag Controls Event Listeners
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || !cameraRef.current || !globeMeshRef.current) return;

    // Track mouse coordinate for hover raycasting
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDragging.current) {
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      globeMeshRef.current.rotation.y += deltaX * 0.005;
      globeMeshRef.current.rotation.x = Math.max(
        -1.1,
        Math.min(1.1, globeMeshRef.current.rotation.x + deltaY * 0.005)
      );

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    const zoomDelta = e.deltaY * 0.004;
    cameraRef.current.position.z = Math.max(4.2, Math.min(14.0, cameraRef.current.position.z + zoomDelta));
  };

  // Click on globe pins to select mission or inspect landmark
  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !globeMeshRef.current || !pinsGroupRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(pinsGroupRef.current.children, true);

    if (intersects.length > 0) {
      let obj: THREE.Object3D | null = intersects[0].object;
      while (obj && !obj.userData?.landmark && obj.parent) {
        obj = obj.parent;
      }
      if (obj && obj.userData?.landmark) {
        const lm = obj.userData.landmark as Landmark;
        setSelectedLandmark(lm);

        // Smoothly rotate globe towards landmark
        const targetLonRad = -(lm.lon + 180) * (Math.PI / 180);
        const targetLatRad = (lm.lat * Math.PI) / 180 * 0.4;
        globeMeshRef.current.rotation.y = targetLonRad;
        globeMeshRef.current.rotation.x = targetLatRad;
      }
    }
  };

  // Fly / Rotate to specific landmark programmatically
  const focusLandmark = (lm: Landmark) => {
    setSelectedLandmark(lm);
    if (globeMeshRef.current) {
      const targetLonRad = -(lm.lon + 180) * (Math.PI / 180);
      const targetLatRad = (lm.lat * Math.PI) / 180 * 0.4;
      globeMeshRef.current.rotation.y = targetLonRad;
      globeMeshRef.current.rotation.x = targetLatRad;
    }
  };

  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden ${
        theme === "dark" ? "bg-[#050811] text-slate-200" : "bg-slate-900 text-white"
      } font-mono`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onClick={handleClick}
    >
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left: Navigation Bar & 2D Return */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={onExitGlobe}
          className="px-3 py-1.5 bg-[#0b0f17] hover:bg-[#161e2e] border border-cyan-500 text-cyan-400 font-bold flex items-center gap-2 transition-colors"
        >
          <span>◄</span>
          <span>[ RETURN TO 2D TACTICAL MAP ]</span>
        </button>

        <div className="px-3 py-1.5 bg-[#07090e]/95 border border-slate-700 text-slate-300 font-bold">
          [ 3D PLANET GLOBE // NASA-AMMOS ARCHITECTURE ]
        </div>

        <button
          onClick={() => setIsAutoRotate((prev) => !prev)}
          className={`px-2.5 py-1.5 border font-bold transition-colors ${
            isAutoRotate
              ? "bg-[#083344] text-[#a5f3fc] border-[#06b6d4]"
              : "bg-[#111827] text-slate-400 border-slate-700 hover:text-white"
          }`}
        >
          {isAutoRotate ? "[ AUTO-ROTATE: ON ]" : "[ AUTO-ROTATE: OFF ]"}
        </button>
      </div>

      {/* Top Right: Global Texture Switcher (Viking MDIM, MOLA Hypsometric, THEMIS IR) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 text-[10px]">
        {(
          [
            { id: "viking", label: "VIKING MDIM 2.1 (TRUE COLOR)" },
            { id: "mola", label: "MOLA CLRSHADE (ELEVATION)" },
            { id: "themis", label: "THEMIS NIGHT IR (THERMAL)" },
          ] as const
        ).map((item) => {
          const isSelected = activeTextureMode === item.id;
          return (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTextureMode(item.id);
              }}
              className={`px-2.5 py-1.5 border font-bold transition-colors ${
                isSelected
                  ? "bg-amber-600 text-slate-950 border-amber-400"
                  : "bg-[#0b0f17]/95 text-slate-400 border-slate-700 hover:text-slate-200"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Bottom Left: Quick Planetary Landmarks Switcher */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="px-2 py-1 bg-[#07090e]/95 border border-slate-800 text-slate-400 font-bold uppercase">
          PLANETARY TARGETS:
        </span>
        {MARTIAN_LANDMARKS.map((lm) => {
          const isSelected = selectedLandmark?.id === lm.id;
          return (
            <button
              key={lm.id}
              onClick={(e) => {
                e.stopPropagation();
                focusLandmark(lm);
              }}
              className={`px-2 py-1 border transition-colors font-bold ${
                isSelected
                  ? lm.siteId
                    ? "bg-[#083344] text-[#a5f3fc] border-[#06b6d4]"
                    : "bg-[#78350f] text-[#fef3c7] border-[#f59e0b]"
                  : "bg-[#0b0f17]/90 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              {lm.tag}
            </button>
          );
        })}
      </div>

      {/* Bottom Right: MMGIS Scientific Feature Inspector Card */}
      {selectedLandmark && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 right-4 z-20 w-80 p-3 bg-[#07090e]/98 border border-slate-700 text-xs shadow-none space-y-2 select-text"
        >
          {/* Card Header */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-1.5">
            <div>
              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">
                {selectedLandmark.tag}
              </span>
              <h4 className="font-bold text-white text-xs leading-snug">
                {selectedLandmark.name}
              </h4>
            </div>
            <button
              onClick={() => setSelectedLandmark(null)}
              className="text-slate-400 hover:text-white px-1 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* Coordinate & Elevation Telemetry */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px] tabular-nums">
            <div className="p-1.5 bg-[#0b0f17] border border-slate-800">
              <span className="text-slate-500 block text-[8px] uppercase">COORDINATES</span>
              <span className="font-bold text-cyan-400">
                {selectedLandmark.lat}°N, {selectedLandmark.lon}°E
              </span>
            </div>
            <div className="p-1.5 bg-[#0b0f17] border border-slate-800">
              <span className="text-slate-500 block text-[8px] uppercase">MOLA ELEVATION</span>
              <span className="font-bold text-amber-400">
                {selectedLandmark.elevationM >= 0 ? `+${selectedLandmark.elevationM}` : selectedLandmark.elevationM} M
              </span>
            </div>
          </div>

          {/* Geologic Description */}
          <div className="text-[10px] text-slate-300 leading-relaxed font-sans">
            <p>{selectedLandmark.description}</p>
          </div>

          <div className="text-[9px] text-slate-400 border-t border-slate-800/80 pt-1">
            <span className="text-slate-500 uppercase font-bold">GEOLOGY: </span>
            <span>{selectedLandmark.geologicUnit}</span>
          </div>

          {/* Action Button: If it is an active mission site (Gale or Jezero), activate in 2D Map */}
          {selectedLandmark.siteId && (
            <button
              onClick={() => {
                onSelectSite(selectedLandmark.siteId!);
                onExitGlobe();
              }}
              className="w-full py-1.5 mt-1 bg-[#064e3b] hover:bg-[#065f46] border border-[#10b981] text-[#34d399] font-mono text-[10px] font-bold transition-colors uppercase tracking-wider text-center block"
            >
              [ ENTER 2D TACTICAL MAP FOR {selectedLandmark.siteId === "gale_crater" ? "GALE" : "JEZERO"} ]
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(MarsGlobeViewer);
