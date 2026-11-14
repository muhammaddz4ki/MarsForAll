"use client";

import React, { useState } from "react";
import AresMissionBadge from "../AresMissionBadge";
import AresMapViewer from "./AresMapViewer";
import ProspectorPanel from "./ProspectorPanel";
import AnalogueMatcherPanel from "./AnalogueMatcherPanel";
import MarswalkPlannerPanel from "./MarswalkPlannerPanel";
import ScientificLayersPanel from "./ScientificLayersPanel";
import SurfacePovModal from "./SurfacePovModal";
import VisorHudOverlay from "./VisorHudOverlay";
import AresInfoModal from "./AresInfoModal";
import {
  MOUNT_SHARP_WAYPOINTS,
  MountSharpWaypoint,
} from "@/lib/martian/mountSharpWaypoints";
import { MarswalkRouteResult } from "@/lib/martian/marswalkRouter";

export type ViewMode = "mission_control" | "visor_hud";
export type SidebarTab = "prospector" | "earth_analogue" | "marswalk" | "layers";

export const AresMartianApp: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("mission_control");
  const [selectedWaypoint, setSelectedWaypoint] = useState<MountSharpWaypoint>(
    MOUNT_SHARP_WAYPOINTS[1] // Default: Curiosity Boxwork 2025 Site
  );
  const [activeTab, setActiveTab] = useState<SidebarTab>("prospector");
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    layer_optical_geologic: true,
    layer_topographic_hazard: true,
    layer_thermal_subsurface: false,
    layer_radiation_weather: false,
  });
  const [activeRoute, setActiveRoute] = useState<MarswalkRouteResult | null>(null);
  const [isPovOpen, setIsPovOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

  const handleToggleLayer = (layerId: string) => {
    setActiveLayers((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  const handleSelectWaypoint = (wp: MountSharpWaypoint) => {
    setSelectedWaypoint(wp);
  };

  const handleOpenPovModal = (wp: MountSharpWaypoint) => {
    setSelectedWaypoint(wp);
    setIsPovOpen(true);
  };

  const handlePlanRouteToWaypoint = (wp: MountSharpWaypoint) => {
    setSelectedWaypoint(wp);
    setActiveTab("marswalk");
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Navigation & Mission Mode Switcher Bar */}
      <header className="h-14 bg-slate-950/95 border-b border-slate-800 px-4 flex items-center justify-between z-20 shrink-0 shadow-md">
        {/* Brand & Mission Badge */}
        <div className="flex items-center gap-3">
          <AresMissionBadge size={34} showSubtext />
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800 text-[11px] font-mono text-slate-400">
            <span>TARGET: MOUNT SHARP (GALE CRATER)</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400">LAT: -5.4453° / LON: 137.8414°</span>
          </div>
        </div>

        {/* 1-Click Viewport Mode Switcher Pill */}
        <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setViewMode("mission_control")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "mission_control"
                ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🌐</span> Habitat Mission Control
          </button>

          <button
            onClick={() => setViewMode("visor_hud")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "visor_hud"
                ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>🪖</span> Astronaut Visor HUD
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenPovModal(selectedWaypoint)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-mono text-xs transition-colors"
          >
            <span>👁️</span> Surface POV
          </button>

          <button
            onClick={() => setIsInfoOpen(true)}
            title="Scientific Attribution & Mission Brief"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            ℹ
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* MapLibre 2.5D / 3D Canvas Viewport */}
        <div className="flex-1 relative h-full">
          <AresMapViewer
            activeLayers={activeLayers}
            selectedWaypoint={selectedWaypoint}
            onSelectWaypoint={handleSelectWaypoint}
            activeRoute={activeRoute}
            viewMode={viewMode}
          />

          {/* Astronaut Visor HUD Overlay (Mounted on top of map when active) */}
          {viewMode === "visor_hud" && (
            <VisorHudOverlay
              selectedWaypoint={selectedWaypoint}
              activeRoute={activeRoute}
              onOpenPovModal={handleOpenPovModal}
              onToggleViewMode={() => setViewMode("mission_control")}
            />
          )}
        </div>

        {/* Habitat Control Right Workbench Panel (Hidden in Visor HUD mode) */}
        {viewMode === "mission_control" && (
          <aside className="w-96 md:w-[440px] h-full bg-slate-950/95 border-l border-slate-800 flex flex-col z-10 shrink-0 shadow-2xl">
            {/* Workbench Tab Navigation */}
            <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 gap-1 shrink-0 font-mono text-[11px]">
              <button
                onClick={() => setActiveTab("prospector")}
                className={`flex-1 py-2 px-1 text-center rounded transition-all ${
                  activeTab === "prospector"
                    ? "bg-slate-800 text-amber-400 font-bold border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Prospector ML
              </button>

              <button
                onClick={() => setActiveTab("earth_analogue")}
                className={`flex-1 py-2 px-1 text-center rounded transition-all ${
                  activeTab === "earth_analogue"
                    ? "bg-slate-800 text-cyan-400 font-bold border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Earth Matcher
              </button>

              <button
                onClick={() => setActiveTab("marswalk")}
                className={`flex-1 py-2 px-1 text-center rounded transition-all ${
                  activeTab === "marswalk"
                    ? "bg-slate-800 text-emerald-400 font-bold border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Marswalk A*
              </button>

              <button
                onClick={() => setActiveTab("layers")}
                className={`flex-1 py-2 px-1 text-center rounded transition-all ${
                  activeTab === "layers"
                    ? "bg-slate-800 text-slate-200 font-bold border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Layers (4)
              </button>
            </div>

            {/* Workbench Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "prospector" && (
                <ProspectorPanel
                  waypoint={selectedWaypoint}
                  onOpenPovModal={handleOpenPovModal}
                  onPlanRouteToWaypoint={handlePlanRouteToWaypoint}
                />
              )}

              {activeTab === "earth_analogue" && (
                <AnalogueMatcherPanel waypoint={selectedWaypoint} />
              )}

              {activeTab === "marswalk" && (
                <MarswalkPlannerPanel
                  selectedWaypoint={selectedWaypoint}
                  onRouteCalculated={setActiveRoute}
                />
              )}

              {activeTab === "layers" && (
                <ScientificLayersPanel
                  activeLayers={activeLayers}
                  onToggleLayer={handleToggleLayer}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Surface POV Eye-Level Inspection Modal */}
      {isPovOpen && (
        <SurfacePovModal
          waypoint={selectedWaypoint}
          onClose={() => setIsPovOpen(false)}
        />
      )}

      {/* Scientific Attribution & Mission Info Modal */}
      <AresInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
};

export default AresMartianApp;
