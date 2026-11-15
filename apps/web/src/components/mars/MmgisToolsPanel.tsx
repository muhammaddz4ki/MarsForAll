import React, { memo } from "react";
import { useTranslations } from "next-intl";
import { MissionSiteId, getRoverTraverseForSite } from "@/lib/martian/mountSharpWaypoints";
import { ZoiFeature } from "@/lib/martian/mmgisSpatialAnalysis";

interface MmgisToolsPanelProps {
  currentSite: MissionSiteId;
  activeMmgisTool: "none" | "measure" | "viewshed" | "zoi";
  onSelectMmgisTool: (tool: "none" | "measure" | "viewshed" | "zoi") => void;
  measurePoints: [number, number][];
  onClearMeasurePoints: () => void;
  zoiList: ZoiFeature[];
  onRemoveZoi?: (id: string) => void;
  showRoverTraverse: boolean;
  onToggleRoverTraverse: () => void;
  showGraticule: boolean;
  onToggleGraticule: () => void;
  showFloatingLegend: boolean;
  onToggleFloatingLegend: () => void;
  pitch3D: boolean;
  onTogglePitch: () => void;
  onReCenter: () => void;
  onOpen360Manager: () => void;
  onOpenPovModal: () => void;
  onExportGeoJson: () => void;
  theme?: "dark" | "light";
  currentSol?: number;
  onSelectSol?: (sol: number) => void;
  dustStormActive?: boolean;
  onToggleDustStorm?: (active: boolean) => void;
  showSolWeatherScrubber?: boolean;
  onToggleSolWeatherScrubber?: () => void;
}

export const MmgisToolsPanel: React.FC<MmgisToolsPanelProps> = memo(({
  currentSite,
  activeMmgisTool,
  onSelectMmgisTool,
  measurePoints,
  onClearMeasurePoints,
  zoiList,
  onRemoveZoi,
  showRoverTraverse,
  onToggleRoverTraverse,
  showGraticule,
  onToggleGraticule,
  showFloatingLegend,
  onToggleFloatingLegend,
  pitch3D,
  onTogglePitch,
  onReCenter,
  onOpen360Manager,
  onOpenPovModal,
  onExportGeoJson,
  theme = "dark",
  currentSol = 4180,
  onSelectSol,
  dustStormActive = false,
  onToggleDustStorm,
  showSolWeatherScrubber = true,
  onToggleSolWeatherScrubber,
}) => {
  const tMmgis = useTranslations("mmgis");
  const isDark = theme === "dark";

  // Calculate cumulative distance for measure points
  let measureDistKm = 0;
  if (measurePoints.length > 1) {
    for (let i = 1; i < measurePoints.length; i++) {
      const p1 = measurePoints[i - 1];
      const p2 = measurePoints[i];
      measureDistKm += Math.sqrt(
        Math.pow((p2[0] - p1[0]) * 59.16, 2) + Math.pow((p2[1] - p1[1]) * 59.16, 2)
      );
    }
  }

  const isGale = currentSite === "gale_crater";

  return (
    <div className={`h-full flex flex-col font-mono text-[11px] select-none ${
      isDark ? "bg-[#0b0f17] text-slate-200" : "bg-white text-slate-800"
    }`}>
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* SECTION 1: SPATIAL ANALYSIS TOOLS */}
        <section className={`border ${isDark ? "bg-[#07090e] border-slate-800" : "bg-slate-50 border-slate-200"} p-2.5`}>
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
            <span className="text-[10px] font-bold tracking-wider text-cyan-400 uppercase">
              {tMmgis("spatialAnalysisTitle")}
            </span>
            <span className="text-[9px] px-1 py-0.2 bg-[#083344] text-[#a5f3fc] border border-[#06b6d4]">
              NASA MMGIS
            </span>
          </div>

          {/* 1A. Measure / Elevation Profile Transect */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[10px] text-slate-300">
                1. {tMmgis("measureTool")}
              </span>
              {activeMmgisTool === "measure" && (
                <span className="text-[9px] px-1 bg-[#083344] text-cyan-300 border border-cyan-400 font-bold">
                  [ACTIVE]
                </span>
              )}
            </div>
            <p className="text-[9px] text-slate-400 leading-tight">
              {tMmgis("measureInstruction")}
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => onSelectMmgisTool(activeMmgisTool === "measure" ? "none" : "measure")}
                className={`flex-1 py-1.5 px-2 border font-bold text-[10px] transition-colors flex items-center justify-center gap-1.5 ${
                  activeMmgisTool === "measure"
                    ? "bg-[#083344] text-[#a5f3fc] border-[#06b6d4]"
                    : isDark
                    ? "bg-[#111827] text-slate-300 border-slate-700 hover:border-cyan-500 hover:text-cyan-300"
                    : "bg-white text-slate-700 border-slate-300 hover:text-cyan-800"
                }`}
              >
                <span className={`w-2 h-2 ${activeMmgisTool === "measure" ? "bg-cyan-400" : "bg-slate-500"}`} />
                <span>{activeMmgisTool === "measure" ? tMmgis("measureActive") : tMmgis("measureTool")}</span>
              </button>

              {measurePoints.length > 0 && (
                <button
                  onClick={onClearMeasurePoints}
                  title={tMmgis("clearMeasureBtn")}
                  className="px-2 py-1.5 border border-red-800 bg-[#450a0a] text-red-300 hover:bg-red-900 font-bold text-[9px]"
                >
                  [CLEAR]
                </button>
              )}
            </div>

            {measurePoints.length > 0 && (
              <div className="mt-1 px-2 py-1 bg-[#07090e] border border-slate-800 text-[9px] text-slate-400 flex items-center justify-between tabular-nums">
                <span>NODES: {measurePoints.length}</span>
                <span className="text-cyan-300 font-bold">{measureDistKm.toFixed(2)} km</span>
              </div>
            )}
          </div>

          {/* 1B. Viewshed 360° Line-of-Sight */}
          <div className="space-y-1.5 mb-3 pt-2.5 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[10px] text-slate-300">
                2. {tMmgis("viewshedTool")}
              </span>
              {activeMmgisTool === "viewshed" && (
                <span className="text-[9px] px-1 bg-[#064e3b] text-emerald-300 border border-emerald-400 font-bold">
                  [ACTIVE]
                </span>
              )}
            </div>
            <p className="text-[9px] text-slate-400 leading-tight">
              {tMmgis("viewshedInstruction")}
            </p>
            <button
              onClick={() => onSelectMmgisTool(activeMmgisTool === "viewshed" ? "none" : "viewshed")}
              className={`w-full py-1.5 px-2 border font-bold text-[10px] transition-colors flex items-center justify-center gap-1.5 ${
                activeMmgisTool === "viewshed"
                  ? "bg-[#064e3b] text-[#a7f3d0] border-[#10b981]"
                  : isDark
                  ? "bg-[#111827] text-slate-300 border-slate-700 hover:border-emerald-500 hover:text-emerald-300"
                  : "bg-white text-slate-700 border-slate-300 hover:text-emerald-800"
              }`}
            >
              <span className={`w-2 h-2 ${activeMmgisTool === "viewshed" ? "bg-emerald-400" : "bg-slate-500"}`} />
              <span>{activeMmgisTool === "viewshed" ? tMmgis("viewshedActive") : tMmgis("viewshedTool")}</span>
            </button>
          </div>

          {/* 1C. Zone of Interest (ZOI) Marker */}
          <div className="space-y-1.5 pt-2.5 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[10px] text-slate-300">
                3. {tMmgis("markZoi")}
              </span>
              {activeMmgisTool === "zoi" && (
                <span className="text-[9px] px-1 bg-[#451a03] text-orange-300 border border-orange-400 font-bold">
                  [ACTIVE]
                </span>
              )}
            </div>
            <p className="text-[9px] text-slate-400 leading-tight">
              Klik titik koordinat di permukaan kawah untuk menaruh pin Zone of Interest riset geologi.
            </p>
            <button
              onClick={() => onSelectMmgisTool(activeMmgisTool === "zoi" ? "none" : "zoi")}
              className={`w-full py-1.5 px-2 border font-bold text-[10px] transition-colors flex items-center justify-center gap-1.5 ${
                activeMmgisTool === "zoi"
                  ? "bg-[#451a03] text-[#fed7aa] border-[#ea580c]"
                  : isDark
                  ? "bg-[#111827] text-slate-300 border-slate-700 hover:border-orange-500 hover:text-orange-300"
                  : "bg-white text-slate-700 border-slate-300 hover:text-orange-800"
              }`}
            >
              <span className={`w-2 h-2 ${activeMmgisTool === "zoi" ? "bg-orange-400" : "bg-slate-500"}`} />
              <span>{activeMmgisTool === "zoi" ? tMmgis("zoiActive") : tMmgis("markZoi")}</span>
            </button>

            {zoiList.length > 0 && (
              <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                {zoiList.map((zoi) => (
                  <div
                    key={zoi.id}
                    className="p-1.5 bg-[#07090e] border border-slate-800 flex items-center justify-between text-[9px] text-slate-300"
                  >
                    <div>
                      <span className="font-bold text-orange-400">{zoi.name}</span>
                      <span className="text-slate-400 ml-1.5">
                        ({zoi.coordinates[1].toFixed(3)}°, {zoi.coordinates[0].toFixed(3)}°)
                      </span>
                    </div>
                    {onRemoveZoi && (
                      <button
                        onClick={() => onRemoveZoi(zoi.id)}
                        className="text-slate-500 hover:text-red-400 px-1"
                        title="Hapus pin ZOI"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: 360° PANORAMA & SURFACE WAYPOINTS */}
        <section className={`border ${isDark ? "bg-[#07090e] border-slate-800" : "bg-slate-50 border-slate-200"} p-2.5 space-y-2`}>
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
              {tMmgis("pano360Title")}
            </span>
            <span className="text-[9px] px-1 py-0.2 bg-[#78350f] text-[#fef3c7] border border-[#f59e0b]">
              SPHERICAL POV
            </span>
          </div>

          <p className="text-[9px] text-slate-400 leading-tight">
            Akses citra panorama 360° WebGL di lokasi waypoint atau kelola folder foto JPEG panorama kustom.
          </p>

          <button
            onClick={onOpen360Manager}
            className="w-full py-1.5 px-2 border font-bold text-[10px] bg-[#083344] text-[#38bdf8] border-[#0284c7] hover:bg-[#0c4a6e] transition-colors flex items-center justify-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>{tMmgis("manage360Btn")}</span>
          </button>

          <button
            onClick={onOpenPovModal}
            className="w-full py-1.5 px-2 border font-bold text-[10px] bg-[#111827] text-amber-400 border-slate-700 hover:border-amber-500 hover:text-amber-300 transition-colors flex items-center justify-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{tMmgis("open360PovBtn")}</span>
          </button>
        </section>

        {/* SECTION 3: MAP DISPLAY CONTROLS & OVERLAYS */}
        <section className={`border ${isDark ? "bg-[#07090e] border-slate-800" : "bg-slate-50 border-slate-200"} p-2.5 space-y-2`}>
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="text-[10px] font-bold tracking-wider text-purple-400 uppercase">
              {tMmgis("mapOverlaysTitle")}
            </span>
            <span className="text-[9px] px-1 py-0.2 bg-[#1e1b4b] text-[#c7d2fe] border border-[#818cf8]">
              VIEWPORT
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            {/* Re-Center */}
            <button
              onClick={onReCenter}
              className={`w-full py-1.5 px-2 border font-bold text-[10px] transition-colors flex items-center justify-between ${
                isDark
                  ? "bg-[#111827] text-amber-400 border-slate-700 hover:border-amber-400"
                  : "bg-white text-amber-700 border-slate-300"
              }`}
            >
              <span>{tMmgis("recenterSite")}</span>
              <span className="text-[9px] text-slate-400">[{isGale ? "GALE" : "JEZERO"}]</span>
            </button>

            {/* Rover Traverse Toggle */}
            <button
              onClick={onToggleRoverTraverse}
              className={`w-full py-1.5 px-2 border font-bold text-[10px] transition-colors flex items-center justify-between ${
                showRoverTraverse
                  ? "bg-[#161e2e] text-slate-200 border-slate-600"
                  : isDark
                  ? "bg-[#111827] text-slate-500 border-slate-800"
                  : "bg-white text-slate-400 border-slate-200"
              }`}
            >
              <span>{tMmgis("roverTraverse")}</span>
              <span className={`text-[9px] font-bold ${showRoverTraverse ? "text-amber-400" : "text-slate-500"}`}>
                [{showRoverTraverse ? "ACTIVE" : "OFF"}]
              </span>
            </button>

            {/* Martian Graticule Grid Toggle */}
            <button
              onClick={onToggleGraticule}
              className={`w-full py-1.5 px-2 border font-bold text-[10px] transition-colors flex items-center justify-between ${
                showGraticule
                  ? "bg-[#161e2e] text-slate-200 border-slate-600"
                  : isDark
                  ? "bg-[#111827] text-slate-500 border-slate-800"
                  : "bg-white text-slate-400 border-slate-200"
              }`}
            >
              <span>{tMmgis("graticuleGrid")}</span>
              <span className={`text-[9px] font-bold ${showGraticule ? "text-cyan-400" : "text-slate-500"}`}>
                [{showGraticule ? "ACTIVE" : "OFF"}]
              </span>
            </button>

            {/* Floating Scientific Legend Toggle */}
            <button
              onClick={onToggleFloatingLegend}
              className={`w-full py-1.5 px-2 border font-bold text-[10px] transition-colors flex items-center justify-between ${
                showFloatingLegend
                  ? "bg-[#161e2e] text-slate-200 border-slate-600"
                  : isDark
                  ? "bg-[#111827] text-slate-500 border-slate-800"
                  : "bg-white text-slate-400 border-slate-200"
              }`}
            >
              <span>{tMmgis("floatingLegend")}</span>
              <span className={`text-[9px] font-bold ${showFloatingLegend ? "text-indigo-400" : "text-slate-500"}`}>
                [{showFloatingLegend ? "VISIBLE" : "HIDDEN"}]
              </span>
            </button>

            {/* 3D Camera Pitch Perspective Toggle */}
            <button
              onClick={onTogglePitch}
              className={`w-full py-1.5 px-2 border font-bold text-[10px] transition-colors flex items-center justify-between ${
                pitch3D
                  ? "bg-[#161e2e] text-slate-200 border-slate-600"
                  : isDark
                  ? "bg-[#111827] text-slate-500 border-slate-800"
                  : "bg-white text-slate-400 border-slate-200"
              }`}
            >
              <span>{tMmgis("cameraPitch")}</span>
              <span className={`text-[9px] font-bold ${pitch3D ? "text-purple-400" : "text-slate-500"}`}>
                [{pitch3D ? "3D PITCH 45°" : "2D FLAT 0°"}]
              </span>
            </button>

            {/* Export .GeoJSON GIS Data */}
            <button
              onClick={onExportGeoJson}
              className="w-full py-1.5 px-2 border border-slate-700 bg-[#111827] text-slate-200 hover:bg-slate-800 hover:border-slate-500 font-bold text-[10px] transition-colors flex items-center justify-center gap-1.5 mt-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{tMmgis("exportGeoJsonBtn")}</span>
            </button>
          </div>
        </section>

        {/* SECTION 4: SOL TIMELINE & ATMOSPHERIC SIMULATOR */}
        <section className={`border ${isDark ? "bg-[#07090e] border-slate-800" : "bg-slate-50 border-slate-200"} p-2.5`}>
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
              4. {tMmgis("solWeatherTitle")}
            </span>
            <span className="text-[9px] px-1 py-0.2 bg-[#78350f] text-[#fef3c7] border border-[#f59e0b]">
              SIMULATOR
            </span>
          </div>

          <p className="text-[9px] text-slate-400 leading-tight mb-2.5">
            {tMmgis("solTimelineDesc")}
          </p>

          <div className="space-y-2">
            {/* Weather Atmospheric Simulator */}
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {tMmgis("weatherSim")}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onToggleDustStorm?.(false)}
                  className={`py-1 px-2 border text-[9px] font-bold transition-colors ${
                    !dustStormActive
                      ? "bg-[#064e3b] text-[#34d399] border-[#10b981]"
                      : isDark
                      ? "bg-[#111827] text-slate-400 border-slate-800 hover:text-slate-200"
                      : "bg-white text-slate-600 border-slate-300 hover:text-slate-900"
                  }`}
                >
                  CLEAR (TAU 0.3)
                </button>
                <button
                  onClick={() => onToggleDustStorm?.(true)}
                  className={`py-1 px-2 border text-[9px] font-bold transition-colors ${
                    dustStormActive
                      ? "bg-[#7f1d1d] text-[#fca5a5] border-[#ef4444]"
                      : isDark
                      ? "bg-[#111827] text-slate-400 border-slate-800 hover:text-slate-200"
                      : "bg-white text-slate-600 border-slate-300 hover:text-slate-900"
                  }`}
                >
                  STORM (TAU 2.4)
                </button>
              </div>
            </div>

            {/* Sol Milestone Time Travel Buttons */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                HISTORICAL MISSION SOLS
              </span>
              <div className="grid grid-cols-4 gap-1">
                {getRoverTraverseForSite(currentSite).map((pt) => (
                  <button
                    key={pt.sol}
                    onClick={() => onSelectSol?.(pt.sol)}
                    className={`py-1 px-1 border text-[9px] font-bold truncate transition-colors ${
                      currentSol === pt.sol
                        ? "bg-[#1e293b] text-amber-400 border-amber-400"
                        : isDark
                        ? "bg-[#111827] text-slate-300 border-slate-800 hover:text-white"
                        : "bg-white text-slate-700 border-slate-300 hover:text-black"
                    }`}
                    title={`Sol ${pt.sol}: ${pt.name}`}
                  >
                    SOL {pt.sol}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Scrubber Overlay Toggle */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={onToggleSolWeatherScrubber}
                className={`w-full py-1.5 px-2 border font-bold text-[10px] transition-colors flex items-center justify-between ${
                  showSolWeatherScrubber
                    ? "bg-[#161e2e] text-slate-200 border-slate-600"
                    : isDark
                    ? "bg-[#111827] text-slate-500 border-slate-800"
                    : "bg-white text-slate-400 border-slate-200"
                }`}
              >
                <span>{tMmgis("bottomScrubberToggle")}</span>
                <span className={`text-[9px] font-bold ${showSolWeatherScrubber ? "text-amber-400" : "text-slate-500"}`}>
                  [{showSolWeatherScrubber ? "VISIBLE" : "HIDDEN"}]
                </span>
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
});

MmgisToolsPanel.displayName = "MmgisToolsPanel";
export default MmgisToolsPanel;
