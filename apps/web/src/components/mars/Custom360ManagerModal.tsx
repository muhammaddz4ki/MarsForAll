"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Custom360PanoramaEntry,
  DEFAULT_360_PANORAMAS,
  getAll360PanoramaEntries,
  saveCustom360Panorama,
  deleteCustom360Panorama,
  convertToMountSharpWaypoint,
} from "@/lib/martian/customPanoramas";
import { MissionSiteId, MountSharpWaypoint } from "@/lib/martian/mountSharpWaypoints";

interface Custom360ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSite: MissionSiteId;
  pickedCoords: [number, number] | null;
  pickedElevation?: number;
  onStartPickCoordinate: () => void;
  onSelectAndOpen360: (wp: MountSharpWaypoint) => void;
  onFlyToCoordinate: (coords: [number, number]) => void;
}

const AVAILABLE_SAMPLE_FILES = [
  { filename: "sol4180_boxwork_equirectangular_2k.jpg", label: "sol4180_boxwork_equirectangular_2k.jpg (Equirectangular 2K)" },
  { filename: "sol4180_boxwork_360.jpg", label: "sol4180_boxwork_360.jpg (Curiosity Mastcam Sol 4180)" },
  { filename: "sol2300_glen_torridon_360.jpg", label: "sol2300_glen_torridon_360.jpg (Glen Torridon Smectite Clay)" },
  { filename: "sol1800_vera_rubin_360.jpg", label: "sol1800_vera_rubin_360.jpg (Vera Rubin Hematite Ridge)" },
  { filename: "sol0_bradbury_landing_360.jpg", label: "sol0_bradbury_landing_360.jpg (Bradbury Landing Touchdown)" },
];

export const Custom360ManagerModal: React.FC<Custom360ManagerModalProps> = ({
  isOpen,
  onClose,
  currentSite,
  pickedCoords,
  pickedElevation,
  onStartPickCoordinate,
  onSelectAndOpen360,
  onFlyToCoordinate,
}) => {
  const t = useTranslations("custom360");
  const [activeTab, setActiveTab] = useState<"add" | "list" | "guide">("add");
  const [entries, setEntries] = useState<Custom360PanoramaEntry[]>([]);

  // Form State
  const isGale = currentSite === "gale_crater";
  const [selectedFile, setSelectedFile] = useState<string>("sol4180_boxwork_equirectangular_2k.jpg");
  const [customFileName, setCustomFileName] = useState<string>("");
  const [localDataUrl, setLocalDataUrl] = useState<string | null>(null);

  const [lonStr, setLonStr] = useState<string>(isGale ? "137.3820" : "77.4509");
  const [latStr, setLatStr] = useState<string>(isGale ? "-4.7315" : "18.3789");
  const [elevationM, setElevationM] = useState<number>(isGale ? -3840 : -2560);
  const [sol, setSol] = useState<number>(isGale ? 4180 : 1220);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [category, setCategory] = useState<Custom360PanoramaEntry["category"]>("boxwork_formation");
  const [headingOffsetDeg, setHeadingOffsetDeg] = useState<number>(180);

  // Sync entries from storage
  const reloadEntries = () => {
    setEntries(getAll360PanoramaEntries(currentSite));
  };

  useEffect(() => {
    if (isOpen) {
      reloadEntries();
    }
  }, [isOpen, currentSite]);

  // Sync picked coordinate from map
  useEffect(() => {
    if (pickedCoords) {
      setLonStr(pickedCoords[0].toFixed(4));
      setLatStr(pickedCoords[1].toFixed(4));
      if (pickedElevation !== undefined) {
        setElevationM(Math.round(pickedElevation));
      }
    }
  }, [pickedCoords, pickedElevation]);

  // Handle local file preview via FileReader
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomFileName(file.name);
    setSelectedFile(file.name);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").toUpperCase());
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLocalDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAndOpen = (openDirectly: boolean = true) => {
    const lon = parseFloat(lonStr);
    const lat = parseFloat(latStr);
    if (isNaN(lon) || isNaN(lat)) {
      alert("Koordinat Bujur dan Lintang tidak valid.");
      return;
    }

    const effectiveFilename = localDataUrl || (customFileName.trim() ? customFileName.trim() : selectedFile);
    const effectiveTitle = title.trim() || `Waypoint 360° (Sol ${sol})`;
    const effectiveDesc = description.trim() || `Sudut pandang permukaan 360° di koordinat ${lat}°, ${lon}° (${effectiveFilename})`;

    const newEntry: Custom360PanoramaEntry = {
      id: `pano_custom_${Date.now()}`,
      filename: effectiveFilename,
      title: effectiveTitle,
      site: currentSite,
      coordinates: [lon, lat],
      elevationM,
      sol,
      description: effectiveDesc,
      category,
      headingOffsetDeg,
      credit: "MARSFORALL User 360 Survey",
      isUserCreated: true,
    };

    saveCustom360Panorama(newEntry);
    reloadEntries();

    const wp = convertToMountSharpWaypoint(newEntry);
    onFlyToCoordinate([lon, lat]);

    if (openDirectly) {
      onSelectAndOpen360(wp);
      onClose();
    } else {
      setActiveTab("list");
    }
  };

  const handleDelete = (id: string) => {
    deleteCustom360Panorama(id);
    reloadEntries();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none font-mono">
      <div className="relative w-full max-w-2xl bg-[#07090e] border border-slate-700 text-slate-100 flex flex-col max-h-[90vh] shadow-[0_25px_60px_rgba(0,0,0,0.95)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0b0f17]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 bg-cyan-400" />
            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase">
              {t("headerTitle")}
            </h2>
            <span className="text-[10px] px-1.5 py-0.5 bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono">
              [FOLDER: /panoramas/]
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
            aria-label="Close modal"
          >
            &#x2715;
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#0b0f17] text-[11px]">
          <button
            onClick={() => setActiveTab("add")}
            className={`flex-1 py-2.5 px-3 border-b-2 text-center font-bold transition-colors ${
              activeTab === "add"
                ? "border-cyan-400 text-cyan-300 bg-[#07090e]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            + {t("tabAdd")}
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`flex-1 py-2.5 px-3 border-b-2 text-center font-bold transition-colors ${
              activeTab === "list"
                ? "border-amber-400 text-amber-300 bg-[#07090e]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("tabList")} ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`flex-1 py-2.5 px-3 border-b-2 text-center font-bold transition-colors ${
              activeTab === "guide"
                ? "border-emerald-400 text-emerald-300 bg-[#07090e]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("tabGuide")}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeTab === "add" && (
            <div className="space-y-4">
              {/* Folder Dropzone Hint */}
              <div className="p-3 bg-[#0b0f17] border border-cyan-900/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-none bg-cyan-950 border border-cyan-700 flex items-center justify-center shrink-0 text-cyan-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="0" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-white text-[11px]">
                    {t("folderNoticeTitle")}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {t("folderNoticeDesc")} <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 border border-slate-800">apps/web/public/panoramas/</code>. {t("folderNoticeDesc2")}
                  </p>
                </div>
              </div>

              {/* Step 1: Select / Upload File */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase block">
                  1. {t("labelSourceFile")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">{t("labelDefaultFiles")}:</span>
                    <select
                      value={selectedFile}
                      onChange={(e) => {
                        setSelectedFile(e.target.value);
                        setCustomFileName("");
                        setLocalDataUrl(null);
                      }}
                      className="w-full bg-[#0b0f17] border border-slate-700 text-white p-2 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    >
                      {AVAILABLE_SAMPLE_FILES.map((f) => (
                        <option key={f.filename} value={f.filename}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block mb-1">{t("labelOrUploadLocal")}:</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleLocalFileSelect}
                      className="w-full bg-[#0b0f17] border border-slate-700 text-slate-300 p-1.5 text-[10px] font-mono file:mr-2 file:py-1 file:px-2 file:border-0 file:bg-cyan-900 file:text-cyan-200 file:text-[10px] file:cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 block mb-1">{t("labelOrTypeFilename")}:</span>
                  <input
                    type="text"
                    value={customFileName}
                    onChange={(e) => {
                      setCustomFileName(e.target.value);
                      setLocalDataUrl(null);
                    }}
                    placeholder="contoh: sol4500_gediz_vallis_360.jpg"
                    className="w-full bg-[#0b0f17] border border-slate-700 text-white px-2.5 py-1.5 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Step 2: Coordinates & Location */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase">
                    2. {t("labelCoordinates")}
                  </label>
                  <button
                    onClick={() => {
                      onStartPickCoordinate();
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-amber-950/80 border border-amber-600 text-amber-300 text-[10px] font-bold hover:bg-amber-900 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 bg-amber-400 animate-pulse" />
                    [ {t("btnPickFromMap")} ]
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Bujur / Lon (°E):</span>
                    <input
                      type="text"
                      value={lonStr}
                      onChange={(e) => setLonStr(e.target.value)}
                      className="w-full bg-[#0b0f17] border border-slate-700 text-white p-2 text-xs font-mono tabular-nums focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Lintang / Lat (°):</span>
                    <input
                      type="text"
                      value={latStr}
                      onChange={(e) => setLatStr(e.target.value)}
                      className="w-full bg-[#0b0f17] border border-slate-700 text-white p-2 text-xs font-mono tabular-nums focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t("molaElevation")}</span>
                    <input
                      type="number"
                      value={elevationM}
                      onChange={(e) => setElevationM(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-[#0b0f17] border border-slate-700 text-white p-2 text-xs font-mono tabular-nums focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Waypoint Details */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-[11px] font-bold text-slate-300 uppercase block">
                  3. {t("labelDetails")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block">{t("waypointTitle")}</span>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Sol 4180: Boxwork Ridge 360 POV"
                      className="w-full bg-[#0b0f17] border border-slate-700 text-white p-2 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t("roverSol")}</span>
                    <input
                      type="number"
                      value={sol}
                      onChange={(e) => setSol(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-[#0b0f17] border border-slate-700 text-white p-2 text-xs font-mono tabular-nums focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t("geologyCategory")}</span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full bg-[#0b0f17] border border-slate-700 text-white p-2 text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="boxwork_formation">{t("catBoxwork")}</option>
                      <option value="clay_trough">{t("catClay")}</option>
                      <option value="ridge_escarpment">{t("catHematite")}</option>
                      <option value="mineral_vein">{t("catSulfate")}</option>
                      <option value="habitat_landing">{t("catHabitat")}</option>
                      <option value="hazard_zone">{t("catHazard")}</option>
                      <option value="custom_user_pov">{t("catCustom")}</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">{t("cameraHeading")}</span>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={headingOffsetDeg}
                      onChange={(e) => setHeadingOffsetDeg(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-[#0b0f17] border border-slate-700 text-white p-2 text-xs font-mono tabular-nums focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">{t("scientificDesc")}</span>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("placeholderDesc")}
                    className="w-full bg-[#0b0f17] border border-slate-700 text-white p-2 text-xs font-mono focus:border-cyan-400 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => handleSaveAndOpen(false)}
                  className="px-4 py-2 bg-slate-800 border border-slate-600 text-slate-200 font-bold text-xs hover:bg-slate-700 transition-colors"
                >
                  {t("btnSaveOnly")}
                </button>
                <button
                  onClick={() => handleSaveAndOpen(true)}
                  className="px-5 py-2 bg-[#083344] border border-[#06b6d4] text-[#a5f3fc] font-bold text-xs hover:bg-[#0e7490] transition-colors flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-cyan-400" />
                  {t("btnSaveAndOpen360")}
                </button>
              </div>
            </div>
          )}

          {activeTab === "list" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                <span>{t("totalWaypointsRegistered")} <strong className="text-white">{entries.length}</strong></span>
                <span className="text-cyan-400">[ {currentSite.toUpperCase()} ]</span>
              </div>

              <div className="space-y-2">
                {entries.map((entry) => {
                  const wp = convertToMountSharpWaypoint(entry);
                  return (
                    <div
                      key={entry.id}
                      className="p-3 bg-[#0b0f17] border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-300 text-[9px] font-bold">
                            360° POV
                          </span>
                          <span className="font-bold text-white text-xs">{entry.title}</span>
                          {entry.isUserCreated && (
                            <span className="px-1 py-0.2 bg-amber-950 text-amber-400 border border-amber-800 text-[8px]">
                              [CUSTOM]
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums">
                          <span>Lon: <strong className="text-slate-300">{entry.coordinates[0]}°</strong></span>
                          <span>Lat: <strong className="text-slate-300">{entry.coordinates[1]}°</strong></span>
                          <span>Elev: <strong className="text-slate-300">{entry.elevationM} m</strong></span>
                          <span>Sol: <strong className="text-slate-300">{entry.sol}</strong></span>
                        </div>
                        <div className="text-[10px] text-cyan-400/80 truncate max-w-md font-mono">
                          File: {entry.filename}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            onFlyToCoordinate(entry.coordinates);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold hover:bg-slate-700 transition-colors"
                        >
                          {t("btnFocusMap")}
                        </button>
                        <button
                          onClick={() => {
                            onFlyToCoordinate(entry.coordinates);
                            onSelectAndOpen360(wp);
                            onClose();
                          }}
                          className="px-3 py-1 bg-[#083344] border border-[#06b6d4] text-[#a5f3fc] text-[10px] font-bold hover:bg-[#0e7490] transition-colors"
                        >
                          {t("btnOpen360")}
                        </button>
                        {entry.isUserCreated && (
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="px-2 py-1 bg-red-950/60 border border-red-800 text-red-300 text-[10px] font-bold hover:bg-red-900 transition-colors"
                            title="Hapus Waypoint Kustom"
                          >
                            &#x2715;
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "guide" && (
            <div className="space-y-4 text-[11px] leading-relaxed text-slate-300">
              <div className="p-3 bg-[#0b0f17] border border-slate-800 space-y-2">
                <div className="font-bold text-white text-xs text-amber-400">
                  {t("guideHeading")}
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1">
                  <li>
                    {t("guideStep1")}{" "}
                    <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 border border-slate-800">
                      apps/web/public/panoramas/
                    </code>
                  </li>
                  <li>
                    {t("guideStep2")}
                  </li>
                  <li>
                    {t("guideStep3")}
                  </li>
                  <li>
                    {t("guideStep4")}
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-[#0b0f17] border border-slate-800 space-y-2">
                <div className="font-bold text-white text-xs text-cyan-400">
                  {t("guideRecHeading")}
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                  <li>{t("guideRec1")}</li>
                  <li>{t("guideRec2")}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Custom360ManagerModal;
