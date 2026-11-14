import type { Metadata } from "next";
import AresMartianApp from "@/components/mars/AresMartianApp";

export const metadata: Metadata = {
  title: "ARES-PATH // GALE-01 | Interplanetary Survival Guide",
  description: "NASA Space Apps Challenge 2026: Hyperlocalized Martian Excursion Map, ML Prospector & Terrain-Aware Marswalk Planner",
};

export default function HomePage() {
  return <AresMartianApp />;
}
