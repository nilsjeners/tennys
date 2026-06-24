import { colors } from '@/theme/tokens';

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// "Heute" / "Gestern" / weekday / "17. Apr"
export function matchDateLabel(ts: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / 86400000);
  if (days === 0) return 'Heute';
  if (days === 1) return 'Gestern';
  if (days > 1 && days < 7) return WEEKDAYS[new Date(ts).getDay()];
  const d = new Date(ts);
  return `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

export function hourLabel(ts: number): string {
  return String(new Date(ts).getHours());
}

// sets from my perspective → "6–3, 6–4"
export function scoreLine(sets: { mine: number; theirs: number }[]): string {
  return sets.map((s) => `${s.mine}–${s.theirs}`).join(', ');
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
