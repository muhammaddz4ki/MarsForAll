import React, { memo } from "react";
import { useTranslations } from "next-intl";
import { MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";
import { getMartianSlope } from "@/lib/martian/mmgisSpatialAnalysis";
import { IdentifiedFeatureInfo } from "./AresMapViewer";

interface PointInspectorPanelProps {
  feature: IdentifiedFeatureInfo | null;
  waypoint: MountSharpWaypoint | null;
  onPlanRouteToWaypoint?: (wp: MountSharpWaypoint) => void;
  onOpenPovModal?: (wp: MountSharpWaypoint) => void;
  onAnalyzeProspector?: (wp: MountSharpWaypoint) => void;
  onOpenAnalogueMatcher?: (wp: MountSharpWaypoint) => void;
  onToggleProfileDock?: () => void;
  isProfileDockOpen?: boolean;
  custom360Waypoints?: MountSharpWaypoint[];
  theme?: "dark" | "light";
}

export const PointInspectorPanel: React.FC<PointInspectorPanelProps> = memo(({
  feature,
  waypoint,
  onPlanRouteToWaypoint,
  onOpenPovModal,
  onAnalyzeProspector,
  onOpenAnalogueMatcher,
  onToggleProfileDock,
  isProfileDockOpen = false,
  custom360Waypoints = [],
  theme = "dark",
}) => {
  const t = useTranslations("inspector");
  const isDark = theme === "dark";

  // Resolve display data from feature or fallback waypoint
  const name = feature?.name || waypoint?.name || "Martian Regolith Bedrock";
  const category = feature?.category || (waypoint ? waypoint.category.toUpperCase().replace("_", " ") : "POINT INSPECTOR");
  const stratigraphicAge = feature?.stratigraphicAge || waypoint?.stratigraphicAge || "Hesperian (~3.3 Ga)";
  const elevationM = feature?.elevationM ?? waypoint?.elevationM ?? -4100;
  const slopeDeg = feature?.slopeDeg ?? (waypoint ? getMartianSlope(waypoint.coordinates[0], waypoint.coordinates[1]) : 5.2);
  const surfaceFirmness = feature?.surfaceFirmness || waypoint?.surfaceFirmness || (elevationM > -4100 ? "BEDROCK FIRM" : "SOFT SAND TRAP RISK");
  const magNt = feature?.crustalMagneticFieldNt ?? waypoint?.crustalMagneticFieldNt ?? 38;
  const coords: [number, number] = feature?.coordinates || waypoint?.coordinates || [137.4520, -4.5950];
  const mineralogy = feature?.mineralogy || waypoint?.dominantHydratedMineral || "Hematite, Sulfates & Amorphous Silica";

  // Check 360 availability
  const targetWp = feature?.associatedWaypoint || waypoint;
  const has360 = targetWp && (
    targetWp.has360Pov ||
    (targetWp as any).customPanoramaUrl ||
    custom360Waypoints.some((c) => c.id === targetWp.id)
  );

  return (
    <div className={`h-full flex flex-col font-mono text-[11px] select-none ${
      isDark ? "bg-[#0b0f17] text-slate-200" : "bg-white text-slate-800"
    }`}>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Active Inspection Guide Banner */}
        <div className="p-2.5 bg-[#07090e] border border-cyan-500/80 text-[10px]">
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span>[{t("activeStatus")}]</span>
          </div>
          <p className="text-[9px] text-slate-300 leading-relaxed">
            {t("instruction")}
          </p>
        </div>

        {/* Location & Geology Block */}
        <div className="bg-[#111827] p-2.5 border border-slate-700">
          <div className="text-[9px] text-slate-300 uppercase font-bold tracking-wider">
            {t("locationGeology")} // {category}
          </div>
          <div className="text-amber-400 font-bold text-xs truncate mt-1">
            {name}
          </div>
          <div className="text-[10px] text-slate-300 font-medium mt-0.5">
            {stratigraphicAge}
          </div>
        </div>

        {/* Metrics Matrix 2x2 */}
        <div className="grid grid-cols-2 gap-2">
          {/* MOLA Elevation */}
          <div className="bg-[#111827] p-2 border border-slate-700">
            <span className="text-[8px] text-slate-300 uppercase tracking-wider block font-bold">
              {t("molaElevation")}
            </span>
            <span className="text-white font-mono font-bold text-xs tabular-nums block mt-0.5">
              {elevationM > 0 ? `+${elevationM}` : elevationM} m
            </span>
          </div>

          {/* Slope / Lereng */}
          <div className="bg-[#111827] p-2 border border-slate-700">
            <span className="text-[8px] text-slate-300 uppercase tracking-wider block font-bold">
              {t("slope")}
            </span>
            <span className="text-white font-mono font-bold text-xs tabular-nums block mt-0.5">
              {slopeDeg.toFixed(1)}°{" "}
              <span className={`text-[8px] font-bold ${
                slopeDeg < 15 ? "text-emerald-400" : slopeDeg < 25 ? "text-amber-400" : "text-red-400"
              }`}>
                [{slopeDeg < 15 ? t("safeTag") : slopeDeg < 25 ? t("cautionTag") : t("hazardTag")}]
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Ground Firmness */}
          <div className="bg-[#111827] p-2 border border-slate-700">
            <span className="text-[8px] text-slate-300 uppercase tracking-wider block font-bold">
              {t("groundFirmness")}
            </span>
            <span className={`text-[9px] font-bold block mt-0.5 ${
              surfaceFirmness === "BEDROCK FIRM"
                ? "text-emerald-400"
                : surfaceFirmness === "MODERATE COMPACTION"
                ? "text-amber-400"
                : "text-red-400"
            }`}>
              [{surfaceFirmness === "BEDROCK FIRM"
                ? t("bedrockFirm")
                : surfaceFirmness === "MODERATE COMPACTION"
                ? t("moderateCompaction")
                : t("softSandRisk")}]
            </span>
          </div>

          {/* Magnetic Shielding */}
          <div className="bg-[#111827] p-2 border border-slate-700">
            <span className="text-[8px] text-slate-300 uppercase tracking-wider block font-bold">
              {t("magShielding")}
            </span>
            <span className="text-purple-300 font-mono font-bold text-xs tabular-nums block mt-0.5">
              {magNt} nT
            </span>
          </div>
        </div>

        {/* Coordinates */}
        <div className="bg-[#111827] p-2 border border-slate-700 flex justify-between items-center text-[10px]">
          <span className="text-slate-300 uppercase font-bold tracking-wider">
            {t("coordinates")}:
          </span>
          <span className="text-white font-mono font-bold tabular-nums">
            Lat {coords[1].toFixed(4)}°, Lon {coords[0].toFixed(4)}°
          </span>
        </div>

        {/* Hydrated Mineralogy */}
        <div className="bg-[#111827] p-2 border border-slate-700">
          <span className="text-[8px] text-slate-300 uppercase block font-bold tracking-wider">
            {t("mineralogy")}:
          </span>
          <span className="text-cyan-300 font-bold text-[10px] truncate block mt-0.5">
            {mineralogy}
          </span>
        </div>

        {/* Action Menu */}
        <div className="pt-2 border-t border-slate-700 space-y-2">
          <span className="text-[9px] text-slate-300 uppercase font-bold tracking-wider block">
            {t("availableActions")}:
          </span>

          {/* Primary Action: Plan Route */}
          <button
            onClick={() => {
              if (targetWp && onPlanRouteToWaypoint) {
                onPlanRouteToWaypoint(targetWp);
              }
            }}
            className="w-full py-2 px-3 bg-[#064e3b] hover:bg-[#047857] text-[#34d399] border border-[#10b981] font-bold text-[11px] tracking-wider transition-colors flex items-center justify-center gap-2"
          >
            <span>[ {t("planRoute")} ]</span>
          </button>

          {/* Secondary Action Grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            {/* 360 POV */}
            {has360 && targetWp ? (
              <button
                onClick={() => onOpenPovModal?.(targetWp)}
                className="py-1.5 px-2 bg-[#083344] hover:bg-[#0e7490] text-[#a5f3fc] border border-[#06b6d4] font-bold text-[9px] transition-colors text-center truncate flex items-center justify-center gap-1"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
                </svg>
                <span>{t("openPov")}</span>
              </button>
            ) : (
              <button
                disabled
                className="py-1.5 px-2 bg-[#111827] text-slate-500 border border-slate-800 font-bold text-[9px] text-center truncate cursor-not-allowed opacity-60"
              >
                [ {t("no360Pov")} ]
              </button>
            )}

            {/* Prospector ML */}
            <button
              onClick={() => {
                if (targetWp && onAnalyzeProspector) {
                  onAnalyzeProspector(targetWp);
                }
              }}
              className="py-1.5 px-2 bg-[#1e1b4b] hover:bg-[#312e81] text-[#c7d2fe] border border-[#6366f1] font-bold text-[9px] transition-colors text-center truncate"
            >
              {t("prospector")}
            </button>

            {/* Earth Analogue */}
            <button
              onClick={() => {
                if (targetWp && onOpenAnalogueMatcher) {
                  onOpenAnalogueMatcher(targetWp);
                }
              }}
              className="py-1.5 px-2 bg-[#451a03] hover:bg-[#78350f] text-[#fde68a] border border-[#d97706] font-bold text-[9px] transition-colors text-center truncate"
            >
              [ {t("earthAnalogue")} ]
            </button>

            {/* 5M Transect Dock */}
            <button
              onClick={() => onToggleProfileDock?.()}
              className={`py-1.5 px-2 border font-bold text-[9px] transition-colors text-center truncate ${
                isProfileDockOpen
                  ? "bg-[#161e2e] text-cyan-300 border-cyan-500"
                  : "bg-[#111827] text-slate-300 border-slate-700 hover:text-white"
              }`}
            >
              [ {t("transectDock")} ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

PointInspectorPanel.displayName = "PointInspectorPanel";
