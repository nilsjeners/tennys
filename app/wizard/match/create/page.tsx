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

const incrementOpponent = (set: SetScore, side: "left" | "right"): SetScore => {
  if (set.winnerSide === "left" && side === "right") {
    if (set.left === 6 && set.right < 4) {
      return asSetScore({ ...set, right: set.right + 1 });
    }
    if (set.left === 6 && set.right === 4) {
      return asSetScore({ ...set, left: 7, right: 5, baseIndex: 2 });
    }
    if (set.left === 7 && set.right === 5) {
      return asSetScore({ ...set, right: 6, baseIndex: 2 });
    }
    if (set.left === 7 && set.right < 5) {
      return asSetScore({ ...set, right: set.right + 1, baseIndex: 2 });
    }
  }

  if (set.winnerSide === "right" && side === "left") {
    if (set.right === 6 && set.left < 4) {
      return asSetScore({ ...set, left: set.left + 1 });
    }
    if (set.right === 6 && set.left === 4) {
      return asSetScore({ ...set, left: 5, right: 7, baseIndex: 2 });
    }
    if (set.right === 7 && set.left === 5) {
      return asSetScore({ ...set, left: 6, baseIndex: 2 });
    }
    if (set.right === 7 && set.left < 5) {
      return asSetScore({ ...set, left: set.left + 1, baseIndex: 2 });
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
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

const userIcon = (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
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

  return (
    <div className="flex h-12 items-center justify-center">
      <div className="relative flex h-12 w-24 items-center justify-center">
        <div
          className={`absolute transition-all duration-300 ease-out ${
            isDoubles ? "scale-75 -translate-x-2 opacity-0" : "scale-100 opacity-100"
          }`}
        >
          <div className="avatar placeholder">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-base-100 ${primary}`}
            >
              {userIcon}
            </div>
          </div>
        </div>
        <div
          className={`absolute flex items-center gap-2 transition-all duration-300 ease-out ${
            isDoubles ? "scale-100 opacity-100" : "scale-75 translate-x-2 opacity-0"
          }`}
        >
          <div className="avatar placeholder">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-base-100 ${primary}`}
            >
              {userIcon}
            </div>
          </div>
          <div className="avatar placeholder">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ring-4 ring-base-100 ${secondary}`}
            >
              {userIcon}
            </div>
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
      prev.map((set, idx): SetScore => {
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
