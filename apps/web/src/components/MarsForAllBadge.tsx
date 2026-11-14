"use client";

import React from "react";

interface MarsForAllBadgeProps {
  size?: number | string;
  className?: string;
  showSubtext?: boolean;
}

/**
 * MARSFORALL // GALE-01 Mission Badge Component
 * Compliant with strict mission branding rules (ZERO NASA logos, zero gradients, flat matte styling).
 */
export const MarsForAllBadge: React.FC<MarsForAllBadgeProps> = ({
  size = 40,
  className = "",
  showSubtext = false,
}) => {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/marsforall-badge.svg"
        alt="MARSFORALL // GALE-01 Mission Emblem"
        width={typeof size === "number" ? size : undefined}
        height={typeof size === "number" ? size : undefined}
        style={typeof size === "string" ? { width: size, height: size } : undefined}
        className="shrink-0"
      />
      {showSubtext && (
        <div className="flex flex-col text-left">
          <span className="font-mono text-xs font-bold tracking-widest text-amber-500">
            MARSFORALL // GALE-01
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
            Interplanetary Survival Guide
          </span>
        </div>
      )}
    </div>
  );
};

export default MarsForAllBadge;
