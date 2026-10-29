// Self-check für TPRS v2 (§3–5). Kein Test-Framework im Repo — schlichte
// Assertions gegen die echten Funktionen:
//   node packages/backend/convex/lib/rating.test.mjs
import { calcSingles, calcDoubles, START_RATING, P_PERCENT } from './rating.ts';

let failed = 0;
function assert(cond, msg) {
  if (cond) console.log(`ok: ${msg}`);
  else {
    console.error(`FAIL: ${msg}`);
    failed++;
  }
}

// ── §4.2 Debüt-Kalibrierung: harte ±10 %-Schranke ─────────────────────────
// Regression: vorher rB × (gamesA+1)/(gamesB+1) ohne Deckel — ein 6:0 6:0
// gegen einen 1000er ergab 13000.
{
  const r = calcSingles(START_RATING, START_RATING, 12, 0, true, false);
  assert(r.ratingA === 1094, `Kantersieg im Debüt bleibt gedeckelt (${r.ratingA}, war 13000)`);
  assert(r.ratingB === 906, `Etablierter bewegt sich spiegelbildlich mit (${r.ratingB})`);
}

// Selbst absurd einseitige Ergebnisse überschreiten die Grenze nie (tanh).
{
  const max = Math.round(START_RATING * (1 + P_PERCENT));
  const min = Math.round(START_RATING * (1 - P_PERCENT));
  const hoch = calcSingles(START_RATING, START_RATING, 600, 0, true, false);
  const tief = calcSingles(START_RATING, START_RATING, 0, 600, true, false);
  assert(hoch.ratingA < max, `60:0-Extrem bleibt unter +10 % (${hoch.ratingA} < ${max})`);
  assert(tief.ratingA > min, `0:60-Extrem bleibt über −10 % (${tief.ratingA} > ${min})`);
}

// Symmetrie: Sieg und Niederlage spiegeln sich um rB.
{
  const sieg = calcSingles(START_RATING, START_RATING, 12, 4, true, false);
  const nied = calcSingles(START_RATING, START_RATING, 4, 12, true, false);
  assert(sieg.ratingA + nied.ratingA === 2 * START_RATING, `Sieg/Niederlage symmetrisch um rB (${sieg.ratingA}/${nied.ratingA})`);
}

// Gleichstand bewegt nichts.
{
  const r = calcSingles(START_RATING, START_RATING, 6, 6, true, false);
  assert(r.ratingA === START_RATING && r.ratingB === START_RATING, `Gleichstand lässt beide unverändert`);
}

// Monotonie: mehr eigene Games darf das Debüt-Rating nie senken.
{
  let prev = -Infinity, mono = true;
  for (let g = 0; g <= 24; g++) {
    const v = calcSingles(START_RATING, START_RATING, g, 12, true, false).ratingA;
    if (v < prev) mono = false;
    prev = v;
  }
  assert(mono, `Debüt-Rating ist monoton im Games-Vorsprung`);
}

// Skaliert am Gegner-Rating, nicht absolut: gegen einen 2000er landet der
// Neuling bei ~2000 ±10 %, nicht bei ~1000.
{
  const r = calcSingles(START_RATING, 2000, 12, 0, true, false);
  assert(r.ratingA > 2000 && r.ratingA <= 2200, `Kalibrierung skaliert am Gegner-Rating (${r.ratingA})`);
}

// Seitenunabhängigkeit: dasselbe Spiel mit vertauschten Rollen spiegelt sich.
{
  const links = calcSingles(START_RATING, START_RATING, 12, 4, true, false);
  const rechts = calcSingles(START_RATING, START_RATING, 4, 12, false, true);
  assert(links.ratingA === rechts.ratingB && links.ratingB === rechts.ratingA, `neu-links und neu-rechts sind spiegelbildlich`);
}

// ── §4.1 Neu vs. Neu ──────────────────────────────────────────────────────
{
  const r = calcSingles(START_RATING, START_RATING, 12, 0, true, true);
  assert(r.ratingA === START_RATING && r.ratingB === START_RATING, `neu-vs-neu bewegt nichts (§4.1)`);
}

// ── §3 Etabliert vs. Etabliert: Nullsummen-Pott ───────────────────────────
{
  const r = calcSingles(1200, 800, 12, 4, false, false);
  assert(Math.abs(r.ratingA + r.ratingB - 2000) <= 1, `Pott ist nullsummig (${r.ratingA}+${r.ratingB})`);
  assert(r.ratingA > 1200, `Sieger gewinnt Punkte (${r.ratingA})`);
}

// ── Floor ─────────────────────────────────────────────────────────────────
{
  const r = calcSingles(120, 5000, 0, 36, false, false);
  assert(r.ratingA >= 100, `Floor 100 greift (${r.ratingA})`);
}

// ── §5 Doppel: durch den Team-Pott begrenzt, kein Games-Verhältnis ────────
{
  const r = calcDoubles(
    { rating: START_RATING, isNew: true },
    { rating: START_RATING, isNew: false },
    { rating: START_RATING, isNew: false },
    { rating: START_RATING, isNew: false },
    12, 0
  );
  assert(r.a1 < 1300, `Doppel-Debüt bleibt vom Pott begrenzt (${r.a1})`);
  assert(Math.abs(r.a1 + r.a2 + r.b1 + r.b2 - 4 * START_RATING) <= 2, `Doppel-Pott ist nullsummig`);
}

console.log(failed ? `\n${failed} Check(s) fehlgeschlagen.` : '\nAlle Checks bestanden.');
process.exit(failed ? 1 : 0);
