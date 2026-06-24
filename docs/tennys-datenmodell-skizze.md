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
- currentStrength (Cache des letzten StrengthSnapshot, Start 1000)
- createdAt

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
- strengthBefore, strengthAfter, delta
- season, seasonYear (denormalisiert für schnelle Season-Abfragen)
- createdAt

Ein Eintrag pro (Spieler, Match), kompletter Audit-Trail. Treibt sowohl den Verlaufs-Chart als auch die Rankings.

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
- type: 'friend_request' | 'friend_accepted' | 'comment' | 'reaction'
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

1. Matches sind nach dem Speichern nicht editierbar. Löschen nur möglich, wenn es das letzte Match aller Teilnehmer ist. Löschen entfernt MatchResult + die zugehörigen StrengthSnapshot-Einträge und setzt currentStrength der Beteiligten auf den vorherigen Snapshot-Wert zurück (oder 1000, falls keiner existiert).
2. Reactions: mehrere tennis-spezifische Typen, nicht nur ein Like.
3. Notifications sind eine eigene, gespeicherte Entität mit Lese-Status, kein Live-Computed-Ansatz.
4. Season-Zeiträume sind global fix (z.B. April–September Sommer, Oktober–März Winter), gleich für alle Clubs. Deshalb kein eigenes Season-Entity, nur eine berechnete, denormalisierte Spalte auf Match.
5. Bilder hängen nur am Match-Post, nicht an einzelnen Kommentaren.
6. Ein Spieler gehört zu genau einem Club (MVP-Default, später erweiterbar).

## Damit gelöste offene Frage aus der PRD

Die PRD fragte offen, ob Match-Historie beim Claim eines privaten Profils automatisch übergeht. Durch das Modell (PlayerProfile bleibt stabil, nur ownerUserId ändert sich) passiert das automatisch, ohne Migrationsaufwand.

## Nächster Schritt

Diese Skizze als Kontext in Claude Design geben, damit Felder und Zustände in den Screens (Match-Wizard, Profil, Ranking, Feed) zur Datenstruktur passen. Danach Convex-Schema (schema.ts) direkt daraus ableiten.
