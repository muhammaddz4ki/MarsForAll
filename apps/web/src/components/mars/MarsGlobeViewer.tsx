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
    lon: 137.4,
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
    description: "Tallest planetary volcano in the Solar System. 600 km wide shield with 8 km cliffs and complex caldera summit.",
    geologicUnit: "Amazonian Basaltic Lava Flows & Flank Scarps",
  },
  {
    id: "valles_marineris",
    name: "Valles Marineris (Coprates Chasma)",
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

// In-Memory Cache for stitched 2048x1024 real NASA Mars Trek satellite textures
const globalRealTextureCache = new Map<string, HTMLCanvasElement>();

// Build 2048x1024 Real Mars Satellite Equirectangular Texture by stitching 32 Trek tiles (8 cols x 4 rows at z=2)
function buildRealMarsSphereTexture(
  mode: GlobeTextureMode,
  onTileDrawn?: () => void
): HTMLCanvasElement {
  if (globalRealTextureCache.has(mode)) {
    return globalRealTextureCache.get(mode)!;
  }

  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Base natural Martian tone while 32 satellite tiles stream in
  if (mode === "viking") {
    ctx.fillStyle = "#8a361c";
    ctx.fillRect(0, 0, width, height);
  } else if (mode === "mola") {
    ctx.fillStyle = "#0c4a6e";
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);
  }

  globalRealTextureCache.set(mode, canvas);

  const trekLayer =
    mode === "viking"
      ? "viking-mdim21"
      : mode === "mola"
      ? "mola-clrshade"
      : "themis-night-ir";

  const directTrekPath =
    mode === "viking"
      ? "Mars_Viking_MDIM21_ClrMosaic_global_232m"
      : mode === "mola"
      ? "Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw"
      : "Mars_MO_THEMIS-IR-Night_mosaic_global_100m_v2";

  // Stream full 8 cols x 4 rows matrix = 32 tiles at z=2 (2048x1024 px total)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.drawImage(img, col * 256, row * 256, 256, 256);
        if (onTileDrawn) onTileDrawn();
      };
      img.onerror = () => {
        // Fallback directly to NASA Trek upstream
        const fbImg = new Image();
        fbImg.crossOrigin = "anonymous";
        fbImg.onload = () => {
          ctx.drawImage(fbImg, col * 256, row * 256, 256, 256);
          if (onTileDrawn) onTileDrawn();
        };
        fbImg.src = `https://trek.nasa.gov/tiles/Mars/EQ/${directTrekPath}/1.0.0/default/default028mm/2/${row}/${col}.jpg`;
      };
      img.src = `/api/mars-tiles/${trekLayer}/2/${row}/${col}?raw=trek`;
    }
  }

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
  const bumpTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const isDragging = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRotation = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize Three.js Scene, 3D Globe Sphere, Atmosphere, and Lighting
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

    // Build real 2048x1024 satellite textures for Viking, MOLA, and THEMIS
    const notifyTileDrawn = () => {
      if (texturesMap.current.viking) texturesMap.current.viking.needsUpdate = true;
      if (texturesMap.current.mola) texturesMap.current.mola.needsUpdate = true;
      if (texturesMap.current.themis) texturesMap.current.themis.needsUpdate = true;
      if (bumpTextureRef.current) bumpTextureRef.current.needsUpdate = true;
    };

    const vikingCanvas = buildRealMarsSphereTexture("viking", notifyTileDrawn);
    const molaCanvas = buildRealMarsSphereTexture("mola", notifyTileDrawn);
    const themisCanvas = buildRealMarsSphereTexture("themis", notifyTileDrawn);

    const vikingTex = new THREE.CanvasTexture(vikingCanvas);
    const molaTex = new THREE.CanvasTexture(molaCanvas);
    const themisTex = new THREE.CanvasTexture(themisCanvas);
    // Real MOLA elevation texture used as bump map
    const bumpTex = new THREE.CanvasTexture(molaCanvas);

    texturesMap.current = {
      viking: vikingTex,
      mola: molaTex,
      themis: themisTex,
    };
    bumpTextureRef.current = bumpTex;

    // 1. Martian Globe Sphere (Radius = 3.0) with Real Satellite Texture & MOLA 3D Bump
    const globeGeo = new THREE.SphereGeometry(3.0, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: vikingTex,
      bumpMap: bumpTex,
      bumpScale: 0.25,
      roughness: 0.85,
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
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // 3. Realistic Lighting Rig (Solar Directional Light + Subtle Ambient)
    const sunLight = new THREE.DirectionalLight(0xfff6ea, 2.2);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x2d3748, 0.45);
    scene.add(ambientLight);

    const rimLight = new THREE.DirectionalLight(0xc2410c, 0.85);
    rimLight.position.set(-6, -2, -4);
    scene.add(rimLight);

    // 4. Background Starfield
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 80;
      starPositions[i + 1] = (Math.random() - 0.5) * 80;
      starPositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.28, transparent: true, opacity: 0.75 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 5. 3D Landmark Pins
    const pinsGroup = new THREE.Group();
    MARTIAN_LANDMARKS.forEach((lm) => {
      const pos = latLonToVector3(lm.lat, lm.lon, 3.03);

      const pinGeo = new THREE.CylinderGeometry(0.02, 0.005, 0.35, 8);
      pinGeo.rotateX(Math.PI / 2);

      const isSite = lm.siteId !== undefined;
      const pinColor = isSite ? 0xf59e0b : 0x06b6d4;
      const pinMat = new THREE.MeshBasicMaterial({ color: pinColor });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);

      pinMesh.position.copy(pos);
      pinMesh.lookAt(new THREE.Vector3(0, 0, 0));
      pinMesh.rotateY(Math.PI);

      const headGeo = new THREE.SphereGeometry(0.07, 16, 16);
      const headMat = new THREE.MeshBasicMaterial({
        color: isSite ? 0xfbbf24 : 0x22d3ee,
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.copy(latLonToVector3(lm.lat, lm.lon, 3.22));

      const landmarkHolder = new THREE.Group();
      landmarkHolder.name = `landmark_${lm.id}`;
      landmarkHolder.userData = { landmark: lm };
      landmarkHolder.add(pinMesh);
      landmarkHolder.add(headMesh);

      pinsGroup.add(landmarkHolder);
    });
    scene.add(pinsGroup);
    pinsGroupRef.current = pinsGroup;

    // Initial camera alignment to active site
    const initTarget = MARTIAN_LANDMARKS.find((l) => l.siteId === currentSite) || MARTIAN_LANDMARKS[0];
    const initialTargetPos = latLonToVector3(initTarget.lat, initTarget.lon, 3.0);
    targetRotation.current = {
      x: Math.atan2(initialTargetPos.z, initialTargetPos.x) - Math.PI / 2,
      y: (initTarget.lat * Math.PI) / 180,
    };
    globeMesh.rotation.y = targetRotation.current.x;
    globeMesh.rotation.x = -targetRotation.current.y * 0.5;
    pinsGroup.rotation.y = globeMesh.rotation.y;
    pinsGroup.rotation.x = globeMesh.rotation.x;

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (globeMeshRef.current && pinsGroupRef.current) {
        if (!isDragging.current) {
          if (isAutoRotate) {
            globeMeshRef.current.rotation.y += 0.0012;
            pinsGroupRef.current.rotation.y = globeMeshRef.current.rotation.y;
          } else {
            // Smooth dampening to target rotation
            globeMeshRef.current.rotation.y += (targetRotation.current.x - globeMeshRef.current.rotation.y) * 0.08;
            globeMeshRef.current.rotation.x += (-targetRotation.current.y * 0.5 - globeMeshRef.current.rotation.x) * 0.08;
            pinsGroupRef.current.rotation.y = globeMeshRef.current.rotation.y;
            pinsGroupRef.current.rotation.x = globeMeshRef.current.rotation.x;
          }
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update globe material when texture mode changes
  useEffect(() => {
    if (!globeMeshRef.current) return;
    const mat = globeMeshRef.current.material as THREE.MeshStandardMaterial;
    const nextTex = texturesMap.current[activeTextureMode];
    if (nextTex) {
      mat.map = nextTex;
      if (bumpTextureRef.current) {
        mat.bumpMap = bumpTextureRef.current;
        mat.bumpScale = 0.25;
      }
      mat.needsUpdate = true;
    }
  }, [activeTextureMode]);

  // Pointer Interaction Handlers for Interactive Rotation
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
    setIsAutoRotate(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !globeMeshRef.current || !pinsGroupRef.current) return;

    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    globeMeshRef.current.rotation.y += deltaX * 0.005;
    globeMeshRef.current.rotation.x += deltaY * 0.005;

    // Clamp pitch to prevent gimbal flip
    globeMeshRef.current.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, globeMeshRef.current.rotation.x));

    pinsGroupRef.current.rotation.y = globeMeshRef.current.rotation.y;
    pinsGroupRef.current.rotation.x = globeMeshRef.current.rotation.x;

    targetRotation.current.x = globeMeshRef.current.rotation.y;
    targetRotation.current.y = -globeMeshRef.current.rotation.x * 2.0;

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  // Landmark Click Raycasting
  const handleGlobeClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !pinsGroupRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(pinsGroupRef.current.children, true);

    if (intersects.length > 0) {
      let currentObj: THREE.Object3D | null = intersects[0].object;
      while (currentObj && !currentObj.name.startsWith("landmark_") && currentObj.parent) {
        currentObj = currentObj.parent;
      }
      if (currentObj && currentObj.userData.landmark) {
        const lm: Landmark = currentObj.userData.landmark;
        setSelectedLandmark(lm);
        handleFlyToLandmark(lm);
      }
    }
  };

  // Focus and orient camera towards clicked landmark
  const handleFlyToLandmark = (lm: Landmark) => {
    setSelectedLandmark(lm);
    setIsAutoRotate(false);

    const pos = latLonToVector3(lm.lat, lm.lon, 3.0);
    targetRotation.current = {
      x: Math.atan2(pos.z, pos.x) - Math.PI / 2,
      y: (lm.lat * Math.PI) / 180,
    };
  };

  return (
    <div className="relative w-full h-full bg-[#050811] overflow-hidden select-none font-mono">
      {/* Three.js Interactive Canvas Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleGlobeClick}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Left MMGIS Telemetry Card */}
      <div className="absolute top-4 left-4 z-10 pointer-events-auto bg-[#07090e]/95 border border-slate-800 p-3 text-xs w-[320px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-purple-500 animate-pulse" />
            <span className="text-purple-400 font-bold uppercase tracking-wider">
              {t("planetGlobe")} // IAU-2000
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-bold">R=3,396.19 KM</span>
        </div>

        {/* Layer Mode Switcher (Viking True Color vs MOLA vs THEMIS IR) */}
        <div className="flex flex-col gap-1.5 mb-3">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            NASA MARS TREK EQUIRECTANGULAR (2048x1024):
          </span>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            <button
              onClick={() => setActiveTextureMode("viking")}
              className={`py-1 px-1.5 border font-bold transition-colors ${
                activeTextureMode === "viking"
                  ? "bg-[#8a361c] text-slate-100 border-amber-500"
                  : "bg-[#0b0f17] text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              VIKING MDIM
            </button>
            <button
              onClick={() => setActiveTextureMode("mola")}
              className={`py-1 px-1.5 border font-bold transition-colors ${
                activeTextureMode === "mola"
                  ? "bg-[#0369a1] text-slate-100 border-cyan-400"
                  : "bg-[#0b0f17] text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              MOLA COLOR
            </button>
            <button
              onClick={() => setActiveTextureMode("themis")}
              className={`py-1 px-1.5 border font-bold transition-colors ${
                activeTextureMode === "themis"
                  ? "bg-[#4338ca] text-slate-100 border-indigo-400"
                  : "bg-[#0b0f17] text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              THEMIS NIGHT
            </button>
          </div>
        </div>

        {/* Auto-Rotation Toggle */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[10px]">
          <span className="text-slate-400">PLANETARY SPIN:</span>
          <button
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            className={`px-2 py-0.5 border font-bold transition-colors ${
              isAutoRotate
                ? "bg-[#064e3b] text-[#34d399] border-[#10b981]"
                : "bg-[#111827] text-slate-400 border-slate-800"
            }`}
          >
            {isAutoRotate ? "[SPIN ON]" : "[SPIN OFF]"}
          </button>
        </div>
      </div>

      {/* Top Right Exit Button */}
      <div className="absolute top-4 right-4 z-10 pointer-events-auto">
        <button
          onClick={onExitGlobe}
          className="px-3 py-1.5 bg-[#07090e]/95 border border-slate-700 hover:border-amber-500 text-slate-200 hover:text-amber-400 font-mono text-xs font-bold transition-colors flex items-center gap-2"
        >
          <span>[ 2D TACTICAL MAP ]</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Bottom Center Landmark Quick-Bar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-auto flex items-center gap-1.5 bg-[#07090e]/95 border border-slate-800 p-1 text-[10px]">
        {MARTIAN_LANDMARKS.map((lm) => {
          const isSelected = selectedLandmark?.id === lm.id;
          return (
            <button
              key={lm.id}
              onClick={() => handleFlyToLandmark(lm)}
              className={`px-2 py-1 border transition-colors ${
                isSelected
                  ? lm.siteId
                    ? "bg-amber-600 text-slate-950 font-bold border-amber-400"
                    : "bg-cyan-600 text-slate-950 font-bold border-cyan-400"
                  : "bg-[#0b0f17] text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {lm.id === "gale_crater"
                ? "GALE CRATER"
                : lm.id === "jezero_crater"
                ? "JEZERO CRATER"
                : lm.name.split(" ")[0].toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Selected Landmark Details Card */}
      {selectedLandmark && (
        <aside className="absolute right-4 top-16 bottom-20 w-[340px] z-10 pointer-events-auto bg-[#07090e]/95 border border-slate-800 p-4 text-xs flex flex-col justify-between">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                {selectedLandmark.tag}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                IAU: {selectedLandmark.lat >= 0 ? `${selectedLandmark.lat.toFixed(2)}°N` : `${Math.abs(selectedLandmark.lat).toFixed(2)}°S`},{" "}
                {selectedLandmark.lon.toFixed(2)}°E
              </span>
            </div>

            <h3 className="text-slate-100 font-bold text-sm leading-snug">
              {selectedLandmark.name}
            </h3>

            <div className="grid grid-cols-2 gap-2 p-2 bg-[#0b0f17] border border-slate-800 text-[10px]">
              <div>
                <span className="text-slate-500 block">DATUM ELEVATION:</span>
                <span className="text-slate-200 font-bold tabular-nums">
                  {selectedLandmark.elevationM >= 0 ? `+${selectedLandmark.elevationM}` : selectedLandmark.elevationM} M
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">GEOLOGIC EPOCH:</span>
                <span className="text-amber-400 font-bold">
                  {selectedLandmark.id === "olympus_mons" ? "AMAZONIAN" : selectedLandmark.id === "gale_crater" ? "HESPERIAN" : "NOACHIAN"}
                </span>
              </div>
            </div>

            <p className="text-slate-300 text-[11px] leading-relaxed">
              {selectedLandmark.description}
            </p>

            <div className="p-2 border border-slate-800 bg-[#090d15] text-[10px]">
              <span className="text-slate-500 block mb-1">REGIONAL GEOLOGIC UNIT:</span>
              <span className="text-cyan-300 font-medium">{selectedLandmark.geologicUnit}</span>
            </div>
          </div>

          {/* Action Button: Transition into 2D Tactical Map if Mission Site */}
          {selectedLandmark.siteId ? (
            <button
              onClick={() => {
                if (selectedLandmark.siteId) {
                  onSelectSite(selectedLandmark.siteId);
                }
              }}
              className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold uppercase tracking-wider text-xs border border-amber-400 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              <span>[ ENTER {selectedLandmark.siteId === "jezero_crater" ? "JEZERO" : "GALE"} TACTICAL MAP ]</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ) : (
            <div className="p-2 bg-[#0b0f17] border border-slate-800 text-center text-slate-500 text-[10px] mt-4">
              [ GLOBAL ORBITAL REFERENCE LANDMARK ]
            </div>
          )}
        </aside>
      )}
    </div>
  );
};

export default MarsGlobeViewer;
