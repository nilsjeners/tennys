// Canonical translation source. Lives in git, is bundled into the app (so the
// UI never renders raw keys while the Convex bundle loads), and is pushed into
// the `translations` table by `npx convex run i18n:seed` for dashboard editing.
//
// `de` is the source of truth — every key must exist there. Missing keys in
// another locale fall back to `de`, then to the key itself.
//
// Placeholders are `{name}` style. Keys ending in `_one` / `_other` are plural
// variants selected by the `n` placeholder (see src/lib/i18n.tsx).

export const LOCALE_CODES = ["de", "en"] as const;
export type LocaleCode = (typeof LOCALE_CODES)[number];

export const DEFAULT_LOCALE: LocaleCode = "de";

export function isLocaleCode(v: unknown): v is LocaleCode {
  return typeof v === "string" && (LOCALE_CODES as readonly string[]).includes(v);
}

// Fills {placeholders}. An unknown placeholder is left verbatim so a typo shows
// up in the UI instead of silently blanking out.
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

const de = {
  // ── common ────────────────────────────────────────────────────────────────
  "common.cancel": "Abbrechen",
  "common.save": "Speichern",
  "common.ok": "OK",
  "common.you": "Du",
  "common.matches_one": "{n} Spiel",
  "common.matches_other": "{n} Spiele",
  "common.points": "Punkte",
  "common.pointsShort": "Pkt.",
  "common.singles": "Einzel",
  "common.doubles": "Doppel",
  "common.deletedPlayer": "Gelöschter Spieler",
  "common.unknownPlayer": "Unbekannt",
  "common.someone": "Jemand",

  // ── relative dates ────────────────────────────────────────────────────────
  "date.justNow": "gerade eben",
  "date.minutesAgo": "vor {n} Min.",
  "date.hoursAgo": "vor {n} Std.",
  "date.today": "Heute",
  "date.yesterday": "Gestern",

  // ── tab bar ───────────────────────────────────────────────────────────────
  "tabs.matches": "Spiele",
  "tabs.friends": "Freunde",
  "tabs.newMatch": "Spiel",
  "tabs.ranking": "Rangliste",
  "tabs.profile": "Profil",

  // ── KPI labels (profile hero row) ─────────────────────────────────────────
  "kpi.matches": "Spiele",
  "kpi.wins": "Siege",
  "kpi.rate": "Quote",
  "kpi.streak": "Serie",

  // ── balance card ──────────────────────────────────────────────────────────
  "balance.title": "Bilanz",
  "balance.sub": "({wins} Siege, {losses} Niederlagen)",

  // ── welcome ───────────────────────────────────────────────────────────────
  "auth.welcome.tagline": "Tracke Deine Matches. Miss Dich mit der Community. Mach Deine Fortschritte sichtbar.",
  "auth.welcome.apple": "Mit Apple fortfahren",
  "auth.welcome.google": "Mit Google fortfahren",
  "auth.welcome.or": "oder",
  "auth.welcome.signupEmail": "Mit E-Mail registrieren",
  "auth.welcome.already": "Schon dabei?",
  "auth.welcome.login": "Anmelden",
  "auth.welcome.legalPrefix": "Mit der Anmeldung stimmst du den",
  "auth.welcome.terms": "AGB",
  "auth.welcome.legalAnd": "und",
  "auth.welcome.privacy": "Datenschutzrichtlinien",
  // leading space is intentional — it closes the sentence after the link
  "auth.welcome.legalSuffix": " zu.",

  // ── login ─────────────────────────────────────────────────────────────────
  "auth.login.title": "Anmelden",
  "auth.login.subtitle": "Willkommen zurück.",
  "auth.login.email": "E-Mail",
  "auth.login.password": "Passwort",
  "auth.login.forgot": "Passwort vergessen?",
  "auth.login.forgotSoon": "Passwort-Zurücksetzen per E-Mail folgt in Kürze.",
  "auth.login.failed": "Anmeldung fehlgeschlagen. Bitte versuche es erneut.",

  // ── signup ────────────────────────────────────────────────────────────────
  "auth.signup.title": "Konto erstellen",
  "auth.signup.subtitle": "Erstelle dein Konto in wenigen Sekunden.",
  "auth.signup.minChars": "Mindestens {n} Zeichen.",
  "auth.signup.acceptPrefix": "Ich akzeptiere die",
  "auth.signup.terms": "Nutzungsbedingungen",
  "auth.signup.and": "und",
  "auth.signup.privacy": "Datenschutz",
  "auth.signup.acceptSuffix": ".",
  "auth.signup.submit": "Weiter",
  "auth.signup.failed": "Registrierung fehlgeschlagen. Bitte versuche es erneut.",

  // ── profile setup ─────────────────────────────────────────────────────────
  "auth.setup.title": "Dein Profil",
  "auth.setup.photoPicked": "Foto ausgewählt",
  "auth.setup.addPhoto": "Foto hinzufügen",
  "auth.setup.displayName": "Anzeigename",
  "auth.setup.namePlaceholder": "Anna Berg",
  "auth.setup.submit": "Profil speichern",
  "auth.setup.failed": "Konnte Profil nicht speichern. Bitte versuche es erneut.",
  "auth.setup.photoPermissionDenied": "Zugriff auf Fotos verweigert. Bitte in den Einstellungen erlauben.",
  "auth.setup.photoFailed": "Foto konnte nicht ausgewählt werden.",

  // ── done ──────────────────────────────────────────────────────────────────
  "auth.done.title": "Willkommen!",
  "auth.done.body": "Dein Konto ist startklar. Logge dein erstes Match und steig in die Rangliste ein. 🎾",
  "auth.done.cta": "Los geht's",

  // ── home / feed ───────────────────────────────────────────────────────────
  "home.title": "Spiele",
  "home.live": "LIVE",
  "home.loadMore": "Weitere Spiele laden",
  "home.empty": "Noch keine Spiele erfasst. Tippe auf ＋ Spiel, um dein erstes Ergebnis einzutragen.",

  // ── friends ───────────────────────────────────────────────────────────────
  "friends.title": "Freunde",
  "friends.searchPlaceholder": "Spieler suchen…",
  "friends.yours": "Deine Freunde",
  "friends.noneFound": "Keine Spieler gefunden.",
  "friends.empty": "Du hast noch keine Freunde hinzugefügt. Nutze den Scan-Button auf dem Platz oder suche nach Spielern.",
  "friends.statusFriends": "Freunde",
  "friends.statusRequested": "Angefragt",
  "friends.accept": "Annehmen",
  "friends.request": "Anfragen",
  "friends.nowFriends": "Ihr seid jetzt Freunde!",
  "friends.requestFailed": "Anfrage konnte nicht gesendet werden.",
  "friends.acceptFailed": "Konnte die Anfrage nicht annehmen.",
  "friends.declineFailed": "Konnte die Anfrage nicht ablehnen.",
  "friends.follow": "Folgen",
  "friends.unfollow": "Nicht mehr folgen",
  "friends.unfollowConfirmTitle": "Nicht mehr folgen?",
  "friends.unfollowConfirmBody": "Ihr seid dann keine Freunde mehr.",
  "friends.unfollowFailed": "Konnte die Freundschaft nicht beenden.",

  // ── ranking ───────────────────────────────────────────────────────────────
  "ranking.title": "Rangliste",
  "ranking.searchPlaceholder": "Suchen…",
  "ranking.summary": "{n} Spieler | Ø {avg}",
  "ranking.you": "(du)",
  "ranking.rowSub": "{matches} Spiele | {pct} % Siege",
  "ranking.loadMore": "Weitere Spieler laden",
  "ranking.noneFound": "Keine Spieler gefunden.",

  // ── profile ───────────────────────────────────────────────────────────────
  "profile.strengthTitle": "Stärkeverlauf",
  "profile.last20": "letzte 30 Tage",
  "profile.topPartners": "Top 3 Mitspieler",
  "profile.recentMatches": "Letzte Spiele",
  "profile.noMatches": "Noch keine Spiele.",
  "profile.rankLabel": "Platzierung",
  "profile.rankOfSingles": "von {total} in der Einzel-Rangliste",
  "profile.rankOfDoubles": "von {total} in der Doppel-Rangliste",
  "profile.activityTitle": "Aktivität",
  "profile.setsWonTitle": "Gewonnene Sätze",
  "profile.setsLostTitle": "Verlorene Sätze",

  // ── edit profile ──────────────────────────────────────────────────────────
  "profile.edit.title": "Profil bearbeiten",
  "profile.edit.uploading": "Lädt hoch…",
  "profile.edit.changePhoto": "Foto ändern",
  "profile.edit.camera": "Kamera",
  "profile.edit.library": "Mediathek",
  "profile.edit.uploadFailed": "Foto konnte nicht hochgeladen werden.",
  "profile.edit.saveFailed": "Konnte Profil nicht speichern.",

  // ── settings ──────────────────────────────────────────────────────────────
  "settings.title": "Einstellungen",
  "settings.groupAccount": "Konto",
  "settings.editProfile": "Profil bearbeiten",
  "settings.email": "E-Mail-Adresse",
  "settings.changePassword": "Passwort ändern",
  "settings.groupNotifications": "Benachrichtigungen",
  "settings.push": "Push-Mitteilungen",
  "settings.pushDisableHint": "Push-Mitteilungen kannst du in den Systemeinstellungen deaktivieren.",
  "settings.pushEnableHint": "Push-Mitteilungen kannst du in den Systemeinstellungen aktivieren.",
  "settings.groupLanguage": "Sprache",
  "settings.language": "App-Sprache",
  "settings.groupLegal": "Rechtliches",
  "settings.terms": "Nutzungsbedingungen",
  "settings.privacy": "Datenschutz",
  "settings.help": "Hilfe & Support",
  "settings.signOut": "Abmelden",
  "settings.deleteAccount": "Konto löschen",
  "settings.deleteTitle": "Konto löschen?",
  "settings.deleteBody": "Bist du sicher, dass du dein Konto unwiderruflich löschen möchtest? Dies kann nicht rückgängig gemacht werden.",
  "settings.deleteConfirm": "Unwiderruflich löschen",
  "settings.deleteFailed": "Konto konnte nicht gelöscht werden. Bitte versuche es erneut.",

  // ── language picker ───────────────────────────────────────────────────────
  "language.system": "Systemsprache",
  "language.de": "Deutsch",
  "language.en": "English",

  // ── match setup ───────────────────────────────────────────────────────────
  "matchSetup.newSingles": "Neues Einzel",
  "matchSetup.newDoubles": "Neues Doppel",
  "matchSetup.slotYou": "Du",
  "matchSetup.slotPartner": "Partner",
  "matchSetup.slotOpponent": "Gegner",
  "matchSetup.slotOpponent1": "Gegner 1",
  "matchSetup.slotOpponent2": "Gegner 2",
  "matchSetup.searchFriends": "Freunde durchsuchen…",
  "matchSetup.noFriendsFound": "Keine Freunde gefunden.",
  "matchSetup.allLinedUp": "Alle Freunde sind aufgestellt.\nEntferne jemanden oder scanne neue Spieler.",
  "matchSetup.scan": "Scan",
  "matchSetup.continue": "Weiter zum Ergebnis",
  "matchSetup.startFailed": "Spiel konnte nicht gestartet werden.",

  // ── match entry ───────────────────────────────────────────────────────────
  "matchEntry.title": "Ergebnis eingeben",
  "matchEntry.addSet": "Satz",
  "matchEntry.save": "Beenden und Speichern",

  // ── scan ──────────────────────────────────────────────────────────────────
  "scan.title": "Spieler scannen",
  "scan.aim": "Auf QR-Code richten",
  "scan.noAccess": "Kein Kamera-Zugriff. Erlaube den Zugriff in den Einstellungen, um QR-Codes zu scannen.",
  "scan.openSettings": "Einstellungen öffnen",
  "scan.tapToAllow": "Tippe, um den Kamera-Zugriff zu erlauben.",
  "scan.added": "{names} hinzugefügt",
  "scan.nobody": "Noch niemand gescannt",
  "scan.yourCode": "Dein Code",
  "scan.yourCodeHint": "Lass andere dich scannen, um dich zum Spiel hinzuzufügen.",
  "scan.ownCode": "Das ist dein eigener Code.",
  "scan.alreadyIn": "Spieler ist bereits im Match.",
  "scan.maxPlayers": "Maximale Spieleranzahl erreicht.",
  "scan.notFound": "Spieler nicht gefunden.",
  "scan.unreadable": "Code konnte nicht gelesen werden.",

  // ── notifications ─────────────────────────────────────────────────────────
  "notifications.title": "Mitteilungen",
  "notifications.empty": "Noch keine Mitteilungen.",
  "notifications.friend_request": "möchte mit dir befreundet sein.",
  "notifications.friend_accepted": "hat deine Freundschaftsanfrage angenommen.",
  "notifications.comment": "hat dein Spiel kommentiert.",
  "notifications.reaction": "hat auf dein Spiel reagiert.",
  "notifications.match_result": "hat ein Match-Ergebnis eingetragen.",
  "notifications.new_match": "hat ein neues Spiel eingetragen, an dem ein Freund von dir mitgespielt hat.",
  "notifications.live_started": "hat ein Live-Spiel mit dir gestartet.",
  "notifications.live_cancelled": "hat das Live-Spiel mit dir ohne Ergebnis abgebrochen.",

  // ── device push (rendered server-side) ────────────────────────────────────
  "push.friend_request.title": "Neue Freundschaftsanfrage",
  "push.friend_request.body": "{name} möchte sich mit dir vernetzen.",
  "push.friend_accepted.title": "Freundschaft bestätigt",
  "push.friend_accepted.body": "{name} hat deine Anfrage angenommen.",
  "push.comment.title": "Neuer Kommentar",
  "push.comment.body": "{name} hat dein Match kommentiert.",
  "push.reaction.title": "Neue Reaktion",
  "push.reaction.body": "{name} hat auf dein Match reagiert.",
  "push.match_result.title": "Match-Ergebnis",
  "push.match_result.body": "{name} hat ein Match-Ergebnis eingetragen.",
  "push.new_match.title": "Neues Spiel",
  "push.new_match.body": "{name} hat ein neues Spiel eingetragen, an dem ein Freund von dir mitgespielt hat.",
  "push.live_started.title": "Live-Spiel gestartet",
  "push.live_started.body": "{name} hat ein Live-Spiel mit dir gestartet.",
  "push.live_cancelled.title": "Live-Spiel abgebrochen",
  "push.live_cancelled.body": "{name} hat das Live-Spiel mit dir ohne Ergebnis abgebrochen.",

  // ── match detail ──────────────────────────────────────────────────────────
  "match.title": "Spiel",
  "match.stats": "Statistik",
  "match.strengthLast10": "Stärkeverlauf · letzte 30 Tage",
  "match.balanceNormalized": "Bilanz · auf 100 % normiert",
  "match.comments": "Kommentare",
  "match.noComments": "Noch keine Kommentare — sei der Erste, der einen Kommentar schreibt.",
  "match.commentPlaceholder": "Kommentar hinzufügen …",
  "match.commentFailed": "Kommentar konnte nicht gesendet werden.",
  "match.delete": "Spiel löschen",
  "match.deleteTitle": "Spiel löschen?",
  "match.deleteBody": "Bist du sicher, dass du dieses Spiel unwiderruflich löschen möchtest? Dies kann nicht rückgängig gemacht werden.",
  "match.deleteConfirm": "Unwiderruflich löschen",
  "match.deleteFailed": "Spiel konnte nicht gelöscht werden.",

  // ── team lounge ───────────────────────────────────────────────────────────
  "team.title": "Team",
  "team.namePlaceholder": "Teamname",
  "team.strength": "Teamstärke",
  "team.locked": "Team-Profil noch gesperrt",
  "team.lockedHint_one": "Spielt {n} weiteres Doppel zusammen, um Teamname, Historie und Statistiken freizuschalten.",
  "team.lockedHint_other": "Spielt {n} weitere Doppel zusammen, um Teamname, Historie und Statistiken freizuschalten.",
  "team.together": "Gemeinsam",
  "team.togetherSub": "Doppel",
  "team.wins": "Siege",
  "team.winsSub": "{pct}% Quote",
  "team.streak": "Serie",
  "team.streakSub": "in Folge",
  "team.games": "Games",
  "team.gamesSub": "Verhältnis",
  "team.players": "Spieler",

  // ── auth / network errors ─────────────────────────────────────────────────
  "error.INVALID_EMAIL_OR_PASSWORD": "E-Mail oder Passwort ist falsch.",
  "error.INVALID_EMAIL": "Bitte gib eine gültige E-Mail-Adresse ein.",
  "error.INVALID_PASSWORD": "Das Passwort ist ungültig.",
  "error.PASSWORD_TOO_SHORT": "Das Passwort muss mindestens 8 Zeichen haben.",
  "error.PASSWORD_TOO_LONG": "Das Passwort ist zu lang.",
  "error.USER_ALREADY_EXISTS": "Für diese E-Mail existiert bereits ein Konto.",
  "error.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL": "Für diese E-Mail existiert bereits ein Konto. Bitte melde dich stattdessen an.",
  "error.USER_NOT_FOUND": "E-Mail oder Passwort ist falsch.",
  "error.EMAIL_NOT_VERIFIED": "Bitte bestätige zuerst deine E-Mail-Adresse.",
  "error.FAILED_TO_CREATE_USER": "Konto konnte nicht erstellt werden. Bitte versuche es erneut.",
  "error.network": "Keine Verbindung zum Server. Bitte prüfe deine Internetverbindung und versuche es erneut.",
  "error.rateLimit": "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.",
  "error.server": "Der Server ist gerade nicht erreichbar. Bitte versuche es später erneut.",

  // ── forced update ─────────────────────────────────────────────────────────
  "update.title": "Update erforderlich",
  "update.body": "Diese Version von Tennys wird nicht mehr unterstützt. Bitte aktualisiere die App im App Store bzw. bei Google Play.",

  // ── legal: terms ──────────────────────────────────────────────────────────
  "legal.updated": "Stand: 29. Oktober 2026",
  "legal.terms.title": "Nutzungsbedingungen",
  "legal.terms.scope.title": "Geltungsbereich",
  "legal.terms.scope.body":
    'Diese Nutzungsbedingungen regeln die Nutzung der App tennys ("tennys", "wir", "uns") durch registrierte und nicht registrierte Nutzer:innen. tennys wird betrieben von der Jeners Consulting GmbH. Mit der Erstellung eines Kontos oder der Nutzung der App erklärst du dich mit diesen Bedingungen einverstanden.',
  "legal.terms.usage.title": "Nutzung der App",
  "legal.terms.usage.body":
    "tennys dient der Erfassung und Verwaltung von Tennisspielen, dem Aufbau eines Spieler:innen-Netzwerks sowie der Darstellung von Ranglisten und Spielstatistiken. Du verpflichtest dich, die App nur für diese Zwecke und im Einklang mit geltendem Recht zu nutzen. Eingegebene Spielergebnisse und Profildaten müssen wahrheitsgemäß sein. Missbrauch, insbesondere die Erstellung falscher Profile oder manipulierte Spielergebnisse, kann zur Sperrung des Kontos führen.",
  "legal.terms.liability.title": "Haftung",
  "legal.terms.liability.body":
    'Die App wird "wie besehen" bereitgestellt. Jeners Consulting GmbH übernimmt keine Gewähr für die ununterbrochene Verfügbarkeit der App, die Richtigkeit berechneter Ranglisten und Bewertungen oder für Inhalte, die von Nutzer:innen eingestellt werden. Eine Haftung für mittelbare Schäden oder entgangenen Gewinn ist, soweit gesetzlich zulässig, ausgeschlossen.',
  "legal.terms.changes.title": "Änderungen der AGB",
  "legal.terms.changes.body":
    "Wir behalten uns vor, diese Nutzungsbedingungen bei Bedarf anzupassen, etwa bei neuen Funktionen oder geänderten rechtlichen Anforderungen. Über wesentliche Änderungen informieren wir dich rechtzeitig in der App. Die fortgesetzte Nutzung nach Inkrafttreten der Änderungen gilt als Zustimmung.",
  "legal.terms.contact.title": "Kontakt",
  "legal.terms.contact.body":
    "Fragen zu diesen Nutzungsbedingungen richtest du bitte an hallo@tennys.app.\nJeners Consulting GmbH, Spitzwegstr. 10, 42579 Heiligenhaus",

  // ── legal: privacy ────────────────────────────────────────────────────────
  "legal.privacy.title": "Datenschutz",
  "legal.privacy.controller.title": "Verantwortliche Stelle",
  "legal.privacy.controller.body":
    "Verantwortlich für die Verarbeitung deiner personenbezogenen Daten im Sinne der DSGVO ist Jeners Consulting GmbH, Spitzwegstr. 10, 42579 Heiligenhaus. Bei Fragen zum Datenschutz erreichst du uns unter hallo@tennys.app.",
  "legal.privacy.data.title": "Erhobene Daten",
  "legal.privacy.data.body":
    "Wir verarbeiten: Kontodaten (E-Mail-Adresse, Anmeldeart, bei Anmeldung mit Apple oder Google die von dort übermittelte Kennung), Profildaten (Anzeigename, Benutzername, Geschlecht, Spielhand, Spielstärke, Stadt, Profilbild, Verein), Spieldaten (Ergebnisse, Mit- und Gegenspieler:innen, Zeitpunkt, berechnete Wertungen), soziale Inhalte (Freundschaften, Beiträge, Kommentare, Reaktionen) sowie technische Daten (Push-Token deines Geräts, Spracheinstellung, Zeitpunkt der letzten Nutzung). Wir nutzen keine Werbe- oder Analyse-Tracker und verkaufen keine Daten.",
  "legal.privacy.purpose.title": "Zweck der Verarbeitung",
  "legal.privacy.purpose.body":
    "Deine Daten werden verarbeitet, um die App bereitzustellen und zu betreiben, dein Profil und deine Spielhistorie darzustellen, Ranglisten und Bewertungen zu berechnen, dich mit anderen Nutzer:innen zu vernetzen sowie um dich über relevante Aktivitäten (z. B. Freundschaftsanfragen, Kommentare) zu benachrichtigen. Rechtsgrundlage ist die Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO) sowie, soweit erforderlich, deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).",
  "legal.privacy.permissions.title": "Berechtigungen auf deinem Gerät",
  "legal.privacy.permissions.body":
    "Die App fragt nur bei Bedarf nach Zugriff: Kamera zum Scannen von QR-Codes (Bilder werden nicht gespeichert), Fotos zum Setzen eines Profilbilds (nur das ausgewählte Bild wird hochgeladen) und Mitteilungen für Push-Benachrichtigungen. Du kannst jede Berechtigung jederzeit in den Systemeinstellungen widerrufen.",
  "legal.privacy.recipients.title": "Dienstleister und Übermittlung in Drittländer",
  "legal.privacy.recipients.body":
    "Wir setzen folgende Auftragsverarbeiter ein: Convex, Inc. (USA) für Datenbank und Server, 650 Industries, Inc. / Expo (USA) für Push-Benachrichtigungen und App-Updates, Vercel Inc. (USA) für das Hosting der Website. Push-Nachrichten werden über Apple (APNs) bzw. Google (FCM) zugestellt. Meldest du dich mit Apple oder Google an, gelten zusätzlich deren Datenschutzbestimmungen. Übermittlungen in die USA erfolgen auf Grundlage des EU-US Data Privacy Framework bzw. der EU-Standardvertragsklauseln.",
  "legal.privacy.rights.title": "Speicherdauer und deine Rechte",
  "legal.privacy.rights.body":
    "Wir speichern deine Daten, solange dein Konto besteht. Du kannst dein Konto jederzeit in der App unter Profil → Einstellungen löschen; dein Profil wird dann gelöscht bzw. anonymisiert (\"Gelöschter Spieler\"), damit gemeinsame Spiele anderer Nutzer:innen erhalten bleiben. Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch sowie ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde, z. B. der LDI NRW.",
  "legal.privacy.contact.title": "Kontakt",
  "legal.privacy.contact.body":
    "Für Anfragen zu deinen Daten oder zur Ausübung deiner Rechte wende dich an hallo@tennys.app.\nJeners Consulting GmbH, Spitzwegstr. 10, 42579 Heiligenhaus",
} as const;

export type TranslationKey = keyof typeof de;

const en: Record<TranslationKey, string> = {
  // ── common ────────────────────────────────────────────────────────────────
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.ok": "OK",
  "common.you": "You",
  "common.matches_one": "{n} match",
  "common.matches_other": "{n} matches",
  "common.points": "points",
  "common.pointsShort": "pts",
  "common.singles": "Singles",
  "common.doubles": "Doubles",
  "common.deletedPlayer": "Deleted player",
  "common.unknownPlayer": "Unknown",
  "common.someone": "Someone",

  // ── relative dates ────────────────────────────────────────────────────────
  "date.justNow": "just now",
  "date.minutesAgo": "{n} min ago",
  "date.hoursAgo": "{n} h ago",
  "date.today": "Today",
  "date.yesterday": "Yesterday",

  // ── tab bar ───────────────────────────────────────────────────────────────
  "tabs.matches": "Matches",
  "tabs.friends": "Friends",
  "tabs.newMatch": "Match",
  "tabs.ranking": "Ranking",
  "tabs.profile": "Profile",

  // ── KPI labels ────────────────────────────────────────────────────────────
  "kpi.matches": "Matches",
  "kpi.wins": "Wins",
  "kpi.rate": "Win rate",
  "kpi.streak": "Streak",

  // ── balance card ──────────────────────────────────────────────────────────
  "balance.title": "Record",
  "balance.sub": "({wins} wins, {losses} losses)",

  // ── welcome ───────────────────────────────────────────────────────────────
  "auth.welcome.tagline": "Track your matches. Measure up against the community. Make your progress visible.",
  "auth.welcome.apple": "Continue with Apple",
  "auth.welcome.google": "Continue with Google",
  "auth.welcome.or": "or",
  "auth.welcome.signupEmail": "Sign up with email",
  "auth.welcome.already": "Already playing?",
  "auth.welcome.login": "Sign in",
  "auth.welcome.legalPrefix": "By signing up you agree to our",
  "auth.welcome.terms": "Terms",
  "auth.welcome.legalAnd": "and",
  "auth.welcome.privacy": "Privacy Policy",
  "auth.welcome.legalSuffix": ".",

  // ── login ─────────────────────────────────────────────────────────────────
  "auth.login.title": "Sign in",
  "auth.login.subtitle": "Welcome back.",
  "auth.login.email": "Email",
  "auth.login.password": "Password",
  "auth.login.forgot": "Forgot your password?",
  "auth.login.forgotSoon": "Password reset by email is coming soon.",
  "auth.login.failed": "Sign-in failed. Please try again.",

  // ── signup ────────────────────────────────────────────────────────────────
  "auth.signup.title": "Create account",
  "auth.signup.subtitle": "Create your account in seconds.",
  "auth.signup.minChars": "At least {n} characters.",
  "auth.signup.acceptPrefix": "I accept the",
  "auth.signup.terms": "Terms of Use",
  "auth.signup.and": "and",
  "auth.signup.privacy": "Privacy Policy",
  "auth.signup.acceptSuffix": ".",
  "auth.signup.submit": "Continue",
  "auth.signup.failed": "Sign-up failed. Please try again.",

  // ── profile setup ─────────────────────────────────────────────────────────
  "auth.setup.title": "Your profile",
  "auth.setup.photoPicked": "Photo selected",
  "auth.setup.addPhoto": "Add photo",
  "auth.setup.displayName": "Display name",
  "auth.setup.namePlaceholder": "Anna Berg",
  "auth.setup.submit": "Save profile",
  "auth.setup.failed": "Couldn't save your profile. Please try again.",
  "auth.setup.photoPermissionDenied": "Photo access denied. Please allow it in Settings.",
  "auth.setup.photoFailed": "Couldn't select a photo.",

  // ── done ──────────────────────────────────────────────────────────────────
  "auth.done.title": "Welcome!",
  "auth.done.body": "Your account is ready. Log your first match and enter the ranking. 🎾",
  "auth.done.cta": "Let's go",

  // ── home / feed ───────────────────────────────────────────────────────────
  "home.title": "Matches",
  "home.live": "LIVE",
  "home.loadMore": "Load more matches",
  "home.empty": "No matches logged yet. Tap ＋ Match to record your first result.",

  // ── friends ───────────────────────────────────────────────────────────────
  "friends.title": "Friends",
  "friends.searchPlaceholder": "Search players…",
  "friends.yours": "Your friends",
  "friends.noneFound": "No players found.",
  "friends.empty": "You haven't added any friends yet. Use the scan button on court or search for players.",
  "friends.statusFriends": "Friends",
  "friends.statusRequested": "Requested",
  "friends.accept": "Accept",
  "friends.request": "Add",
  "friends.nowFriends": "You're friends now!",
  "friends.requestFailed": "Couldn't send the request.",
  "friends.acceptFailed": "Couldn't accept the request.",
  "friends.declineFailed": "Couldn't decline the request.",
  "friends.follow": "Follow",
  "friends.unfollow": "Unfollow",
  "friends.unfollowConfirmTitle": "Unfollow?",
  "friends.unfollowConfirmBody": "You'll no longer be friends.",
  "friends.unfollowFailed": "Couldn't end the friendship.",

  // ── ranking ───────────────────────────────────────────────────────────────
  "ranking.title": "Ranking",
  "ranking.searchPlaceholder": "Search…",
  "ranking.summary": "{n} players | avg {avg}",
  "ranking.you": "(you)",
  "ranking.rowSub": "{matches} matches | {pct} % wins",
  "ranking.loadMore": "Load more players",
  "ranking.noneFound": "No players found.",

  // ── profile ───────────────────────────────────────────────────────────────
  "profile.strengthTitle": "Rating history",
  "profile.last20": "last 30 days",
  "profile.topPartners": "Top 3 partners",
  "profile.recentMatches": "Recent matches",
  "profile.noMatches": "No matches yet.",
  "profile.rankLabel": "Position",
  "profile.rankOfSingles": "of {total} in the singles ranking",
  "profile.rankOfDoubles": "of {total} in the doubles ranking",
  "profile.activityTitle": "Activity",
  "profile.setsWonTitle": "Sets won",
  "profile.setsLostTitle": "Sets lost",

  // ── edit profile ──────────────────────────────────────────────────────────
  "profile.edit.title": "Edit profile",
  "profile.edit.uploading": "Uploading…",
  "profile.edit.changePhoto": "Change photo",
  "profile.edit.camera": "Camera",
  "profile.edit.library": "Photo library",
  "profile.edit.uploadFailed": "Couldn't upload the photo.",
  "profile.edit.saveFailed": "Couldn't save your profile.",

  // ── settings ──────────────────────────────────────────────────────────────
  "settings.title": "Settings",
  "settings.groupAccount": "Account",
  "settings.editProfile": "Edit profile",
  "settings.email": "Email address",
  "settings.changePassword": "Change password",
  "settings.groupNotifications": "Notifications",
  "settings.push": "Push notifications",
  "settings.pushDisableHint": "You can turn push notifications off in your system settings.",
  "settings.pushEnableHint": "You can turn push notifications on in your system settings.",
  "settings.groupLanguage": "Language",
  "settings.language": "App language",
  "settings.groupLegal": "Legal",
  "settings.terms": "Terms of Use",
  "settings.privacy": "Privacy",
  "settings.help": "Help & support",
  "settings.signOut": "Sign out",
  "settings.deleteAccount": "Delete account",
  "settings.deleteTitle": "Delete account?",
  "settings.deleteBody": "Are you sure you want to permanently delete your account? This cannot be undone.",
  "settings.deleteConfirm": "Delete permanently",
  "settings.deleteFailed": "Couldn't delete your account. Please try again.",

  // ── language picker ───────────────────────────────────────────────────────
  "language.system": "System language",
  "language.de": "Deutsch",
  "language.en": "English",

  // ── match setup ───────────────────────────────────────────────────────────
  "matchSetup.newSingles": "New singles",
  "matchSetup.newDoubles": "New doubles",
  "matchSetup.slotYou": "You",
  "matchSetup.slotPartner": "Partner",
  "matchSetup.slotOpponent": "Opponent",
  "matchSetup.slotOpponent1": "Opponent 1",
  "matchSetup.slotOpponent2": "Opponent 2",
  "matchSetup.searchFriends": "Search friends…",
  "matchSetup.noFriendsFound": "No friends found.",
  "matchSetup.allLinedUp": "All your friends are lined up.\nRemove someone or scan new players.",
  "matchSetup.scan": "Scan",
  "matchSetup.continue": "Continue to score",
  "matchSetup.startFailed": "Couldn't start the match.",

  // ── match entry ───────────────────────────────────────────────────────────
  "matchEntry.title": "Enter score",
  "matchEntry.addSet": "Set",
  "matchEntry.save": "Finish and save",

  // ── scan ──────────────────────────────────────────────────────────────────
  "scan.title": "Scan player",
  "scan.aim": "Point at a QR code",
  "scan.noAccess": "No camera access. Allow access in your settings to scan QR codes.",
  "scan.openSettings": "Open settings",
  "scan.tapToAllow": "Tap to allow camera access.",
  "scan.added": "{names} added",
  "scan.nobody": "Nobody scanned yet",
  "scan.yourCode": "Your code",
  "scan.yourCodeHint": "Let others scan you to add you to their match.",
  "scan.ownCode": "That's your own code.",
  "scan.alreadyIn": "That player is already in the match.",
  "scan.maxPlayers": "Maximum number of players reached.",
  "scan.notFound": "Player not found.",
  "scan.unreadable": "Couldn't read that code.",

  // ── notifications ─────────────────────────────────────────────────────────
  "notifications.title": "Notifications",
  "notifications.empty": "No notifications yet.",
  "notifications.friend_request": "wants to be your friend.",
  "notifications.friend_accepted": "accepted your friend request.",
  "notifications.comment": "commented on your match.",
  "notifications.reaction": "reacted to your match.",
  "notifications.match_result": "logged a match result.",
  "notifications.new_match": "logged a new match with one of your friends.",
  "notifications.live_started": "started a live match with you.",
  "notifications.live_cancelled": "cancelled the live match with you without a result.",

  // ── device push ───────────────────────────────────────────────────────────
  "push.friend_request.title": "New friend request",
  "push.friend_request.body": "{name} wants to connect with you.",
  "push.friend_accepted.title": "Friend request accepted",
  "push.friend_accepted.body": "{name} accepted your request.",
  "push.comment.title": "New comment",
  "push.comment.body": "{name} commented on your match.",
  "push.reaction.title": "New reaction",
  "push.reaction.body": "{name} reacted to your match.",
  "push.match_result.title": "Match result",
  "push.match_result.body": "{name} logged a match result.",
  "push.new_match.title": "New match",
  "push.new_match.body": "{name} logged a new match with one of your friends.",
  "push.live_started.title": "Live match started",
  "push.live_started.body": "{name} started a live match with you.",
  "push.live_cancelled.title": "Live match cancelled",
  "push.live_cancelled.body": "{name} cancelled the live match with you without a result.",

  // ── match detail ──────────────────────────────────────────────────────────
  "match.title": "Match",
  "match.stats": "Stats",
  "match.strengthLast10": "Rating history · last 30 days",
  "match.balanceNormalized": "Record · normalised to 100 %",
  "match.comments": "Comments",
  "match.noComments": "No comments yet — be the first to write one.",
  "match.commentPlaceholder": "Add a comment …",
  "match.commentFailed": "Couldn't post your comment.",
  "match.delete": "Delete match",
  "match.deleteTitle": "Delete match?",
  "match.deleteBody": "Are you sure you want to permanently delete this match? This cannot be undone.",
  "match.deleteConfirm": "Delete permanently",
  "match.deleteFailed": "Couldn't delete the match.",

  // ── team lounge ───────────────────────────────────────────────────────────
  "team.title": "Team",
  "team.namePlaceholder": "Team name",
  "team.strength": "Team rating",
  "team.locked": "Team profile still locked",
  "team.lockedHint_one": "Play {n} more doubles match together to unlock team name, history and stats.",
  "team.lockedHint_other": "Play {n} more doubles matches together to unlock team name, history and stats.",
  "team.together": "Together",
  "team.togetherSub": "doubles",
  "team.wins": "Wins",
  "team.winsSub": "{pct}% win rate",
  "team.streak": "Streak",
  "team.streakSub": "in a row",
  "team.games": "Games",
  "team.gamesSub": "ratio",
  "team.players": "Players",

  // ── auth / network errors ─────────────────────────────────────────────────
  "error.INVALID_EMAIL_OR_PASSWORD": "Email or password is incorrect.",
  "error.INVALID_EMAIL": "Please enter a valid email address.",
  "error.INVALID_PASSWORD": "That password is invalid.",
  "error.PASSWORD_TOO_SHORT": "Your password must be at least 8 characters.",
  "error.PASSWORD_TOO_LONG": "That password is too long.",
  "error.USER_ALREADY_EXISTS": "An account already exists for this email.",
  "error.USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL": "An account already exists for this email. Please sign in instead.",
  "error.USER_NOT_FOUND": "Email or password is incorrect.",
  "error.EMAIL_NOT_VERIFIED": "Please confirm your email address first.",
  "error.FAILED_TO_CREATE_USER": "Couldn't create your account. Please try again.",
  "error.network": "No connection to the server. Please check your internet connection and try again.",
  "error.rateLimit": "Too many attempts. Please wait a moment and try again.",
  "error.server": "The server is unavailable right now. Please try again later.",

  // ── forced update ─────────────────────────────────────────────────────────
  "update.title": "Update required",
  "update.body": "This version of Tennys is no longer supported. Please update the app from the App Store or Google Play.",

  // ── legal: terms ──────────────────────────────────────────────────────────
  // NOTE: English legal copy is a translation of the binding German original
  // and has not been reviewed by counsel. Have a lawyer review before shipping.
  "legal.updated": "Last updated: 29 October 2026",
  "legal.terms.title": "Terms of Use",
  "legal.terms.scope.title": "Scope",
  "legal.terms.scope.body":
    'These Terms of Use govern the use of the tennys app ("tennys", "we", "us") by registered and unregistered users. tennys is operated by Jeners Consulting GmbH. By creating an account or using the app you agree to these terms.',
  "legal.terms.usage.title": "Using the app",
  "legal.terms.usage.body":
    "tennys is for recording and managing tennis matches, building a network of players, and displaying rankings and match statistics. You agree to use the app only for these purposes and in accordance with applicable law. Match results and profile data you enter must be truthful. Misuse — in particular creating false profiles or manipulating match results — may lead to suspension of your account.",
  "legal.terms.liability.title": "Liability",
  "legal.terms.liability.body":
    'The app is provided "as is". Jeners Consulting GmbH gives no warranty for uninterrupted availability of the app, for the accuracy of calculated rankings and ratings, or for content submitted by users. Liability for indirect damages or lost profit is excluded to the extent permitted by law.',
  "legal.terms.changes.title": "Changes to these terms",
  "legal.terms.changes.body":
    "We may adapt these Terms of Use where necessary, for example for new features or changed legal requirements. We will inform you of material changes in good time within the app. Continued use after the changes take effect constitutes acceptance.",
  "legal.terms.contact.title": "Contact",
  "legal.terms.contact.body":
    "Please direct questions about these Terms of Use to hallo@tennys.app.\nJeners Consulting GmbH, Spitzwegstr. 10, 42579 Heiligenhaus, Germany",

  // ── legal: privacy ────────────────────────────────────────────────────────
  "legal.privacy.title": "Privacy",
  "legal.privacy.controller.title": "Data controller",
  "legal.privacy.controller.body":
    "The controller for the processing of your personal data within the meaning of the GDPR is Jeners Consulting GmbH, Spitzwegstr. 10, 42579 Heiligenhaus, Germany. For privacy questions you can reach us at hallo@tennys.app.",
  "legal.privacy.data.title": "Data we collect",
  "legal.privacy.data.body":
    "We process: account data (email address, sign-in method and, when signing in with Apple or Google, the identifier they provide), profile data (display name, username, gender, playing hand, skill level, city, profile picture, club), match data (results, partners and opponents, timestamps, calculated ratings), social content (friendships, posts, comments, reactions) and technical data (your device's push token, language setting, time of last use). We use no advertising or analytics trackers and do not sell data.",
  "legal.privacy.purpose.title": "Purpose of processing",
  "legal.privacy.purpose.body":
    "Your data is processed to provide and operate the app, display your profile and match history, calculate rankings and ratings, connect you with other users, and notify you about relevant activity (e.g. friend requests, comments). The legal basis is performance of the user contract (Art. 6(1)(b) GDPR) and, where required, your consent (Art. 6(1)(a) GDPR).",
  "legal.privacy.permissions.title": "Device permissions",
  "legal.privacy.permissions.body":
    "The app only asks for access when needed: camera to scan QR codes (no images are stored), photos to set a profile picture (only the selected image is uploaded) and notifications for push messages. You can revoke any permission at any time in your system settings.",
  "legal.privacy.recipients.title": "Service providers and transfers outside the EU",
  "legal.privacy.recipients.body":
    "We use the following processors: Convex, Inc. (USA) for database and servers, 650 Industries, Inc. / Expo (USA) for push notifications and app updates, Vercel Inc. (USA) for hosting the website. Push messages are delivered via Apple (APNs) or Google (FCM). If you sign in with Apple or Google, their privacy policies apply as well. Transfers to the USA are based on the EU-US Data Privacy Framework or the EU Standard Contractual Clauses.",
  "legal.privacy.rights.title": "Retention and your rights",
  "legal.privacy.rights.body":
    "We store your data for as long as your account exists. You can delete your account at any time in the app under Profile → Settings; your profile is then deleted or anonymised (\"Deleted player\") so that shared matches of other users remain intact. You have the right to access, rectification, erasure, restriction of processing, data portability and objection, and the right to lodge a complaint with a data protection supervisory authority, e.g. the LDI NRW.",
  "legal.privacy.contact.title": "Contact",
  "legal.privacy.contact.body":
    "For requests about your data or to exercise your rights, contact hallo@tennys.app.\nJeners Consulting GmbH, Spitzwegstr. 10, 42579 Heiligenhaus, Germany",
};

export const LOCALES: Record<LocaleCode, Record<string, string>> = { de, en };

// Privacy policy section keys in display order (`legal.privacy.<key>.title` /
// `.body`). Shared by the app screen and the website's /datenschutz page.
export const PRIVACY_SECTIONS = ["controller", "data", "purpose", "permissions", "recipients", "rights", "contact"] as const;
