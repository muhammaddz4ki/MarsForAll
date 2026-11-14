import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "id", "es", "fr", "zh"],
  defaultLocale: "en",
  pathnames: {
    "/": "/",
    "/peta": {
      en: "/map",
      id: "/peta",
      es: "/mapa",
      fr: "/carte",
      zh: "/ditu",
    },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
