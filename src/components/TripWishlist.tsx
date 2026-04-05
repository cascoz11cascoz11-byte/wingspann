"use client";

import { useEffect, useState } from "react";
import {
  getTripWishlist,
  addTripWishlistItem,
  importBoardItemsToTripWishlist,
  scheduleTripWishlistItem,
  removeTripWishlistItem,
} from "@/lib/store";
import { addActivity } from "@/lib/store";
import type { TripWishlistItem } from "@/lib/store";

const TYPE_OPTIONS = [
  { value: "activity", label: "🎯 Activity" },
  { value: "restaurant", label: "🍽️ Restaurant" },
  { value: "stay", label: "🏨 Stay" },
  { value: "destination", label: "📍 Destination" },
];

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface Props {
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  sourceBoardId?: string;
  onActivityAdded: () => void;
}

type View = "list" | "schedule" | "add";

export function TripWishlist({ tripId, tripStartDate, tripEndDate, sourceBoardId, onActivityAdded }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("list");
  const [items, setItems] = useState<TripWishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TripWishlistItem | null>(null);
  const [scheduleDate, setScheduleDate] = useState(tripStartDate);
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduling, setScheduling] = useState(false);

  // Add form state
  const [addName, setAddName] = useState("");
  const [addType, setAddType] = useState<TripWishlistItem["type"]>("activity");
  const [addNotes, setAddNotes] = useState("");
  const [addLink, setAddLink] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addVenue, setAddVenue] = useState("");
  const [adding, setAdding] = useState(false);

  const dates = getDatesInRange(tripStartDate, tripEndDate);

  async function load() {
    setLoading(true);
    const data = await getTripWishlist(tripId);
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    if (open) load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function handleImport() {
    if (!sourceBoardId) return;
    setImporting(true);
    await importBoardItemsToTripWishlist(tripId, sourceBoardId);
    await load();
    setImporting(false);
  }

  async function handleSchedule() {
    if (!selectedItem || !scheduleDate) return;
    setScheduling(true);

    await addActivity(tripId, {
      title: selectedItem.name,
      description: selectedItem.description,
      date: scheduleDate,
      time: scheduleTime || undefined,
      location: selectedItem.venue,
      link: selectedItem.link,
      type: selectedItem.type === "restaurant" ? "meal"
          : selectedItem.type === "stay" ? "stay"
          : "event",

    });

    await scheduleTripWishlistItem(selectedItem.id);
    await load();

    setScheduling(false);
    setSelectedItem(null);
    setView("list");
    onActivityAdded();
  }

  async function handleAdd() {
    if (!addName.trim()) return;
    setAdding(true);
    await addTripWishlistItem(tripId, {
      name: addName.trim(),
      type: addType,
      notes: addNotes || undefined,
      link: addLink || undefined,
      price: addPrice || undefined,
      venue: addVenue || undefined,
    });
    setAddName("");
    setAddType("activity");
    setAddNotes("");
    setAddLink("");
    setAddPrice("");
    setAddVenue("");
    setAdding(false);
    await load();
    setView("list");
  }

  async function handleRemove(id: string) {
    await removeTripWishlistItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <>
      {/* Trigger button — drop this next to your other buttons */}
      <button
        type="button"
        onClick={() => { setOpen(true); setView("list"); }}
        className="flex items-center gap-1.5 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:border-sky-300 hover:text-sky-600 transition"
      >
        ✨ Wishlist
        {items.length > 0 && (
          <span className="ml-0.5 rounded-full bg-sky-100 text-sky-600 text-xs font-bold px-1.5 py-0.5 leading-none">
            {items.length}
          </span>
        )}
      </button>

      {/* Backdrop + modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              {view !== "list" ? (
                <button
                  type="button"
                  onClick={() => { setView("list"); setSelectedItem(null); }}
                  className="text-sm text-slate-400 hover:text-slate-600 transition"
                >
                  ← Back
                </button>
              ) : (
                <p className="text-sm font-semibold text-slate-700">
                  ✨ Trip Wishlist
                  {items.length > 0 && (
                    <span className="ml-2 text-xs text-slate-400 font-normal">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                  )}
                </p>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* ── List view ── */}
            {view === "list" && (
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Import from board button */}
                {sourceBoardId && (
                  <div className="px-4 pt-3">
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={importing}
                      className="w-full rounded-xl border-2 border-dashed border-sky-200 py-2 text-xs font-medium text-sky-500 hover:bg-sky-50 transition"
                    >
                      {importing ? "Importing..." : "⬇️ Import from linked board"}
                    </button>
                  </div>
                )}

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {loading ? (
                    <p className="text-sm text-slate-400 text-center py-8">Loading...</p>
                  ) : items.length === 0 ? (
                    <div className="text-center py-8 space-y-1">
                      <p className="text-2xl">✨</p>
                      <p className="text-sm text-slate-500">No wishlist items yet</p>
                      <p className="text-xs text-slate-400">Add something or import from your board</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                              {item.type}
                            </span>
                            {item.price && (
                              <span className="text-[10px] text-slate-400">{item.price}</span>
                            )}
                            {item.venue && (
                              <span className="text-[10px] text-slate-400 truncate">{item.venue}</span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => { setSelectedItem(item); setScheduleDate(tripStartDate); setScheduleTime(""); setView("schedule"); }}
                            className="text-xs font-semibold text-sky-500 hover:text-sky-700 transition whitespace-nowrap"
                          >
                            Add to day →
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(item.id)}
                            className="text-xs text-slate-300 hover:text-red-400 transition text-right"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add new item button */}
                <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setView("add")}
                    className="w-full rounded-xl bg-sky-500 hover:bg-sky-600 text-white py-2.5 text-sm font-semibold transition"
                  >
                    + Add to wishlist
                  </button>
                </div>
              </div>
            )}

            {/* ── Schedule view ── */}
            {view === "schedule" && selectedItem && (
              <div className="flex flex-col gap-4 p-4">
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                  <p className="text-sm font-semibold text-slate-800">{selectedItem.name}</p>
                  {selectedItem.venue && (
                    <p className="text-xs text-slate-400 mt-0.5">{selectedItem.venue}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Day
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                      {dates.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setScheduleDate(d)}
                          className={`rounded-xl px-3 py-2 text-xs font-medium transition text-left ${
                            scheduleDate === d
                              ? "bg-sky-500 text-white"
                              : "bg-slate-50 border border-slate-200 text-slate-600 hover:border-sky-300"
                          }`}
                        >
                          {formatDate(d)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                      Time <span className="font-normal normal-case">(optional)</span>
                    </label>
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSchedule}
                  disabled={scheduling || !scheduleDate}
                  className="w-full rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white py-2.5 text-sm font-semibold transition"
                >
                  {scheduling ? "Adding..." : "Add to itinerary ✓"}
                </button>
              </div>
            )}

            {/* ── Add new item view ── */}
            {view === "add" && (
              <div className="flex flex-col gap-3 p-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Name *</label>
                  <input
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="e.g. Sunset hike, Ramen spot..."
                    className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Type</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TYPE_OPTIONS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setAddType(t.value as TripWishlistItem["type"])}
                        className={`rounded-xl px-3 py-2 text-xs font-medium transition text-left ${
                          addType === t.value
                            ? "bg-sky-500 text-white"
                            : "bg-slate-50 border border-slate-200 text-slate-600 hover:border-sky-300"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Venue / Location</label>
                  <input
                    type="text"
                    value={addVenue}
                    onChange={(e) => setAddVenue(e.target.value)}
                    placeholder="e.g. 123 Main St"
                    className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Price</label>
                  <input
                    type="text"
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value)}
                    placeholder="e.g. $20/person, Free"
                    className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Link</label>
                  <input
                    type="url"
                    value={addLink}
                    onChange={(e) => setAddLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Notes</label>
                  <textarea
                    value={addNotes}
                    onChange={(e) => setAddNotes(e.target.value)}
                    placeholder="Any extra details..."
                    rows={2}
                    className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:outline-none resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={adding || !addName.trim()}
                  className="w-full rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white py-2.5 text-sm font-semibold transition"
                >
                  {adding ? "Adding..." : "Add to wishlist"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}