import type { Metadata } from "next";
import { LOCALES, PRIVACY_SECTIONS } from "@repo/backend/convex/lib/locales";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = { title: "Datenschutz — Tennys" };

// Same copy as the in-app privacy screen (bundled source, not dashboard edits).
function Policy({ locale }: { locale: "de" | "en" }) {
  const t = LOCALES[locale];
  return (
    <>
      <p className="label">{t["legal.updated"]}</p>
      {PRIVACY_SECTIONS.map((key) => (
        <section key={key}>
          <h2>{t[`legal.privacy.${key}.title`]}</h2>
          <p>{t[`legal.privacy.${key}.body`]}</p>
        </section>
      ))}
    </>
  );
}

export default function Datenschutz() {
  return (
    <LegalPage title="Datenschutz">
      <p className="lang-switch"><a href="#en">English version below</a></p>
      <Policy locale="de" />
      <h1 id="en" className="display">Privacy Policy</h1>
      <Policy locale="en" />
    </LegalPage>
  );
}
