"use client";
import { useState, useRef, useEffect } from "react";
import type { FamilyMember } from "@/types";

interface RoomPickerProps {
  members: FamilyMember[];
}

const CARD_COLORS = [
  "bg-sky-400", "bg-amber-400", "bg-rose-400", "bg-violet-400",
  "bg-emerald-400", "bg-orange-400", "bg-pink-400", "bg-teal-400",
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

interface CardState {
  id: string;
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

  function makeCards(memberList: FamilyMember[], faceDown = true): CardState[] {
    return memberList.map((member, i) => ({
      id: member.id,
      member,
      colorIndex: i % CARD_COLORS.length,
      x: (Math.random() - 0.5) * 4,
      y: -(total - 1 - i) * 2,
      rotate: (Math.random() - 0.5) * 4,
      zIndex: i,
      faceDown,
      dealt: false,
      dealOrder: -1,
    }));
  }

  function dealtPosition(index: number) {
    const cols = Math.min(total, 4);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const spacing = Math.min(88, 300 / cols);
    const startX = -(Math.min(total, cols) - 1) * spacing / 2;
    return { x: startX + col * spacing, y: row * 118 + 50 };
  }

  async function startShuffle() {
    if (isRunning.current) return;
    isRunning.current = true;
    setPhase("shuffling");

    let order = shuffleArray(accepted);

    // Step 1: Neat stack
    setCards(makeCards(order));
    await sleep(500);

    // Step 2: Fan face up
    setCards(order.map((member, i) => {
      const angle = (i - (total - 1) / 2) * Math.min(18, 80 / total);
      const radius = Math.min(70, 28 + total * 7);
      return {
        id: member.id,
        member,
        colorIndex: i % CARD_COLORS.length,
        x: Math.sin((angle * Math.PI) / 180) * radius,
        y: -Math.abs(Math.sin((angle * Math.PI) / 180)) * 10,
        rotate: angle,
        zIndex: i,
        faceDown: false,
        dealt: false,
        dealOrder: -1,
      };
    }));
    await sleep(750);

    // Step 3: Flip face down
    setCards((prev) => prev.map((c) => ({ ...c, faceDown: true })));
    await sleep(500);

    // Step 4: Two piles
    const half = Math.ceil(total / 2);
    setCards(order.map((member, i) => ({
      id: member.id,
      member,
      colorIndex: i % CARD_COLORS.length,
      x: i < half ? -48 : 48,
      y: -(i < half ? i : i - half) * 2.5,
      rotate: (i < half ? -4 : 4) + (Math.random() - 0.5) * 2,
      zIndex: i < half ? i : i - half,
      faceDown: true,
      dealt: false,
      dealOrder: -1,
    })));
    await sleep(700);

    // Step 5: Merge to new stack
    order = shuffleArray(order);
    setCards(makeCards(order));
    await sleep(700);

    // Step 6: Two piles again
    setCards(order.map((member, i) => ({
      id: member.id,
      member,
      colorIndex: i % CARD_COLORS.length,
      x: i < half ? -48 : 48,
      y: -(i < half ? i : i - half) * 2.5,
      rotate: (i < half ? -4 : 4) + (Math.random() - 0.5) * 2,
      zIndex: i < half ? i : i - half,
      faceDown: true,
      dealt: false,
      dealOrder: -1,
    })));
    await sleep(700);

    // Step 7: Final stack
    order = shuffleArray(order);
    setCards(makeCards(order));
    await sleep(700);

    // Step 8: Deal one by one to final positions
    for (let i = 0; i < total; i++) {
      await sleep(370);
      const pos = dealtPosition(i);
      const topIdx = total - 1 - i;
      setCards((prev) => prev.map((c, ci) =>
        ci === topIdx
          ? { ...c, x: pos.x, y: pos.y, rotate: (Math.random() - 0.5) * 2, zIndex: 20 + i, faceDown: false, dealt: true, dealOrder: i }
          : c
      ));
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
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">🃏 Room pick order</h3>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            {accepted.length === 0 ? (
              <p className="text-sm text-slate-500">No accepted members yet — invite people first!</p>
            ) : (
              <>
                <div
                  className="relative flex items-center justify-center overflow-visible"
                  style={{ height: cardAreaHeight, transition: "height 0.5s ease" }}
                >
                  {phase === "idle" && (
                    <div className="flex gap-3">
                      {accepted.map((_, i) => (
                        <div key={i} className="w-20 h-28 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200" />
                      ))}
                    </div>
                  )}

                  {cards.map((card, i) => (
                    <div
                      key={card.id + "-" + i}
                      className={"absolute w-20 h-28 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 select-none text-xs font-bold text-center px-2 leading-tight " + (card.faceDown ? "bg-slate-700" : CARD_COLORS[card.colorIndex] + " text-white")}
                      style={{
                        transform: `translate(${card.x}px, ${card.y}px) rotate(${card.rotate}deg)`,
                        zIndex: card.zIndex,
                        transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.35s ease",
                      }}
                    >
                      {card.faceDown ? (
                        <span className="text-slate-500 text-xl">🂠</span>
                      ) : (
                        <>
                          {card.dealOrder === 0 && <span className="text-lg">🥇</span>}
                          <span>{card.member.name}</span>
                          {card.dealt && <span className="text-white/70 text-[10px]">{card.dealOrder === 0 ? "picks first" : "picks #" + (card.dealOrder + 1)}</span>}
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
