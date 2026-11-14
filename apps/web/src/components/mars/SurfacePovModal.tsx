"use client";

import React, { useState, useRef, useCallback } from "react";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";

interface SurfacePovModalProps {
  waypoint: MountSharpWaypoint | null;
  onClose: () => void;
  theme?: "dark" | "light";
}

interface ScienceHotspot {
  id: string;
  code: string;
  name: string;
  azimuth: number; // 0° - 360°
  pitch: number;   // -25° to +45°
  instrument: string;
  metricLabel: string;
  metricValue: string;
  description: string;
}

const SCIENCE_HOTSPOTS: ScienceHotspot[] = [
  {
    id: "pin_01",
    code: "PIN-01",
    name: "BOXWORK VEIN OUTCROP",
    azimuth: 145,
    pitch: -5,
    instrument: "APXS / CHEMCAM",
    metricLabel: "SULFATE FILL",
    metricValue: "34.2% SO3 / Ca-Sulfate",
    description: "Polygonal ridge network formed by ancient deep subsurface hydrothermal fluid flow in Aeolis Mons strata.",
  },
  {
    id: "pin_02",
    code: "PIN-02",
    name: "CURIOSITY SOL-4180 ROVER TRACKS",
    azimuth: 210,
    pitch: -18,
    instrument: "HAZCAM / MOBILITY",
    metricLabel: "REGOLITH SINKAGE",
    metricValue: "3.2 cm basaltic sand",
    description: "Curiosity 50cm cleated aluminum wheel imprint showing regolith bearing capacity and eolian ripple compaction.",
  },
  {
    id: "pin_03",
    code: "PIN-03",
    name: "CHEMCAM LIBS LASER TARGET",
    azimuth: 95,
    pitch: -2,
    instrument: "CHEMCAM LIBS",
    metricLabel: "EMISSION SPECTRA",
    metricValue: "High-Si / Al Phyllosilicate",
    description: "Pitted laser-ablation target analyzing clay-sulfate transition zone bedrock with 1064nm optical laser.",
  },
];

export const SurfacePovModal: React.FC<SurfacePovModalProps> = ({
  waypoint,
  onClose,
  theme = "dark",
}) => {
  const initialAz = waypoint?.roverRawImage?.pointingAzimuthDeg ?? 142;
  const initialPitch = waypoint?.roverRawImage?.elevationAngleDeg ?? -4.5;

  const [povMode, setPovMode] = useState<"panorama" | "tactical_lidar">("panorama");
  const [azimuth, setAzimuth] = useState<number>(initialAz);
  const [pitch, setPitch] = useState<number>(initialPitch);
  const [zoom, setZoom] = useState<number>(1.0);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  // Drag interaction state
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; startAz: number; startPitch: number }>({
    x: 0,
    y: 0,
    startAz: initialAz,
    startPitch: initialPitch,
  });
  const viewportRef = useRef<HTMLDivElement>(null);

  if (!waypoint) return null;

  const isDark = theme === "dark";
  const roverImage = waypoint.roverRawImage;

  // Viewport FOV calculations
  const fovX = 70 / zoom; // horizontal field of view in degrees
  const fovY = 44 / zoom; // vertical field of view in degrees
  const halfFovX = fovX / 2;
  const halfFovY = fovY / 2;

  // Normalize azimuth to 0-360
  const normalizedAz = ((azimuth % 360) + 360) % 360;

  // Pointer drag handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startAz: azimuth,
      startPitch: pitch,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const deltaAz = -(dx / rect.width) * fovX;
    const deltaPitch = (dy / rect.height) * fovY;

    const newAz = ((dragStartRef.current.startAz + deltaAz) % 360 + 360) % 360;
    const newPitch = Math.max(-25, Math.min(45, dragStartRef.current.startPitch + deltaPitch));

    setAzimuth(Math.round(newAz * 10) / 10);
    setPitch(Math.round(newPitch * 10) / 10);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture already lost
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.max(1.0, Math.min(2.5, Math.round((prev + delta) * 10) / 10)));
  };

  const resetPov = () => {
    setAzimuth(initialAz);
    setPitch(initialPitch);
    setZoom(1.0);
    setActivePinId(null);
  };

  // Compass tick angles (every 15° around 360°)
  const compassTicks = [
    { deg: 0, label: "N" },
    { deg: 30, label: "30" },
    { deg: 45, label: "NE" },
    { deg: 60, label: "60" },
    { deg: 90, label: "E" },
    { deg: 120, label: "120" },
    { deg: 135, label: "SE" },
    { deg: 150, label: "150" },
    { deg: 180, label: "S" },
    { deg: 210, label: "210" },
    { deg: 225, label: "SW" },
    { deg: 240, label: "240" },
    { deg: 270, label: "W" },
    { deg: 300, label: "300" },
    { deg: 315, label: "NW" },
    { deg: 330, label: "330" },
  ];

  // Helper to calculate delta angle wrapped to [-180, 180]
  const getAngleDelta = (targetDeg: number, currentDeg: number) => {
    return ((targetDeg - currentDeg + 540) % 360) - 180;
  };

  // Cardinal direction label for current azimuth
  const getCardinal = (deg: number) => {
    const val = ((deg % 360) + 360) % 360;
    if (val >= 337.5 || val < 22.5) return "N";
    if (val >= 22.5 && val < 67.5) return "NE";
    if (val >= 67.5 && val < 112.5) return "E";
    if (val >= 112.5 && val < 157.5) return "SE";
    if (val >= 157.5 && val < 202.5) return "S";
    if (val >= 202.5 && val < 247.5) return "SW";
    if (val >= 247.5 && val < 292.5) return "W";
    return "NW";
  };

  const activePin = SCIENCE_HOTSPOTS.find((p) => p.id === activePinId);

  // Parallax background offset based on azimuth & pitch
  const bgHorizonShiftX = -((normalizedAz / 360) * 100);
  const bgMidgroundShiftX = -((normalizedAz / 360) * 160);
  const bgPitchOffset = (pitch / 45) * 35; // vertical shift in px

  // Rover raw image center angle relative to current azimuth
  const roverTargetAz = roverImage?.pointingAzimuthDeg ?? 142;
  const roverTargetPitch = roverImage?.elevationAngleDeg ?? -4.5;
  const dAzRover = getAngleDelta(roverTargetAz, normalizedAz);
  const dPitchRover = roverTargetPitch - pitch;
  const isRoverImageVisible =
    roverImage &&
    !imageFailed &&
    Math.abs(dAzRover) <= halfFovX + 35 &&
    Math.abs(dPitchRover) <= halfFovY + 25;
  const roverImgScreenX = 50 + (dAzRover / halfFovX) * 50;
  const roverImgScreenY = 50 - (dPitchRover / halfFovY) * 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 select-none">
      <div
        className={`relative w-full max-w-5xl border flex flex-col max-h-[94vh] shadow-none ${
          isDark ? "bg-[#0b0f17] border-slate-700" : "bg-white border-slate-300"
        }`}
      >
        {/* Top Tactical Banner */}
        <div
          className={`px-4 py-2 border-b flex items-center justify-between ${
            isDark ? "bg-[#111827] border-slate-800" : "bg-slate-100 border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-amber-500" />
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-[10px] font-bold uppercase tracking-widest block ${
                    isDark ? "text-amber-400" : "text-amber-800"
                  }`}
                >
                  360° SURFACE PANORAMIC EXPLORER // {povMode === "panorama" ? "SURFACE PANORAMA" : "TACTICAL LIDAR"}
                </span>
                <span className="font-mono text-[9px] text-cyan-400 border border-cyan-800/80 bg-[#07090e] px-1 py-0.2">
                  FOV: {Math.round(fovX)}°
                </span>
              </div>
              <h2 className={`text-xs font-mono font-semibold uppercase ${isDark ? "text-white" : "text-slate-900"}`}>
                {waypoint.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle: 360° PANORAMA vs TACTICAL LIDAR */}
            <div className="flex bg-[#07090e] border border-slate-700 p-0.5 font-mono text-[10px]">
              <button
                onClick={() => setPovMode("panorama")}
                className={`px-2.5 py-1 transition-colors ${
                  povMode === "panorama"
                    ? "bg-amber-600 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                360° PANORAMA
              </button>
              <button
                onClick={() => setPovMode("tactical_lidar")}
                className={`px-2.5 py-1 transition-colors ${
                  povMode === "tactical_lidar"
                    ? "bg-cyan-600 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                TACTICAL LIDAR
              </button>
            </div>

            <span className="font-mono text-[10px] text-slate-300 bg-[#161e2e] border border-slate-700 px-2 py-1 tabular-nums hidden sm:inline-block">
              DATUM: {waypoint.elevationM} m
            </span>

            <button
              onClick={onClose}
              title="Close Viewer"
              className="w-7 h-7 bg-[#1f2937] hover:bg-[#374151] border border-slate-600 text-slate-300 font-mono text-xs flex items-center justify-center transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* 360° Interactive Panoramic Viewport */}
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          className="relative w-full h-80 sm:h-96 bg-[#07090e] border-b border-slate-800 overflow-hidden cursor-grab active:cursor-grabbing select-none"
        >
          {/* LAYER 1: COMPASS HEADING TAPE (Top HUD Ribbon) */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-[#0b0f17]/90 border-b border-slate-800 z-30 pointer-events-none overflow-hidden font-mono">
            {/* Center tick indicator */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-amber-500 z-40" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-bold z-40">
              {Math.round(normalizedAz)}° {getCardinal(normalizedAz)}
            </div>

            {/* Moving compass ticks */}
            <div className="relative w-full h-full">
              {compassTicks.map((tick) => {
                const dAz = getAngleDelta(tick.deg, normalizedAz);
                if (Math.abs(dAz) > halfFovX + 10) return null;
                const screenX = 50 + (dAz / halfFovX) * 50;
                return (
                  <div
                    key={tick.deg}
                    style={{ left: `${screenX}%` }}
                    className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center"
                  >
                    <span className="text-[8px] text-slate-400 font-bold leading-none mb-0.5">
                      {tick.label}
                    </span>
                    <span className="w-px h-2 bg-slate-600" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* LAYER 2: 360° MARS TERRAIN HORIZON & PANORAMA (MODE A vs MODE B) */}
          {povMode === "panorama" ? (
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                transform: `translateY(${bgPitchOffset}px)`,
                transition: isDraggingRef.current ? "none" : "transform 0.1s ease-out",
              }}
            >
              {/* Sky Dome (Flat solid Mars Ochre/Dust sky) */}
              <div className="absolute inset-0 bg-[#2b1712]" />

              {/* Distant Gale Crater Rim & Aeolis Mons Mountain Silhouette (Parallax Layer 1) */}
              <div
                className="absolute bottom-16 w-[300%] h-56 flex"
                style={{
                  left: `${bgHorizonShiftX}%`,
                  transition: isDraggingRef.current ? "none" : "left 0.1s ease-out",
                }}
              >
                {[0, 1, 2].map((idx) => (
                  <svg
                    key={idx}
                    className="w-1/3 h-full shrink-0 text-[#4a221a]"
                    viewBox="0 0 1000 200"
                    preserveAspectRatio="none"
                  >
                    <polygon
                      points="0,200 80,130 180,150 290,90 410,135 520,65 640,115 760,85 880,140 1000,105 1000,200"
                      fill="currentColor"
                    />
                  </svg>
                ))}
              </div>

              {/* Midground Sulfate Ridge / Boxwork Layer (Parallax Layer 2) */}
              <div
                className="absolute bottom-6 w-[300%] h-44 flex"
                style={{
                  left: `${bgMidgroundShiftX}%`,
                  transition: isDraggingRef.current ? "none" : "left 0.1s ease-out",
                }}
              >
                {[0, 1, 2].map((idx) => (
                  <svg
                    key={idx}
                    className="w-1/3 h-full shrink-0 text-[#210e0b]"
                    viewBox="0 0 1000 160"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,160 L0,105 Q120,70 240,95 T480,75 T720,100 T1000,80 L1000,160 Z"
                      fill="currentColor"
                    />
                    {/* Sulfate Ridge Lattice Strata */}
                    <path
                      d="M150,110 L230,85 L320,100 M450,90 L520,70 L610,95 M780,105 L870,85 L950,95"
                      stroke="#8c4738"
                      strokeWidth="1.5"
                      fill="none"
                    />
                  </svg>
                ))}
              </div>

              {/* Foreground Martian Surface Flat Plate */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#140806] border-t border-[#3d1b14]" />

              {/* Real Mastcam/Navcam Image Frustum (If inside FOV) */}
              {isRoverImageVisible && roverImage && (
                <div
                  style={{
                    left: `${roverImgScreenX}%`,
                    top: `${roverImgScreenY}%`,
                    width: `${340 * zoom}px`,
                    height: `${210 * zoom}px`,
                    transform: "translate(-50%, -50%)",
                  }}
                  className="absolute border-2 border-amber-500 bg-[#07090e] shadow-none z-20"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={roverImage.imageUrl}
                    alt={roverImage.caption}
                    onError={() => setImageFailed(true)}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <div className="absolute top-0 left-0 bg-[#07090e]/90 px-1.5 py-0.5 border-b border-r border-amber-500 font-mono text-[8px] text-amber-400 font-bold">
                    NASA PDS // {roverImage.camera} [SOL {roverImage.sol}]
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-[#07090e]/90 px-2 py-0.5 font-mono text-[8px] text-slate-300 truncate">
                    TARGET: {roverImage.targetName}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MODE B: TACTICAL LIDAR / WIREFRAME TERRAIN VIEW */
            <div
              className="absolute inset-0 bg-[#07090e] overflow-hidden"
              style={{
                transform: `translateY(${bgPitchOffset}px)`,
                transition: isDraggingRef.current ? "none" : "transform 0.1s ease-out",
              }}
            >
              {/* Tactical Distance Grid */}
              <svg className="absolute inset-0 w-full h-full opacity-20 text-cyan-500" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="lidarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#lidarGrid)" />
              </svg>

              {/* Wireframe Mount Sharp Ridgeline */}
              <div
                className="absolute bottom-16 w-[300%] h-56 flex"
                style={{
                  left: `${bgHorizonShiftX}%`,
                  transition: isDraggingRef.current ? "none" : "left 0.1s ease-out",
                }}
              >
                {[0, 1, 2].map((idx) => (
                  <svg
                    key={idx}
                    className="w-1/3 h-full shrink-0 text-cyan-600"
                    viewBox="0 0 1000 200"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      points="0,200 80,130 180,150 290,90 410,135 520,65 640,115 760,85 880,140 1000,105 1000,200"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <line x1="290" y1="90" x2="290" y2="200" stroke="#0891b2" strokeWidth="0.5" strokeDasharray="3 3" />
                    <line x1="520" y1="65" x2="520" y2="200" stroke="#0891b2" strokeWidth="0.5" strokeDasharray="3 3" />
                    <line x1="760" y1="85" x2="760" y2="200" stroke="#0891b2" strokeWidth="0.5" strokeDasharray="3 3" />
                  </svg>
                ))}
              </div>

              {/* Boxwork Polygonal Vein Mesh (If Curiosity Boxwork) */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-32 border border-dashed border-amber-500/60 bg-[#0b0f17]/40 p-2 font-mono text-[9px] text-amber-400">
                <span className="font-bold block">[SUBTERRANEAN BOXWORK RIDGE LATTICE DETECTED]</span>
                <span>FRACTURE DENSITY: 14.8/m | DIP: 78° NW</span>
              </div>
            </div>
          )}

          {/* LAYER 3: 360° SCIENCE HOTSPOTS (Pins positioned by Azimuth & Pitch) */}
          <div className="absolute inset-0 pointer-events-none z-30">
            {SCIENCE_HOTSPOTS.map((pin) => {
              const dAz = getAngleDelta(pin.azimuth, normalizedAz);
              const dPitch = pin.pitch - pitch;

              // Check if inside visible FOV
              if (Math.abs(dAz) > halfFovX || Math.abs(dPitch) > halfFovY) return null;

              const screenX = 50 + (dAz / halfFovX) * 50;
              const screenY = 50 - (dPitch / halfFovY) * 50;
              const isSelected = activePinId === pin.id;

              return (
                <div
                  key={pin.id}
                  style={{ left: `${screenX}%`, top: `${screenY}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                >
                  <button
                    onClick={() => setActivePinId(isSelected ? null : pin.id)}
                    className={`flex items-center gap-1.5 px-2 py-1 border font-mono text-[9px] transition-colors ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 border-amber-300 font-bold"
                        : "bg-[#07090e]/90 text-amber-400 border-amber-600 hover:bg-amber-600 hover:text-slate-950"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 bg-amber-400" />
                    <span>{pin.code}</span>
                    <span className="hidden sm:inline-block">[{pin.name}]</span>
                  </button>

                  {/* Target line down */}
                  <div className="w-px h-4 bg-amber-500 mx-auto" />
                </div>
              );
            })}
          </div>

          {/* Tactical Crosshair Center Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
            <div className="w-8 h-8 border border-cyan-500/40 flex items-center justify-center">
              <div className="w-1 h-1 bg-cyan-400" />
            </div>
          </div>

          {/* Active Science Pin Floating Telemetry Card */}
          {activePin && (
            <div className="absolute bottom-10 left-3 right-3 sm:left-4 sm:right-auto sm:w-96 bg-[#07090e]/95 border border-amber-500 p-3 font-mono z-40">
              <div className="flex justify-between items-start border-b border-slate-800 pb-1.5 mb-2">
                <div>
                  <span className="text-amber-400 font-bold text-[10px] block">
                    {activePin.code} // {activePin.name}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    AZ: {activePin.azimuth}° | ELEV: {activePin.pitch}° | {activePin.instrument}
                  </span>
                </div>
                <button
                  onClick={() => setActivePinId(null)}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] border border-slate-700"
                >
                  [X]
                </button>
              </div>

              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between bg-[#111827] px-2 py-1 border border-slate-800">
                  <span className="text-slate-400 uppercase">{activePin.metricLabel}:</span>
                  <span className="text-cyan-400 font-bold tabular-nums">{activePin.metricValue}</span>
                </div>
                <p className="text-slate-300 text-[10px] leading-relaxed">
                  {activePin.description}
                </p>
              </div>
            </div>
          )}

          {/* Viewport HUD Telemetry Overlay (Corners) */}
          <div className="absolute top-10 left-3 font-mono text-[9px] text-slate-400 pointer-events-none z-20">
            <span className="text-cyan-400 font-bold">AZIMUTH: <span className="tabular-nums">{Math.round(normalizedAz)}°</span></span>
            <br />
            <span>PITCH: <span className="tabular-nums">{pitch}°</span></span>
            <br />
            <span>OPTICAL ZOOM: <span className="tabular-nums">{zoom}x</span></span>
          </div>

          <div className="absolute top-10 right-3 font-mono text-[9px] text-right text-slate-400 pointer-events-none z-20">
            <span className="text-amber-400 font-bold">REMS SENSORS</span>
            <br />
            <span>GROUND: <span className="text-slate-200 tabular-nums">+3°C</span></span>
            <br />
            <span>UV FLUX: <span className="text-emerald-400 tabular-nums">8.2 W/m²</span></span>
          </div>

          {/* Quick HUD Navigation & Zoom Controls (Bottom Right of Viewport) */}
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-30 font-mono text-[10px]">
            <button
              onClick={() => setZoom((prev) => Math.min(2.5, Math.round((prev + 0.2) * 10) / 10))}
              title="Zoom In"
              className="w-7 h-7 bg-[#111827] hover:bg-[#1f2937] text-white border border-slate-700 flex items-center justify-center font-bold"
            >
              +
            </button>
            <button
              onClick={() => setZoom((prev) => Math.max(1.0, Math.round((prev - 0.2) * 10) / 10))}
              title="Zoom Out"
              className="w-7 h-7 bg-[#111827] hover:bg-[#1f2937] text-white border border-slate-700 flex items-center justify-center font-bold"
            >
              -
            </button>
            <button
              onClick={resetPov}
              title="Reset View to Rover Heading"
              className="px-2 h-7 bg-[#111827] hover:bg-[#1f2937] text-amber-400 border border-slate-700 flex items-center justify-center font-bold text-[9px]"
            >
              RESET POV
            </button>
          </div>

          {/* Drag instruction pill */}
          <div className="absolute bottom-3 left-3 bg-[#07090e]/80 border border-slate-800 px-2 py-0.5 font-mono text-[9px] text-slate-400 pointer-events-none z-20">
            [DRAG TO PAN 360° // SCROLL TO ZOOM]
          </div>
        </div>

        {/* Rover & Science Instrument Detail Cards */}
        <div
          className={`p-3 grid grid-cols-1 md:grid-cols-3 gap-2.5 overflow-y-auto ${
            isDark ? "bg-[#0b0f17]" : "bg-slate-50"
          }`}
        >
          {/* Geochemical Abundances */}
          <div
            className={`p-2.5 border font-mono ${
              isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300"
            }`}
          >
            <span
              className={`text-[10px] uppercase font-bold block mb-1 ${
                isDark ? "text-cyan-400" : "text-cyan-800"
              }`}
            >
              GEOCHEMISTRY (APXS / CHEMCAM)
            </span>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-400">SULFATES (SO3):</span>
                <span className="font-bold text-amber-400 tabular-nums">{waypoint.mineralogy.sulfatePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">HEMATITE (Fe2O3):</span>
                <span className="font-bold text-red-400 tabular-nums">{waypoint.mineralogy.hematitePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CLAY (PHYLLOSILICATES):</span>
                <span className="font-bold text-emerald-400 tabular-nums">{waypoint.mineralogy.phyllosilicateClayPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SILICA (SiO2):</span>
                <span className="font-bold text-slate-300 tabular-nums">{waypoint.mineralogy.silicaPercent}%</span>
              </div>
            </div>
          </div>

          {/* Curiosity In-Situ Log */}
          <div
            className={`p-2.5 border font-mono ${
              isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300"
            }`}
          >
            <span className="text-[10px] text-amber-500 uppercase font-bold block mb-1">
              MSL GROUND TRUTH
            </span>
            <p className={`text-[10px] font-bold ${isDark ? "text-slate-200" : "text-slate-900"}`}>
              {waypoint.roverGroundTruth?.instrument}: {waypoint.roverGroundTruth?.targetName}
            </p>
            <p className={`text-[10px] mt-1 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              &quot;{waypoint.roverGroundTruth?.keyFinding}&quot;
            </p>
          </div>

          {/* Astronaut Suit Traverse Conditions */}
          <div
            className={`p-2.5 border font-mono flex flex-col justify-between ${
              isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-300"
            }`}
          >
            <div>
              <span className="text-[10px] text-emerald-500 uppercase font-bold block mb-1">
                SUIT MOBILITY ENVELOPE
              </span>
              <p className={`text-[10px] ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                SLOPE: <span className="font-bold tabular-nums">{waypoint.meanSlopeDeg}°</span> (MAX:{" "}
                <span className="tabular-nums">{waypoint.maxSlopeDeg}°</span>)
              </p>
              <p className={`text-[10px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                THERMAL INERTIA: <span className="tabular-nums">{waypoint.apparentThermalInertiaTiu} tiu</span>
              </p>
            </div>
            <div className="mt-2">
              <span
                className={`inline-block px-1.5 py-0.5 text-[9px] font-bold border ${
                  waypoint.evaSuitTraversable
                    ? "bg-[#064e3b] text-[#34d399] border-[#059669]"
                    : "bg-[#7f1d1d] text-[#fca5a5] border-[#dc2626]"
                }`}
              >
                {waypoint.evaSuitTraversable ? "[TRAVERSABLE]" : "[EXCEEDS SAFE ENVELOPE]"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Attribution */}
        <div
          className={`px-4 py-2 border-t text-[10px] font-mono flex items-center justify-between ${
            isDark ? "bg-[#0b0f17] border-slate-800 text-slate-400" : "bg-slate-100 border-slate-300 text-slate-600"
          }`}
        >
          <span>ATTRIBUTION: NASA / JPL-CALTECH / MSSS / PDS GEOSCIENCES</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#1f2937] hover:bg-[#374151] border border-slate-700 text-white font-mono text-[11px] font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurfacePovModal;