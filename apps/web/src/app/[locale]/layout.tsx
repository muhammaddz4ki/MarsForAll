import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Overpass, Fira_Code, Playfair_Display, Bebas_Neue } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/lib/ThemeContext";
import "../globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

const overpass = Overpass({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
  weight: "400",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MARSFORALL | Martian Surface Tactical Navigation Cockpit",
    template: "%s | MARSFORALL",
  },
  description:
    "NASA Space Apps Challenge 2026: Hyperlocalized Mount Sharp (Gale Crater) Tactical Navigation Cockpit. Synthesizing 5 NASA Operational Layers, 2025 Curiosity Rover Boxwork Mineral Veins Discovery, Morgan et al. (2020) Thermal Sand Trap Detection, MGS MAG Crustal Shielding, and Terrain-Aware A* Metabolic Router.",
  applicationName: "MARSFORALL",
  authors: [{ name: "MARSFORALL Planetary Science & Engineering Team" }],
  generator: "Next.js",
  keywords: [
    "Mars",
    "Gale Crater",
    "Mount Sharp",
    "Aeolis Mons",
    "Curiosity Rover 2025",
    "Boxwork Mineral Veins",
    "NASA Space Apps Challenge 2026",
    "Planetary GIS",
    "Extravehicular Activity EVA",
    "Marswalk Route Planner",
    "Thermal Inertia",
    "Morgan et al 2020",
    "MGS MAG Crustal Field",
    "HiRISE 25cm",
    "CRISM Hydrated Minerals",
  ],
  alternates: {
    canonical: "/",
    languages: {
      en: "/en",
      id: "/id",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "MARSFORALL",
    title: "MARSFORALL: Interplanetary Tactical Martian Navigation Cockpit",
    description:
      "High-resolution Martian surface navigation cockpit for astronaut safety at Mount Sharp, Gale Crater. Fusing 5 NASA operational layers and 2025 Boxwork mineral vein discovery.",
    images: [
      {
        url: "/images/mars-surface-hd.jpg",
        width: 2048,
        height: 1024,
        alt: "MARSFORALL 3D Martian Surface Terrain and Navigation Trajectory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MARSFORALL: Tactical Martian Map Cockpit",
    description:
      "NASA Space Apps Challenge 2026: Offline-first extravehicular tactical navigation for Mount Sharp, Gale Crater, Mars.",
    images: ["/images/mars-surface-hd.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default async function RootLocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages({ locale });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MARSFORALL",
    url: SITE_URL,
    description:
      "Tactical extravehicular activity (EVA) surface navigation cockpit for astronaut safety at Mount Sharp, Gale Crater, Mars.",
    applicationCategory: "ScientificApplication",
    operatingSystem: "All modern browsers with WebGL support",
    keywords: "Mars, Gale Crater, Mount Sharp, Curiosity 2025, Boxwork, NASA Space Apps Challenge 2026",
    author: {
      "@type": "Organization",
      name: "MARSFORALL Team",
    },
  };

  return (
    <html
      lang={locale}
      data-theme="dark"
      className={`dark ${overpass.variable} ${firaCode.variable} ${playfair.variable} ${bebasNeue.variable}`}
      translate="no"
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `try {
              const saved = localStorage.getItem('dibisalitas_theme') || 'dark';
              document.documentElement.dataset.theme = saved;
              document.documentElement.classList.toggle('dark', saved === 'dark');
            } catch(e) {}`,
          }}
        />
      </head>
      <body className={`${overpass.className} bg-[#07090e] text-slate-100 font-sans antialiased min-h-screen overflow-x-hidden transition-colors duration-300`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
