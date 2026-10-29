import type { Metadata } from "next";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = { title: "Impressum — Tennys" };

export default function Impressum() {
  return (
    <LegalPage title="Impressum">
      <section>
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          Jeners Consulting GmbH{"\n"}
          Spitzwegstr. 10{"\n"}
          42579 Heiligenhaus{"\n"}
          Deutschland
        </p>
      </section>
      <section>
        <h2>Vertreten durch</h2>
        <p>TODO Geschäftsführer:in</p>
      </section>
      <section>
        <h2>Kontakt</h2>
        <p>
          E-Mail: <a href="mailto:hallo@tennys.app">hallo@tennys.app</a>
        </p>
      </section>
      <section>
        <h2>Registereintrag</h2>
        <p>
          Registergericht: TODO{"\n"}
          Registernummer: TODO
        </p>
      </section>
      <section>
        <h2>Umsatzsteuer-ID</h2>
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: TODO</p>
      </section>
      <section>
        <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
        <p>TODO Name, Anschrift wie oben</p>
      </section>
      <section>
        <h2>Verbraucherstreitbeilegung</h2>
        <p>
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </section>
    </LegalPage>
  );
}
