export default function Home() {
  return (
    <main>
      <div className="page">
        <section className="hero">
          <span className="app-pill">Leistungsbereit</span>
          <h1 className="hero-title">TENNYS</h1>
          <p className="hero-subtitle">
            Der mobile Hub fuer Matchvorbereitung, explosives Training und smarte
            Regeneration. Finde deinen Rhythmus, tracke deine Intensitaet und
            bleib matchscharf.
          </p>
          <div className="hero-actions">
            <button className="cta primary">Saison starten</button>
            <button className="cta secondary">Live-Metriken sehen</button>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Aufschlagtempo</span>
            <span className="stat-value">186</span>
            <span className="stat-trend">▲ +7 km/h</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Beinarbeit</span>
            <span className="stat-value">92</span>
            <span className="stat-trend">▲ +12% Agilitaet</span>
          </div>
        </section>

        <section className="progress-card">
          <div className="progress-header">
            <span className="progress-title">Saisonintensitaet</span>
            <span className="progress-badge">Serie 9</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" />
          </div>
          <div className="schedule">
            <div className="schedule-item">
              <div>
                <div className="schedule-time">07:30</div>
                <div className="schedule-meta">Court-Sprints • 45 Min</div>
              </div>
              <span className="progress-badge">Gruene Zone</span>
            </div>
            <div className="schedule-item">
              <div>
                <div className="schedule-time">18:00</div>
                <div className="schedule-meta">Match-Sim • Aufschlag + Rueckschlag</div>
              </div>
              <span className="progress-badge">Power-Block</span>
            </div>
          </div>
        </section>

        <section className="footer-card">
          <span>
            Bereit fuer dein naechstes Turnier? Hol dir personalisierte
            Trainingsplaene und Regenerations-Alerts.
          </span>
          <div className="footer-chip">Werde Mitglied</div>
        </section>
      </div>
    </main>
  );
}
