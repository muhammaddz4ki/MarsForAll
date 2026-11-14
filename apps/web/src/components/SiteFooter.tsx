import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** Static (param-free) routes, the only ones usable as a plain Link href. */
type StaticPath =
  | "/tentang"
  | "/peta"
  | "/metodologi"
  | "/data"
  | "/sumber-data"
  | "/status"
  | "/apresiasi"
  | "/proyek"
  | "/dukung"
  | "/ketentuan"
  | "/privasi";

const colTitle =
  "mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted";
const footLink =
  "text-[0.9rem] text-muted transition-colors hover:text-foreground hover:no-underline";

export default async function SiteFooter({ locale }: { locale: string }) {
  const [t, tNav, tSite] = await Promise.all([
    getTranslations({ locale, namespace: "footer" }),
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "site" }),
  ]);

  const explore: { href: StaticPath; label: string }[] = [
    { href: "/tentang", label: tNav("about") },
    { href: "/peta", label: tNav("map") },
    { href: "/metodologi", label: tNav("methodology") },
    { href: "/data", label: tNav("data") },
  ];
  const transparency: { href: StaticPath; label: string }[] = [
    { href: "/sumber-data", label: tNav("sources") },
    { href: "/status", label: tNav("status") },
    { href: "/apresiasi", label: tNav("credits") },
    { href: "/ketentuan", label: t("terms") },
    { href: "/privasi", label: t("privacy") },
  ];

  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-border">
      <div className="mx-auto max-w-[1080px] px-5 py-12">
        <div className="grid gap-10 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] md:[grid-template-columns:1.6fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-[22rem]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 hover:no-underline"
              aria-label={tSite("name")}
            >
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#111318"/>
                <path d="M16 5C11.03 5 7 9.03 7 14C7 19.25 14 27 16 27C18 27 25 19.25 25 14C25 9.03 20.97 5 16 5Z" fill="url(#fg1)"/>
                <circle cx="16" cy="14" r="4" fill="#111318"/>
                <rect x="10" y="13.25" width="12" height="1.5" rx="0.75" fill="#f5a623" transform="rotate(-40 16 14)"/>
                <rect x="10" y="13.25" width="12" height="1.5" rx="0.75" fill="#fbbf24" transform="rotate(40 16 14)"/>
                <defs>
                  <linearGradient id="fg1" x1="7" y1="5" x2="25" y2="27" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fbbf24"/>
                    <stop offset="100%" stopColor="#f5a623"/>
                  </linearGradient>
                </defs>
              </svg>
              <span style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
                <span style={{ color: "var(--text)" }}>Mine</span>
                <span style={{ color: "var(--accent)" }}>ForAll</span>
              </span>
            </Link>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">
              {tSite("tagline")}
            </p>
          </div>

          {/* Explore */}
          <nav aria-label={t("exploreTitle")}>
            <h3 className={colTitle}>{t("exploreTitle")}</h3>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {explore.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={footLink}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Transparency */}
          <nav aria-label={t("transparencyTitle")}>
            <h3 className={colTitle}>{t("transparencyTitle")}</h3>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {transparency.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={footLink}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Project */}
          <nav aria-label={t("projectTitle")}>
            <h3 className={colTitle}>{t("projectTitle")}</h3>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              <li>
                <Link href="/proyek" className={footLink}>
                  {t("sourceCode")}
                </Link>
              </li>
              <li>
                <Link href="/proyek" className={footLink}>
                  {t("contribute")}
                </Link>
              </li>
              <li>
                <Link href="/dukung" className={footLink}>
                  {t("support")}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-[0.82rem] text-muted md:flex-row md:items-center md:justify-between">
          <p className="m-0">
            © {year} {tSite("name")}. {t("rights")}
          </p>
          <p className="m-0 max-w-[42rem] md:text-right">
            {t("disclaimer")}{" "}
            <Link href="/ketentuan" className="underline hover:text-foreground">
              {t("terms")}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
