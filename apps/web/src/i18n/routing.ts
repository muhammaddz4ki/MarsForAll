import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "id"],
  defaultLocale: "en",
  pathnames: {
    "/": "/",
    "/peta": {
      en: "/map",
      id: "/peta",
    },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
