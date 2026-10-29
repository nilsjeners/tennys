import Link from "next/link";
import { Logo } from "./Logo";
import { SiteFooter } from "./SiteFooter";

// Shell for the text subpages (Datenschutz, Impressum, Kontakt).
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main>
      <header className="legal-head">
        <Link href="/" className="brand" aria-label="Tennys Startseite">
          <Logo size={32} />
        </Link>
      </header>
      <article className="legal">
        <h1 className="display">{title}</h1>
        {children}
      </article>
      <SiteFooter />
    </main>
  );
}
