"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type WinnerSide = "left" | "right" | null;

type SetScore = {
  left: number;
  right: number;
  winnerSide: WinnerSide;
  baseIndex: 0 | 1 | 2;
};

const EMPTY_SET: SetScore = {
  left: 0,
  right: 0,
  winnerSide: null,
  baseIndex: 0
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

const applyBaseScore = (side: "left" | "right", baseIndex: 1 | 2) => {
  if (side === "left") {
    return baseIndex === 1 ? { left: 6, right: 0 } : { left: 7, right: 5 };
  }
  return baseIndex === 1 ? { left: 0, right: 6 } : { left: 5, right: 7 };
};

const incrementOpponent = (set: SetScore, side: "left" | "right") => {
  if (set.winnerSide === "left" && side === "right") {
    if (set.left === 6 && set.right < 4) {
      return { ...set, right: set.right + 1 };
    }
    if (set.left === 6 && set.right === 4) {
      return { ...set, left: 7, right: 5, baseIndex: 2 };
    }
    if (set.left === 7 && set.right === 5) {
      return { ...set, right: 6, baseIndex: 2 };
    }
    if (set.left === 7 && set.right < 5) {
      return { ...set, right: set.right + 1, baseIndex: 2 };
    }
  }

  if (set.winnerSide === "right" && side === "left") {
    if (set.right === 6 && set.left < 4) {
      return { ...set, left: set.left + 1 };
    }
    if (set.right === 6 && set.left === 4) {
      return { ...set, left: 5, right: 7, baseIndex: 2 };
    }
    if (set.right === 7 && set.left === 5) {
      return { ...set, left: 6, baseIndex: 2 };
    }
    if (set.right === 7 && set.left < 5) {
      return { ...set, left: set.left + 1, baseIndex: 2 };
    }
  }

  return set;
};

const asSetScore = (set: SetScore) => set;

const trashIcon = (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 12a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9l1-12"
    />
  </svg>
);

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

export default function MatchCreatePage() {
  const router = useRouter();
  const [isDoubles, setIsDoubles] = useState(false);
  const [sets, setSets] = useState<SetScore[]>([EMPTY_SET]);
  const [activeSetIndex, setActiveSetIndex] = useState(0);

  const scoreLine = (set: SetScore) => `${set.left}:${set.right}`;

  const handleSideClick = (side: "left" | "right") => {
    setSets((prev) =>
      prev.map((set, idx) => {
        if (idx !== activeSetIndex) {
          return set;
        }

        if (set.winnerSide === null) {
          return asSetScore({
            ...set,
            ...applyBaseScore(side, 1),
            winnerSide: side,
            baseIndex: 1
          });
        }

        if (set.winnerSide === side) {
          if (set.baseIndex === 1) {
            return asSetScore({
              ...set,
              ...applyBaseScore(side, 2),
              baseIndex: 2
            });
          }
          if (set.baseIndex === 2) {
            return { ...EMPTY_SET };
          }
          return asSetScore({
            ...set,
            ...applyBaseScore(side, 1),
            baseIndex: 1
          });
        }

        return incrementOpponent(set, side);
      })
    );
  };

  const addSet = () => {
    setSets((prev) => {
      if (prev.length >= 7) {
        return prev;
      }
      const next = [...prev, EMPTY_SET];
      setActiveSetIndex(next.length - 1);
      return next;
    });
  };

  const removeSet = (index: number) => {
    setSets((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      const safeNext = next.length > 0 ? next : [EMPTY_SET];
      setActiveSetIndex((current) => {
        if (index === current) {
          return Math.max(0, Math.min(index - 1, safeNext.length - 1));
        }
        if (index < current) {
          return Math.max(0, current - 1);
        }
        return current;
      });
      return safeNext;
    });
  };

  const handleFinish = () => {
    const payload = encodeURIComponent(JSON.stringify(sets));
    router.push(`/wizard/match/result?doubles=${isDoubles ? "1" : "0"}&sets=${payload}`);
  };

  const setCards = useMemo(
    () =>
      sets.map((set, index) => {
        const isActive = index === activeSetIndex;

        return (
          <section
            key={`set-${index}`}
            className="relative rounded-brand border border-base-300/70 bg-base-100/90"
          >
            <div className="pointer-events-none absolute inset-x-2 top-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-base-content/60">
                SATZ {index + 1}
              </span>
              <button
                type="button"
                className="pointer-events-auto btn btn-ghost btn-xs"
                onClick={() => removeSet(index)}
                aria-label={`Satz ${index + 1} loeschen`}
              >
                {trashIcon}
              </button>
            </div>
            <button
              type="button"
              className={`w-full rounded-brand px-2 py-3 text-center text-3xl font-semibold tabular-nums transition ${
                isActive ? "text-base-content" : "text-base-content/70"
              }`}
              onClick={() => setActiveSetIndex(index)}
            >
              {scoreLine(set)}
            </button>
          </section>
        );
      }),
    [activeSetIndex, sets]
  );

  return (
    <main className="min-h-screen bg-base-100 px-6 py-10 text-base-content">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold uppercase tracking-[0.18em]">
            Match erfassen
          </h1>

          <div className="relative inline-flex w-fit items-center rounded-full border border-base-300 bg-base-200/70 p-1">
            <span
              className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-gradient-to-r from-brand-cyan to-accent bg-[length:200%_100%] transition-[transform,background-position] duration-300 ${
                isDoubles ? "translate-x-full bg-right" : "translate-x-0 bg-left"
              }`}
              aria-hidden="true"
            />
            <button
              type="button"
              className={`relative z-10 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                !isDoubles ? "text-neutral-content" : "text-base-content/70"
              }`}
              onClick={() => setIsDoubles(false)}
            >
              Einzel
            </button>
            <button
              type="button"
              className={`relative z-10 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                isDoubles ? "text-neutral-content" : "text-base-content/70"
              }`}
              onClick={() => setIsDoubles(true)}
            >
              Doppel
            </button>
          </div>
        </header>

        <section className="rounded-brand border border-base-300 bg-base-200/60 p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSideClick("left")}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-brand border px-2 py-3 text-center transition hover:border-brand-cyan/60 hover:bg-brand-cyan/15 ${teamStyles.left.frame}`}
            >
              <TeamAvatars side="left" isDoubles={isDoubles} />
            </button>

            <button
              type="button"
              onClick={() => handleSideClick("right")}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-brand border px-2 py-3 text-center transition hover:border-accent/60 hover:bg-accent/15 ${teamStyles.right.frame}`}
            >
              <TeamAvatars side="right" isDoubles={isDoubles} />
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            {setCards}
            <button
              type="button"
              className="w-full rounded-brand border border-dashed border-base-300/80 bg-base-100/70 px-2 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-base-content/70 transition hover:border-base-400 hover:text-base-content"
              onClick={addSet}
              disabled={sets.length >= 7}
            >
              + Nächster Satz
            </button>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="button" className="btn btn-primary" onClick={handleFinish}>
            Fertig
          </button>
        </div>
      </div>
    </main>
  );
}
