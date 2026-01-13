"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

type SetScore = {
  left: number;
  right: number;
};

const teamStyles = {
  left: {
    frame: "border-brand-cyan/30 bg-brand-cyan/10",
    primary: "bg-brand-cyan text-neutral-content",
    secondary: "bg-brand-cyan/50 text-neutral-content"
  },
  right: {
    frame: "border-accent/30 bg-accent/10",
    primary: "bg-accent text-neutral-content",
    secondary: "bg-accent/50 text-neutral-content"
  }
} as const;

const TeamAvatars = ({
  side,
  isDoubles
}: {
  side: "left" | "right";
  isDoubles: boolean;
}) => {
  const { primary, secondary } = teamStyles[side];

  if (!isDoubles) {
    return (
      <div className="flex h-12 items-center justify-center">
        <div className="avatar placeholder">
          <div className={`h-12 w-12 rounded-full ring-4 ring-base-100 ${primary}`}>
            <span className="text-sm font-semibold">A</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-12 items-center justify-center">
      <div className="avatar-group -space-x-3">
        <div className="avatar placeholder">
          <div className={`h-12 w-12 rounded-full ring-4 ring-base-100 ${primary}`}>
            <span className="text-sm font-semibold">A</span>
          </div>
        </div>
        <div className="avatar placeholder">
          <div className={`h-12 w-12 rounded-full ring-4 ring-base-100 ${secondary}`}>
            <span className="text-sm font-semibold">B</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const parseSets = (raw: string | null): SetScore[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as SetScore[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((set) => ({
        left: Number(set.left ?? 0),
        right: Number(set.right ?? 0)
      }))
      .filter((set) => Number.isFinite(set.left) && Number.isFinite(set.right));
  } catch {
    return [];
  }
};

export default function MatchResultPage() {
  const searchParams = useSearchParams();
  const isDoubles = searchParams.get("doubles") === "1";
  const sets = useMemo(() => parseSets(searchParams.get("sets")), [searchParams]);

  const { leftGames, rightGames } = useMemo(() => {
    return sets.reduce(
      (acc, set) => {
        acc.leftGames += set.left;
        acc.rightGames += set.right;
        return acc;
      },
      { leftGames: 0, rightGames: 0 }
    );
  }, [sets]);

  const totalGames = leftGames + rightGames;
  const playerStrengthA =
    totalGames > 0 ? Math.round(1000 * (leftGames / totalGames) + 500) : 500;
  const playerStrengthB =
    totalGames > 0 ? Math.round(1000 * (rightGames / totalGames) + 500) : 500;

  const setCards = useMemo(
    () =>
      sets.map((set, index) => (
        <section
          key={`result-set-${index}`}
          className={`relative rounded-brand border ${
            set.left > set.right
              ? "border-brand-cyan/40 bg-brand-cyan/10"
              : set.right > set.left
                ? "border-accent/40 bg-accent/10"
                : "border-base-300/70 bg-base-100/90"
          }`}
        >
          <div className="pointer-events-none absolute inset-x-2 top-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-base-content/60">
              SATZ {index + 1}
            </span>
          </div>
          <div className="w-full rounded-brand px-2 py-3 text-center text-3xl font-semibold tabular-nums text-base-content">
            {set.left}:{set.right}
          </div>
        </section>
      )),
    [sets]
  );

  return (
    <main className="min-h-screen bg-base-100 px-6 py-10 text-base-content">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold uppercase tracking-[0.18em]">
            Match Ergebnis
          </h1>
        </header>

        <section className="rounded-brand border border-base-300 bg-base-200/60 p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-brand border px-2 py-3 text-center ${teamStyles.left.frame}`}
            >
              <TeamAvatars side="left" isDoubles={isDoubles} />
              {!isDoubles ? (
                <div className="text-sm text-base-content/70">
                  {playerStrengthA} Punkte
                </div>
              ) : (
                <div className="text-xs text-base-content/50">Punkte folgen</div>
              )}
              <div className="flex items-center gap-2">
                {sets.map((set, index) => {
                  const isWin = set.left > set.right;
                  return (
                    <span
                      key={`left-dot-${index}`}
                      className={`h-2 w-2 rounded-full border ${
                        isWin
                          ? "border-brand-cyan bg-brand-cyan"
                          : "border-base-content/40 bg-transparent"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            <div
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-brand border px-2 py-3 text-center ${teamStyles.right.frame}`}
            >
              <TeamAvatars side="right" isDoubles={isDoubles} />
              {!isDoubles ? (
                <div className="text-sm text-base-content/70">
                  {playerStrengthB} Punkte
                </div>
              ) : (
                <div className="text-xs text-base-content/50">Punkte folgen</div>
              )}
              <div className="flex items-center gap-2">
                {sets.map((set, index) => {
                  const isWin = set.right > set.left;
                  return (
                    <span
                      key={`right-dot-${index}`}
                      className={`h-2 w-2 rounded-full border ${
                        isWin
                          ? "border-accent bg-accent"
                          : "border-base-content/40 bg-transparent"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
              Ergebnis
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {sets.length === 0 ? (
                <div className="text-sm text-base-content/60">Keine Saetze vorhanden.</div>
              ) : (
                setCards
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
