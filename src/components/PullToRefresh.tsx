"use client";
import { useEffect, useRef, useState } from "react";

export function PullToRefresh() {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const threshold = 80;

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (window.scrollY > 0 || startY.current === 0) return;
      const dist = e.touches[0].clientY - startY.current;
      if (dist > 0) {
        setPullDistance(Math.min(dist, threshold + 20));
        setPulling(dist >= threshold);
      }
    }

    function onTouchEnd() {
      if (pulling) {
        window.location.reload();
      }
      setPullDistance(0);
      setPulling(false);
      startY.current = 0;
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
      <div className={`text-sky-500 text-sm font-medium transition-all ${pulling ? "scale-110" : "scale-90 opacity-60"}`}>
        {pulling ? "Release to refresh ↻" : "Pull to refresh ↓"}
      </div>
    </div>
  );
}