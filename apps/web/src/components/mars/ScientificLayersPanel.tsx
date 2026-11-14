"use client";

import React from "react";
import { MARTIAN_SCIENTIFIC_LAYERS, MartianLayerDef } from "@/lib/martian/martianLayers";

interface ScientificLayersPanelProps {
  activeLayers: Record<string, boolean>;
  onToggleLayer: (layerId: string) => void;
}

export const ScientificLayersPanel: React.FC<ScientificLayersPanelProps> = ({
  activeLayers,
  onToggleLayer,
}) => {
  return (
    <div className="flex flex-col h-full overflow-y-auto text-slate-200 text-xs p-4 space-y-4">
      {/* Header */}
      <div className="border-b border-slate-800 pb-2.5">
        <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 block">
          PLANETARY GIS TELEMETRY LAYERS
        </span>
        <h3 className="text-sm font-bold text-white mt-1">Mount Sharp Multi-Layer Overlays</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Standardized planetary telemetry combining USGS geologic mapping, HRSC elevation contours, and Morgan et al. (2020) thermal indices.
        </p>
      </div>

      {/* Layer Cards */}
      <div className="space-y-3">
        {MARTIAN_SCIENTIFIC_LAYERS.map((layer) => {
          const isVisible = Boolean(activeLayers[layer.id]);

          return (
            <div
              key={layer.id}
              className={`p-3 rounded-lg border transition-all ${
                isVisible
                  ? "bg-slate-900 border-amber-500/40 shadow-sm"
                  : "bg-slate-900/50 border-slate-800 opacity-75 hover:opacity-100"
              }`}
            >
              {/* Header Toggle */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isVisible ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "bg-slate-600"
                      }`}
                    />
                    <h4 className="font-bold text-white text-xs leading-snug">{layer.name}</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{layer.description}</p>
                </div>

                <button
                  onClick={() => onToggleLayer(layer.id)}
                  className={`px-3 py-1 rounded font-mono text-[10px] font-bold uppercase transition-colors shrink-0 ${
                    isVisible
                      ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {isVisible ? "Active" : "Disabled"}
                </button>
              </div>

              {/* Legends if Visible */}
              {isVisible && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 block">
                    Layer Legend &amp; Color Ramps
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    {layer.legend.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px]">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0 border border-black/40"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-slate-200">{item.label}:</span>
                        <span className="text-slate-400 truncate">{item.description}</span>
                      </div>
                    ))}
                  </div>

                  {/* Scientific Citation */}
                  <div className="mt-2 text-[9px] text-slate-400 font-mono bg-slate-950/60 p-1.5 rounded border border-slate-800/60 flex items-center justify-between">
                    <span className="truncate">Attribution: {layer.sourceCitation.attributionText}</span>
                    <a
                      href={layer.sourceCitation.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline shrink-0 ml-2"
                    >
                      PDS Source ↗
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
