import type { MetadataRoute } from "next";

const LOCALES = ["en", "id"] as const;
type Locale = (typeof LOCALES)[number];

const ROUTES: {
  paths: Record<Locale, string>;
  priority: number;
}[] = [
  {
    paths: { en: "", id: "" },
    priority: 1.0,
  },
  {
    paths: {
      en: "/map",
      id: "/peta",
    },
    priority: 0.95,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  return ROUTES.flatMap(({ paths, priority }) => {
    const alternatesLanguages: Record<string, string> = {};
    for (const loc of LOCALES) {
      alternatesLanguages[loc] = `${baseUrl}/${loc}${paths[loc]}`;
    }

    return LOCALES.map((locale) => ({
      url: `${baseUrl}/${locale}${paths[locale]}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority,
      alternates: {
        languages: alternatesLanguages,
      },
    }));
  });
}
