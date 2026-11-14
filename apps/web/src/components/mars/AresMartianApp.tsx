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
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090e] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Navigation & Mission Mode Switcher Bar */}
      <header className="h-12 bg-[#0b0f17] border-b border-slate-800 px-4 flex items-center justify-between z-20 shrink-0">
        {/* Brand & Mission Badge */}
        <div className="flex items-center gap-3">
          <AresMissionBadge size={30} showSubtext />
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800 text-[11px] font-mono text-slate-400">
            <span>TARGET: MOUNT SHARP (GALE CRATER)</span>
            <span className="text-slate-600">/</span>
            <span className="text-amber-500 tabular-nums">LAT -5.4453° LON 137.8414°</span>
          </div>
        </div>

        {/* Mode Switcher Pill */}
        <div className="flex items-center p-0.5 bg-[#111827] border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setViewMode("mission_control")}
            className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
              viewMode === "mission_control"
                ? "bg-amber-600 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>HABITAT CONTROL</span>
          </button>

          <button
            onClick={() => setViewMode("visor_hud")}
            className={`flex items-center gap-1.5 px-3 py-1 transition-colors ${
              viewMode === "visor_hud"
                ? "bg-cyan-600 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12h20M4 12v5a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-5M6 12V7a6 6 0 0 1 12 0v5" />
            </svg>
            <span>ASTRONAUT VISOR HUD</span>
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenPovModal(selectedWaypoint)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#161e2e] hover:bg-[#1e293b] border border-slate-700 text-amber-400 font-mono text-[11px] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>SURFACE POV</span>
          </button>

          <button
            onClick={() => setIsInfoOpen(true)}
            title="Scientific Attribution & Mission Brief"
            className="flex items-center justify-center w-7 h-7 bg-[#161e2e] hover:bg-[#1e293b] border border-slate-700 text-slate-300 font-mono text-xs font-bold transition-colors"
          >
            INFO
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

          {/* Astronaut Visor HUD Overlay */}
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
          <aside className="w-96 md:w-[440px] h-full bg-[#0b0f17] border-l border-slate-800 flex flex-col z-10 shrink-0">
            {/* Workbench Tab Navigation */}
            <div className="flex border-b border-slate-800 bg-[#07090e] p-1 gap-1 shrink-0 font-mono text-[11px]">
              <button
                onClick={() => setActiveTab("prospector")}
                className={`flex-1 py-1.5 px-1 text-center border transition-colors ${
                  activeTab === "prospector"
                    ? "bg-[#161e2e] text-amber-400 font-bold border-slate-700"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                PROSPECTOR ML
              </button>

              <button
                onClick={() => setActiveTab("earth_analogue")}
                className={`flex-1 py-1.5 px-1 text-center border transition-colors ${
                  activeTab === "earth_analogue"
                    ? "bg-[#161e2e] text-cyan-400 font-bold border-slate-700"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                EARTH MATCHER
              </button>

              <button
                onClick={() => setActiveTab("marswalk")}
                className={`flex-1 py-1.5 px-1 text-center border transition-colors ${
                  activeTab === "marswalk"
                    ? "bg-[#161e2e] text-emerald-400 font-bold border-slate-700"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                MARSWALK A*
              </button>

              <button
                onClick={() => setActiveTab("layers")}
                className={`flex-1 py-1.5 px-1 text-center border transition-colors ${
                  activeTab === "layers"
                    ? "bg-[#161e2e] text-slate-200 font-bold border-slate-700"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                LAYERS (4)
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
