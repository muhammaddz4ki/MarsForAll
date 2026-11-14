import type { MetadataRoute } from "next";

const ROUTES: { paths: { id: string; en: string }; priority: number }[] = [
  { paths: { id: "", en: "" }, priority: 1.0 }, // home
  { paths: { id: "/peta", en: "/map" }, priority: 0.9 }, // map
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const now = new Date();

  const url = (locale: "id" | "en", path: string) =>
    `${baseUrl}/${locale}${path}`;

  return ROUTES.flatMap(({ paths, priority }) => {
    const languages = {
      id: url("id", paths.id),
      en: url("en", paths.en),
    };
    return (["id", "en"] as const).map((locale) => ({
      url: url(locale, paths[locale]),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority,
      alternates: { languages },
    }));
  });
}
