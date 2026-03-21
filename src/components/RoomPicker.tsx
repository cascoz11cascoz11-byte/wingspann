"use client";
import { useRef, useState } from "react";
import gsap from "gsap";
import type { FamilyMember } from "@/types";

interface RoomPickerProps {
  members: FamilyMember[];
}

const CARD_COLORS = [
  "bg-sky-400","bg-amber-400","bg-rose-400","bg-violet-400",
  "bg-emerald-400","bg-orange-400","bg-pink-400","bg-teal-400",
];

export function RoomPicker({ members }: RoomPickerProps) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "animating" | "done">("idle");

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLDivElement[]>([]);
  const running = useRef(false);

  const accepted = members.filter((m) => m.status === "accepted");
  const total = accepted.length;

  function dealtPosition(index: number) {
    const cols = Math.min(total, 4);
    const col = index % cols;
    const row = Math.floor(index / cols);
    const spacing = Math.min(88, 300 / cols);
    const startX = -(Math.min(total, cols) - 1) * spacing / 2;

    return {
      x: startX + col * spacing,
      y: row * 118 + 50,
      rotation: (Math.random() - 0.5) * 4,
    };
  }

  function stackPosition(i: number) {
    return {
      x: (Math.random() - 0.5) * 6,
      y: -(total - i) * 2,
      rotation: (Math.random() - 0.5) * 6,
    };
  }

  function scatterPosition() {
    return {
      x: (Math.random() - 0.5) * 160,
      y: (Math.random() - 0.5) * 60,
      rotation: (Math.random() - 0.5) * 30,
    };
  }

  function startAnimation() {
    if (running.current || total === 0) return;
    running.current = true;
    setPhase("animating");

    const cards = cardRefs.current;

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        setPhase("done");
        running.current = false;
      },
    });

    // 🃏 Step 1: Stack
    tl.to(cards, {
      ...stackPosition(0),
      duration: 0.6,
      stagger: {
        each: 0.04,
        from: "end",
      },
    });

    // 🔀 Shuffle (scatter → stack repeated)
    for (let i = 0; i < 2; i++) {
      tl.to(cards, {
        x: () => scatterPosition().x,
        y: () => scatterPosition().y,
        rotation: () => scatterPosition().rotation,
        duration: 0.7,
        stagger: 0.02,
      });

      tl.to(cards, {
        x: (_, i) => stackPosition(i).x,
        y: (_, i) => stackPosition(i).y,
        rotation: (_, i) => stackPosition(i).rotation,
        duration: 0.6,
        stagger: {
          each: 0.04,
          from: "end",
        },
      });
    }

    // 🃏 Deal cards one-by-one
    cards.forEach((card, i) => {
      const pos = dealtPosition(i);

      tl.to(card, {
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation,
        duration: 0.5,
      }, `+=0.15`);

      // flip + reveal
      tl.to(card, {
        rotateY: 180,
        duration: 0.3,
        onStart: () => {
          card.classList.remove("bg-slate-700");
          card.classList.add(CARD_COLORS[i % CARD_COLORS.length], "text-white");
          card.innerText = accepted[i].name;
        },
      }, "<");
    });
  }

  function close() {
    running.current = false;
    setOpen(false);
    setPhase("idle");
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
        🃏 Pick rooms
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between">
              <h3 className="text-lg font-semibold text-sky-700">
                🃏 Room pick order
              </h3>
              <button onClick={close}>✕</button>
            </div>

            <div
              ref={containerRef}
              className="relative h-[220px] flex items-center justify-center"
            >
              {accepted.map((m, i) => (
                <div
                  key={m.id}
                  ref={(el) => {
                    if (el) cardRefs.current[i] = el;
                  }}
                  className="absolute w-20 h-28 rounded-2xl bg-slate-700 text-white flex items-center justify-center text-xs font-bold shadow-lg"
                  style={{
                    transform: "translate3d(0,0,0)",
                    backfaceVisibility: "hidden",
                  }}
                >
                  🂠
                </div>
              ))}
            </div>

            <button
              onClick={startAnimation}
              disabled={phase === "animating"}
              className="btn-primary w-full py-3"
            >
              {phase === "animating"
                ? "Shuffling..."
                : phase === "done"
                ? "Reshuffle"
                : "Shuffle & deal"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}