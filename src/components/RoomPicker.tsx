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

interface CardState {
  member: FamilyMember;
  colorIndex: number;
  x: number;
  y: number;
  rotate: number;
  zIndex: number;
  faceDown: boolean;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function RoomPicker({ members }: RoomPickerProps) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "animating" | "dealing" | "done">("idle");
  const [cards, setCards] = useState<CardState[]>([]);
  const [dealt, setDealt] = useState<CardState[]>([]);

  const accepted = members.filter((m) => m.status === "accepted");

  function makeStack(memberList: FamilyMember[], faceDown = true): CardState[] {
    return memberList.map((member, i) => ({
      member,
      colorIndex: i % CARD_COLORS.length,
      x: (Math.random() - 0.5) * 6,
      y: -i * 2,
      rotate: (Math.random() - 0.5) * 5,
      zIndex: i,
      faceDown,
    }));
  }

  async function startShuffle() {
    setDealt([]);
    setPhase("animating");

    const shuffled = [...accepted].sort(() => Math.random() - 0.5);

    // Step 1: Scatter cards out
    const scattered = shuffled.map((member, i) => ({
      member,
      colorIndex: i % CARD_COLORS.length,
      x: (Math.random() - 0.5) * 160,
      y: (Math.random() - 0.5) * 80,
      rotate: (Math.random() - 0.5) * 40,
      zIndex: i,
      faceDown: true,
    }));
    setCards(scattered);
    await sleep(500);

    // Step 2: Gather back into stack
    const reshuffled = [...shuffled].sort(() => Math.random() - 0.5);
    const stacked = makeStack(reshuffled);
    setCards(stacked);
    await sleep(500);

    // Step 3: Scatter again
    const scattered2 = reshuffled.map((member, i) => ({
      member,
      colorIndex: i % CARD_COLORS.length,
      x: (Math.random() - 0.5) * 140,
      y: (Math.random() - 0.5) * 70,
      rotate: (Math.random() - 0.5) * 35,
      zIndex: i,
      faceDown: true,
    }));
    setCards(scattered2);
    await sleep(400);

    // Step 4: Final stack in random order
    const finalOrder = [...reshuffled].sort(() => Math.random() - 0.5);
    const finalStack = makeStack(finalOrder);
    setCards(finalStack);
    await sleep(400);

    // Step 5: Deal one by one
    setPhase("dealing");
    const dealtSoFar: CardState[] = [];
    for (let i = finalStack.length - 1; i >= 0; i--) {
      await sleep(350);
      dealtSoFar.push({ ...finalStack[i], faceDown: false });
      setDealt([...dealtSoFar]);
      setCards((prev) => prev.slice(0, i));
    }

    setPhase("done");
  }

  function close() {
    setOpen(false);
    setPhase("idle");
    setCards([]);
    setDealt([]);
  }

  const isAnimating = phase === "animating" || phase === "dealing";

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
                {/* Card animation area */}
                {(phase === "animating" || (phase === "dealing" && cards.length > 0)) && (
                  <div className="relative h-40 flex items-center justify-center overflow-hidden">
                    {cards.map((card, i) => (
                      <div
                        key={card.member.id + i}
                        className="absolute w-16 h-24 rounded-xl shadow-lg flex items-center justify-center select-none bg-slate-700"
                        style={{
                          transform: `translate(${card.x}px, ${card.y}px) rotate(${card.rotate}deg)`,
                          zIndex: card.zIndex,
                          transition: "transform 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)",
                        }}
                      >
                        <span className="text-slate-500 text-2xl">🂠</span>
                      </div>
                    ))}
                    {phase === "dealing" && cards.length > 0 && (
                      <span className="absolute -bottom-1 text-xs text-slate-400">{cards.length} remaining</span>
                    )}
                  </div>
                )}

                {/* Dealt results */}
                {dealt.length > 0 && (
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {dealt.map((card, index) => (
                      <li
                        key={card.member.id + index}
                        className={"flex items-center gap-3 rounded-xl px-4 py-3 border " + (index === 0 ? "bg-amber-50 border-amber-200" : "bg-sky-50 border-sky-100")}
                        style={{ animation: "dealIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                      >
                        <span className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white " + CARD_COLORS[card.colorIndex]}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-slate-800">{card.member.name}</span>
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
