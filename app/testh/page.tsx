"use client";

import type { TouchEvent, WheelEvent } from "react";
import { useMemo, useRef, useState } from "react";

type Winner = "A" | "B";

const BASE_SCORES = ["6:0", "6:1", "6:2", "6:3", "6:4", "7:5", "7:6"];
const MAX_SETS = 5;

function swapScore(score: string) {
  const [left, right] = score.split(":");
  return `${right}:${left}`;
}

export default function TestHPage() {
  const [winner, setWinner] = useState<Winner>("A");
  const [scoreIndex, setScoreIndex] = useState(0);
  const [sets, setSets] = useState<string[]>([]);
  const touchStartRef = useRef<number | null>(null);
  const lastScrollRef = useRef<number>(0);

  const displayedScore = useMemo(() => {
    const base = BASE_SCORES[scoreIndex];
    return winner === "A" ? base : swapScore(base);
  }, [scoreIndex, winner]);

  const handleScroll = (deltaX: number) => {
    const now = Date.now();
    if (now - lastScrollRef.current < 120) {
      return;
    }
    lastScrollRef.current = now;
    if (deltaX === 0) {
      return;
    }
    const nextWinner: Winner = deltaX < 0 ? "A" : "B";
    setWinner(nextWinner);
    setScoreIndex((prev) => (prev + 1) % BASE_SCORES.length);
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const primaryDelta =
      Math.abs(event.deltaX) >= Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    handleScroll(primaryDelta);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (touchStartRef.current === null) {
      return;
    }
    const current = event.touches[0]?.clientX ?? touchStartRef.current;
    const delta = touchStartRef.current - current;
    if (Math.abs(delta) < 24) {
      return;
    }
    handleScroll(delta);
    touchStartRef.current = current;
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const handleSaveSet = () => {
    if (sets.length >= MAX_SETS) {
      return;
    }
    setSets((prev) => [...prev, displayedScore]);
  };

  const handleRemoveLast = () => {
    setSets((prev) => prev.slice(0, -1));
  };

  return (
    <main className="min-h-screen">
      <div
        className="relative grid min-h-screen w-full grid-cols-2 overscroll-none touch-none"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <section className="flex items-center justify-center bg-gradient-to-br from-[#0c1220] to-[#111c31] text-base-100">
          <div className="flex flex-col items-center gap-2 uppercase tracking-[0.12em]">
            <span className="text-lg font-semibold">Spieler A</span>
            <span className="text-xs text-base-100/70">Wisch nach links</span>
          </div>
        </section>
        <section className="flex items-center justify-center bg-gradient-to-bl from-[#f97316] to-[#111c31] text-base-100">
          <div className="flex flex-col items-center gap-2 uppercase tracking-[0.12em]">
            <span className="text-lg font-semibold">Spieler B</span>
            <span className="text-xs text-base-100/70">Wisch nach rechts</span>
          </div>
        </section>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
          <div className="card pointer-events-auto w-full max-w-xs bg-base-100/90 shadow-soft">
            <div className="card-body items-center gap-2 text-center">
              <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                Satz {Math.min(sets.length + 1, MAX_SETS)} von {MAX_SETS}
              </span>
              <span className="font-condensed text-4xl text-base-content">
                {displayedScore}
              </span>
              <span className="text-sm text-ink-muted">
                {winner === "A" ? "Spieler A gewinnt" : "Spieler B gewinnt"}
              </span>
            </div>
          </div>
          <div className="pointer-events-auto flex flex-wrap justify-center gap-3">
            <button
              className="btn btn-primary"
              onClick={handleSaveSet}
              disabled={sets.length >= MAX_SETS}
            >
              Satz speichern
            </button>
            <button
              className="btn btn-secondary btn-outline"
              onClick={handleRemoveLast}
              disabled={sets.length === 0}
            >
              Letzten Satz loeschen
            </button>
          </div>
        </div>

        <aside className="card pointer-events-none static mx-auto mt-6 w-[calc(100%-32px)] max-w-xs bg-[rgba(12,18,32,0.72)] text-base-100 shadow-soft backdrop-blur md:pointer-events-auto md:absolute md:bottom-6 md:right-6 md:mt-0 md:w-48">
          <div className="card-body gap-3 p-4">
            <span className="text-xs uppercase tracking-[0.2em]">Eingegebene Saetze</span>
            <div className="flex flex-col gap-2 text-sm">
              {sets.length === 0 && (
                <span className="text-base-100/70">
                  Noch keine Saetze gespeichert.
                </span>
              )}
              {sets.map((score, index) => (
                <div key={`${score}-${index}`} className="flex justify-between gap-4">
                  <span>Satz {index + 1}</span>
                  <span>{score}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
