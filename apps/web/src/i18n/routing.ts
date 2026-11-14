import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["id", "en", "es"],
  defaultLocale: "id",
  pathnames: {
    "/": "/",
    "/peta": { id: "/peta", en: "/map", es: "/mapa" },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
