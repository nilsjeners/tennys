import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} Tennys</span>
      <nav className="footer-links">
        <Link href="/kontakt">Kontakt &amp; Support</Link>
        <Link href="/datenschutz">Datenschutz</Link>
        <Link href="/impressum">Impressum</Link>
      </nav>
    </footer>
  );
}
