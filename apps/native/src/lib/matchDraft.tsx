import { createContext, useContext, useMemo, useState } from 'react';

export type DraftPlayer = { profileId: string; name: string; initials: string; avatarUrl: string | null; points: number };
export type MatchMode = 'Einzel' | 'Doppel';
// A team seat: the signed-in user ('me'), an added player, or empty.
export type SlotValue = DraftPlayer | 'me' | null;

type Ctx = {
  mode: MatchMode;
  // Doppel: [myTeamSeat0, myTeamSeat1, oppTeamSeat0, oppTeamSeat1]. Einzel: [mySeat, oppSeat].
  // Exactly one slot always holds 'me' — it can move (drag-and-drop) but never disappears.
  slots: SlotValue[];
  // The live match row created once score entry starts (null before/after).
  matchId: string | null;
  setMode: (m: MatchMode) => void;
  addPlayer: (p: DraftPlayer) => void;
  removePlayer: (id: string) => void;
  swapSlots: (a: number, b: number) => void;
  setMatchId: (id: string | null) => void;
  reset: () => void;
};

const MatchDraftContext = createContext<Ctx | null>(null);

function emptySlots(m: MatchMode): SlotValue[] {
  return m === 'Doppel' ? ['me', null, null, null] : ['me', null];
}

// Holds the in-progress match while the user moves setup → scan → entry.
export function MatchDraftProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<MatchMode>('Einzel');
  const [slots, setSlots] = useState<SlotValue[]>(emptySlots('Einzel'));
  const [matchId, setMatchId] = useState<string | null>(null);

  const value = useMemo<Ctx>(
    () => ({
      mode,
      slots,
      matchId,
      setMatchId,
      setMode: (m) => {
        setModeState(m);
        // rebuild for the new capacity, keeping already-added players and 'me' (position resets)
        setSlots((prev) => {
          const players = prev.filter((s): s is DraftPlayer => s !== null && s !== 'me');
          const next = emptySlots(m);
          for (const p of players) {
            const idx = next.findIndex((s) => s === null);
            if (idx === -1) break;
            next[idx] = p;
          }
          return next;
        });
      },
      addPlayer: (p) =>
        setSlots((prev) => {
          if (prev.some((s) => s !== null && s !== 'me' && s.profileId === p.profileId)) return prev;
          const idx = prev.findIndex((s) => s === null);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = p;
          return next;
        }),
      // leaves the vacated slot empty in place — the rest don't shift
      removePlayer: (id) => setSlots((prev) => prev.map((s) => (s !== null && s !== 'me' && s.profileId === id ? null : s))),
      swapSlots: (a, b) =>
        setSlots((prev) => {
          if (a === b || a < 0 || b < 0 || a >= prev.length || b >= prev.length) return prev;
          const next = [...prev];
          [next[a], next[b]] = [next[b], next[a]];
          return next;
        }),
      reset: () => {
        setModeState('Einzel');
        setSlots(emptySlots('Einzel'));
        setMatchId(null);
      },
    }),
    [mode, slots, matchId]
  );

  return <MatchDraftContext.Provider value={value}>{children}</MatchDraftContext.Provider>;
}

export function useMatchDraft(): Ctx {
  const ctx = useContext(MatchDraftContext);
  if (!ctx) throw new Error('useMatchDraft must be used within MatchDraftProvider');
  return ctx;
}
