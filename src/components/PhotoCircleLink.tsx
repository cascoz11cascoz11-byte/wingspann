"use client";

export default function PhotoCircleLink({ tripName }: { tripName: string }) {
  function open() {
    window.open("https://photocircle.app", "_blank");
  }
  return (
    <button type="button" onClick={open} className="w-full flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-sky-300 hover:shadow-md transition text-left">
      <span className="text-2xl">📸</span>
      <div>
        <p className="text-sm font-semibold text-slate-800">Share photos with PhotoCircle</p>
        <p className="text-xs text-slate-500">Create a shared album for {tripName}</p>
      </div>
      <span className="ml-auto text-slate-400 text-sm">↗</span>
    </button>
  );
}