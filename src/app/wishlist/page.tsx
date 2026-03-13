"use client";
import { useEffect, useState } from "react";
import { getWishlist, removeFromWishlist } from "@/lib/store";
import type { WishlistItem } from "@/lib/store";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  concerts: "Concerts", sports: "Sports", theater: "Theater",
  restaurants: "Restaurants", outdoor: "Outdoor", museums: "Museums",
  family: "Family", comestoyou: "Comes to you",
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setItems(await getWishlist());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(id: string) {
    await removeFromWishlist(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-sky-700">Wishlist</h1>
          <p className="text-sm text-slate-500 mt-0.5">Activities you want to do someday</p>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-sky-600">Back to trips</Link>
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-12">Loading...</p>
      ) : items.length === 0 ? (
        <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
          <p className="text-2xl">🌟</p>
          <p className="text-slate-600 font-medium">Your wishlist is empty</p>
          <p className="text-sm text-slate-400">Hit the I'm Bored button and save things you want to do!</p>
          <Link href="/" className="inline-block mt-2 text-sm text-sky-600 hover:underline">Go explore</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.category && (
                      <span className="text-xs font-medium text-sky-600 bg-sky-50 rounded-full px-2 py-0.5">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                    )}
                    {item.price && <span className="text-xs text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">{item.price}</span>}
                    {item.distance && <span className="text-xs text-sky-500 bg-sky-50 rounded-full px-2 py-0.5">{item.distance}</span>}
                  </div>
                  <p className="font-medium text-slate-800">{item.name}</p>
                  {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                  {item.venue && <p className="text-xs text-slate-400">📍 {item.venue}</p>}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="rounded-xl px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600 transition text-center">
                      Details
                    </a>
                  )}
                  <button type="button" onClick={() => handleRemove(item.id)} className="rounded-xl px-3 py-1.5 text-xs font-medium border border-red-100 text-red-400 hover:border-red-300 hover:text-red-600 transition">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}