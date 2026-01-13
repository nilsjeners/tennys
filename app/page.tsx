export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <div className="pointer-events-none absolute -top-40 left-0 right-0 h-[65vh] rounded-b-[42%] bg-[radial-gradient(circle_at_16%_30%,rgba(63,216,229,0.4),transparent_58%),radial-gradient(circle_at_70%_15%,rgba(249,115,22,0.35),transparent_60%),linear-gradient(160deg,rgba(12,18,32,0.95),rgba(17,28,49,0.86))]" />
      <div className="pointer-events-none absolute right-[10%] top-[55%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(163,230,53,0.35),transparent_70%)] blur-md" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-6">
        <section className="animate-heroIn rounded-brand border border-accent/20 bg-[rgba(12,18,32,0.85)] p-6 text-base-100 shadow-soft backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="badge border-brand-cyan/50 bg-brand-cyan/15 text-xs uppercase tracking-[0.2em] text-base-100">
              Alpha-Phase
            </span>
            <span className="badge border-accent/50 bg-accent/20 text-xs uppercase tracking-[0.2em] text-accent-content">
              Nur mit Einladung
            </span>
          </div>

          <h1 className="mt-3 text-4xl font-semibold uppercase tracking-[0.18em] sm:text-5xl">
            TENNYS
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-base-100 text-opacity-80">
            Deine mobile Rangliste fuer echte Spielstaerke. Trage Matches ein,
            sieh sofort, wie stark du, deine Freunde und deine Gegner wirklich
            sind. Klare Rankings, transparente Ergebnisse, relevante
            Statistiken. Nur Ergebnisse.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a className="btn btn-primary shadow-lg" href="/wizard/match/create">
              Spielergebnis eingeben
            </a>
            <button className="btn btn-secondary btn-outline">registrieren</button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-base-100 text-opacity-80">
            <span>Du hast schon einen Account?</span>
            <a className="link link-secondary uppercase tracking-[0.08em]" href="#">
              login
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
