"use client";

import React from "react";

interface AresMissionBadgeProps {
  size?: number | string;
  className?: string;
  showSubtext?: boolean;
}

/**
 * ARES-PATH // GALE-01 Mission Badge Component
 * Compliant with NASA Space Apps Challenge branding rules (ZERO NASA logos, flat matte styling).
 */
export const AresMissionBadge: React.FC<AresMissionBadgeProps> = ({
  size = 40,
  className = "",
  showSubtext = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/images/ares-path-badge.svg"
        alt="ARES-PATH // GALE-01 Mission Emblem"
        width={typeof size === "number" ? size : undefined}
        height={typeof size === "number" ? size : undefined}
        style={typeof size === "string" ? { width: size, height: size } : undefined}
        className="shrink-0"
      />
      {showSubtext && (
        <div className="flex flex-col text-left">
          <span className="font-mono text-xs font-bold tracking-widest text-amber-500">
            ARES-PATH // GALE-01
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
            Mount Sharp Reconnaissance
          </span>
        </div>
      )}
    </div>
  );
};

export default AresMissionBadge;
