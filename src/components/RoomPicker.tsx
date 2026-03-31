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

const CARD_W = 80;
const CARD_H = 112;
const GAP_X = 12;
const GAP_Y = 20;
const COLS = 4;

export function RoomPicker({ members }: RoomPickerProps) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"idle" | "animating" | "done">("idle");
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);

  const cardRefs = useRef<HTMLDivElement[]>([]);
  const running = useRef(false);

  const accepted = members.filter((m) => m.status === "accepted");
  const total = accepted.length;

  function getStackPosition() {
    const gridW = COLS * CARD_W + (COLS - 1) * GAP_X;
    const originX = -gridW / 2 + CARD_W / 2;
    return {
      x: originX + (COLS - 1) * (CARD_W + GAP_X),
      y: 0,
    };
  }

  function dealtPosition(cardIndex: number) {
    const stackSlot = COLS - 1;
    let slot = cardIndex;
    if (slot >= stackSlot) slot += 1;

    const col = slot % COLS;
    const row = Math.floor(slot / COLS);

    const gridW = COLS * CARD_W + (COLS - 1) * GAP_X;
    const originX = -gridW / 2 + CARD_W / 2;
    const originY = -(getGridHeight() / 2) + CARD_H / 2 + 8;

    return {
      x: originX + col * (CARD_W + GAP_X),
      y: originY + row * (CARD_H + GAP_Y),
      rotation: gsap.utils.random(-2, 2),
    };
  }

  function getGridHeight() {
    const totalSlots = total + 1;
    const rows = Math.ceil(totalSlots / COLS);
    return rows * CARD_H + (rows - 1) * GAP_Y + 40;
  }

  function shuffle(arr: number[]) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startAnimation() {
    if (running.current || total === 0) return;
    running.current = true;
    setPhase("animating");

    const cards = cardRefs.current;
    const stack = getStackPosition();

    // Generate new random order
    const newOrder = shuffle(Array.from({ length: total }, (_, i) => i));
    setShuffledOrder(newOrder);

    // Reset all card flips and remove medals before starting
    cards.forEach((card) => {
      const inner = card.querySelector(".inner-card") as HTMLElement;
      if (inner) {
        gsap.set(inner, { rotateY: 0 });
        const medal = inner.querySelector(".first-place");
        if (medal) medal.remove();
      }
    });

    const tl = gsap.timeline({
      defaults: { ease: "power2.out", duration: 0.45 },
      onComplete: () => {
        setPhase("done");
        running.current = false;
      },
    });

    // 🃏 Initial stack in CENTER CENTER
    tl.to(cards, {
      x: () => gsap.utils.random(-4, 4),
      y: (_, i) => -(total - i) * 2,
      rotation: () => gsap.utils.random(-4, 4),
      scale: 1,
      stagger: { each: 0.03, from: "end" },
    });

    // 🔀 Shuffle passes in CENTER
    for (let i = 0; i < 4; i++) {
      const speed = 0.5 - i * 0.08;

      tl.to(cards, {
        x: () => gsap.utils.random(-140, 140),
        y: () => gsap.utils.random(-60, 40),
        rotation: () => gsap.utils.random(-25, 25),
        scale: 0.96,
        duration: speed,
        stagger: 0.015,
      });

      tl.to(cards, {
        x: () => gsap.utils.random(-6, 6),
        y: (_, i) => -(total - i) * 2,
        rotation: () => gsap.utils.random(-6, 6),
        scale: 1,
        duration: speed * 0.9,
        stagger: { each: 0.03, from: "end" },
      });
    }

    // ➡️ Slide full stack to top-right
    tl.to(cards, {
      x: stack.x,
      y: (_, i) => stack.y - (total - i) * 2,
      rotation: () => gsap.utils.random(-4, 4),
      duration: 0.4,
      ease: "power2.inOut",
      stagger: { each: 0.02, from: "end" },
    });

    // 🃏 Deal cards in shuffled order
    newOrder.forEach((cardIndex, dealOrder) => {
      const card = cards[cardIndex];
      const pos = dealtPosition(dealOrder);

      tl.fromTo(
        card,
        { y: stack.y + "-=40" },
        {
          x: pos.x,
          y: pos.y,
          rotation: pos.rotation,
          duration: 0.4,
          ease: "power4.out",
        },
        "+=0.06"
      );

      const inner = card.querySelector(".inner-card") as HTMLElement;
      if (inner) {
        tl.to(inner, {
          rotateY: 180,
          duration: 0.35,
          ease: "power2.out",
          onStart: () => {
            if (dealOrder === 0) {
              const front = inner.querySelector(".card-front") as HTMLElement;
              if (front && !front.querySelector(".first-place")) {
                const medal = document.createElement("div");
                medal.innerText = "🥇";
                medal.className =
                  "first-place absolute -bottom-4 text-lg text-white w-full text-center";
                front.appendChild(medal);
              }
            }
          },
        }, "<0.05");
      }
    });
  }

  function close() {
    running.current = false;
    setOpen(false);
    setPhase("idle");
  }

  const gridHeight = getGridHeight();

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-secondary text-sm">
        🃏 Pick rooms
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={close} />

          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-sky-700">
                🃏 Room pick order
              </h3>
              <button onClick={close}>✕</button>
            </div>

            {/* Card arena */}
            <div
              className="relative w-full flex items-center justify-center overflow-visible"
              style={{ height: gridHeight, perspective: 800 }}
            >
              {accepted.map((m, i) => (
                <div
                  key={m.id}
                  className="absolute w-20 h-28"
                  ref={(el) => { if (el) cardRefs.current[i] = el; }}
                >
                  <div
                    className="inner-card relative w-full h-full"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* BACK */}
                    <div
                      className="absolute inset-0 rounded-2xl bg-slate-700 flex items-center justify-center text-white text-xl shadow-lg"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      🂠
                    </div>

                    {/* FRONT */}
                    <div
                      className={
                        "card-front absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-xs font-bold text-white px-2 text-center shadow-lg " +
                        CARD_COLORS[i % CARD_COLORS.length]
                      }
                      style={{
                        transform: "rotateY(180deg)",
                        backfaceVisibility: "hidden",
                      }}
                    >
                      <span>{m.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {total <= 1 && (
              <p className="text-center text-xs text-slate-400">Add at least 2 members to use the room picker!</p>
            )}

            <button
              onClick={startAnimation}
              disabled={phase === "animating" || total <= 1}
              className={"btn-primary w-full py-3 " + (total <= 1 ? "opacity-40 cursor-not-allowed" : "")}
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