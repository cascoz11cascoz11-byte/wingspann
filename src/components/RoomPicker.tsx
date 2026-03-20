"use client";
import { useState } from "react";
import type { FamilyMember } from "@/types";

interface RoomPickerProps {
  members: FamilyMember[];
}

const CARD_COLORS = [
  "bg-sky-400", "bg-amber-400", "bg-rose-400", "bg-violet-400",
  "bg-emerald-400", "bg-orange-400", "bg-pink-400", "bg-teal-400",
];

const MEDALS = ["🥇", "🥈", "🥉"];

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
  member: FamilyMember;
  colorIndex: number;
  x: number;
  y: number;
  rotate: number;
  zIndex: number;
  faceDown: boolean;
  dealt: boolean;
}

export function RoomPicker({ members }: RoomPickerProps) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "shuffling" | "done">("idle");
  const [cards, setCards] = useState<CardState[]>([]);

  const accepted = members.filter((m) => m.status === "accepted");
  const total = accepted.length;

  function stackCards(memberList: FamilyMember[]): CardState[] {
    return memberList.map((member, i) => ({
      member,
      colorIndex: i % CARD_COLORS.length,
      x: (Math.random() - 0.5) * 4,
      y: -(total - 1 - i) * 2,
      rotate: (Math.random() - 0.5) * 4,
      zIndex: i,
      faceDown: true,
      dealt: false,
    }));
  }

  function dealtPosition(index: number, total: number) {
    const cols = Math.min(total, 4);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const spacing = Math.min(96, 320 / cols);
    const startX = -(cols - 1) * spacing / 2;
    return {
      x: startX + col * spacing,
      y: row * 110,
    };
  }

  async function startShuffle() {
    setPhase("shuffling");
    let order = shuffleArray(accepted);

    // Step 1: Stack face down
    let stack = stackCards(order);
    setCards(stack);
    await sleep(600);

    // Step 2: Fan out face up
    const fanned = order.map((member, i) => {
      const angle = (i - (total - 1) / 2) * Math.min(20, 90 / total);
      const radius = Math.min(75, 30 + total * 7);
      return {
        member,
        colorIndex: i % CARD_COLORS.length,
        x: Math.sin((angle * Math.PI) / 180) * radius,
        y: -Math.abs(Math.sin((angle * Math.PI) / 180)) * 12,
        rotate: angle,
        zIndex: i,
        faceDown: false,
        dealt: false,
      };
    });
    setCards(fanned);
    await sleep(700);

    // Step 3: Flip face down
    setCards(fanned.map((c) => ({ ...c, faceDown: true })));
    await sleep(500);

    // Step 4: Split to two piles
    const half = Math.ceil(total / 2);
    setCards(order.map((member, i) => ({
      member,
      colorIndex: i % CARD_COLORS.length,
      x: i < half ? -50 : 50,
      y: -(i < half ? i : i - half) * 2.5,
      rotate: (i < half ? -5 : 5) + (Math.random() - 0.5) * 2,
      zIndex: i < half ? i : i - half,
      faceDown: true,
      dealt: false,
    })));
    await sleep(650);

    // Step 5: Merge back
    order = shuffleArray(order);
    stack = stackCards(order);
    setCards(stack);
    await sleep(650);

    // Step 6: Split again
    setCards(order.map((member, i) => ({
      member,
      colorIndex: i % CARD_COLORS.length,
      x: i < half ? -50 : 50,
      y: -(i < half ? i : i - half) * 2.5,
      rotate: (i < half ? -5 : 5) + (Math.random() - 0.5) * 2,
      zIndex: i < half ? i : i - half,
      faceDown: true,
      dealt: false,
    })));
    await sleep(650);

    // Step 7: Final stack
    order = shuffleArray(order);
    stack = stackCards(order);
    setCards(stack);
    await sleep(650);

    // Step 8: Deal out one by one to poker positions, flip face up
    for (let i = 0; i < total; i++) {
      await sleep(380);
      const pos = dealtPosition(i, total);
      setCards((prev) => {
        const updated = [...prev];
        const topIdx = total - 1 - i;
        if (updated[topIdx]) {
          updated[topIdx] = {
            ...updated[topIdx],
            x: pos.x,
            y: pos.y + 60,
            rotate: (Math.random() - 0.5) * 3,
            zIndex: 10 + i,
            faceDown: false,
            dealt: true,
          };
        }
        return updated;
      });
    }

    setPhase("done");
  }

  function close() {
    setOpen(false);
    setPhase("idle");
    setCards([]);
  }

  const isShuffling = phase === "shuffling";

  // Calculate container height based on rows needed
  const cols = Math.min(total, 4);
  const rows = Math.ceil(total / cols);
  const containerHeight = phase === "idle" ? 140 : phase === "shuffling" && cards.some((c) => !c.dealt) ? 140 : 80 + rows * 115;

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
                  className="relative flex items-start justify-center overflow-visible transition-all duration-500"
                  style={{ height: containerHeight }}
                >
                  {phase === "idle" && (
                    <div className="flex gap-3 pt-4">
                      {accepted.map((_, i) => (
                        <div key={i} className="w-20 h-28 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200" />
                      ))}
                    </div>
                  )}

                  {cards.map((card, i) => {
                    const dealIndex = cards.filter((c, ci) => c.dealt && ci <= i).length - 1;
                    const medal = card.dealt ? MEDALS[dealIndex] ?? null : null;
                    return (
                      <div
                        key={card.member.id + "-" + i}
                        className={"absolute w-20 h-28 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 select-none text-xs font-bold text-center px-2 leading-tight " + (card.faceDown ? "bg-slate-700" : CARD_COLORS[card.colorIndex] + " text-white")}
                        style={{
                          transform: `translate(${card.x}px, ${card.y}px) rotate(${card.rotate}deg)`,
                          zIndex: card.zIndex,
                          transition: "transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.3s ease",
                        }}
                      >
                        {card.faceDown ? (
                          <span className="text-slate-500 text-xl">🂠</span>
                        ) : (
                          <>
                            {medal && <span className="text-lg">{medal}</span>}
                            <span>{card.member.name}</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {phase === "done" && (
                  <p className="text-center text-xs text-slate-400">Left to right = pick order</p>
                )}

                <button
                  type="button"
                  onClick={startShuffle}
                  disabled={isShuffling}
                  className="btn-primary w-full py-3"
                >
                  {isShuffling ? "🃏 Shuffling..." : phase === "done" ? "🃏 Re-shuffle!" : "🃏 Shuffle & deal"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
