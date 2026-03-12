"use client";
import { useState } from "react";
import { addActivity } from "@/lib/store";

interface ActivityFinderProps {
  tripId: string;
  tripDestination: string;
  tripStartDate: string;
  onAdded: () => void;
}

const CATEGORIES = [
  { id: "concerts", label: "Concerts" },
  { id: "sports", label: "Sports" },
  { id: "theater", label: "Theater" },
  { id: "restaurants", label: "Restaurants" },
  { id: "outdoor", label: "Outdoor" },
  { id: "museums", label: "Museums" },
  { id: "family", label: "Family" },
  { id: "comestoyou", label: "Comes to you" },
];

type Mode = "bored" | "plan";

interface Result {
  name: string;
  category: string;
  description: string;
  date: string;
  venue?: string;
  price?: string;
  link?: string;
  distance?: string;
}

export function ActivityFinder({ tripId, tripDestination, tripStartDate, onAdded }: ActivityFinderProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("bored");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [addedIndexes, setAddedIndexes] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(new Set());
  const [luckyResult, setLuckyResult] = useState<Result | null>(null);
  const [luckyAdded, setLuckyAdded] = useState(false);

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  function toggleExpanded(index: number) {
    setExpandedIndexes((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  async function search() {
    setLoading(true);
    setError(null);
    setHasSearched(false);
    setResults([]);
    setAddedIndexes(new Set());
    setExpandedIndexes(new Set());
    setLuckyResult(null);
    setLuckyAdded(false);
    try {
      const cats = selectedCategories.length > 0 ? selectedCategories : CATEGORIES.map((c) => c.id);
      let url = "/api/find-activities?categories=" + cats.join(",") + "&mode=" + mode;
      if (mode === "bored") {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
        );
        url += "&lat=" + pos.coords.latitude + "&lng=" + pos.coords.longitude;
      } else {
        url += "&location=" + encodeURIComponent(tripDestination);
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results ?? []);
      setHasSearched(true);
    } catch (e: any) {
      if (e.code === 1) {
        setError("Location access denied. Please enable location permissions and try again.");
      } else {
        setError(e.message ?? "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  }

  function feelingLucky() {
    if (results.length === 0) return;
    const pick = results[Math.floor(Math.random() * results.length)];
    setLuckyResult(pick);
    setLuckyAdded(false);
  }

  async function handleAdd(result: Result, index: number) {
    setAddingIndex(index);
    await addActivity(tripId, {
      title: result.name,
      description: (result.description || "") + (result.venue ? " - " + result.venue : "") + (result.price ? " - " + result.price : ""),
      date: tripStartDate,
      type: result.category === "restaurants" ? "meal" : "event",
      location: result.venue ?? "",
      link: result.link ?? "",
    });
    setAddedIndexes((prev) => { const next = new Set(prev); next.add(index); return next; });
    setAddingIndex(null);
    onAdded();
  }

  async function handleAddLucky() {
    if (!luckyResult) return;
    setAddingIndex(-1);
    await addActivity(tripId, {
      title: luckyResult.name,
      description: (luckyResult.description || "") + (luckyResult.venue ? " - " + luckyResult.venue : "") + (luckyResult.price ? " - " + luckyResult.price : ""),
      date: tripStartDate,
      type: luckyResult.category === "restaurants" ? "meal" : "event",
      location: luckyResult.venue ?? "",
      link: luckyResult.link ?? "",
    });
    setLuckyAdded(true);
    setAddingIndex(null);
    onAdded();
  }

  function close() {
    setOpen(false);
    setResults([]);
    setHasSearched(false);
    setSelectedCategories([]);
    setError(null);
    setExpandedIndexes(new Set());
    setLuckyResult(null);
    setLuckyAdded(false);
  }

  const destShort = tripDestination.split(",")[0];
  const activeBorder = "border-sky-400 bg-sky-50 text-sky-700";
  const inactiveBorder = "border-slate-200 text-slate-500 hover:border-sky-200";
  const activePill = "bg-sky-500 border-sky-500 text-white";
  const inactivePill = "border-slate-200 text-slate-600 hover:border-sky-300";

  function ResultCard({ result, index, added, adding, onAdd }: {
    result: Result;
    index: number;
    added: boolean;
    adding: boolean;
    onAdd: () => void;
  }) {
    const cat = CATEGORIES.find((c) => c.id === result.category);
    const expanded = expandedIndexes.has(index);
    const isLong = (result.description?.length ?? 0) > 100;
    return (
      <div className="rounded-xl border border-slate-200 p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-sky-600 bg-sky-50 rounded-full px-2 py-0.5">{cat ? cat.label : result.category}</span>
              {result.date && <span className="text-xs text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">{result.date}</span>}
              {result.price && <span className="text-xs text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">{result.price}</span>}
              {result.distance && <span className="text-xs text-sky-500 font-medium bg-sky-50 rounded-full px-2 py-0.5">{result.distance}</span>}
            </div>
            <p className="font-medium text-slate-800 text-sm">{result.name}</p>
            {result.description && (
              <div>
                <p className="text-xs text-slate-500">
                  {isLong && !expanded ? result.description.slice(0, 100) + "..." : result.description}
                </p>
                {isLong && (
                  <button type="button" onClick={() => toggleExpanded(index)} className="text-xs text-sky-500 hover:text-sky-700 mt-0.5">
                    {expanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}
            {result.venue && <p className="text-xs text-slate-400">{result.venue}</p>}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button type="button" onClick={onAdd} disabled={added || adding} className={"rounded-xl px-3 py-2 text-xs font-medium transition " + (added ? "bg-emerald-100 text-emerald-600 border border-emerald-200" : "btn-primary")}>
              {added ? "Added" : adding ? "Adding..." : "+ Add"}
            </button>
            {result.link && (
              <a href={result.link} target="_blank" rel="noopener noreferrer" className="rounded-xl px-3 py-2 text-xs font-medium text-center border border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600 transition">
                Details
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-sm">
        🥱 I&apos;m Bored!
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-sky-700">🥱 Find Activities</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mode === "bored" ? "Finding things near you right now" : "Finding things near " + tripDestination}
                </p>
              </div>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setMode("bored"); setHasSearched(false); setResults([]); }} className={"flex-1 rounded-xl border-2 py-2 text-sm font-medium transition " + (mode === "bored" ? activeBorder : inactiveBorder)}>
                🥱 Near me now
              </button>
              <button type="button" onClick={() => { setMode("plan"); setHasSearched(false); setResults([]); }} className={"flex-1 rounded-xl border-2 py-2 text-sm font-medium transition " + (mode === "plan" ? activeBorder : inactiveBorder)}>
                {"📍 Near " + destShort}
              </button>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">Filter by category (leave blank for all)</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat.id} type="button" onClick={() => toggleCategory(cat.id)} className={"rounded-full px-3 py-1 text-xs font-medium border transition " + (selectedCategories.includes(cat.id) ? activePill : inactivePill)}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={search} disabled={loading} className="btn-primary flex-1 py-3">
                {loading ? "Searching..." : "🔍 Find things to do"}
              </button>
              {hasSearched && results.length > 0 && (
                <button type="button" onClick={feelingLucky} className="btn-secondary px-4 py-3 text-sm whitespace-nowrap">
                  🎲 Feeling lucky
                </button>
              )}
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
            )}
            {luckyResult && (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-2">
                <p className="text-xs font-semibold text-amber-600 mb-1">🎲 Your lucky pick!</p>
                <ResultCard result={luckyResult} index={-1} added={luckyAdded} adding={addingIndex === -1} onAdd={handleAddLucky} />
                <button type="button" onClick={feelingLucky} className="text-xs text-amber-500 hover:text-amber-700">Try another</button>
              </div>
            )}
            {hasSearched && (
              <div className="space-y-3">
                {results.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No results found - try different categories!</p>
                ) : results.map((result, index) => (
                  <ResultCard key={index} result={result} index={index} added={addedIndexes.has(index)} adding={addingIndex === index} onAdd={() => handleAdd(result, index)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
