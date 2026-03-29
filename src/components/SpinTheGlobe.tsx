"use client";
import { useState } from "react";
import { addToWishlist } from "@/lib/store";

interface Destination {
  name: string;
  country: string;
  emoji: string;
  facts: string[];
}

const REGIONS = [
  "🌍 Whole World",
  "🇺🇸 United States",
  "🌎 North America",
  "🌎 South America",
  "🌍 Europe",
  "🌍 Africa",
  "🌏 Asia",
  "🌏 Oceania",
  "🌨️ Arctic / Antarctica",
];

export function SpinTheGlobe() {
  const [spinning, setSpinning] = useState(false);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("🌍 Whole World");

  async function spin() {
    setSpinning(true);
    setDestination(null);
    setAdded(false);
    const res = await fetch("/api/spin-globe?region=" + encodeURIComponent(selectedRegion));
    const data = await res.json();
    setDestination(data);
    setSpinning(false);
  }

  async function addToMyWishlist() {
    if (!destination) return;
    setAdding(true);
    await addToWishlist({
      name: destination.name + ", " + destination.country,
      type: "destination",
      description: destination.facts.join(" • "),
    });
    setAdding(false);
    setAdded(true);
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-sky-700">Spin the Globe 🌍</h2>
        <p className="text-sm text-slate-500">Let fate decide your next adventure!</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {REGIONS.map((region) => (
          <button key={region} type="button" onClick={() => setSelectedRegion(region)} className={["rounded-full border px-3 py-1.5 text-xs font-medium transition", selectedRegion === region ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600 hover:border-sky-200"].join(" ")}>
            {region}
          </button>
        ))}
      </div>
      <button type="button" onClick={spin} disabled={spinning} className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-violet-500 shadow-lg text-6xl transition hover:scale-105 active:scale-95">
        <span className={spinning ? "animate-spin inline-block" : ""}> 🌍</span>
      </button>
      {spinning && <p className="text-sm text-slate-500 animate-pulse">Finding your next adventure...</p>}
      {destination && !spinning && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4 text-left">
          <div className="text-center space-y-1">
            <p className="text-4xl">{destination.emoji}</p>
            <h3 className="font-display text-xl font-bold text-slate-800">{destination.name}</h3>
            <p className="text-sm text-slate-500">{destination.country}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide">Top 3 things to know</p>
            {destination.facts.map((fact, i) => (
              <div key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="font-bold text-sky-500">{i + 1}.</span>
                <span>{fact}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={addToMyWishlist} disabled={adding || added} className="btn-primary text-sm flex-1">
              {added ? "Added to wishlist ✓" : adding ? "Adding..." : "Add to wishlist 🌟"}
            </button>
            <button type="button" onClick={spin} className="btn-secondary text-sm">Spin again</button>
          </div>
        </div>
      )}
      {!destination && !spinning && <p className="text-sm text-slate-400">Tap the globe to discover your next destination!</p>}
    </div>
  );
}