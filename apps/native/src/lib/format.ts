import { colors } from '@/theme/tokens';
import type { LocaleCode, TFunction } from '@/lib/i18n';

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Fixed left-to-right order; "my score : opponent score" so 6:0 is the most
// dominant win and 0:6 the most lopsided loss. Used by the profile's set-score bars.
export const WON_SET_ORDER = ['6:0', '6:1', '6:2', '6:3', '6:4', '7:5', '7:6'];
export const LOST_SET_ORDER = ['0:6', '1:6', '2:6', '3:6', '4:6', '5:7', '6:7'];

export function setScoreBars(counts: Record<string, number> | undefined, order: string[]): { score: string; pct: number }[] {
  const total = Object.values(counts ?? {}).reduce((a, b) => a + b, 0);
  return order.map((score) => ({ score, pct: total ? Math.round(((counts?.[score] ?? 0) / total) * 100) : 0 }));
}

// Relative up to 7 days back (PRD): "gerade eben" / "vor 10 Min." / "vor 3 Std."
// (today), "Heute", "Gestern", weekday — then a fixed date like "8. Jul.".
// Weekday and month names come from Intl rather than a hand-kept table, so they
// are correct in every locale for free.
export function matchDateLabel(ts: number, t: TFunction, locale: LocaleCode, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / 86400000);
  if (days === 0) {
    const mins = Math.floor((now - ts) / 60000);
    if (mins < 1) return t('date.justNow');
    if (mins < 60) return t('date.minutesAgo', { n: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 12) return t('date.hoursAgo', { n: hours });
    return t('date.today');
  }
  if (days === 1) return t('date.yesterday');
  if (days > 1 && days < 7) return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(ts);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(ts);
}

export function hourLabel(ts: number): string {
  return String(new Date(ts).getHours());
}

// Signed rating change as a localised percentage, e.g. "+1,9 %" / "+1.9%".
export function formatPctDelta(pct: number, locale: LocaleCode): string {
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

// sets from my perspective → "6–3, 6–4"
export function scoreLine(sets: { mine: number; theirs: number }[]): string {
  return sets.map((s) => `${s.mine}–${s.theirs}`).join(', ');
}

// 1122 → "1122" — points are shown WITHOUT thousands separators app-wide (PRD).
export function formatPoints(n: number): string {
  return String(Math.round(n));
}

// "Anna Berg" → "Anna B."
export function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// first name only, for team labels ("Anna & Lena")
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function skillLabel(skill: 'beginner' | 'intermediate' | 'pro' | null): string {
  if (skill === 'pro') return 'LK 6';
  if (skill === 'intermediate') return 'LK 12';
  if (skill === 'beginner') return 'LK 18';
  return 'LK –';
}

// Deterministic avatar colours from a stable id.
const PALETTE: { bg: string; fg: string }[] = [
  { bg: colors.courtGreen, fg: colors.lime },
  { bg: colors.red, fg: '#fff' },
  { bg: colors.purple, fg: '#fff' },
  { bg: colors.teal, fg: '#fff' },
  { bg: colors.redDark, fg: '#fff' },
];

export function avatarColors(id: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

type ApiPlayer = { profileId: string; initials: string; avatarUrl: string | null };
type ApiSide = { players: ApiPlayer[]; name: string; scores: number[]; won: boolean };

// Backend match side → MatchCard side (adds deterministic avatar colors).
export function toCardSide(side: ApiSide) {
  return {
    ...side,
    players: side.players.map((p) => ({ initials: p.initials, uri: p.avatarUrl, ...avatarColors(p.profileId) })),
  };
}
