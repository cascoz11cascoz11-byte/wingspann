"use client";
import { useState } from "react";
import { addToWishlist } from "@/lib/store";
import type { Trip } from "@/types";

interface HomeActivityFinderProps {
  trips: Trip[];
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

export function HomeActivityFinder({ trips }: HomeActivityFinderProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [luckyResult, setLuckyResult] = useState<Result | null>(null);
  const [luckySaved, setLuckySaved] = useState(false);
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(new Set());
  const [shareToast, setShareToast] = useState(false);

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
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
    setSavedIndexes(new Set());
    setExpandedIndexes(new Set());
    setLuckyResult(null);
    setLuckySaved(false);
    try {
      const cats = selectedCategories.length > 0 ? selectedCategories : CATEGORIES.map(c => c.id);
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 })
      );
      const url = "/api/find-activities?categories=" + cats.join(",") + "&lat=" + pos.coords.latitude + "&lng=" + pos.coords.longitude;
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results ?? []);
      setHasSearched(true);
    } catch (e: any) {
      if (e.code === 1) setError("Location access denied. Please enable location permissions.");
      else setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function feelingLucky() {
    if (results.length === 0) return;
    setLuckyResult(results[Math.floor(Math.random() * results.length)]);
    setLuckySaved(false);
  }

  async function handleSave(result: Result, index: number) {
    setSavingIndex(index);
    await addToWishlist({
      name: result.name,
      category: result.category,
      description: result.description,
      venue: result.venue,
      price: result.price,
      link: result.link,
      distance: result.distance,
    });
    setSavedIndexes((prev) => { const next = new Set(prev); next.add(index); return next; });
    setSavingIndex(null);
  }

  async function handleSaveLucky() {
    if (!luckyResult) return;
    setSavingIndex(-1);
    await addToWishlist({
      name: luckyResult.name,
      category: luckyResult.category,
      description: luckyResult.description,
      venue: luckyResult.venue,
      price: luckyResult.price,
      link: luckyResult.link,
      distance: luckyResult.distance,
    });
    setLuckySaved(true);
    setSavingIndex(null);
  }

  function handleShare(result: Result) {
    const text = result.name + (result.venue ? " at " + result.venue : "") + (result.link ? " - " + result.link : "");
    if (navigator.share) {
      navigator.share({ title: result.name, text, url: result.link ?? window.location.href });
    } else {
      navigator.clipboard.writeText(text);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  }

  function close() {
    setOpen(false);
    setResults([]);
    setHasSearched(false);
    setSelectedCategories([]);
    setError(null);
    setLuckyResult(null);
    setLuckySaved(false);
    setExpandedIndexes(new Set());
  }

  const activePill = "bg-sky-500 border-sky-500 text-white";
  const inactivePill = "border-slate-200 text-slate-600 hover:border-sky-300";

  function ResultCard({ result, index, saved, saving, onSave, onShare }: {
    result: Result; index: number; saved: boolean; saving: boolean;
    onSave: () => void; onShare: () => void;
  }) {
    const cat = CATEGORIES.find(c => c.id === result.category);
    const expanded = expandedIndexes.has(index);
    const isLong = (result.description?.length ?? 0) > 100;
    return (
      <div className="rounded-xl border border-slate-200 p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {cat && <span className="text-xs font-medium text-sky-600 bg-sky-50 rounded-full px-2 py-0.5">{cat.label}</span>}
              {result.date && <span className="text-xs text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">{result.date}</span>}
              {result.price && <span className="text-xs text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">{result.price}</span>}
              {result.distance && <span className="text-xs text-sky-500 bg-sky-50 rounded-full px-2 py-0.5">{result.distance}</span>}
            </div>
            <p className="font-medium text-slate-800 text-sm">{result.name}</p>
            {result.description && (
              <div>
                <p className="text-xs text-slate-500">{isLong && !expanded ? result.description.slice(0, 100) + "..." : result.description}</p>
                {isLong && <button type="button" onClick={() => toggleExpanded(index)} className="text-xs text-sky-500 hover:text-sky-700 mt-0.5">{expanded ? "Show less" : "Show more"}</button>}
              </div>
            )}
            {result.venue && <p className="text-xs text-slate-400">{result.venue}</p>}
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button type="button" onClick={onSave} disabled={saved || saving} className={"rounded-xl px-3 py-2 text-xs font-medium transition " + (saved ? "bg-emerald-100 text-emerald-600 border border-emerald-200" : "btn-primary")}>
              {saved ? "Saved!" : saving ? "Saving..." : "🌟 Save"}
            </button>
            <button type="button" onClick={onShare} className="rounded-xl px-3 py-2 text-xs font-medium border border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600 transition">
              Share
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
    <div className="relative">
      {shareToast && (
        <div className="fixed top-4 right-4 z-50 rounded-xl bg-slate-800 text-white px-4 py-2 text-sm shadow-lg">
          Copied to clipboard!
        </div>
      )}
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-sm whitespace-nowrap">
        🥱 I&apos;m Bored!
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-sky-700">🥱 Find Activities</h3>
                <p className="text-xs text-slate-500 mt-0.5">Finding things near you right now</p>
              </div>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
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

            {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}

            {luckyResult && (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-2">
                <p className="text-xs font-semibold text-amber-600 mb-1">🎲 Your lucky pick!</p>
                <ResultCard result={luckyResult} index={-1} saved={luckySaved} saving={savingIndex === -1} onSave={handleSaveLucky} onShare={() => handleShare(luckyResult)} />
                <button type="button" onClick={feelingLucky} className="text-xs text-amber-500 hover:text-amber-700">Try another</button>
              </div>
            )}

            {hasSearched && (
              <div className="space-y-3">
                {results.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No results found - try different categories!</p>
                ) : results.map((result, index) => (
                  <ResultCard
                    key={index}
                    result={result}
                    index={index}
                    saved={savedIndexes.has(index)}
                    saving={savingIndex === index}
                    onSave={() => handleSave(result, index)}
                    onShare={() => handleShare(result)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}