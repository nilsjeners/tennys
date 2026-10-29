import { Logo } from "./Logo";

const features = [
  { title: "Matches loggen", text: "Einzel und Doppel in Sekunden eintragen — Satz für Satz." },
  { title: "Rangliste", text: "Getrennte Wertung für Einzel und Doppel, im Verein und darüber hinaus." },
  { title: "Community", text: "Freunde, Vereine und ein Feed mit den Matches Deiner Leute." },
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav className="nav">
          <span className="brand">
            <Logo size={36} />
          </span>
          <span className="pill">Private Beta</span>
        </nav>

        <div className="hero-body">
          <h1 className="display">tennys</h1>
          <p className="tagline">
            Tracke Deine Matches. Miss Dich mit der Community. Mach Deine Fortschritte sichtbar.
          </p>
          <div className="score mono" aria-hidden="true">
            <span>6:4</span>
            <span>3:6</span>
            <span>7:5</span>
          </div>
          <p className="beta-note">
            Tennys befindet sich in der privaten Beta. Zugang aktuell nur auf Einladung.
          </p>
        </div>
      </section>

      <section className="features">
        {features.map((f, i) => (
          <article key={f.title} className="feature">
            <span className="num mono">0{i + 1}</span>
            <h2 className="display">{f.title}</h2>
            <p>{f.text}</p>
          </article>
        ))}
      </section>

      <footer className="footer">© {new Date().getFullYear()} Tennys</footer>
    </main>
  );
}
