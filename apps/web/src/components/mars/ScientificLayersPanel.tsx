"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { MARTIAN_SCIENTIFIC_LAYERS, MartianLayerDef } from "@/lib/martian/martianLayers";
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
  layerOpacities?: Record<string, number>;
  onChangeLayerOpacity?: (layerId: string, opacity: number) => void;
}

interface LayerGroup {
  id: string;
  nameKey: string;
  defaultName: string;
  tag: string;
  layers: MartianLayerDef[];
}

export const ScientificLayersPanel: React.FC<ScientificLayersPanelProps> = ({
  activeLayers,
  onToggleLayer,
  theme = "dark",
  orbitalSource = "jpl_hirise",
  onSelectOrbitalSource,
  wmtsStatus = "streaming",
  layerOpacities,
  onChangeLayerOpacity,
}) => {
  const t = useTranslations("layers");
  const isDark = theme === "dark";
  const activePreset = ORBITAL_WMTS_PRESETS[orbitalSource] || ORBITAL_WMTS_PRESETS.jpl_hirise;
  const [probeSuccess, setProbeSuccess] = useState<boolean | null>(null);

  // Search & Filtering State (Bioscape Data Portal Image 1 standard)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");

  // Accordion collapsed state for 5 categories
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    topography: false,
    thermal: false,
    mineral: false,
    radiation: false,
    weather: false,
  });

  // Expanded layer parameters state
  const [expandedLayerId, setExpandedLayerId] = useState<string | null>("layer_optical_geologic");

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

  const isProxyActive = probeSuccess !== false && wmtsStatus === "streaming" && orbitalSource !== "local_vector";

  // Grouped layer categories
  const layerGroups: LayerGroup[] = useMemo(() => [
    {
      id: "topography",
      nameKey: "groupTopography",
      defaultName: "1. TOPOGRAFI & MEDAN JALAN",
      tag: "topography",
      layers: MARTIAN_SCIENTIFIC_LAYERS.filter(
        (l) => l.id === "layer_optical_geologic" || l.id === "layer_topographic_hazard"
      ),
    },
    {
      id: "thermal",
      nameKey: "groupThermal",
      defaultName: "2. FISIK TERMAL & PASIR AMBLAS",
      tag: "thermal",
      layers: MARTIAN_SCIENTIFIC_LAYERS.filter((l) => l.id === "layer_thermal_subsurface"),
    },
    {
      id: "mineral",
      nameKey: "groupMinerals",
      defaultName: "3. MINERALOGI & SUMBER DAYA HIDRAT",
      tag: "minerals",
      layers: MARTIAN_SCIENTIFIC_LAYERS.filter((l) => l.id === "layer_science_mineral"),
    },
    {
      id: "radiation",
      nameKey: "groupRadiation",
      defaultName: "4. PERISAI RADIASI & MAGNETIK KERAK",
      tag: "radiation",
      layers: MARTIAN_SCIENTIFIC_LAYERS.filter((l) => l.id === "layer_safety_magnetic"),
    },
  ], []);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const tagList = ["ALL", "topography", "thermal", "minerals", "radiation"];

  return (
    <div
      className={`flex flex-col h-full overflow-y-auto ${
        isDark ? "text-slate-200" : "text-slate-800"
      } text-xs p-3 space-y-3 font-sans`}
    >
      {/* Bioscape Header (Ref Image 1) */}
      <div className={`border-b ${isDark ? "border-slate-800" : "border-slate-300"} pb-2`}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest uppercase text-cyan-500 font-bold block">
            {t("title")}
          </span>
          <span className="font-mono text-[9px] text-slate-400 bg-[#0b0f17] border border-slate-800 px-1.5 py-0.5">
            5 NASA LAYERS
          </span>
        </div>
        <h3 className={`text-xs font-bold font-mono ${isDark ? "text-white" : "text-slate-900"} uppercase mt-0.5`}>
          {t("subtitle")}
        </h3>
        <p className={`text-[10px] ${isDark ? "text-slate-400" : "text-slate-500"} mt-0.5 font-mono`}>
          {t("description")}
        </p>
      </div>

      {/* Search Input & Tags Filter (Image 1 Ref: 'Search layers (# for tags)') */}
      <div className="space-y-1.5 font-mono">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder") || "Search layers (# for tags)..."}
            className={`w-full px-2.5 py-1.5 text-[10px] border ${
              isDark
                ? "bg-[#0b0f17] border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500"
                : "bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600"
            } focus:outline-none`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-white text-[11px]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Tag Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[8px]">
          {tagList.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-1.5 py-0.5 uppercase border font-bold transition-colors shrink-0 ${
                  isSelected
                    ? "bg-cyan-900/60 text-cyan-300 border-cyan-500"
                    : isDark
                    ? "bg-[#0b0f17] text-slate-400 border-slate-800 hover:text-slate-200"
                    : "bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900"
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Categorized Layer Accordion Tree (Ref Image 1: Bioscape Data Portal standard) */}
      <div className="space-y-2">
        {layerGroups.map((group) => {
          // Filter group layers based on search and tag
          const filteredLayers = group.layers.filter((layer) => {
            const matchesTag = selectedTag === "ALL" || group.tag === selectedTag;
            const matchesQuery =
              !searchQuery ||
              layer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              layer.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTag && matchesQuery;
          });

          if (filteredLayers.length === 0) return null;

          const isCollapsed = Boolean(collapsedGroups[group.id]);
          const activeCount = filteredLayers.filter((l) => Boolean(activeLayers[l.id])).length;

          return (
            <div
              key={group.id}
              className={`border ${
                isDark ? "bg-[#0b0f17] border-slate-800" : "bg-white border-slate-300 shadow-sm"
              }`}
            >
              {/* Category Folder Header */}
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between p-2 text-left font-mono text-[10px] font-bold uppercase transition-colors ${
                  isDark ? "bg-[#111827] hover:bg-[#161e2e]" : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400 font-mono">{isCollapsed ? "►" : "▼"}</span>
                  <span className={isDark ? "text-slate-200" : "text-slate-900"}>
                    {group.defaultName}
                  </span>
                </div>
                <span
                  className={`text-[8px] px-1.5 py-0.2 border tabular-nums ${
                    activeCount > 0
                      ? "bg-[#064e3b] text-[#34d399] border-[#059669]"
                      : "bg-[#1f2937] text-slate-400 border-slate-700"
                  }`}
                >
                  [{activeCount}/{filteredLayers.length} ON]
                </span>
              </button>

              {/* Group Layers */}
              {!isCollapsed && (
                <div className="p-2 space-y-2 border-t border-slate-800/80">
                  {filteredLayers.map((layer) => {
                    const isVisible = Boolean(activeLayers[layer.id]);
                    const isExpanded = expandedLayerId === layer.id;

                    return (
                      <div
                        key={layer.id}
                        className={`p-2 border transition-colors ${
                          isVisible
                            ? isDark
                              ? "bg-[#111827] border-amber-500/70"
                              : "bg-amber-50/50 border-amber-500"
                            : isDark
                            ? "bg-[#07090e] border-slate-800 opacity-80 hover:opacity-100"
                            : "bg-slate-50 border-slate-300 opacity-80 hover:opacity-100"
                        }`}
                      >
                        {/* Layer Title Row & Checkbox Toggle */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            {/* Checkbox */}
                            <button
                              onClick={() => onToggleLayer(layer.id)}
                              className={`w-4 h-4 mt-0.5 shrink-0 border flex items-center justify-center transition-colors ${
                                isVisible
                                  ? "bg-amber-500 border-amber-400 text-slate-950 font-bold"
                                  : isDark
                                  ? "bg-[#0b0f17] border-slate-700 hover:border-slate-500"
                                  : "bg-white border-slate-400 hover:border-slate-600"
                              }`}
                            >
                              {isVisible && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>

                            <div className="flex-1">
                              <div className="flex items-center gap-1.5 font-mono">
                                <h4
                                  className={`font-bold ${
                                    isDark ? "text-white" : "text-slate-900"
                                  } text-[10px] leading-snug uppercase`}
                                >
                                  {layer.name}
                                </h4>
                              </div>
                              <p
                                className={`text-[9px] ${
                                  isDark ? "text-slate-400" : "text-slate-500"
                                } mt-0.5 leading-relaxed font-sans line-clamp-2`}
                              >
                                {layer.description}
                              </p>
                            </div>
                          </div>

                          {/* Quick Controls: Expand / Opacity */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => onToggleLayer(layer.id)}
                              className={`px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase border transition-colors ${
                                isVisible
                                  ? "bg-amber-600 text-slate-950 border-amber-400"
                                  : isDark
                                  ? "bg-[#1f2937] text-slate-400 border-slate-700 hover:text-white"
                                  : "bg-slate-100 text-slate-600 border-slate-300 hover:text-slate-900"
                              }`}
                            >
                              {isVisible ? t("active") : t("disabled")}
                            </button>

                            <button
                              onClick={() => setExpandedLayerId(isExpanded ? null : layer.id)}
                              className={`px-1 py-0.5 font-mono text-[9px] border ${
                                isDark
                                  ? "bg-[#161e2e] text-slate-300 border-slate-700 hover:border-slate-500"
                                  : "bg-slate-200 text-slate-700 border-slate-300"
                              }`}
                              title="Toggle Layer Details & Controls"
                            >
                              {isExpanded ? "▲" : "▼"}
                            </button>
                          </div>
                        </div>

                        {/* Expanded Parameter Controls & Legends */}
                        {isExpanded && (
                          <div className={`mt-2 pt-2 border-t ${isDark ? "border-slate-800" : "border-slate-200"} space-y-2 font-mono text-[9px]`}>
                            {/* Opacity Slider */}
                            <div
                              className={`p-1.5 border ${
                                isDark ? "bg-[#07090e] border-slate-800" : "bg-white border-slate-200"
                              } flex items-center justify-between gap-2`}
                            >
                              <span className="text-slate-400 uppercase font-bold tracking-wider shrink-0">
                                {t("opacity")}
                              </span>
                              <div className="flex items-center gap-2 flex-1 max-w-[140px]">
                                <input
                                  type="range"
                                  min="0.05"
                                  max="1.0"
                                  step="0.05"
                                  value={layerOpacities?.[layer.id] ?? 0.8}
                                  onChange={(e) =>
                                    onChangeLayerOpacity?.(layer.id, parseFloat(e.target.value))
                                  }
                                  className="w-full h-1 bg-slate-700 rounded-none accent-amber-500 cursor-pointer"
                                />
                                <span className="text-amber-400 font-bold tabular-nums w-8 text-right">
                                  {Math.round((layerOpacities?.[layer.id] ?? 0.8) * 100)}%
                                </span>
                              </div>
                            </div>

                            {/* Layer 1: Orbital WMTS Source Grid */}
                            {layer.id === "layer_optical_geologic" && (
                              <div
                                className={`p-2 border ${
                                  isDark ? "bg-[#07090e] border-slate-800" : "bg-white border-slate-200"
                                } space-y-1.5`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400 uppercase font-bold tracking-wider text-[8px]">
                                    {t("orbitalWmtsSource")}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 border text-[8px] font-bold tabular-nums ${
                                      isProxyActive
                                        ? "bg-[#064e3b] text-[#34d399] border-[#10b981]"
                                        : "bg-[#78350f] text-[#fde68a] border-[#d97706]"
                                    }`}
                                  >
                                    {isProxyActive ? t("proxyActive") : t("proxyFallback")}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-1 text-[8px]">
                                  {(["jpl_hirise", "mola_hrsc", "opm_basemap", "local_vector"] as const).map(
                                    (key) => {
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
                                                : "bg-amber-100 border-amber-500 text-amber-950 font-bold"
                                              : isDark
                                              ? "bg-[#0b0f17] border-slate-800 text-slate-400 hover:text-slate-200"
                                              : "bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900"
                                          }`}
                                        >
                                          <span className="truncate">{preset.label}</span>
                                          <span className="text-[7px] text-slate-400 mt-0.5 tabular-nums">
                                            {preset.resolution}
                                          </span>
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Layer 3: Sand Trap Callout */}
                            {layer.id === "layer_thermal_subsurface" && (
                              <div
                                className={`p-2 border ${
                                  isDark ? "bg-[#07090e] border-slate-800" : "bg-white border-slate-200"
                                } space-y-1`}
                              >
                                <span className="text-amber-400 uppercase font-bold tracking-wider block text-[8px]">
                                  {t("sandTrapTitle")}
                                </span>
                                <p className="text-slate-300 font-sans text-[8px] leading-relaxed">
                                  {t("sandTrapDesc")}
                                </p>
                              </div>
                            )}

                            {/* Layer 5: Magnetic Shielding Callout */}
                            {layer.id === "layer_safety_magnetic" && (
                              <div
                                className={`p-2 border ${
                                  isDark ? "bg-[#07090e] border-slate-800" : "bg-white border-slate-200"
                                } space-y-1`}
                              >
                                <span className="text-purple-400 uppercase font-bold tracking-wider block text-[8px]">
                                  {t("magneticTitle")}
                                </span>
                                <p className="text-slate-300 font-sans text-[8px] leading-relaxed">
                                  {t("magneticDesc")}
                                </p>
                              </div>
                            )}

                            {/* Legend Color Swatches */}
                            <div className="space-y-1 pt-1">
                              <span className={`text-[8px] uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} block`}>
                                {t("legendTitle")}
                              </span>
                              <div className="grid grid-cols-1 gap-1">
                                {layer.legend.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-1.5 text-[8px]">
                                    <span
                                      className="w-2.5 h-2.5 shrink-0 border border-black/40"
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
                            </div>

                            {/* Scientific Citation */}
                            <div
                              className={`mt-1.5 text-[8px] ${
                                isDark
                                  ? "bg-[#080c14] border-slate-800 text-slate-400"
                                  : "bg-slate-100 border-slate-200 text-slate-600"
                              } p-1.5 border flex items-center justify-between`}
                            >
                              <span className="truncate">{t("source", { source: layer.sourceCitation.attributionText })}</span>
                              <a
                                href={layer.sourceCitation.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-500 hover:underline shrink-0 ml-2 font-bold"
                              >
                                {t("pdsDocs")}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(ScientificLayersPanel);
