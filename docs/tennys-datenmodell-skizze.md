# TENNYS – Datenmodell-Skizze (grob)

Quelle: Notion-Seite "TENNYS" (PRD, Abschnitt 8) plus die Entscheidungen aus diesem Chat. Gedacht als Kontext für Claude Design (Screens) und später für das Convex-Schema. Felder sind bewusst in Englisch/camelCase gehalten, weil sie so direkt in Code übernommen werden können.

## Grundprinzip

User ist die Account-Ebene (Login, Auth). PlayerProfile ist die eigentliche Tennis-Identität. Ein Coach kann ein PlayerProfile anlegen, ohne dass ein User dahinter existiert ("private profile"). Wird es später per QR geclaimt, bekommt das bestehende PlayerProfile einfach einen ownerUserId, die Match-Historie bleibt automatisch erhalten, weil sich nur die Owner-Verknüpfung ändert, nicht die ID.

## Entitäten

### User
- id
- email
- authProvider: 'password' | 'apple'
- roles: array, z.B. ['player'], ['player','coach'], ['admin']
- createdAt

### PlayerProfile
- id
- displayName (Pseudonym erlaubt)
- gender
- handedness: 'left' | 'right'
- avatarMediaId (optional)
- clubId (optional, genau ein Club pro MVP-Default)
- ownerUserId (nullable, null solange unclaimed)
- createdByCoachId (Audit, bleibt auch nach Claim erhalten)
- claimToken (nullable, für QR-Claim)
- claimTokenExpiresAt (nullable)
- ratingSingles (Cache des letzten Einzel-StrengthSnapshot, Start 1000, Floor 100)
- ratingDoubles (Cache des letzten Doppel-StrengthSnapshot, Start 1000, Floor 100)
- currentStrength (LEGACY, ersetzt durch ratingSingles/ratingDoubles, wird nicht mehr gelesen)
- isDeleted (optional; DSGVO-Kontolöschung anonymisiert das Profil zu "Gelöschter Spieler", entfernt Foto/ownerUserId und blendet es aus allen Listen/Suchen/Ranglisten/Setups aus — Match-Historie bleibt bestehen)
- createdAt

Einzel- und Doppel-Rating sind streng getrennt (TPRS v2); es findet kein Punktetransfer zwischen ihnen statt. Berechnung siehe `tennis_rating_konzept_v2.md` bzw. `convex/lib/rating.ts`.

### Club
- id
- name
- description
- location (Freitext)
- logoMediaId (optional)
- ownerCoachId
- createdAt

### Connection
- id
- requesterPlayerProfileId
- recipientPlayerProfileId
- status: 'pending' | 'accepted' | 'declined'
- createdAt
- respondedAt

Freunde-Semantik (PRD): "Freund" = accepted Connection in beliebiger Richtung. Die globale Suche erzeugt `pending` + friend_request-Notification; Annehmen → `accepted` (+ friend_accepted-Notification), Ablehnen → Datensatz wird gelöscht. QR-Scan legt direkt `accepted` an (Mutual Consent durch physische Nähe). Profile ohne ownerUserId (Coach-/Seed-Profile) können nicht konsentieren und verbinden sich daher direkt.

### Match
- id
- type: 'singles' | 'doubles'
- dateTime
- place (Freitext)
- clubId (optional, auto-derived)
- season: 'summer' | 'winter' (denormalisiert, aus dateTime per fixer Kalenderregel berechnet, kein eigenes Season-Entity nötig)
- seasonYear
- team1PlayerIds (Länge 1 bei Singles, 2 bei Doubles)
- team2PlayerIds
- createdByUserId
- createdAt

### MatchResult
- id
- matchId
- sets: Array von { team1Games, team2Games, tiebreak?: {team1Points, team2Points} }
- isRetirement, isWalkover, retiredTeam (optional)
- team1TotalGames, team2TotalGames (denormalisiert)
- createdAt

### StrengthSnapshot
- id
- playerProfileId
- matchId
- discipline: 'singles' | 'doubles' (welches Rating dieser Snapshot betrifft)
- strengthBefore, strengthAfter, delta
- season, seasonYear (denormalisiert für schnelle Season-Abfragen)
- createdAt

Ein Eintrag pro (Spieler, Match) — auch bei delta 0 (z.B. etablierter Spieler bei neu-vs-etabliert), damit die Löschregel "letztes Match aller Teilnehmer" pro Teilnehmer greift. Kompletter Audit-Trail, treibt Verlaufs-Chart und Rankings (getrennt nach discipline).

### TeamPlays (Team-Lounge, §6.2)
- id
- pairKey (die zwei profileIds sortiert + verkettet, reihenfolgeunabhängig)
- profileA, profileB
- matches (Anzahl gemeinsamer Doppel; Team-Profil ab >= 3 freigeschaltet)
- teamName (optional), teamAvatarStorageId (optional)

Flache Verknüpfungstabelle. Es werden KEINE eigenständigen Team-Ratings gespeichert — die Teamstärke wird dynamisch als Summe der `ratingDoubles` beider Spieler berechnet.

### Post
- id
- matchId (0 oder 1 Post pro Match)
- authorUserId
- caption (optional)
- createdAt

### Media
- id
- postId (nur am Post, nicht an Kommentaren)
- url / storageId
- order
- createdAt

### Comment
- id
- matchId (Kommentare hängen am Match, nicht erst am Post, weil die Match-Detail-Seite auch ohne Post ein Kommentar-Thread hat)
- authorUserId
- text
- createdAt

### Reaction
- id
- matchId
- userId
- type: 'like' | 'tennis_ball' | 'fire' | 'strong' (erweiterbar)
- createdAt
- Annahme: ein Reaction-Eintrag pro (matchId, userId), erneutes Reagieren ändert nur den Typ

### Notification
- id
- recipientUserId
- type: 'friend_request' | 'friend_accepted' | 'comment' | 'reaction' | 'match_result' | 'new_match' | 'live_started' | 'live_cancelled'
- payload (relevante IDs, z.B. fromUserId, matchId, connectionId)
- isRead
- createdAt

## Beziehungen (Kurzfassung)

- User 1:1 PlayerProfile (optional, da private Profile ohne User existieren können)
- PlayerProfile N:1 Club (optional)
- PlayerProfile 1:N StrengthSnapshot
- Connection verweist 2x auf PlayerProfile (requester/recipient)
- Match N:N PlayerProfile (über team1PlayerIds/team2PlayerIds)
- Match 1:1 MatchResult
- Match 1:N StrengthSnapshot (eine pro Teilnehmer)
- Match 1:1 Post (optional)
- Post 1:N Media
- Match 1:N Comment
- Match 1:N Reaction
- User 1:N Notification
- Club 1:N PlayerProfile (Mitglieder)

## Entscheidungen aus diesem Chat

1. Matches sind nach dem Speichern nicht editierbar. Löschen nur möglich, wenn es das letzte Match aller Teilnehmer ist. Löschen entfernt MatchResult + die zugehörigen StrengthSnapshot-Einträge und setzt das Rating der Match-Disziplin (ratingSingles bzw. ratingDoubles) der Beteiligten auf den vorherigen Snapshot-Wert derselben Disziplin zurück (oder 1000, falls keiner existiert). Bei Doppeln wird zusätzlich der TeamPlays-Zähler des/der Paare(s) dekrementiert.
6. Rating (TPRS v2): Einzel und Doppel sind zwei getrennte Ratings pro Spieler. Berechnung zero-sum über die Summe aller Games (nicht Sätze), Laplace-Glättung +1, Pott-System 10%, Floor 100, kein Ceiling. Sonderfälle für neue Spieler (neu-vs-neu → 1000/1000; neu-vs-etabliert → Kalibrierung auf das Rating des Etablierten ±10 %, per `tanh` über den geglätteten Games-Vorsprung gedämpft, Etablierter bewegt sich spiegelbildlich mit ∓10 %). Team-Ratings werden nie gespeichert, Teamstärke = Summe der ratingDoubles.

> **Änderung ggü. Ursprungs-Spec (§4.2):** dort war der Etablierte Δ=0 und der Neuling bekam `rB × Games-Verhältnis` **ohne Deckel**. Ein glattes 6:0 6:0 im Debüt erzeugte damit ein Rating von 13000, eine Kanterniederlage fiel sofort auf den Floor — der Fehler potenzierte sich zudem, sobald der nächste Neuling gegen einen bereits verzerrten Gegner debütierte. Die ±10 %-Schranke ersetzt das bewusst; sie ist kein Bug, der zurückzudrehen wäre. Ratings sind abgeleitete Daten: nach jeder Formeländerung müssen sie neu berechnet werden — dafür gibt es bewusst kein In-App-Tool, das ist ein einmaliger Vorgang außerhalb der App.
2. Reactions: mehrere tennis-spezifische Typen, nicht nur ein Like.
3. Notifications sind eine eigene, gespeicherte Entität mit Lese-Status, kein Live-Computed-Ansatz.
4. Season-Zeiträume sind global fix (z.B. April–September Sommer, Oktober–März Winter), gleich für alle Clubs. Deshalb kein eigenes Season-Entity, nur eine berechnete, denormalisierte Spalte auf Match.
5. Bilder hängen nur am Match-Post, nicht an einzelnen Kommentaren.
6. Ein Spieler gehört zu genau einem Club (MVP-Default, später erweiterbar).

## Damit gelöste offene Frage aus der PRD

Die PRD fragte offen, ob Match-Historie beim Claim eines privaten Profils automatisch übergeht. Durch das Modell (PlayerProfile bleibt stabil, nur ownerUserId ändert sich) passiert das automatisch, ohne Migrationsaufwand.

## Nächster Schritt

Diese Skizze als Kontext in Claude Design geben, damit Felder und Zustände in den Screens (Match-Wizard, Profil, Ranking, Feed) zur Datenstruktur passen. Danach Convex-Schema (schema.ts) direkt daraus ableiten.
