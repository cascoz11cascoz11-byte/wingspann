"use client";
import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const already = sessionStorage.getItem("splashShown");
    if (already) return;
    sessionStorage.setItem("splashShown", "1");
    setVisible(true);
    const fadeTimer = setTimeout(() => setFading(true), 1800);
    const hideTimer = setTimeout(() => setVisible(false), 2300);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white"
      style={{ opacity: fading ? 0 : 1, transition: "opacity 0.5s ease" }}
    >
      <div className="flex flex-col items-center gap-6">
        <img src="/logo.png" alt="Wingspann" className="h-16 w-auto" />
        <div className="relative w-48 h-6 overflow-hidden">
          <div
            className="absolute text-2xl"
            style={{ animation: "flyAcross 1.6s ease-in-out forwards", top: 0 }}
          >
            ✈️
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-100 rounded-full"
            style={{ animation: "trailGrow 1.6s ease-in-out forwards" }}
          />
        </div>
      </div>
      <style>{`
        @keyframes flyAcross {
          0% { left: -10%; opacity: 0; transform: translateY(4px); }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { left: 105%; opacity: 0; transform: translateY(-4px); }
        }
        @keyframes trailGrow {
          0% { transform: scaleX(0); transform-origin: left; opacity: 0; }
          15% { opacity: 1; }
          100% { transform: scaleX(1); transform-origin: left; opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
