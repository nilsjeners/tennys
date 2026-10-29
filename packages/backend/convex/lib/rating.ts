// Tennis-Pott-Rating-System (TPRS) v2 — reine Berechnungsfunktionen.
// Portiert 1:1 aus dem Owner-Spec (tennis_rating_konzept_v2.md). Einzige Quelle
// der Rating-Wahrheit; keine DB-Zugriffe, damit unit-prüfbar.
//
// Kernprinzipien: Nullsummenspiel, Berechnung über die SUMME aller Games (nicht
// Sätze), Laplace-Glättung (+1 je Seite), Floor 100, kein Ceiling, Einzel und
// Doppel strikt getrennt.

export const START_RATING = 1000;
export const RATING_FLOOR = 100;
export const P_PERCENT = 0.1; // 10 % Pott-Beitrag

// §4.2: Steilheit der Debüt-Kalibrierung. Bei 2 schöpft ein glatter
// Doppel-6:0 ~9,4 % der möglichen 10 % aus und die realistischen Ergebnisse
// (6:1 6:3 … 7:5 6:5) verteilen sich noch klar unterscheidbar darunter.
const CALIBRATION_STEEPNESS = 2;

const floor = (r: number) => Math.max(RATING_FLOOR, Math.round(r));

// Anteil, um den das Rating des Etablierten für den Neuling nach oben (bzw. für
// ihn selbst nach unten) korrigiert wird. tanh nähert sich ±P_PERCENT nur
// asymptotisch, ein Kantersieg kann die 10 % also nie überschreiten.
function calibrationFactor(gWinnerP: number, gLoserP: number): number {
  const margin = (gWinnerP - gLoserP) / (gWinnerP + gLoserP); // ∈ (-1, 1)
  return P_PERCENT * Math.tanh(CALIBRATION_STEEPNESS * margin);
}

export type SinglesResult = { ratingA: number; ratingB: number };

// Einzel (1 vs 1). §3–4. isNewX = Spieler hat noch kein etabliertes Einzel-Rating.
export function calcSingles(
  rA: number,
  rB: number,
  gamesA: number,
  gamesB: number,
  isNewA: boolean,
  isNewB: boolean
): SinglesResult {
  const gAp = gamesA + 1; // Laplace
  const gBp = gamesB + 1;

  // §4.1 Neu vs. Neu → beide starten auf 1000 (Spiel selbst bewegt nichts).
  if (isNewA && isNewB) {
    return { ratingA: START_RATING, ratingB: START_RATING };
  }

  // §4.2 Neu vs. Etabliert → Kalibrierung am Rating des Etablierten, begrenzt
  // auf ±10 % davon. Bewusste Abweichung vom ursprünglichen Spec (dort war der
  // Etablierte Δ=0 und der Neuling bekam rB × Games-Verhältnis ohne Deckel —
  // das ließ Debüt-Ratings ins Absurde laufen, z. B. 13000 nach einem 6:0 6:0).
  // Der Etablierte bewegt sich jetzt spiegelbildlich mit, trägt also Risiko.
  if (isNewA && !isNewB) {
    const f = calibrationFactor(gAp, gBp);
    return { ratingA: floor(rB * (1 + f)), ratingB: floor(rB * (1 - f)) };
  }
  if (!isNewA && isNewB) {
    const f = calibrationFactor(gBp, gAp);
    return { ratingA: floor(rA * (1 - f)), ratingB: floor(rA * (1 + f)) };
  }

  // §3 Etabliert vs. Etabliert → Pott-System.
  const potA = rA * P_PERCENT;
  const potB = rB * P_PERCENT;
  const total = potA + potB;
  const payoutA = total * (gAp / (gAp + gBp));
  const payoutB = total * (gBp / (gAp + gBp));
  return {
    ratingA: floor(rA - potA + payoutA),
    ratingB: floor(rB - potB + payoutB),
  };
}

export type DoublesPlayer = { rating: number; isNew: boolean };
export type DoublesResult = { a1: number; a2: number; b1: number; b2: number };

// Doppel (2 vs 2). §5. Neue Spieler bekommen temporär 1000, danach reguläre
// Zweistufen-Pott-Berechnung + Vorschusskraft-Aufteilung.
export function calcDoubles(
  a1: DoublesPlayer,
  a2: DoublesPlayer,
  b1: DoublesPlayer,
  b2: DoublesPlayer,
  gamesA: number,
  gamesB: number
): DoublesResult {
  const rA1 = a1.isNew ? START_RATING : a1.rating;
  const rA2 = a2.isNew ? START_RATING : a2.rating;
  const rB1 = b1.isNew ? START_RATING : b1.rating;
  const rB2 = b2.isNew ? START_RATING : b2.rating;

  // Stufe 1: Einzahlungen
  const potA1 = rA1 * P_PERCENT;
  const potA2 = rA2 * P_PERCENT;
  const potB1 = rB1 * P_PERCENT;
  const potB2 = rB2 * P_PERCENT;
  const total = potA1 + potA2 + potB1 + potB2;

  // Stufe 2: Teamauszahlung (geglättete Games)
  const gAp = gamesA + 1;
  const gBp = gamesB + 1;
  const totalG = gAp + gBp;
  const teamA = total * (gAp / totalG);
  const teamB = total * (gBp / totalG);

  // Stufe 3: Spielerauszahlung nach Vorschusskraft
  const payA1 = teamA * (rA1 / (rA1 + rA2));
  const payA2 = teamA * (rA2 / (rA1 + rA2));
  const payB1 = teamB * (rB1 / (rB1 + rB2));
  const payB2 = teamB * (rB2 / (rB1 + rB2));

  // Stufe 4: neue Ratings
  return {
    a1: floor(rA1 - potA1 + payA1),
    a2: floor(rA2 - potA2 + payA2),
    b1: floor(rB1 - potB1 + payB1),
    b2: floor(rB2 - potB2 + payB2),
  };
}

// Summe aller gewonnenen Games je Seite (§2.2). Tie-Break-Sätze werden bereits
// als 7:6 eingegeben, daher kein Spezial-Decode nötig.
export function totalGames(sets: { team1Games: number; team2Games: number }[]): {
  gamesTeam1: number;
  gamesTeam2: number;
} {
  return sets.reduce(
    (acc, s) => ({ gamesTeam1: acc.gamesTeam1 + s.team1Games, gamesTeam2: acc.gamesTeam2 + s.team2Games }),
    { gamesTeam1: 0, gamesTeam2: 0 }
  );
}
