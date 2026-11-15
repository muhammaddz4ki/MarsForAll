"use client";

import React, { useState, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { MarswalkRouteResult, HighDensityPointTelemetry } from "@/lib/martian/marswalkRouter";

interface MarswalkProfileDockProps {
  route: MarswalkRouteResult;
  onHoverPoint: (point: HighDensityPointTelemetry | null) => void;
  onClose?: () => void;
  isLeftDrawerOpen?: boolean;
}

export const MarswalkProfileDock: React.FC<MarswalkProfileDockProps> = ({
  route,
  onHoverPoint,
  onClose,
  isLeftDrawerOpen = false,
}) => {
  const t = useTranslations("marswalk");
  const svgRef = useRef<SVGSVGElement>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const points = route.highDensityRoutePoints;
  const hasPoints = points && points.length > 1;

  // Active point telemetry (defaults to target or last hovered point)
  const activePoint = useMemo(() => {
    if (!hasPoints) return null;
    if (hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < points.length) {
      return points[hoveredIdx];
    }
    return points[Math.floor(points.length / 2)] || points[0];
  }, [points, hoveredIdx, hasPoints]);

  // SVG Dimension Calculations
  const { minElev, maxElev, totalDistM, svgWidth, svgHeight } = useMemo(() => {
    if (!hasPoints) {
      return { minElev: -4500, maxElev: -3800, totalDistM: 1000, svgWidth: 1000, svgHeight: 110 };
    }
    const elevs = points.map((p) => p.elevationM);
    const minE = Math.min(...elevs) - 20;
    const maxE = Math.max(...elevs) + 20;
    const distM = points[points.length - 1].cumulativeDistanceM || route.totalDistanceKm * 1000;
    return {
      minElev: minE,
      maxElev: maxE,
      totalDistM: Math.max(1, distM),
      svgWidth: 1000,
      svgHeight: 110,
    };
  }, [points, hasPoints, route.totalDistanceKm]);

  // Generate SVG Path for Elevation Area
  const { pathD, areaD, pointCoordinates } = useMemo(() => {
    if (!hasPoints) return { pathD: "", areaD: "", pointCoordinates: [] };

    const coords: { x: number; y: number }[] = [];
    const elevRange = maxElev - minElev || 1;

    points.forEach((p) => {
      const x = (p.cumulativeDistanceM / totalDistM) * svgWidth;
      const normalizedY = (p.elevationM - minElev) / elevRange;
      const y = svgHeight - normalizedY * (svgHeight - 16) - 8;
      coords.push({ x, y });
    });

    const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
    const closedArea = `${linePath} L ${svgWidth} ${svgHeight} L 0 ${svgHeight} Z`;

    return { pathD: linePath, areaD: closedArea, pointCoordinates: coords };
  }, [points, minElev, maxElev, totalDistM, svgWidth, svgHeight, hasPoints]);

  // Handle Scrubbing across Graph
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !hasPoints) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const progress = mouseX / rect.width;
    const targetIdx = Math.min(points.length - 1, Math.max(0, Math.round(progress * (points.length - 1))));

    setHoveredIdx(targetIdx);
    onHoverPoint(points[targetIdx]);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
    onHoverPoint(null);
  };

  if (!hasPoints) return null;

  const activeCoord = hoveredIdx !== null && pointCoordinates[hoveredIdx] ? pointCoordinates[hoveredIdx] : null;

  return (
    <div
      className={`absolute bottom-0 z-30 transition-all duration-200 select-none font-mono ${
        isLeftDrawerOpen ? "left-0 sm:left-[400px]" : "left-0 sm:left-[50px]"
      } right-0 bg-[#07090e] border-t border-slate-700 shadow-[0_-10px_35px_rgba(0,0,0,0.85)]`}
    >
      {/* Top Header Row */}
      <div className="h-7 bg-[#0b0f17] border-b border-slate-800 px-3 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-emerald-400" />
          <span className="font-bold text-white tracking-wider uppercase">
            MEASURE // TRANSEK ELEVASI & KONDISI JALUR [SAMPLING RESOLUSI 5-METER]
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-[#f97316] font-bold">
            {route.startWaypoint.name.split(" ")[0]} &rarr; {route.targetWaypoint.name.split(" ")[0]} ({route.totalDistanceKm} km)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="px-2 py-0.5 bg-[#161e2e] border border-slate-700 text-slate-300 hover:text-white text-[9px] font-bold"
          >
            {isCollapsed ? "[ EXPAND TRANSECT ]" : "[ MINIMIZE ]"}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-1.5 py-0.5 bg-red-950/60 border border-red-800 text-red-300 hover:text-white text-[9px] font-bold"
              title="Close transect dock"
            >
              &#x2715;
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col md:flex-row items-stretch min-h-[140px] p-2 gap-2 text-xs">
          {/* Left Controls & Mission Settings (NASA MMGIS Style) */}
          <div className="w-48 shrink-0 bg-[#0b0f17] border border-slate-800 p-2.5 flex flex-col justify-between text-[10px] space-y-1">
            <div className="space-y-1.5">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">DATASET:</span>
                <span className="text-white font-bold">MOLA / HRSC</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">MODE:</span>
                <span className="text-emerald-400 font-bold">5m Density</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">SAMPLES:</span>
                <span className="text-cyan-400 tabular-nums font-bold">{points.length} nodes</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-400">UNIT:</span>
                <span className="text-white font-bold">Meters (SI)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">LINE OF SIGHT:</span>
                <span className="text-emerald-400 font-bold">[CLEAR LOS]</span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-800 text-[9px] text-slate-500">
              {t("scrubPrompt")}
            </div>
          </div>

          {/* Center Elevation Graph Area with Live Scrub Needle */}
          <div className="flex-1 relative bg-[#05070b] border border-slate-800 flex flex-col justify-between p-2 overflow-hidden">
            {/* Y-Axis Elevation Markers */}
            <div className="absolute left-2 top-1 text-[9px] text-slate-400 font-mono tabular-nums z-10">
              {Math.round(maxElev)} m
            </div>
            <div className="absolute left-2 bottom-6 text-[9px] text-slate-400 font-mono tabular-nums z-10">
              {Math.round(minElev)} m
            </div>

            {/* Interactive SVG Area Graph */}
            <div className="relative w-full h-[95px] cursor-crosshair">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="none"
                className="w-full h-full"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  {/* Terracotta/Crimson solid gradient fill for elevation profile */}
                  <linearGradient id="transectElevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#991b1b" stopOpacity="0.85" />
                    <stop offset="70%" stopColor="#450a0a" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#1c0505" stopOpacity="1" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                <line x1="0" y1={svgHeight * 0.25} x2={svgWidth} y2={svgHeight * 0.25} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="0" y1={svgHeight * 0.50} x2={svgWidth} y2={svgHeight * 0.50} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
                <line x1="0" y1={svgHeight * 0.75} x2={svgWidth} y2={svgHeight * 0.75} stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />

                {/* Filled Elevation Polygon */}
                <path d={areaD} fill="url(#transectElevGrad)" />
                <path d={pathD} fill="none" stroke="#ef4444" strokeWidth="1.8" />

                {/* Active Yellow Scrubber Needle */}
                {activeCoord && (
                  <g>
                    <line
                      x1={activeCoord.x}
                      y1={0}
                      x2={activeCoord.x}
                      y2={svgHeight}
                      stroke="#facc15"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={activeCoord.x}
                      cy={activeCoord.y}
                      r="4"
                      fill="#facc15"
                      stroke="#07090e"
                      strokeWidth="1.5"
                    />
                  </g>
                )}
              </svg>
            </div>

            {/* X-Axis Distance Footers */}
            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono px-1 border-t border-slate-800 pt-1">
              <span>0 m (START)</span>
              <span>{(totalDistM * 0.25).toFixed(0)} m</span>
              <span>{(totalDistM * 0.50).toFixed(0)} m</span>
              <span>{(totalDistM * 0.75).toFixed(0)} m</span>
              <span className="text-amber-400 font-bold">{totalDistM.toFixed(0)} m ({route.totalDistanceKm} km)</span>
            </div>
          </div>

          {/* Right Live Point Telemetry HUD (MMGIS Point Inspector) */}
          {activePoint && (
            <div className="w-64 shrink-0 bg-[#0b0f17] border border-slate-800 p-2.5 flex flex-col justify-between text-[10px] space-y-1">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="text-amber-400 font-bold uppercase">{t("pointInspector")}</span>
                <span className="text-slate-400 tabular-nums">#{activePoint.pointIndex + 1}</span>
              </div>

              <div className="space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t("coordinatesLabel")}</span>
                  <span className="text-slate-200 tabular-nums">
                    {activePoint.coordinates[1]}°, {activePoint.coordinates[0]}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t("elevationMolaLabel")}</span>
                  <span className="text-cyan-400 font-bold tabular-nums">
                    {activePoint.elevationM} m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t("distance2dLabel")}</span>
                  <span className="text-white tabular-nums font-bold">
                    {activePoint.cumulativeDistanceM} m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t("slopeLabel")}:</span>
                  <span
                    className={`font-bold tabular-nums ${
                      activePoint.slopeCategory === "SAFE"
                        ? "text-emerald-400"
                        : activePoint.slopeCategory === "CAUTION"
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {activePoint.slopeDeg}° [{activePoint.slopeCategory}]
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t("firmnessLabel")}</span>
                  <span
                    className={`font-bold ${
                      activePoint.surfaceFirmness === "BEDROCK FIRM"
                        ? "text-emerald-400"
                        : activePoint.surfaceFirmness === "MODERATE COMPACTION"
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {activePoint.surfaceFirmness}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t("thermalInertiaLabel")}</span>
                  <span className="text-slate-300 tabular-nums">
                    {activePoint.thermalInertiaTiu} tiu
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t("remainingO2Label")}</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    {activePoint.remainingO2Percent}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t("mgsMagLabel")}</span>
                  <span className="text-amber-400 font-bold tabular-nums">
                    {activePoint.crustalMagneticFieldNt} nT
                  </span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-800 text-[9px] text-slate-400 flex items-center justify-between">
                <span>{t("estimatedTimeLabel")}</span>
                <span className="text-white font-bold">{activePoint.cumulativeTimeMinutes} {t("unitMinutes")}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MarswalkProfileDock;
