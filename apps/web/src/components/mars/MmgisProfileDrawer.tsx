"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { ElevationProfileResult } from "@/lib/martian/mmgisSpatialAnalysis";

interface MmgisProfileDrawerProps {
  profile: ElevationProfileResult | null;
  onClear: () => void;
  onClose: () => void;
  theme?: "dark" | "light";
  siteName?: string;
}

export const MmgisProfileDrawer: React.FC<MmgisProfileDrawerProps> = ({
  profile,
  onClear,
  onClose,
  theme = "dark",
  siteName = "Gale Crater",
}) => {
  const t = useTranslations("mmgis");
  const isDark = theme === "dark";

  const chartData = useMemo(() => {
    if (!profile) return [];
    return profile.samples.map((s) => ({
      distKm: s.distanceKm,
      groundM: s.elevationM,
      losM: s.losElevationM,
      slope: s.slopeDeg,
      obstructed: s.isObstructed,
    }));
  }, [profile]);

  const handleExportCsv = () => {
    if (!profile || profile.samples.length === 0) return;
    const header = "distance_km,elevation_m,slope_deg,los_elevation_m,is_obstructed,lon,lat\n";
    const rows = profile.samples
      .map(
        (s) =>
          `${s.distanceKm},${s.elevationM},${s.slopeDeg},${s.losElevationM},${s.isObstructed},${s.coordinates[0]},${s.coordinates[1]}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mars-elevation-profile-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!profile) return null;

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-30 border-t ${
        isDark
          ? "bg-[#07090e] border-slate-800 text-slate-200"
          : "bg-white border-slate-300 text-slate-800"
      } font-mono select-none shadow-none`}
    >
      {/* Header & Telemetry Bar */}
      <div className={`px-3 py-2 border-b ${isDark ? "border-slate-800/80" : "border-slate-200"} flex flex-wrap items-center justify-between gap-2 text-xs`}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-400" />
          <span className="font-bold uppercase tracking-wider text-cyan-400">
            {t("profileTitle")}
          </span>
          <span className="text-[10px] text-slate-400">
            ({siteName})
          </span>
        </div>

        {/* Telemetry Metrics */}
        <div className="flex items-center gap-3 text-[10px] tabular-nums">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">{t("totalDistance")}:</span>
            <span className="font-bold text-amber-400">{profile.totalDistanceKm} KM</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">{t("elevationGain")}:</span>
            <span className="font-bold text-emerald-400">+{profile.elevationGainM} M</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">{t("elevationLoss")}:</span>
            <span className="font-bold text-rose-400">-{profile.elevationLossM} M</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">{t("maxSlope")}:</span>
            <span className="font-bold text-purple-400">{profile.maxSlopeDeg}°</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">{t("losStatus")}:</span>
            <span
              className={`px-1.5 py-0.2 border text-[9px] font-bold ${
                profile.isDirectLosClear
                  ? "bg-[#064e3b] text-[#34d399] border-[#10b981]"
                  : "bg-[#7f1d1d] text-[#fca5a5] border-[#ef4444]"
              }`}
            >
              {profile.isDirectLosClear ? t("losClear") : t("losObstructed")}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <button
            onClick={handleExportCsv}
            className={`px-2 py-0.5 border font-bold transition-colors ${
              isDark
                ? "bg-[#0b0f17] border-cyan-500/80 text-cyan-400 hover:bg-cyan-950/40"
                : "bg-slate-50 border-cyan-600 text-cyan-800 hover:bg-cyan-100"
            }`}
          >
            {t("exportCsv")}
          </button>
          <button
            onClick={onClear}
            className={`px-2 py-0.5 border font-bold transition-colors ${
              isDark
                ? "bg-[#0b0f17] border-slate-700 text-slate-400 hover:text-white"
                : "bg-slate-50 border-slate-300 text-slate-600 hover:text-slate-900"
            }`}
          >
            {t("clear")}
          </button>
          <button
            onClick={onClose}
            className={`px-2 py-0.5 border font-bold transition-colors ${
              isDark
                ? "bg-[#111827] border-slate-700 text-slate-300 hover:text-white"
                : "bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900"
            }`}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-36 w-full p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <XAxis
              dataKey="distKm"
              stroke={isDark ? "#64748b" : "#94a3b8"}
              tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }}
              tickFormatter={(v) => `${v} km`}
            />
            <YAxis
              stroke={isDark ? "#64748b" : "#94a3b8"}
              tick={{ fontSize: 9, fill: isDark ? "#94a3b8" : "#64748b" }}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `${v}m`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div
                    className={`p-2 border text-[10px] font-mono leading-tight ${
                      isDark
                        ? "bg-[#0b0f17] border-slate-700 text-slate-200"
                        : "bg-white border-slate-300 text-slate-900"
                    }`}
                  >
                    <div className="text-amber-400 font-bold mb-1">
                      {d.distKm} KM (SLOPE: {d.slope}°)
                    </div>
                    <div className="text-cyan-400">MOLA ELEV: {d.groundM} M</div>
                    <div className={d.obstructed ? "text-rose-400" : "text-emerald-400"}>
                      LOS (1.7m): {d.losM} M ({d.obstructed ? "OBSTRUCTED" : "CLEAR"})
                    </div>
                  </div>
                );
              }}
            />
            {/* Terrain Cross Section Area */}
            <Area
              type="monotone"
              dataKey="groundM"
              stroke="#06b6d4"
              strokeWidth={1.5}
              fill={isDark ? "#0e2038" : "#e0f2fe"}
              fillOpacity={0.8}
              isAnimationActive={false}
            />
            {/* Direct Line-of-Sight Reference Line */}
            <Line
              type="linear"
              dataKey="losM"
              stroke={profile.isDirectLosClear ? "#10b981" : "#ef4444"}
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default React.memo(MmgisProfileDrawer);
