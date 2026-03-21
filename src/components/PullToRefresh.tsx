"use client";
import { useEffect, useRef, useState } from "react";

export function PullToRefresh() {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const startX = useRef(0);
  const isVertical = useRef<boolean | null>(null);
  const threshold = 80;

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        startX.current = e.touches[0].clientX;
        isVertical.current = null;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (window.scrollY > 0 || startY.current === 0) return;
      const dy = e.touches[0].clientY - startY.current;
      const dx = e.touches[0].clientX - startX.current;

      // Determine direction on first significant move
      if (isVertical.current === null && (Math.abs(dy) > 5 || Math.abs(dx) > 5)) {
        isVertical.current = Math.abs(dy) > Math.abs(dx);
      }

      // Only pull-to-refresh if clearly vertical
      if (!isVertical.current) return;

      if (dy > 0) {
        setPullDistance(Math.min(dy, threshold + 20));
        setPulling(dy >= threshold);
      }
    }

    function onTouchEnd() {
      if (pulling) window.location.reload();
      setPullDistance(0);
      setPulling(false);
      startY.current = 0;
      startX.current = 0;
      isVertical.current = null;
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [pulling]);

  if (pullDistance === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-sky-50 transition-all"
      style={{ height: pullDistance }}
    >
      <div className={"text-sky-500 text-sm font-medium transition-all " + (pulling ? "scale-110" : "scale-90 opacity-60")}>
        {pulling ? "Release to refresh ↻" : "Pull to refresh ↓"}
      </div>
    </div>
  );
}
