import type { Metadata } from "next";
import DiBisalitasLanding from "@/components/landing/DiBisalitasLanding";

export const metadata: Metadata = {
  title: "MarsForAll | Interplanetary Survival Guide: Martian Map",
  description:
    "NASA Space Apps Challenge 2026: Hyperlocalized Mount Sharp (Gale Crater) Surface Map, 5 NASA Operational Layers, ML Prospector Fusion & Curiosity Historical Traverse.",
};

export default function HomePage() {
  return <DiBisalitasLanding />;
}
