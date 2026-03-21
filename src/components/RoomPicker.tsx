"use client";

import { useState, useRef } from "react";
import type { FamilyMember } from "@/types";

interface RoomPickerProps {
  members: FamilyMember[];
}

const CARD_COLORS = [
  "bg-sky-400",
  "bg-amber-400",
  "bg-rose-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-orange-400",
  "bg-pink-400",
  "bg-teal-400",
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const MOVE_MS = 780;
const MOVE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const STEP_PAUSE_MS = MOVE_MS + 50;

const DEAL_MOVE_MS = 580;
const DEAL_EASE = "cubic-bezier(0.25, 0.85, 0.35, 1)";
const DEAL_STAGGER_MS = 480;

interface CardState {
  member: FamilyMember;
  colorIndex: number;
  x: number;
  y: number;
  rotate: number;
  zIndex: number;
  faceDown: boolean;
  dealt: boolean;
  dealOrder: number;
}

export function RoomPicker({ members }: RoomPickerProps) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "shuffling" | "done">("idle");
  const [cards, setCards] = useState<CardState[]>([]);
  const isRunning = useRef(false);

  const accepted = members.filter((m) => m.status === "accepted");
  const total = accepted.length;

  function makeStack(order: FamilyMember[]): CardState[] {
    return order.map((member, i) => ({
      member,
      colorIndex: i % CARD_COLORS.length,
      x: (Math.random() - 0.5) * 5,
      y: -(total - 1 - i) * 2,
      rotate: (Math.random() - 0.5) * 5,
      zIndex: i,
      faceDown: true,
      dealt: false,
      dealOrder: -1,
    }));
  }

  function makeScatter(order: FamilyMember[]): CardState[] {
    return order.map((member, i) => ({
      member,
      colorIndex: i % CARD_COLORS.length,
      x: (Math.random() - 0.5) * 150,
      y: (Math.random() - 0.5) * 52,
      rotate: (Math.random() - 0.5) * 28,
      zIndex: i,
      faceDown: true,
      dealt: false,
      dealOrder: -1,
    }));
  }

  function dealtPosition(index: number) {
    const cols = Math.min(total, 4);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const spacing = Math.min(88, 300 / cols);
    const startX = (-(Math.min(total, cols) - 1) * spacing) / 2;
    return { x: startX + col * spacing, y: row * 118 + 50 };
  }

  async function startShuffle() {
    if (isRunning.current) return;
    isRunning.current = true;
    setPhase("shuffling");

    let order = shuffleArray(accepted);

    setCards(makeStack(order));
    await sleep(STEP_PAUSE_MS);

    order = shuffleArray(order);
    setCards(makeScatter(order));
    await sleep(STEP_PAUSE_MS);

    order = shuffleArray(order);
    setCards(makeStack(order));
    await sleep(STEP_PAUSE_MS);

    order = shuffleArray(order);
    setCards(makeScatter(order));
    await sleep(STEP_PAUSE_MS);

    order = shuffleArray(order);
    setCards(makeStack(order));
    await sleep(STEP_PAUSE_MS);

    for (let i = 0; i < total; i++) {
      await sleep(DEAL_STAGGER_MS);
      const pos = dealtPosition(i);
      const topIdx = total - 1 - i;
      setCards((prev) =>
        prev.map((c, ci) =>
          ci === topIdx
            ? {
                ...c,
                x: pos.x,
                y: pos.y,
                rotate: (Math.random() - 0.5) * 2,
                zIndex: 20 + i,
                faceDown: false,
                dealt: true,
                dealOrder: i,
              }
            : c
        )
      );
    }

    setPhase("done");
    isRunning.current = false;
  }

  function close() {
    isRunning.current = false;
    setOpen(false);
    setPhase("idle");
    setCards([]);
  }

  const rows = Math.ceil(total / Math.min(total, 4));
  const cardAreaHeight = phase === "done" ? 60 + rows * 120 : 160;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-sm">
        🃏 Pick rooms
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">🃏 Room pick order</h3>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
                ✕
              </button>
            </div>

            {accepted.length === 0 ? (
              <p className="text-sm text-slate-500">No accepted members yet — invite people first!</p>
            ) : (
              <>
                <div
                  className="relative flex items-center justify-center overflow-visible"
                  style={{ height: cardAreaHeight, transition: "height 0.6s ease" }}
                >
                  {phase === "idle" && (
                    <div className="flex gap-3">
                      {accepted.map((_, i) => (
                        <div
                          key={i}
                          className="h-28 w-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-100"
                        />
                      ))}
                    </div>
                  )}

                  {cards.map((card, i) => (
                    <div
                      key={card.member.id + "-" + i}
                      className={
                        "absolute flex h-28 w-20 select-none flex-col items-center justify-center gap-1 rounded-2xl px-2 text-center text-xs font-bold leading-tight shadow-lg will-change-transform " +
                        (card.faceDown ? "bg-slate-700" : CARD_COLORS[card.colorIndex] + " text-white")
                      }
                      style={{
                        transform: `translate3d(${card.x}px, ${card.y}px, 0) rotate(${card.rotate}deg)`,
                        zIndex: card.zIndex,
                        backfaceVisibility: "hidden",
                        transition:
                          phase === "shuffling"
                            ? `transform ${MOVE_MS}ms ${MOVE_EASE}, background-color 0.35s ease`
                            : `transform ${DEAL_MOVE_MS}ms ${DEAL_EASE}, background-color 0.35s ease`,
                      }}
                    >
                      {card.faceDown ? (
                        <span className="text-xl text-slate-500">🂠</span>
                      ) : (
                        <>
                          {card.dealOrder === 0 && <span className="text-lg">🥇</span>}
                          <span>{card.member.name}</span>
                          {card.dealt && (
                            <span className="text-[10px] text-white/70">
                              {card.dealOrder === 0 ? "picks first" : "picks #" + (card.dealOrder + 1)}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {phase === "done" && (
                  <p className="text-center text-xs text-slate-400">🥇 picks first · left to right order</p>
                )}

                <button
                  type="button"
                  onClick={startShuffle}
                  disabled={phase === "shuffling"}
                  className="btn-primary w-full py-3"
                >
                  {phase === "shuffling" ? "🃏 Shuffling..." : phase === "done" ? "🃏 Re-shuffle!" : "🃏 Shuffle & deal"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
