"use client";

import React from "react";

interface AresMissionBadgeProps {
  size?: number | string;
  className?: string;
  showSubtext?: boolean;
}

/**
 * ARES-PATH // GALE-01 Mission Badge Component
 * Compliant with NASA Space Apps Challenge branding rules (NO official NASA meatball or worm logos).
 */
export const AresMissionBadge: React.FC<AresMissionBadgeProps> = ({
  size = 48,
  className = "",
  showSubtext = false,
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/images/ares-path-badge.svg"
        alt="ARES-PATH // GALE-01 Mission Emblem"
        width={typeof size === "number" ? size : undefined}
        height={typeof size === "number" ? size : undefined}
        style={typeof size === "string" ? { width: size, height: size } : undefined}
        className="shrink-0 drop-shadow-[0_0_12px_rgba(249,115,22,0.35)]"
      />
      {showSubtext && (
        <div className="flex flex-col text-left">
          <span className="font-mono text-xs font-black tracking-widest text-orange-400">
            ARES-PATH // GALE-01
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400">
            Mount Sharp Surface Traversal
          </span>
        </div>
      )}
    </div>
  );
};

export default AresMissionBadge;

