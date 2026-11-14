import type { MetadataRoute } from "next";

const ROUTES: { paths: { id: string; en: string; es: string }; priority: number }[] = [
  { paths: { id: "", en: "", es: "" }, priority: 1.0 }, // home
  { paths: { id: "/peta", en: "/map", es: "/mapa" }, priority: 0.9 }, // map
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  const url = (locale: "id" | "en" | "es", path: string) =>
    `${baseUrl}/${locale}${path}`;

  return ROUTES.flatMap(({ paths, priority }) => {
    const languages = {
      id: url("id", paths.id),
      en: url("en", paths.en),
      es: url("es", paths.es),
    };
    return (["id", "en", "es"] as const).map((locale) => ({
      url: url(locale, paths[locale]),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority,
      alternates: { languages },
    }));
  });
}
