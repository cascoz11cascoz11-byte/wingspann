"use client";

import { useState, useEffect } from "react";
import { addActivity, getWishlist, getBoardItemsById } from "@/lib/store";
import type { WishlistItem } from "@/lib/store";
import type { Activity } from "@/types";

interface AddActivityProps {
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  sourceBoardId?: string;
  onAdded: () => void;
}

const ACTIVITY_TYPES: { value: Activity["type"]; label: string }[] = [
  { value: "event", label: "Event" },
  { value: "meal", label: "Meal" },
  { value: "travel", label: "Travel" },
  { value: "stay", label: "Stay" },
  { value: "other", label: "Other" },
];

const TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  destination: { label: "Destination", emoji: "🌍", color: "bg-violet-100 text-violet-700" },
  stay:        { label: "Stay",        emoji: "🏠", color: "bg-emerald-100 text-emerald-700" },
  restaurant:  { label: "Restaurant",  emoji: "🍽️", color: "bg-amber-100 text-amber-700" },
  activity:    { label: "Activity",    emoji: "🎯", color: "bg-sky-100 text-sky-700" },
};

function getTripDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T12:00:00");
  const last = new Date(end + "T12:00:00");
  while (cur <= last) {
    dates.push(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

type Tab = "new" | "wishlist";

export function AddActivity({ tripId, tripStartDate, tripEndDate, sourceBoardId, onAdded }: AddActivityProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("new");

  // New activity form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState<Activity["type"]>("event");
  const [travelSubtype, setTravelSubtype] = useState<"flight" | "drive" | "other">("flight");
  const [departureLocation, setDepartureLocation] = useState("");
  const [arrivalLocation, setArrivalLocation] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [driveTime, setDriveTime] = useState("");
  const [calculatingDrive, setCalculatingDrive] = useState(false);
  const [saving, setSaving] = useState(false);

  // Wishlist tab
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [selectedWishlistItem, setSelectedWishlistItem] = useState<WishlistItem | null>(null);
  const [wishlistDate, setWishlistDate] = useState("");
  const [addingWishlist, setAddingWishlist] = useState(false);

  const tripDates = getTripDates(tripStartDate, tripEndDate);

  useEffect(() => {
    if (travelSubtype !== "drive" || !departureLocation || !arrivalLocation) return;
    const timeout = setTimeout(async () => {
      setCalculatingDrive(true);
      try {
        const res = await fetch("/api/drive-time?origin=" + encodeURIComponent(departureLocation) + "&destination=" + encodeURIComponent(arrivalLocation));
        const data = await res.json();
        if (data.duration) setDriveTime(data.duration);
        else setDriveTime("");
      } catch {
        setDriveTime("");
      }
      setCalculatingDrive(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [departureLocation, arrivalLocation, travelSubtype]);

  async function loadWishlist() {
    setWishlistLoading(true);
    if (sourceBoardId) {
      const items = await getBoardItemsById(sourceBoardId);
      setWishlist(items.filter(i => i.type !== "destination").map(i => ({
        id: i.id,
        userId: "",
        name: i.name,
        type: i.type,
        description: i.description,
        notes: i.notes,
        venue: i.venue,
        price: i.price,
        link: i.link,
        createdAt: i.createdAt,
      })));
    } else {
      setWishlist(await getWishlist());
    }
    setWishlistLoading(false);
  }

  function resetForm() {
    setTitle(""); setDescription(""); setDate(""); setCheckOutDate("");
    setTime(""); setEndTime(""); setLocation(""); setLink("");
    setType("event"); setTravelSubtype("flight");
    setDepartureLocation(""); setArrivalLocation(""); setArrivalTime("");
    setFlightNumber(""); setDriveTime(""); setSaving(false);
    setSelectedWishlistItem(null); setWishlistDate("");
  }

  function close() {
    resetForm();
    setOpen(false);
    setTab("new");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    let finalTitle = title;
    if (type === "travel") {
      if (travelSubtype === "drive") finalTitle = "Drive: " + departureLocation + " to " + arrivalLocation;
      if (travelSubtype === "flight") finalTitle = "Flight " + flightNumber + ": " + departureLocation + " to " + arrivalLocation;
      if (travelSubtype === "other") finalTitle = title;
    }

    await addActivity(tripId, {
      title: finalTitle,
      description: description || undefined,
      date,
      checkOutDate: type === "stay" ? checkOutDate || undefined : undefined,
      time: time || undefined,
      endTime: endTime || undefined,
      location: location || undefined,
      link: link || undefined,
      type,
      travelSubtype: type === "travel" ? travelSubtype : undefined,
      departureLocation: departureLocation || undefined,
      arrivalLocation: arrivalLocation || undefined,
      arrivalTime: arrivalTime || undefined,
      flightNumber: flightNumber || undefined,
      driveTime: driveTime || undefined,
    });

    resetForm();
    setOpen(false);
    onAdded();
  }

  async function handleAddFromWishlist() {
    if (!selectedWishlistItem || !wishlistDate) return;
    setAddingWishlist(true);
    await addActivity(tripId, {
      title: selectedWishlistItem.name,
      description: [selectedWishlistItem.description, selectedWishlistItem.notes].filter(Boolean).join(" — ") || undefined,
      date: wishlistDate,
      type: selectedWishlistItem.type === "restaurant" ? "meal" : selectedWishlistItem.type === "stay" ? "stay" : "event",
      location: selectedWishlistItem.venue || undefined,
      link: selectedWishlistItem.link || undefined,
    });
    setAddingWishlist(false);
    close();
    onAdded();
  }

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); loadWishlist(); }} className="btn-primary text-sm">
        Add activity
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">Add activity</h3>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
              <button type="button" onClick={() => setTab("new")} className={"pb-2 text-sm font-medium transition border-b-2 " + (tab === "new" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-sky-500")}>
                ✏️ New activity
              </button>
              <button type="button" onClick={() => setTab("wishlist")} className={"pb-2 text-sm font-medium transition border-b-2 " + (tab === "wishlist" ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-sky-500")}>
                {sourceBoardId ? "🗺️ From board" : "🌟 From wishlist"}
              </button>
            </div>

            {/* New activity tab */}
            {tab === "new" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Category</label>
                  <select className="input mt-1" value={type} onChange={(e) => setType(e.target.value as Activity["type"])}>
                    {ACTIVITY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {type === "travel" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Travel type</label>
                    <div className="mt-2 flex gap-3">
                      {[{ value: "flight", label: "Flight" }, { value: "drive", label: "Drive" }, { value: "other", label: "Other" }].map((t) => (
                        <button key={t.value} type="button" onClick={() => setTravelSubtype(t.value as "flight" | "drive" | "other")} className={"rounded-xl border-2 px-4 py-2 text-sm font-medium transition " + (travelSubtype === t.value ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600 hover:border-sky-200")}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {type === "travel" && travelSubtype === "flight" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Flight number</label>
                    <input type="text" className="input mt-1" placeholder="e.g. AA1234" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value.toUpperCase())} required />
                  </div>
                )}

                {type === "travel" && (travelSubtype === "drive" || travelSubtype === "flight") && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{travelSubtype === "drive" ? "Departing from" : "Departure airport"}</label>
                      <input type="text" className="input mt-1" placeholder={travelSubtype === "drive" ? "e.g. Charlotte, NC" : "e.g. CLT - Charlotte"} value={departureLocation} onChange={(e) => setDepartureLocation(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">{travelSubtype === "drive" ? "Arriving at" : "Arrival airport"}</label>
                      <input type="text" className="input mt-1" placeholder={travelSubtype === "drive" ? "e.g. Outer Banks, NC" : "e.g. ORF - Norfolk"} value={arrivalLocation} onChange={(e) => setArrivalLocation(e.target.value)} required />
                    </div>
                    {travelSubtype === "drive" && (
                      <div className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                        {calculatingDrive ? "Calculating drive time..." : driveTime ? "Est. drive time: " + driveTime : "Enter locations above to calculate drive time"}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Departure time</label>
                        <input type="time" className="input mt-1" value={time} onChange={(e) => setTime(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Arrival time</label>
                        <input type="time" className="input mt-1" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}

                {type === "stay" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Name</label>
                      <input type="text" className="input mt-1" placeholder="e.g. Beach House, Airbnb Santiago" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Location</label>
                      <input type="text" className="input mt-1" placeholder="e.g. Santiago, Chile" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Check in</label>
                        <input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Check out</label>
                        <input type="date" className="input mt-1" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} required />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Link (optional)</label>
                      <input type="text" className="input mt-1" placeholder="Airbnb, VRBO, hotel link..." value={link} onChange={(e) => setLink(e.target.value)} />
                    </div>
                  </>
                )}

                {(type !== "travel" || travelSubtype === "other") && type !== "stay" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Title</label>
                      <input type="text" className="input mt-1" placeholder="e.g. Beach day" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Date</label>
                      <input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700">Start time</label>
                        <input type="time" className="input mt-1" value={time} onChange={(e) => setTime(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700">End time (optional)</label>
                        <input type="time" className="input mt-1" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Location (optional)</label>
                      <input type="text" className="input mt-1" placeholder="e.g. Gulf Shores, AL" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                  </>
                )}

                {type === "travel" && travelSubtype !== "other" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Date</label>
                    <input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                )}

                {type !== "stay" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
                      <textarea rows={2} className="input mt-1 resize-none" placeholder="Details..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Link (optional)</label>
                      <input type="text" className="input mt-1" placeholder="Paste a URL or leave blank" value={link} onChange={(e) => setLink(e.target.value)} />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="btn-primary text-sm" disabled={saving}>{saving ? "Adding..." : "Add to itinerary"}</button>
                  <button type="button" onClick={close} className="btn-secondary text-sm">Cancel</button>
                </div>
              </form>
            )}

            {/* Wishlist/Board tab */}
            {tab === "wishlist" && (
              <div className="space-y-4">
                {wishlistLoading ? (
                  <p className="text-sm text-slate-500 text-center py-6">Loading...</p>
                ) : wishlist.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-2xl">{sourceBoardId ? "🗺️" : "🌟"}</p>
                    <p className="text-sm text-slate-500">{sourceBoardId ? "No items on this board yet!" : "Your wishlist is empty!"}</p>
                    <p className="text-xs text-slate-400">{sourceBoardId ? "Add ideas to the board first." : "Add things to your wishlist first, then you can add them to trips."}</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-slate-500">{sourceBoardId ? "Pick an idea from this trip's board:" : "Pick something from your wishlist:"}</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {wishlist.filter(i => i.type !== "destination").map((item) => {
                        const config = TYPE_CONFIG[item.type];
                        const isSelected = selectedWishlistItem?.id === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedWishlistItem(isSelected ? null : item)}
                            className={"w-full text-left rounded-xl border-2 p-3 transition " + (isSelected ? "border-sky-400 bg-sky-50" : "border-slate-200 hover:border-sky-200")}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={"text-xs font-medium rounded-full px-2 py-0.5 " + config.color}>{config.emoji} {config.label}</span>
                              {item.price && <span className="text-xs text-emerald-600">{item.price}</span>}
                            </div>
                            <p className="font-medium text-slate-800 text-sm mt-1">{item.name}</p>
                            {item.venue && <p className="text-xs text-slate-400">📍 {item.venue}</p>}
                          </button>
                        );
                      })}
                    </div>

                    {selectedWishlistItem && (
                      <div className="space-y-3 pt-2 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-600">Which day?</p>
                        <div className="flex flex-wrap gap-2">
                          {tripDates.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setWishlistDate(d)}
                              className={"rounded-lg border px-3 py-1.5 text-xs font-medium transition " + (wishlistDate === d ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600 hover:border-sky-200")}
                            >
                              {formatDateLabel(d)}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button type="button" onClick={handleAddFromWishlist} disabled={!wishlistDate || addingWishlist} className="btn-primary text-sm">
                            {addingWishlist ? "Adding..." : "Add to itinerary"}
                          </button>
                          <button type="button" onClick={close} className="btn-secondary text-sm">Cancel</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}