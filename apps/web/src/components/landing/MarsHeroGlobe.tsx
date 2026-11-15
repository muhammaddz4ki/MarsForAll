"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Sparkles,
  Zap,
  RotateCcw,
  Shield,
  Activity,
  CheckCircle2,
  Thermometer,
} from "lucide-react";

// Gale Crater (Mount Sharp) Primary Target Parameters
const GALE_SITE = {
  name: "Mount Sharp // Gale Crater",
  subtitle: "MSL Curiosity Site (2025 Boxwork Ridge)",
  tag: "[TARGET: GALE CRATER]",
  lat: -5.4453,
  lon: 137.8414,
  radiusKm: "3,396.2 km",
  polarRadiusKm: "3,376.2 km",
  compression: "0.00589",
};

// 8 Expedition Corridor Waypoints spanning from Elysium Basin across Gale Crater to Mount Sharp
const SAFE_ROUTE_WAYPOINTS = [
  { name: "Elysium Spaceport // Base Alpha", lat: 16.5, lon: 114.2, tag: "EXPEDITION BASE" },
  { name: "Aeolis Fluvial Corridor", lat: 11.2, lon: 119.8, tag: "SAFE PASS" },
  { name: "Zephyrus Plains Station", lat: 6.4, lon: 125.4, tag: "BEDROCK FIRM" },
  { name: "Medusae Fossae Pass", lat: 1.8, lon: 130.6, tag: "LOW SLOPE <10°" },
  { name: "Gale North Rim Rampart", lat: -2.2, lon: 134.8, tag: "CRATER ENTRY" },
  { name: "Bradbury Landing (Curiosity Sol 0)", lat: -4.5895, lon: 137.4417, tag: "HISTORIC MSL" },
  { name: "Vera Rubin Hematite Ridge", lat: -4.95, lon: 137.62, tag: "HEMATITE RIDGE" },
  { name: "Mount Sharp Boxwork 2025", lat: -5.4453, lon: 137.8414, tag: "PRIMARY TARGET" },
];

// Helper: Convert Martian Lat/Lon to 3D Cartesian coordinates on sphere
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Helper: Generates a soft glowing radial star texture for the 3D Galactic Nebula
function createStarParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.2, "rgba(255, 255, 255, 0.85)");
    grad.addColorStop(0.5, "rgba(255, 255, 255, 0.35)");
    grad.addColorStop(0.8, "rgba(255, 255, 255, 0.08)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

export default function MarsHeroGlobe() {
  const t = useTranslations("landing.globe");
  const tAbout = useTranslations("landing.about");
  const containerRef = useRef<HTMLDivElement>(null);
  const outerWrapperRef = useRef<HTMLDivElement>(null);

  const [scrollProgress, setScrollProgress] = useState(0); // 0 = Stage 1 (Hero), 1 = Stage 2 (Tactical Dashboard)
  const [forceStage, setForceStage] = useState<number | null>(null);

  // Interactive 3D Card Tilt State for Stage 1 (100% Persis Seperti Gambar)
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });
  const [sheenPos, setSheenPos] = useState({ x: 50, y: 50 });
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const heroCardRef = useRef<HTMLDivElement | null>(null);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const tiltX = -((y - centerY) / centerY) * 4.5;
    const tiltY = ((x - centerX) / centerX) * 4.5;
    setCardTilt({ x: tiltX, y: tiltY });
    setSheenPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleCardMouseLeave = () => {
    setIsHoveringCard(false);
    setCardTilt({ x: 0, y: 0 });
  };

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeMeshRef = useRef<THREE.Mesh | null>(null);
  const galaxyPointsRef = useRef<THREE.Points | null>(null);
  const routeGroupRef = useRef<THREE.Group | null>(null);
  const targetBeaconRef = useRef<THREE.Mesh | null>(null);
  const targetRippleRef = useRef<THREE.Mesh | null>(null);
  const activeLineGeomRef = useRef<THREE.BufferGeometry | null>(null);
  const scoutMeshRef = useRef<THREE.Mesh | null>(null);
  const pulseBeadsRef = useRef<THREE.Mesh[]>([]);
  const surfacePointsRef = useRef<THREE.Vector3[]>([]);
  const routeProgressRef = useRef<number>(0);

  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0.0012, y: 0 });
  const targetRotation = useRef<{ x: number; y: number } | null>(null);

  const effectiveStageRatio = forceStage !== null ? (forceStage === 2 ? 1 : 0) : scrollProgress;
  const stageRatioRef = useRef(effectiveStageRatio);
  useEffect(() => {
    stageRatioRef.current = effectiveStageRatio;
  }, [effectiveStageRatio]);
  const isSection2Active = effectiveStageRatio > 0.45;

  // Track scroll position across the 220vh container
  useEffect(() => {
    const handleScroll = () => {
      if (!outerWrapperRef.current) return;
      const rect = outerWrapperRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;
      const scrolled = -rect.top;
      const ratio = Math.max(0, Math.min(1, scrolled / totalScrollable));
      setScrollProgress(ratio);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // When Section 2 becomes active, smoothly align Gale Crater towards front
  useEffect(() => {
    if (isSection2Active && globeMeshRef.current) {
      const targetY = -((GALE_SITE.lon + 90) * (Math.PI / 180));
      const targetX = (GALE_SITE.lat * (Math.PI / 180)) * 0.6;
      targetRotation.current = { x: targetX, y: targetY };
    }
  }, [isSection2Active]);

  // Three.js Scene Setup with Interactive Mars Globe + 3D Glowing Safe Route
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let width = container.clientWidth;
    let height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x030508, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 1. Background Starfield (2,200 stars)
    const starCount = 2200;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      const radius = 25 + Math.random() * 60;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[idx] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[idx + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[idx + 2] = radius * Math.cos(phi);

      const randColor = Math.random();
      if (randColor > 0.8) {
        starColors[idx] = 0.6; // ice blue
        starColors[idx + 1] = 0.85;
        starColors[idx + 2] = 1.0;
      } else if (randColor > 0.65) {
        starColors[idx] = 1.0; // amber
        starColors[idx + 1] = 0.75;
        starColors[idx + 2] = 0.55;
      } else {
        starColors[idx] = 0.95; // white
        starColors[idx + 1] = 0.95;
        starColors[idx + 2] = 0.95;
      }
    }

    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 1b. Swirling 3D Galactic Nebula Band behind Mars (Matching Reference Image)
    const galaxyStarTex = createStarParticleTexture();
    const galaxyParticleCount = 8000;
    const galaxyGeom = new THREE.BufferGeometry();
    const galaxyPositions = new Float32Array(galaxyParticleCount * 3);
    const galaxyColors = new Float32Array(galaxyParticleCount * 3);

    for (let i = 0; i < galaxyParticleCount; i++) {
      const idx = i * 3;
      // Parametric horizontal fiery galactic stream across Mars (matching reference image)
      const t = (i / galaxyParticleCount) * 2 - 1; // -1 (left) to +1 (right)
      const streamCurve = Math.sin(t * Math.PI * 0.9) * 1.8;
      
      // Dispersion spread around galactic arm spine
      const spreadX = (Math.random() - 0.5) * (3.5 + Math.abs(t) * 2.0);
      const spreadY = (Math.random() - 0.5) * (2.8 + Math.abs(t) * 1.5);
      const depthZ = -4.0 - Math.random() * 6.0; // distinctly behind the planet

      galaxyPositions[idx] = t * 16.0 + spreadX;
      galaxyPositions[idx + 1] = streamCurve + spreadY;
      galaxyPositions[idx + 2] = depthZ;

      // Fiery Red/Magenta on left (t < 0), Fiery Amber/Gold on right (t > 0)
      const rand = Math.random();
      if (t < -0.05) {
        // Left arm: Fiery Crimson, Ruby Red, Magenta
        galaxyColors[idx] = 0.95 + rand * 0.05;
        galaxyColors[idx + 1] = 0.12 + rand * 0.22;
        galaxyColors[idx + 2] = 0.28 + rand * 0.45;
      } else if (t > 0.05) {
        // Right arm: Fiery Amber, Warm Gold, Sunburst Orange
        galaxyColors[idx] = 1.0;
        galaxyColors[idx + 1] = 0.48 + rand * 0.42;
        galaxyColors[idx + 2] = rand * 0.12;
      } else {
        // Central transition: Warm blazing peach/orange core
        galaxyColors[idx] = 1.0;
        galaxyColors[idx + 1] = 0.65;
        galaxyColors[idx + 2] = 0.35;
      }
    }

    galaxyGeom.setAttribute("position", new THREE.BufferAttribute(galaxyPositions, 3));
    galaxyGeom.setAttribute("color", new THREE.BufferAttribute(galaxyColors, 3));

    const galaxyMaterial = new THREE.PointsMaterial({
      size: 0.36,
      map: galaxyStarTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const galaxyPoints = new THREE.Points(galaxyGeom, galaxyMaterial);
    scene.add(galaxyPoints);
    galaxyPointsRef.current = galaxyPoints;

    // 2. 3D Mars Globe Sphere with NASA Viking MDIM 2.1 HD Texture (Polar Cap + Enhanced Contrast)
    const globeRadius = 1.95;
    const globeGeometry = new THREE.SphereGeometry(globeRadius, 96, 96);

    const textureLoader = new THREE.TextureLoader();
    const marsColorMap = textureLoader.load("/images/mars-surface-hd.jpg", (tex) => {
      tex.needsUpdate = true;
    });
    marsColorMap.colorSpace = THREE.SRGBColorSpace;
    marsColorMap.minFilter = THREE.LinearMipmapLinearFilter;
    marsColorMap.magFilter = THREE.LinearFilter;

    const globeMaterial = new THREE.MeshStandardMaterial({
      map: marsColorMap,
      roughness: 0.86,
      metalness: 0.02,
    });

    const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    globeMesh.rotation.y = -Math.PI * 0.45;
    globeMesh.rotation.x = 0.28; // ~16 deg forward tilt to prominently display white north polar cap
    scene.add(globeMesh);
    globeMeshRef.current = globeMesh;

    // 3. Atmospheric Rim Glow (Warm orange-red haze matching reference)
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius * 1.025, 48, 48);
    const atmosphereMaterial = new THREE.ShaderMaterial({
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
          gl_FragColor = vec4(0.98, 0.42, 0.12, 1.0) * intensity * 0.9;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    globeMesh.add(atmosphereMesh);

    // 3b. Thin Concentric Orbit Ring (Warm amber-red matching reference image)
    const orbitalGroup = new THREE.Group();
    orbitalGroup.rotation.x = Math.PI * 0.14;
    orbitalGroup.rotation.z = -Math.PI * 0.06;

    const ringRadius = globeRadius * 1.25;
    const ringSegments = 128;
    const ringPositions = new Float32Array((ringSegments + 1) * 3);
    for (let i = 0; i <= ringSegments; i++) {
      const theta = (i / ringSegments) * Math.PI * 2;
      ringPositions[i * 3] = ringRadius * Math.cos(theta);
      ringPositions[i * 3 + 1] = ringRadius * Math.sin(theta);
      ringPositions[i * 3 + 2] = 0;
    }
    const ringGeom = new THREE.BufferGeometry();
    ringGeom.setAttribute("position", new THREE.BufferAttribute(ringPositions, 3));
    const ringMat = new THREE.LineBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.35,
    });
    const ringLine = new THREE.Line(ringGeom, ringMat);
    orbitalGroup.add(ringLine);

    // 3 small satellite nodes on the ring
    const satAngles = [0.5, 2.6, 4.7];
    satAngles.forEach((theta) => {
      const satGeom = new THREE.SphereGeometry(0.024, 12, 12);
      const satMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
      const satMesh = new THREE.Mesh(satGeom, satMat);
      satMesh.position.set(ringRadius * Math.cos(theta), ringRadius * Math.sin(theta), 0);
      orbitalGroup.add(satMesh);
    });

    globeMesh.add(orbitalGroup);

    // 4. 3D GLOWING SAFE ROUTE ON MARS SURFACE ("Menjalar" Alur Google Maps)
    const routeGroup = new THREE.Group();
    const routePoints3D: THREE.Vector3[] = SAFE_ROUTE_WAYPOINTS.map((wp) =>
      latLonToVector3(wp.lat, wp.lon, globeRadius + 0.022)
    );

    // Smooth CatmullRom curve projected strictly onto Mars spherical surface (no dipping)
    const rawCurve = new THREE.CatmullRomCurve3(routePoints3D, false, "centripetal");
    const rawPoints = rawCurve.getPoints(260);
    const surfacePoints = rawPoints.map((pt) =>
      pt.clone().normalize().multiplyScalar(globeRadius + 0.024)
    );
    surfacePointsRef.current = surfacePoints;

    // A. Base Guide Line (Faint sky blue track like Google Maps planned route)
    const baseLineGeom = new THREE.BufferGeometry().setFromPoints(surfacePoints);
    const baseLineMat = new THREE.LineBasicMaterial({
      color: 0x0284c7, // sky-600
      transparent: true,
      opacity: 0.4,
      linewidth: 2,
    });
    const baseLine = new THREE.Line(baseLineGeom, baseLineMat);
    routeGroup.add(baseLine);

    // B. Active "Menjalar" Route Line (Progressively draws forward)
    const activeLineGeom = new THREE.BufferGeometry().setFromPoints(surfacePoints);
    activeLineGeom.setDrawRange(0, 2);
    const activeLineMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee, // vibrant glowing cyan
      transparent: true,
      opacity: 0.95,
      linewidth: 3,
    });
    const activeLine = new THREE.Line(activeLineGeom, activeLineMat);
    routeGroup.add(activeLine);
    activeLineGeomRef.current = activeLineGeom;

    // C. Leading Scout Navigation Cursor (Rides at current front tip)
    const scoutGeom = new THREE.SphereGeometry(0.042, 16, 16);
    const scoutMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const scoutMesh = new THREE.Mesh(scoutGeom, scoutMat);
    scoutMesh.position.copy(surfacePoints[0]);
    routeGroup.add(scoutMesh);
    scoutMeshRef.current = scoutMesh;

    // D. Flowing GPS Energy Beads (Google Maps traffic stream effect)
    const pulseBeads: THREE.Mesh[] = [];
    const beadGeom = new THREE.SphereGeometry(0.024, 12, 12);
    for (let i = 0; i < 8; i++) {
      const beadMat = new THREE.MeshBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.9,
      });
      const beadMesh = new THREE.Mesh(beadGeom, beadMat);
      beadMesh.position.copy(surfacePoints[0]);
      routeGroup.add(beadMesh);
      pulseBeads.push(beadMesh);
    }
    pulseBeadsRef.current = pulseBeads;

    // E. Tactical Waypoint Markers & Destination Pin
    routePoints3D.forEach((pos, idx) => {
      const isOrigin = idx === 0;
      const isTarget = idx === routePoints3D.length - 1;

      // Node marker sphere
      const nodeRadius = isTarget ? 0.055 : isOrigin ? 0.042 : 0.022;
      const nodeGeom = new THREE.SphereGeometry(nodeRadius, 14, 14);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: isTarget ? 0xf97316 : isOrigin ? 0x06b6d4 : 0x7dd3fc,
        transparent: true,
        opacity: 0.9,
      });
      const nodeMesh = new THREE.Mesh(nodeGeom, nodeMat);
      nodeMesh.position.copy(pos);
      routeGroup.add(nodeMesh);

      // Radar ripple rings for origin and target
      if (isOrigin) {
        const originRingGeom = new THREE.RingGeometry(0.05, 0.075, 24);
        const originRingMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.6,
        });
        const originRingMesh = new THREE.Mesh(originRingGeom, originRingMat);
        originRingMesh.position.copy(pos);
        originRingMesh.lookAt(0, 0, 0);
        routeGroup.add(originRingMesh);
      }

      if (isTarget) {
        // Base ring
        const beaconGeom = new THREE.RingGeometry(0.06, 0.085, 32);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: 0xf97316,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        });
        const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
        beaconMesh.position.copy(pos);
        beaconMesh.lookAt(0, 0, 0);
        routeGroup.add(beaconMesh);
        targetBeaconRef.current = beaconMesh;

        // Expanding ripple ring
        const rippleGeom = new THREE.RingGeometry(0.07, 0.095, 32);
        const rippleMat = new THREE.MeshBasicMaterial({
          color: 0xf97316,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });
        const rippleMesh = new THREE.Mesh(rippleGeom, rippleMat);
        rippleMesh.position.copy(pos);
        rippleMesh.lookAt(0, 0, 0);
        routeGroup.add(rippleMesh);
        targetRippleRef.current = rippleMesh;
      }
    });

    globeMesh.add(routeGroup);
    routeGroupRef.current = routeGroup;

    // 6. Lighting (Matches Reference: Solar Key Light from Top-Left, Warm Amber Shadows)
    const ambientLight = new THREE.AmbientLight(0x221310, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ee, 2.8);
    sunLight.position.set(-5, 6, 4.5);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0xe11d48, 1.1);
    rimLight.position.set(6, -3, -3);
    scene.add(rimLight);

    // 7. Pointer Interactions (Mouse / Touch Drag)
    const onPointerDown = (e: PointerEvent) => {
      isDragging.current = true;
      targetRotation.current = null;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current || !globeMeshRef.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      rotationVelocity.current = {
        x: deltaX * 0.004,
        y: deltaY * 0.003,
      };

      globeMeshRef.current.rotation.y += rotationVelocity.current.x;
      globeMeshRef.current.rotation.x += rotationVelocity.current.y;
      globeMeshRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, globeMeshRef.current.rotation.x));

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // 8. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (globeMeshRef.current) {
        if (targetRotation.current) {
          const dy = targetRotation.current.y - globeMeshRef.current.rotation.y;
          const dx = targetRotation.current.x - globeMeshRef.current.rotation.x;
          globeMeshRef.current.rotation.y += dy * 0.06;
          globeMeshRef.current.rotation.x += dx * 0.06;

          if (Math.abs(dy) < 0.001 && Math.abs(dx) < 0.001) {
            targetRotation.current = null;
          }
        } else if (!isDragging.current) {
          globeMeshRef.current.rotation.y += rotationVelocity.current.x;
          rotationVelocity.current.x *= 0.95;
          rotationVelocity.current.y *= 0.95;

          if (Math.abs(rotationVelocity.current.x) < 0.0012) {
            globeMeshRef.current.rotation.y += 0.001;
          }
        }

        // Cinematic Zoom and Position shift to bottom-left corner when scrolling into Section 2
        // Matches target reference: Planet curves from bottom-left up through the left flank
        const ratio = stageRatioRef.current;
        const isMobile = window.innerWidth < 1024;
        const targetX = isMobile ? ratio * -0.7 : ratio * -2.45;
        const targetY = isMobile ? ratio * -1.35 : ratio * -1.2;
        const targetScale = isMobile ? 1.0 + ratio * 1.4 : 1.0 + ratio * 1.85;

        globeMeshRef.current.position.x += (targetX - globeMeshRef.current.position.x) * 0.08;
        globeMeshRef.current.position.y += (targetY - globeMeshRef.current.position.y) * 0.08;
        
        const curScale = globeMeshRef.current.scale.x;
        const nextScale = curScale + (targetScale - curScale) * 0.08;
        globeMeshRef.current.scale.setScalar(nextScale);
      }

      starField.rotation.y += 0.0002;
      if (galaxyPointsRef.current) {
        galaxyPointsRef.current.rotation.z += 0.0002;
        galaxyPointsRef.current.rotation.y += 0.0001;
        const ratio = stageRatioRef.current;
        const targetGalaxyOpacity = Math.max(0.3, 0.88 * (1 - ratio * 0.5));
        (galaxyPointsRef.current.material as THREE.PointsMaterial).opacity = targetGalaxyOpacity;
      }

      // Google Maps Navigation Route Animation: Menjalar + Flowing GPS Pulses
      const surfacePoints = surfacePointsRef.current;
      if (activeLineGeomRef.current && surfacePoints.length > 0) {
        routeProgressRef.current += 0.0035;
        if (routeProgressRef.current > 1.35) {
          routeProgressRef.current = 0; // loops the crawling animation
        }

        const currentP = Math.min(1, routeProgressRef.current);
        const drawCount = Math.max(2, Math.floor(currentP * (surfacePoints.length - 1)));
        activeLineGeomRef.current.setDrawRange(0, drawCount);

        // Position lead scout navigation head at advancing front
        if (scoutMeshRef.current && surfacePoints[drawCount - 1]) {
          scoutMeshRef.current.position.copy(surfacePoints[drawCount - 1]);
          const pulse = Math.sin(elapsedTime * 8) * 0.25;
          scoutMeshRef.current.scale.setScalar(1 + pulse);
        }

        // Flowing GPS pulse beads along the active path ("alur Google Maps")
        if (pulseBeadsRef.current && pulseBeadsRef.current.length > 0) {
          pulseBeadsRef.current.forEach((bead, i) => {
            const beadP = ((elapsedTime * 0.16 + i / pulseBeadsRef.current.length) % 1) * currentP;
            const beadIdx = Math.min(surfacePoints.length - 1, Math.floor(beadP * (surfacePoints.length - 1)));
            if (surfacePoints[beadIdx]) {
              bead.position.copy(surfacePoints[beadIdx]);
              bead.scale.setScalar(0.75 + Math.sin(elapsedTime * 6 + i) * 0.25);
            }
          });
        }
      }

      // Target Boxwork beacon & radar ripple rings
      if (targetBeaconRef.current) {
        const pulse = (Math.sin(elapsedTime * 4) + 1) * 0.5;
        targetBeaconRef.current.scale.set(1 + pulse * 0.25, 1 + pulse * 0.25, 1);
      }
      if (targetRippleRef.current) {
        const ripple = (elapsedTime * 1.5) % 1; // 0 to 1
        targetRippleRef.current.scale.set(1 + ripple * 2.2, 1 + ripple * 2.2, 1);
        if ((targetRippleRef.current.material as THREE.Material)) {
          (targetRippleRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, (1 - ripple) * 0.75);
        }
      }

      renderer.render(scene, camera);
    };
    animate();

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
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      galaxyGeom.dispose();
      galaxyMaterial.dispose();
      galaxyStarTex.dispose();
      globeGeometry.dispose();
      marsColorMap.dispose();
      globeMaterial.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    };
  }, []);

  // Update Route Opacity based on Effective Stage Ratio (smooth transition to Section 2)
  useEffect(() => {
    if (!routeGroupRef.current) return;
    const targetOpacity = Math.max(0.75, Math.min(1, 0.75 + effectiveStageRatio * 0.25));
    
    routeGroupRef.current.children.forEach((child) => {
      if ((child as any).material) {
        const mat = (child as any).material;
        mat.opacity = targetOpacity;
      }
    });
  }, [effectiveStageRatio]);

  return (
    <div ref={outerWrapperRef} className="relative w-full h-[220vh] bg-[#030508] select-none font-sans text-white">
      
      {/* =========================================================
          STICKY FULLSCREEN VIEWPORT (Contains 3D Globe + Two HUD Stages)
      ========================================================= */}
      <div className="sticky top-0 w-full h-screen overflow-hidden bg-[#030508]">
        
        {/* =========================================================
            STAGE 1: EXACT HD HERO ARTWORK (100% PERSIS SEPERTI GAMBAR)
            Matches user's reference image: Rounded card with golden glow, deep space, glowing MA/RS, 
            polar ice cap on Mars, concentric orbit rings with satellites, and fiery nebula ribbons
        ========================================================= */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4 sm:px-6 lg:px-8 pointer-events-none transition-all duration-700"
          style={{
            opacity: Math.max(0, 1 - effectiveStageRatio * 2.2),
            transform: `scale(${1 - effectiveStageRatio * 0.08}) translateY(${-effectiveStageRatio * 50}px)`,
          }}
        >
          {/* Main Interactive Hero Card (Persis Seperti Gambar) */}
          <div 
            ref={heroCardRef}
            onMouseMove={handleCardMouseMove}
            onMouseEnter={() => setIsHoveringCard(true)}
            onMouseLeave={handleCardMouseLeave}
            className="relative w-full max-w-5xl aspect-[1024/571] rounded-2xl sm:rounded-3xl overflow-hidden pointer-events-auto transition-transform duration-200 ease-out select-none shadow-[0_25px_80px_rgba(0,0,0,0.92),0_0_50px_rgba(249,115,22,0.2)] border border-[#f97316]/30 cursor-pointer"
            style={{
              transform: `perspective(1000px) rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
            }}
          >
            <img
              src="/images/mars-hero-exact.jpg"
              alt="MARSFORALL: Mars with MA RS Cosmic Nebula"
              className="w-full h-full object-cover object-center"
            />
            
            {/* Subtle interactive specular light sheen across card surface */}
            <div 
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle at ${sheenPos.x}% ${sheenPos.y}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
                opacity: isHoveringCard ? 1 : 0,
              }}
            />
          </div>

          {/* Minimalist Sub-hint below Card */}
          <div className="mt-4 sm:mt-5 flex items-center gap-3 text-slate-400 font-mono text-xs select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] animate-pulse" />
            <span className="tracking-widest uppercase">MARTIAN MAP RECON</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-[11px] tracking-wider">Scroll ke bawah untuk navigasi misi ↓</span>
          </div>
        </div>

        {/* 2. PERSISTENT 3D MARS GLOBE (Zooms to bottom-left corner in Section 2) */}
        <div
          ref={containerRef}
          className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing touch-none transition-opacity duration-500"
          style={{
            opacity: Math.min(1, Math.max(0, (effectiveStageRatio - 0.08) * 2.5)),
            pointerEvents: effectiveStageRatio > 0.25 ? "auto" : "none",
          }}
          title="Drag to rotate Mars 360°"
        />

        {/* =========================================================
            STAGE 2 OVERLAY (Cinematic Mission Overview: Floating Astronaut & Universe-Travel Typography)
            Matches user's reference image: 3D Mars in bottom-left, floating realistic astronaut, clean Universe-travel typography
        ========================================================= */}
        <div 
          className="absolute inset-0 pointer-events-none transition-all duration-700 z-30 flex flex-col justify-between overflow-hidden"
          style={{
            opacity: Math.max(0, Math.min(1, (effectiveStageRatio - 0.22) * 2.2)),
            display: effectiveStageRatio < 0.15 ? "none" : "flex",
          }}
        >
          {/* Subtle atmospheric backdrop on the right for pristine typographic contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#030508]/30 to-[#030508]/80 pointer-events-none -z-10" />

          {/* Main Content Area */}
          <div className="relative w-full h-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-24 sm:pt-28 pb-16 flex items-center justify-between">
            
            {/* ──── LEFT: FLOATING ZERO-G ASTRONAUT OVER MARS CURVATURE ──── */}
            <div 
              className="relative w-1/2 max-w-[460px] lg:max-w-[540px] h-full hidden md:flex items-center justify-center pointer-events-none transition-transform duration-700 select-none"
              style={{
                transform: `translateX(${(1 - Math.min(1, effectiveStageRatio)) * -140}px)`,
              }}
            >
              {/* Geometric blue frame accent (from reference image) */}
              <div className="absolute w-44 sm:w-60 lg:w-72 h-80 sm:h-96 lg:h-[430px] border border-sky-400/35 rounded-sm -translate-x-6 sm:-translate-x-10 translate-y-4 sm:translate-y-6 -z-10 shadow-[0_0_25px_rgba(56,189,248,0.12)]" />

              {/* Floating HD Spacewalker Astronaut (Realistic from Reference) */}
              <div className="relative w-full max-w-[360px] lg:max-w-[440px] animate-astronaut-float">
                <img
                  src="/images/astronaut-floating.png"
                  alt="Floating Martian Astronaut in EVA Spacesuit"
                  className="w-full h-auto object-contain drop-shadow-[0_25px_60px_rgba(0,0,0,0.92)] filter brightness-100"
                />
              </div>

              {/* Subtle status tag under astronaut */}
              <div className="absolute bottom-8 left-4 font-mono text-[10px] text-slate-400/80 tracking-wider">
                <span>[EVA STATUS: DRIFT NOMINAL]</span>
              </div>
            </div>

            {/* ──── RIGHT: CINEMATIC MISSION HEADLINE & TEXT (Universe — travel Style) ──── */}
            <div 
              className="w-full md:w-1/2 lg:max-w-xl flex flex-col justify-center space-y-6 pointer-events-auto transition-transform duration-700 z-10"
              style={{
                transform: `translateY(${Math.max(0, (1 - effectiveStageRatio) * 60)}px)`,
              }}
            >
              {/* Category Tag */}
              <div className="flex items-center gap-2.5 font-mono text-xs font-bold text-[#f97316] uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse" />
                <span>{tAbout("tag")}</span>
              </div>

              {/* Headline matching reference image ("Universe — travel") */}
              <div className="space-y-1.5 select-none">
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-white font-sans leading-[1.02]">
                  MARSFORALL
                </h1>
                <div className="flex items-center gap-3 text-2xl sm:text-3xl lg:text-4xl font-light text-slate-300 font-sans tracking-tight">
                  <span className="inline-block w-8 sm:w-14 h-[2px] bg-slate-500 shrink-0" />
                  <span>{tAbout("titleSub")}</span>
                </div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#f97316] font-sans tracking-tight pt-1 leading-snug">
                  {tAbout("titleHighlight")}
                </div>
              </div>

              {/* Description Paragraph */}
              <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans font-light max-w-lg">
                {tAbout("desc")}
              </p>

              {/* Operational Metadata Row (like OFFICE & GET IN TOUCH in Reference) */}
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800/80 font-mono text-xs max-w-lg">
                <div>
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">
                    {tAbout("targetSiteLabel")}
                  </div>
                  <div className="text-white font-semibold">{tAbout("targetSiteVal")}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{tAbout("coordsLabel")}</div>
                </div>

                <div>
                  <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">
                    {tAbout("safetyLabel")}
                  </div>
                  <div className="text-cyan-400 font-semibold">{tAbout("safetyVal")}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">{tAbout("safetySub")}</div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link
                  href="/peta"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white font-mono text-xs font-bold tracking-wider transition-colors border border-[#f97316]/50 shadow-none pointer-events-auto"
                >
                  <span>{tAbout("cta")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

            </div>

          </div>

          {/* ──── VERTICAL ACCENTS ON FAR LEFT (from reference image) ──── */}
          <div className="absolute left-8 top-1/2 -translate-y-1/2 hidden 2xl:flex flex-col gap-6 text-[10px] font-mono text-slate-400/70 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 select-none pointer-events-none z-30">
            <span>{tAbout("evaBadge")}</span>
            <span className="w-8 h-[1px] bg-slate-800" />
            <span>{tAbout("evaCockpit")}</span>
          </div>

          {/* Bottom-Left Circular Scroll Down Indicator */}
          <div className="absolute left-8 bottom-10 hidden sm:flex items-center gap-3 select-none pointer-events-none z-30">
            <div className="w-10 h-10 rounded-full border border-slate-700/80 flex items-center justify-center text-slate-400 bg-[#07090e]/40 backdrop-blur-sm">
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </div>
            <span className="text-[10px] font-mono text-slate-400/90 tracking-wider">
              {tAbout("scrollExplore")}
            </span>
          </div>

          {/* Far-Right Pagination & Navigation Arrows (from reference image) */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-4 select-none pointer-events-auto z-30">
            <span className="text-xs font-mono font-bold text-white tracking-widest">02</span>
            <div className="w-[1px] h-12 bg-slate-700" />
            <span className="text-xs font-mono text-slate-500 tracking-widest">03</span>

            <div className="flex flex-col gap-2 mt-2">
              <button
                type="button"
                onClick={() => setForceStage(1)}
                className="w-8 h-8 rounded-lg border border-slate-800 hover:border-slate-600 bg-[#07090e]/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                title="Halaman 1 (Hero)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setForceStage(2)}
                className="w-8 h-8 rounded-lg border border-slate-800 hover:border-slate-600 bg-[#07090e]/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                title="Halaman 2 (Misi)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Smooth Cosmic Gradient (Requested: 'bawahnya kasih gradasi') */}
        <div className="absolute bottom-0 left-0 right-0 h-44 sm:h-60 bg-gradient-to-t from-[#030508] via-[#030508]/85 to-transparent pointer-events-none z-25" />

      </div>

    </div>
  );
}
