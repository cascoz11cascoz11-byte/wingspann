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
      rotation: gsap.utils.random(-2, 2),
    };
  }

  function startAnimation() {
    if (running.current || total === 0) return;
    running.current = true;
    setPhase("animating");

    const cards = cardRefs.current;

    const tl = gsap.timeline({
      defaults: { ease: "power2.out", duration: 0.45 },
      onComplete: () => {
        setPhase("done");
        running.current = false;
      },
    });

    // 🃏 Initial stack (tight + subtle depth)
    tl.to(cards, {
      x: () => gsap.utils.random(-4, 4),
      y: (_, i) => -(total - i) * 2,
      rotation: () => gsap.utils.random(-4, 4),
      scale: 1,
      stagger: { each: 0.03, from: "end" },
    });

    // 🔀 Shuffle passes (controlled chaos + speed ramp)
    for (let i = 0; i < 4; i++) {
      const speed = 0.5 - i * 0.08;

      // scatter (chaos, but soft)
      tl.to(cards, {
        x: () => gsap.utils.random(-140, 140),
        y: () => gsap.utils.random(-60, 40),
        rotation: () => gsap.utils.random(-25, 25),
        scale: 0.96,
        duration: speed,
        ease: "power2.out",
        stagger: 0.015,
      });

      // regroup (tight + satisfying)
      tl.to(cards, {
        x: () => gsap.utils.random(-6, 6),
        y: (_, i) => -(total - i) * 2,
        rotation: () => gsap.utils.random(-6, 6),
        scale: 1,
        duration: speed * 0.9,
        ease: "power3.out",
        stagger: { each: 0.03, from: "end" },
      });
    }

    // 🃏 Deal cards (arc motion + snap)
    cards.forEach((card, i) => {
      const pos = dealtPosition(i);

      // arc lift
      tl.to(card, {
        y: pos.y - 40,
        duration: 0.18,
        ease: "power2.out",
      }, "+=0.04");

      // drop into place
      tl.to(card, {
        x: pos.x,
        y: pos.y,
        rotation: pos.rotation,
        duration: 0.32,
        ease: "power4.out",
      }, "<");

      // flip + reveal
      tl.to(card, {
        rotateY: 180,
        duration: 0.25,
        ease: "power2.out",
        onStart: () => {
          card.classList.remove("bg-slate-700");
          card.classList.add(
            CARD_COLORS[i % CARD_COLORS.length],
            "text-white"
          );
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
              className="relative h-[260px] flex items-center justify-center"
              style={{ perspective: 800 }}
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
                    transformStyle: "preserve-3d",
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