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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface CardPos {
  x: number;
  y: number;
  rotate: number;
  zIndex: number;
  faceDown: boolean;
}

export function RoomPicker({ members }: RoomPickerProps) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "animating" | "dealing" | "done">("idle");
  const [memberOrder, setMemberOrder] = useState<FamilyMember[]>([]);
  const [positions, setPositions] = useState<CardPos[]>([]);
  const [dealtCount, setDealtCount] = useState(0);

  const accepted = members.filter((m) => m.status === "accepted");

  function stackPos(i: number, total: number): CardPos {
    return {
      x: (Math.random() - 0.5) * 4,
      y: -(total - 1 - i) * 2.5,
      rotate: (Math.random() - 0.5) * 4,
      zIndex: i,
      faceDown: true,
    };
  }

  async function startShuffle() {
    setDealtCount(0);
    setPhase("animating");

    const total = accepted.length;
    let order = shuffleArray(accepted);
    setMemberOrder(order);

    // Step 1: Fan out face up
    const fanned: CardPos[] = order.map((_, i) => {
      const angle = (i - (total - 1) / 2) * Math.min(22, 100 / total);
      const radius = Math.min(80, 30 + total * 8);
      return {
        x: Math.sin((angle * Math.PI) / 180) * radius,
        y: -Math.abs(Math.sin((angle * Math.PI) / 180)) * 14,
        rotate: angle,
        zIndex: i,
        faceDown: false,
      };
    });
    setPositions(fanned);
    await sleep(800);

    // Step 2: Flip face down
    setPositions(fanned.map((p) => ({ ...p, faceDown: true })));
    await sleep(500);

    // Step 3: Split to two piles
    const half = Math.ceil(total / 2);
    const split: CardPos[] = order.map((_, i) => ({
      x: i < half ? -52 : 52,
      y: -(i < half ? i : i - half) * 2.5,
      rotate: (i < half ? -6 : 6) + (Math.random() - 0.5) * 3,
      zIndex: i < half ? i : i - half,
      faceDown: true,
    }));
    setPositions(split);
    await sleep(700);

    // Step 4: Merge back into stack
    order = shuffleArray(order);
    setMemberOrder([...order]);
    setPositions(order.map((_, i) => stackPos(i, total)));
    await sleep(700);

    // Step 5: Split again
    const split2: CardPos[] = order.map((_, i) => ({
      x: i < half ? -52 : 52,
      y: -(i < half ? i : i - half) * 2.5,
      rotate: (i < half ? -6 : 6) + (Math.random() - 0.5) * 3,
      zIndex: i < half ? i : i - half,
      faceDown: true,
    }));
    setPositions(split2);
    await sleep(700);

    // Step 6: Final stack
    order = shuffleArray(order);
    setMemberOrder([...order]);
    const finalStack = order.map((_, i) => stackPos(i, total));
    setPositions(finalStack);
    await sleep(700);

    // Step 7: Deal all cards one by one from top
    setPhase("dealing");
    for (let dealt = 0; dealt < total; dealt++) {
      await sleep(420);
      setDealtCount(dealt + 1);
      // Remove top card from stack by moving it off screen
      setPositions((prev) => {
        const updated = [...prev];
        const topIdx = total - 1 - dealt;
        if (updated[topIdx]) {
          updated[topIdx] = { ...updated[topIdx], x: 0, y: -120, rotate: 0, faceDown: false, zIndex: 99 };
        }
        return updated;
      });
    }

    await sleep(300);
    setPhase("done");
  }

  function close() {
    setOpen(false);
    setPhase("idle");
    setMemberOrder([]);
    setPositions([]);
    setDealtCount(0);
  }

  const isAnimating = phase === "animating" || phase === "dealing";
  const total = accepted.length;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-sm">
        🎲 Pick rooms
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">🎲 Room pick order</h3>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            {accepted.length === 0 ? (
              <p className="text-sm text-slate-500">No accepted members yet — invite people first!</p>
            ) : (
              <>
                <div className="relative h-44 flex items-center justify-center overflow-visible">
                  {memberOrder.map((member, i) => {
                    const pos = positions[i];
                    if (!pos) return null;
                    const color = CARD_COLORS[i % CARD_COLORS.length];
                    return (
                      <div
                        key={member.id + "-" + i}
                        className={"absolute w-16 h-24 rounded-xl shadow-lg flex items-center justify-center select-none text-xs font-bold text-center px-1 leading-tight " + (pos.faceDown ? "bg-slate-700" : color + " text-white")}
                        style={{
                          transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotate}deg)`,
                          zIndex: pos.zIndex,
                          transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), background-color 0.35s ease",
                        }}
                      >
                        {pos.faceDown
                          ? <span className="text-slate-500 text-xl">🂠</span>
                          : member.name}
                      </div>
                    );
                  })}
                </div>

                {dealtCount > 0 && (
                  <ul className="space-y-2 max-h-56 overflow-y-auto">
                    {memberOrder.slice(total - dealtCount).reverse().map((member, index) => (
                      <li
                        key={member.id + "-dealt-" + index}
                        className={"flex items-center gap-3 rounded-xl px-4 py-3 border " + (index === 0 ? "bg-amber-50 border-amber-200" : "bg-sky-50 border-sky-100")}
                        style={{ animation: "dealIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                      >
                        <span className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white " + CARD_COLORS[(total - dealtCount + index) % CARD_COLORS.length]}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-slate-800">{member.name}</span>
                        {index === 0 && (
                          <span className="ml-auto text-xs text-amber-500 font-medium">Picks first 👑</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={startShuffle}
                  disabled={isAnimating}
                  className="btn-primary w-full py-3"
                >
                  {isAnimating ? "🎲 Shuffling..." : phase === "done" ? "🎲 Re-shuffle!" : "🎲 Shuffle & deal"}
                </button>

                <style>{`
                  @keyframes dealIn {
                    from { opacity: 0; transform: translateY(-16px) scale(0.92); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                  }
                `}</style>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
