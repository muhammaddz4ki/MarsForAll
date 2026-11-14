"use client";

import React from "react";
import { MARTIAN_SCIENTIFIC_LAYERS } from "@/lib/martian/martianLayers";

interface ScientificLayersPanelProps {
  activeLayers: Record<string, boolean>;
  onToggleLayer: (layerId: string) => void;
  theme?: "dark" | "light";
}

export const ScientificLayersPanel: React.FC<ScientificLayersPanelProps> = ({
  activeLayers,
  onToggleLayer,
  theme = "dark",
}) => {
  const isDark = theme === "dark";

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

              {/* Legends if Visible */}
              {isVisible && (
                <div className={`mt-2.5 pt-2 border-t ${isDark ? "border-slate-800" : "border-slate-200"} space-y-1 font-mono`}>
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