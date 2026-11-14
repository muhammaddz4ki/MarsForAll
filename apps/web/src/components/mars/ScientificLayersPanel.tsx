"use client";

import React from "react";
import { MARTIAN_SCIENTIFIC_LAYERS } from "@/lib/martian/martianLayers";
import {
  OrbitalImagerySource,
  WmtsStreamStatus,
  ORBITAL_WMTS_PRESETS,
} from "@/lib/martian/scientificParams";

interface ScientificLayersPanelProps {
  activeLayers: Record<string, boolean>;
  onToggleLayer: (layerId: string) => void;
  theme?: "dark" | "light";
  orbitalSource?: OrbitalImagerySource;
  onSelectOrbitalSource?: (source: OrbitalImagerySource) => void;
  wmtsStatus?: WmtsStreamStatus;
}

export const ScientificLayersPanel: React.FC<ScientificLayersPanelProps> = ({
  activeLayers,
  onToggleLayer,
  theme = "dark",
  orbitalSource = "jpl_hirise",
  onSelectOrbitalSource,
  wmtsStatus = "streaming",
}) => {
  const isDark = theme === "dark";
  const activePreset = ORBITAL_WMTS_PRESETS[orbitalSource] || ORBITAL_WMTS_PRESETS.jpl_hirise;
  const [probeSuccess, setProbeSuccess] = React.useState<boolean | null>(null);

  // Probe tile health check to /api/mars-tiles/mola-clrshade/4/8/10
  React.useEffect(() => {
    let isMounted = true;
    const probe = async () => {
      try {
        const res = await fetch("/api/mars-tiles/mola-clrshade/4/8/10", {
          method: "HEAD",
        });
        if (isMounted) {
          const isFallback = res.headers.get("X-Tile-Fallback");
          setProbeSuccess(res.ok && !isFallback);
        }
      } catch (_e) {
        if (isMounted) {
          setProbeSuccess(false);
        }
      }
    };
    probe();
    return () => {
      isMounted = false;
    };
  }, []);

  const isProxyActive = (probeSuccess !== false) && wmtsStatus === "streaming" && orbitalSource !== "local_vector";

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${
      isDark ? "text-slate-200" : "text-slate-800"
    } text-xs p-3 space-y-3 font-sans`}>
      {/* Header */}
      <div className={`border-b ${isDark ? "border-slate-800" : "border-slate-300"} pb-2`}>
        <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-500 font-bold block">
          PLANETARY GIS TELEMETRY LAYERS
        </span>
        <h3 className={`text-xs font-bold font-mono ${isDark ? "text-white" : "text-slate-900"} uppercase mt-0.5`}>
          Mount Sharp Multi-Layer Overlays
        </h3>
        <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"} mt-0.5 font-mono`}>
          Planetary telemetry combining USGS geologic mapping, HRSC elevation contours, and Morgan et al. (2020) thermal indices.
        </p>
      </div>

      {/* Layer Cards (Flat Solid Cards, Sharp 1px Border) */}
      <div className="space-y-2">
        {MARTIAN_SCIENTIFIC_LAYERS.map((layer) => {
          const isVisible = Boolean(activeLayers[layer.id]);

          return (
            <div
              key={layer.id}
              className={`p-2.5 border transition-colors ${
                isVisible
                  ? isDark
                    ? "bg-[#111827] border-amber-500/70"
                    : "bg-amber-50/50 border-amber-500"
                  : isDark
                  ? "bg-[#0b0f17] border-slate-800 opacity-75 hover:opacity-100"
                  : "bg-white border-slate-300 opacity-75 hover:opacity-100"
              }`}
            >
              {/* Header Toggle */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span
                      className={`w-2 h-2 shrink-0 ${
                        isVisible ? "bg-amber-400" : "bg-slate-500"
                      }`}
                    />
                    <h4 className={`font-bold ${isDark ? "text-white" : "text-slate-900"} text-[11px] leading-snug uppercase`}>
                      {layer.name}
                    </h4>
                  </div>
                  <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"} mt-1 leading-relaxed font-mono`}>
                    {layer.description}
                  </p>
                </div>

                <button
                  onClick={() => onToggleLayer(layer.id)}
                  className={`px-2 py-0.5 font-mono text-[9px] font-bold uppercase border transition-colors shrink-0 ${
                    isVisible
                      ? "bg-amber-600 text-slate-950 border-amber-400"
                      : isDark
                      ? "bg-[#1f2937] text-slate-400 border-slate-700 hover:text-white"
                      : "bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900"
                  }`}
                >
                  {isVisible ? "[ACTIVE]" : "[DISABLED]"}
                </button>
              </div>

              {/* Legends & Orbital Source Controls if Visible */}
              {isVisible && (
                <div className={`mt-2.5 pt-2 border-t ${isDark ? "border-slate-800" : "border-slate-200"} space-y-2 font-mono`}>
                  {/* Specialized Orbital Source Controls for Optical Layer */}
                  {layer.id === "layer_optical_geologic" && (
                    <div className={`p-2 border ${
                      isDark ? "bg-[#07090e] border-slate-800" : "bg-slate-50 border-slate-200"
                    } space-y-1.5`}>
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-slate-400 uppercase font-bold tracking-wider">
                          ORBITAL WMTS SOURCE:
                        </span>
                        {/* Live / Fallback Status Badge */}
                        <span
                          className={`px-1.5 py-0.5 border text-[9px] font-bold tabular-nums ${
                            isProxyActive
                              ? "bg-[#064e3b] text-[#34d399] border-[#10b981]"
                              : "bg-[#78350f] text-[#fde68a] border-[#d97706]"
                          }`}
                        >
                          {isProxyActive
                            ? "[JPL WMTS PROXY ACTIVE]"
                            : "[LOCAL + OPM FALLBACK]"}
                        </span>
                      </div>

                      {/* 4-Button Grid for WMTS Source Switcher */}
                      <div className="grid grid-cols-2 gap-1 text-[9px]">
                        {(["jpl_hirise", "mola_hrsc", "opm_basemap", "local_vector"] as const).map((key) => {
                          const preset = ORBITAL_WMTS_PRESETS[key];
                          const isSelected = orbitalSource === key;
                          return (
                            <button
                              key={key}
                              onClick={() => onSelectOrbitalSource?.(key)}
                              className={`p-1.5 border text-left flex flex-col justify-between transition-colors ${
                                isSelected
                                  ? isDark
                                    ? "bg-[#161e2e] border-amber-500 text-white font-bold"
                                    : "bg-white border-amber-500 text-amber-950 font-bold shadow-sm"
                                  : isDark
                                  ? "bg-[#0b0f17] border-slate-800 text-slate-400 hover:text-slate-200"
                                  : "bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900"
                              }`}
                            >
                              <span className="truncate">{preset.label}</span>
                              <span className="text-[8px] text-slate-400 mt-0.5 tabular-nums">
                                {preset.resolution}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Footprint & Endpoint Metadata */}
                      <div className="text-[8px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-800/80">
                        <span className="truncate max-w-[200px]">
                          FOOTPRINT: GALE CRATER / MOUNT SHARP
                        </span>
                        <span className="text-amber-500 tabular-nums">
                          RES: {activePreset.resolution}
                        </span>
                      </div>
                    </div>
                  )}

                  <span className={`text-[8px] uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} block`}>
                    LEGEND &amp; STRATIGRAPHIC RAMPS
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {layer.legend.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[9px]">
                        <span
                          className={`w-2.5 h-2.5 shrink-0 border ${isDark ? "border-slate-700" : "border-slate-300"}`}
                          style={{ backgroundColor: item.color }}
                        />
                        <span className={`font-bold ${isDark ? "text-slate-200" : "text-slate-800"} uppercase`}>
                          {item.label}:
                        </span>
                        <span className={`${isDark ? "text-slate-400" : "text-slate-500"} truncate`}>
                          {item.description}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Scientific Citation */}
                  <div className={`mt-1.5 text-[9px] ${
                    isDark ? "bg-[#080c14] border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"
                  } p-1.5 border flex items-center justify-between`}>
                    <span className="truncate">SOURCE: {layer.sourceCitation.attributionText}</span>
                    <a
                      href={layer.sourceCitation.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-500 hover:underline shrink-0 ml-2 font-bold"
                    >
                      [PDS DOCS]
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScientificLayersPanel;