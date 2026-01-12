export default function Home() {
  return (
    <main>
      <div className="page">
        <section className="hero">
          <div className="hero-top">
            <span className="app-pill">Alpha-Phase</span>
            <span className="hero-chip">Nur mit Einladung</span>
          </div>
          <h1 className="hero-title">TENNYS</h1>
          <p className="hero-subtitle">
            Dein mobiles Control-Center fuer Matchvorbereitung, Training und
            Regeneration. Tracke Intensitaet, manage Belastung und geh mit
            Fokus in die Saison.
          </p>
          <div className="hero-actions">
            <button className="cta primary">Saison starten</button>
            <button className="cta secondary">Trainingsplan ansehen</button>
          </div>
          <div className="hero-login">
            <span>Du hast schon einen Account?</span>
            <a className="login-link" href="#">
              login
            </a>
          </div>
        </section>

        <section className="signal-grid">
          <div className="signal-card">
            <div className="signal-header">
              <span className="signal-label">Live Load</span>
              <span className="signal-pill">+18%</span>
            </div>
            <div className="signal-value">186</div>
            <p className="signal-meta">Aufschlagtempo mit Power-Fenster</p>
          </div>
          <div className="signal-card">
            <div className="signal-header">
              <span className="signal-label">Footwork Index</span>
              <span className="signal-pill warning">Zone 2</span>
            </div>
            <div className="signal-value">92</div>
            <p className="signal-meta">Beinarbeit-Agilitaet fuer lange Rallies</p>
          </div>
          <div className="signal-card">
            <div className="signal-header">
              <span className="signal-label">Recovery</span>
              <span className="signal-pill success">Stabil</span>
            </div>
            <div className="signal-value">7:15</div>
            <p className="signal-meta">Schlaf & Regeneration vor dem Matchday</p>
          </div>
        </section>

        <section className="match-card">
          <div className="match-header">
            <div>
              <h2>Matchday Blueprint</h2>
              <p>Alpha-Woche 3 • Gegneranalyse & Belastungsfenster</p>
            </div>
            <span className="match-badge">Heute</span>
          </div>
          <div className="match-track">
            <div className="match-fill" />
          </div>
          <div className="match-schedule">
            <div className="match-item">
              <div>
                <div className="match-time">07:30</div>
                <div className="match-meta">Court Sprints • 45 Min</div>
              </div>
              <span className="match-chip">Gruene Zone</span>
            </div>
            <div className="match-item">
              <div>
                <div className="match-time">18:00</div>
                <div className="match-meta">Match Sim • Aufschlag + Rueckschlag</div>
              </div>
              <span className="match-chip">Power Block</span>
            </div>
          </div>
        </section>

        <section className="cta-card">
          <div>
            <h3>Alpha bedeutet: schneller lernen, direkter Einfluss.</h3>
            <p>
              Teile dein Feedback und forme den Trainingsflow der ersten Saison.
            </p>
          </div>
          <button className="cta tertiary">Feedback senden</button>
        </section>
      </div>
    </main>
  );
}
