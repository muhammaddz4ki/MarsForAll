import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "../globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ARES-PATH // GALE-01 | Martian Excursion Map & Survival Guide",
    template: "%s | ARES-PATH // GALE-01",
  },
  description:
    "NASA Space Apps Challenge 2026: Hyperlocalized Mount Sharp (Gale Crater) Surface Map, ML Prospector Fusion & Terrain-Aware Marswalk Route Planner.",
  applicationName: "ARES-PATH",
  icons: {
    icon: [
      { url: "/images/ares-path-badge.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    shortcut: "/images/ares-path-badge.svg",
    apple: "/images/ares-path-badge.svg",
  },
  keywords: [
    "Mars",
    "Gale Crater",
    "Mount Sharp",
    "Aeolis Mons",
    "Curiosity Rover 2025",
    "Boxwork Formations",
    "NASA Space Apps Challenge 2026",
    "Planetary GIS",
    "Marswalk Route Planner",
    "Thermal Inertia",
  ],
};

export default async function RootLocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages({ locale });
  const theme = "dark";

  return (
    <html lang={locale} data-theme={theme} className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.theme = 'dark';`,
          }}
        />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased overflow-hidden w-screen h-screen">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
