import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = { title: "Kontakt & Support — Tennys" };

const mail = <a href="mailto:hallo@tennys.app">hallo@tennys.app</a>;

export default function Kontakt() {
  return (
    <LegalPage title="Kontakt & Support">
      <p className="lang-switch"><a href="#en">English version below</a></p>
      <section>
        <h2>Hilfe zur App</h2>
        <p>
          Fragen, Fehler oder Feedback zu Tennys? Schreib uns an {mail}. Wir melden uns in der
          Regel innerhalb von zwei Werktagen.
        </p>
      </section>
      <section>
        <h2>Konto löschen</h2>
        <p>
          Du kannst dein Konto jederzeit in der App unter Profil → Einstellungen → Konto löschen
          entfernen. Alternativ genügt eine E-Mail an {mail}.
        </p>
      </section>
      <section>
        <h2>Anbieter</h2>
        <p>
          Jeners Consulting GmbH, Spitzwegstr. 10, 42579 Heiligenhaus.{" "}
          <Link href="/impressum">Impressum</Link> · <Link href="/datenschutz">Datenschutz</Link>
        </p>
      </section>

      <h1 id="en" className="display">Contact &amp; Support</h1>
      <section>
        <h2>Help with the app</h2>
        <p>
          Questions, bugs or feedback about Tennys? Email us at {mail}. We usually reply within
          two business days.
        </p>
      </section>
      <section>
        <h2>Delete your account</h2>
        <p>
          You can delete your account at any time in the app under Profile → Settings → Delete
          account, or by emailing {mail}.
        </p>
      </section>
    </LegalPage>
  );
}
