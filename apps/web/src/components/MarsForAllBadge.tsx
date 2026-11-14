"use client";

import React, { useState } from "react";

interface MarsForAllBadgeProps {
  size?: number | string;
  className?: string;
  showSubtext?: boolean;
}

/**
 * MARSFORALL // GALE-01 Mission Badge & Official Team Logo Component
 * Compliant with strict mission branding rules (ZERO NASA logos, zero gradients, flat matte styling).
 */
export const MarsForAllBadge: React.FC<MarsForAllBadgeProps> = ({
  size = 36,
  className = "",
  showSubtext = false,
}) => {
  const [imgError, setImgError] = useState(false);
  const pixelSize = typeof size === "number" ? size : 36;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official Team Logo Image with clean rounded-sm border */}
      <div
        className="shrink-0 overflow-hidden rounded-sm border border-slate-700 bg-[#07090e] flex items-center justify-center"
        style={{ width: pixelSize, height: pixelSize }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgError ? "/images/marsforall-badge.svg" : "/images/marsforall-logo.png"}
          alt="MARSFORALL Team Logo"
          width={pixelSize}
          height={pixelSize}
          onError={() => setImgError(true)}
          className="w-full h-full object-contain"
        />
      </div>

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
