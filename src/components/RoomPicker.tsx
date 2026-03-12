"use client";
import { useState } from "react";
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

interface CardState {
  member: FamilyMember;
  colorIndex: number;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  zIndex: number;
  faceDown: boolean;
}

export function RoomPicker({ members }: RoomPickerProps) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "spread" | "shuffle" | "stack" | "deal" | "done">("idle");
  const [cards, setCards] = useState<CardState[]>([]);
  const [dealt, setDealt] = useState<CardState[]>([]);

  const accepted = members.filter((m) => m.status === "accepted");

  function makeCards(memberList: FamilyMember[]): CardState[] {
    return memberList.map((member, i) => ({
      member,
      colorIndex: i % CARD_COLORS.length,
      x: 0, y: 0, rotate: 0, scale: 1, zIndex: i, faceDown: false,
    }));
  }

  async function startShuffle() {
    setDealt([]);
    setPhase("spread");

    const base = [...accepted].sort(() => Math.random() - 0.5);
    const initial = makeCards(base);

    // Step 1: Fan cards out so all are visible
    const fanned = initial.map((c, i) => {
      const total = base.length;
      const angle = (i - (total - 1) / 2) * (Math.min(30, 120 / total));
      const radius = Math.min(90, 40 + total * 8);
      return {
        ...c,
        x: Math.sin((angle * Math.PI) / 180) * radius,
        y: -Math.abs(Math.sin((angle * Math.PI) / 180)) * 20,
        rotate: angle,
        scale: 1,
        zIndex: i,
        faceDown: false,
      };
    });
    setCards(fanned);
    await new Promise((r) => setTimeout(r, 800));

    // Step 2: Flip face down
    setCards(fanned.map((c) => ({ ...c, faceDown: true })));
    await new Promise((r) => setTimeout(r, 400));

    // Step 3: Gather into two piles then riffle shuffle
    setPhase("shuffle");
    for (let round = 0; round < 4; round++) {
      const half = Math.floor(base.length / 2);

      // Split into two piles
      const leftPile = fanned.slice(0, half).map((c, i) => ({
        ...c,
        faceDown: true,
        x: -55,
        y: -i * 3,
        rotate: -5 + (Math.random() - 0.5) * 4,
        zIndex: i,
      }));
      const rightPile = fanned.slice(half).map((c, i) => ({
        ...c,
        faceDown: true,
        x: 55,
        y: -i * 3,
        rotate: 5 + (Math.random() - 0.5) * 4,
        zIndex: i,
      }));
      setCards([...leftPile, ...rightPile]);
      await new Promise((r) => setTimeout(r, 400));

      // Riffle — interleave cards from each pile into center
      const riffled: CardState[] = [];
      let l = 0, r = 0;
      while (l < leftPile.length || r < rightPile.length) {
        if (l < leftPile.length && (r >= rightPile.length || Math.random() > 0.5)) {
          riffled.push({ ...leftPile[l], x: (Math.random() - 0.5) * 12, y: -riffled.length * 2, rotate: (Math.random() - 0.5) * 8, zIndex: riffled.length });
          l++;
        } else {
          riffled.push({ ...rightPile[r], x: (Math.random() - 0.5) * 12, y: -riffled.length * 2, rotate: (Math.random() - 0.5) * 8, zIndex: riffled.length });
          r++;
        }
      }
      setCards(riffled);
      await new Promise((r) => setTimeout(r, 500));
    }

    // Step 4: Final shuffle order
    const finalOrder = [...base].sort(() => Math.random() - 0.5);
    const finalCards = makeCards(finalOrder).map((c, i) => ({
      ...c,
      faceDown: true,
      x: (Math.random() - 0.5) * 8,
      y: -i * 2.5,
      rotate: (Math.random() - 0.5) * 6,
      zIndex: i,
    }));
    setCards(finalCards);
    await new Promise((r) => setTimeout(r, 600));

    // Step 5: Deal from top
    setPhase("deal");
    const dealtSoFar: CardState[] = [];
    for (let i = finalCards.length - 1; i >= 0; i--) {
      await new Promise((r) => setTimeout(r, 400));
      const card = { ...finalCards[i], faceDown: false };
      dealtSoFar.push(card);
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
                {/* Card area */}
                {(phase === "spread" || phase === "shuffle" || phase === "stack") && (
                  <div className="relative h-48 flex items-center justify-center overflow-hidden">
                    {cards.map((card, i) => (
                      <div
                        key={card.member.id + i}
                        className={`absolute w-20 h-28 rounded-2xl shadow-lg flex items-center justify-center font-bold text-sm text-center px-2 select-none transition-all duration-[400ms] ease-in-out ${
                          card.faceDown ? "bg-slate-700 text-slate-700" : `${CARD_COLORS[card.colorIndex]} text-white`
                        }`}
                        style={{
                          transform: `translate(${card.x}px, ${card.y}px) rotate(${card.rotate}deg) scale(${card.scale})`,
                          zIndex: card.zIndex,
                        }}
                      >
                        {card.faceDown ? (
                          <span className="text-slate-500 text-2xl">🂠</span>
                        ) : (
                          card.member.name
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Deal phase — show remaining stack + dealt list */}
                {(phase === "deal" || phase === "done") && (
                  <div className="space-y-3">
                    {/* Remaining stack */}
                    {cards.length > 0 && (
                      <div className="relative h-20 flex items-center justify-center">
                        {cards.slice(-3).map((card, i) => (
                          <div
                            key={card.member.id + i}
                            className="absolute w-16 h-24 rounded-xl bg-slate-700 shadow-md"
                            style={{
                              transform: `translate(${card.x}px, ${card.y}px) rotate(${card.rotate}deg)`,
                              zIndex: i,
                              transition: "all 0.3s ease",
                            }}
                          >
                            <span className="flex items-center justify-center h-full text-slate-500 text-xl">🂠</span>
                          </div>
                        ))}
                        <span className="absolute -bottom-1 text-xs text-slate-400">{cards.length} remaining</span>
                      </div>
                    )}

                    {/* Dealt cards */}
                    <ul className="space-y-2">
                      {dealt.map((card, index) => (
                        <li
                          key={card.member.id + index}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                            index === 0 ? "bg-amber-50 border-amber-200" : "bg-sky-50 border-sky-100"
                          }`}
                          style={{ animation: "dealIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${CARD_COLORS[card.colorIndex]}`}>
                            {index + 1}
                          </span>
                          <span className="font-medium text-slate-800">{card.member.name}</span>
                          {index === 0 && (
                            <span className="ml-auto text-xs text-amber-500 font-medium">Picks first 👑</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={startShuffle}
                  disabled={phase === "spread" || phase === "shuffle" || phase === "stack" || phase === "deal"}
                  className="btn-primary w-full py-3"
                >
                  {phase === "spread" || phase === "shuffle" || phase === "stack" || phase === "deal"
                    ? "🎲 Shuffling..."
                    : phase === "done"
                    ? "🎲 Re-shuffle!"
                    : "🎲 Shuffle & deal"}
                </button>

                <style>{`
                  @keyframes dealIn {
                    from { opacity: 0; transform: translateY(-20px) scale(0.9); }
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