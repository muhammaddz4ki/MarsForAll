"use client";

import React from "react";
import { MarsForAllBadge } from "./MarsForAllBadge";

export const AresMissionBadge: React.FC<{
  size?: number | string;
  className?: string;
  showSubtext?: boolean;
}> = (props) => {
  return <MarsForAllBadge {...props} />;
};

export default AresMissionBadge;
