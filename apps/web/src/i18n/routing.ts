import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["id", "en"],
  defaultLocale: "id",
  pathnames: {
    "/": "/",
    "/peta": { id: "/peta", en: "/map" },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
