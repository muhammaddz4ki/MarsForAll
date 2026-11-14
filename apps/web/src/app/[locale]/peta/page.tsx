import type { Metadata } from "next";
import AresMartianApp from "@/components/mars/AresMartianApp";

export const metadata: Metadata = {
  title: "ARES-PATH // GALE-01 | Mount Sharp Martian Map",
  description: "Interplanetary Survival Guide & Rover Traverse Planning for NASA Space Apps Challenge 2026",
};

export default function MapPage() {
  return <AresMartianApp />;
}
