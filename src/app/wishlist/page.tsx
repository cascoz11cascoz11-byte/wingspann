"use client";
import { useEffect, useState } from "react";
import { getWishlist, removeFromWishlist, addToWishlist, getTrips, addActivity, getBoards, getJoinedBoards, createBoard, deleteBoard, leaveBoard } from "@/lib/store";
import type { WishlistItem, Board } from "@/lib/store";
import type { Trip } from "@/types";
import Link from "next/link";
import { SpinTheGlobe } from "@/components/SpinTheGlobe";

const TYPE_CONFIG = {
  destination: { label: "Destination", emoji: "🌍", color: "bg-violet-100 text-violet-700" },
  stay:        { label: "Stay",        emoji: "🏠", color: "bg-emerald-100 text-emerald-700" },
  restaurant:  { label: "Restaurant",  emoji: "🍽️", color: "bg-amber-100 text-amber-700" },
  activity:    { label: "Activity",    emoji: "🎯", color: "bg-sky-100 text-sky-700" },
};

const TYPES = Object.entries(TYPE_CONFIG) as [WishlistItem["type"], typeof TYPE_CONFIG[keyof typeof TYPE_CONFIG]][];

const GRADIENTS = [
  { label: "Sunset",   value: "from-orange-400 to-pink-500" },
  { label: "Ocean",    value: "from-sky-400 to-blue-600" },
  { label: "Forest",   value: "from-emerald-400 to-teal-600" },
  { label: "Lavender", value: "from-violet-400 to-purple-600" },
  { label: "Golden",   value: "from-amber-400 to-orange-500" },
  { label: "Rose",     value: "from-rose-400 to-pink-600" },
  { label: "Arctic",   value: "from-cyan-400 to-sky-600" },
  { label: "Jungle",   value: "from-lime-400 to-emerald-600" },
];

const EMOJIS = ["🗺️","🌍","🌎","🌏","✈️","🏖️","🏔️","🌴","🗽","🏯","🎡","🍜","🍷","🎭","🎿","🤿","🧳","🌅"];

type Tab = "personal" | "shared" | "globe";

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function WishlistPage() {
  const [tab, setTab] = useState<Tab>("personal");

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<WishlistItem["type"] | "all">("all");
  const [addingTrip, setAddingTrip] = useState<{ itemId: string } | null>(null);
  const [addingToTripId, setAddingToTripId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<WishlistItem["type"]>("activity");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [venue, setVenue] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);

  // Boards state — now tracks created vs joined separately
  const [myBoards, setMyBoards] = useState<Board[]>([]);
  const [joinedBoards, setJoinedBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [boardAddOpen, setBoardAddOpen] = useState(false);
  const [boardTitle, setBoardTitle] = useState("");
  const [boardDesc, setBoardDesc] = useState("");
  const [boardEmoji, setBoardEmoji] = useState("🗺️");
  const [boardGradient, setBoardGradient] = useState(GRADIENTS[0].value);
  const [boardSaving, setBoardSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function loadPersonal() {
    setLoading(true);
    const [w, t] = await Promise.all([getWishlist(), getTrips()]);
    setItems(w);
    setTrips(t);
    setLoading(false);
  }

  async function loadBoards() {
    setBoardsLoading(true);
    const [mine, joined] = await Promise.all([getBoards(), getJoinedBoards()]);
    setMyBoards(mine);
    // Filter out any joined boards that user also owns (edge case)
    setJoinedBoards(joined.filter((j) => !mine.find((m) => m.id === j.id)));
    setBoardsLoading(false);
  }

  useEffect(() => { loadPersonal(); loadBoards(); }, []);

  function resetForm() {
    setName(""); setType("activity"); setDescription("");
    setNotes(""); setVenue(""); setPrice(""); setLink("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await addToWishlist({ name, type, description: description || undefined, notes: notes || undefined, venue: venue || undefined, price: price || undefined, link: link || undefined });
    await loadPersonal();
    resetForm();
    setAddOpen(false);
    setSaving(false);
  }

  async function handleRemove(id: string) {
    await removeFromWishlist(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleAddToTrip(item: WishlistItem, tripId: string) {
    setAddingToTripId(tripId);
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;
    await addActivity(tripId, {
      title: item.name,
      description: [item.description, item.notes].filter(Boolean).join(" — ") || undefined,
      date: trip.startDate,
      type: item.type === "restaurant" ? "meal" : item.type === "stay" ? "stay" : "event",
      location: item.venue || undefined,
      link: item.link || undefined,
    });
    setAddingToTripId(null);
    setAddingTrip(null);
  }

  async function handleCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    setBoardSaving(true);
    await createBoard({ title: boardTitle, description: boardDesc || undefined, emoji: boardEmoji, gradient: boardGradient });
    await loadBoards();
    setBoardTitle(""); setBoardDesc(""); setBoardEmoji("🗺️"); setBoardGradient(GRADIENTS[0].value);
    setBoardAddOpen(false);
    setBoardSaving(false);
  }

  async function handleDeleteBoard(id: string) {
    if (!confirm("Delete this board?")) return;
    await deleteBoard(id);
    setMyBoards((prev) => prev.filter((b) => b.id !== id));
  }

  async function handleLeaveBoard(id: string) {
    if (!confirm("Remove this board from your list?")) return;
    await leaveBoard(id);
    setJoinedBoards((prev) => prev.filter((b) => b.id !== id));
  }

  function copyBoardLink(board: Board) {
    navigator.clipboard.writeText(window.location.origin + "/boards/join/" + board.inviteCode);
    setCopied(board.id);
    setTimeout(() => setCopied(null), 2000);
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);
  const grouped = TYPES.reduce((acc, [t]) => {
    acc[t] = filtered.filter((i) => i.type === t);
    return acc;
  }, {} as Record<WishlistItem["type"], WishlistItem[]>);

  const activeTab = "border-b-2 border-sky-500 text-sky-600 font-semibold pb-2";
  const inactiveTab = "text-slate-500 hover:text-sky-500 pb-2 transition";

  const allBoards = [...myBoards, ...joinedBoards];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-sky-700">🌟 Wishlist</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your travel inspiration</p>
        </div>
        <div className="flex gap-2 items-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-sky-600">← Back</Link>
          {tab === "personal" && (
            <button type="button" onClick={() => setAddOpen(true)} className="btn-primary text-sm">+ Add</button>
          )}
          {tab === "shared" && (
            <button type="button" onClick={() => setBoardAddOpen(true)} className="btn-primary text-sm">+ New board</button>
          )}
        </div>
      </div>

      <div className="flex gap-6 border-b border-slate-200">
        <button type="button" onClick={() => setTab("personal")} className={tab === "personal" ? activeTab : inactiveTab}>
          🔒 Personal
        </button>
        <button type="button" onClick={() => setTab("shared")} className={tab === "shared" ? activeTab : inactiveTab}>
          🗺️ Shared Boards
          {allBoards.length > 0 && (
            <span className="ml-1.5 rounded-full bg-sky-100 text-sky-600 text-[10px] font-bold px-1.5 py-0.5">
              {allBoards.length}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setTab("globe")} className={tab === "globe" ? activeTab : inactiveTab}>
          🎯 Throw a Dart
        </button>
      </div>

      {tab === "personal" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => setFilter("all")} className={"rounded-full px-3 py-1.5 text-xs font-medium border-2 transition " + (filter === "all" ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500 hover:border-sky-200")}>
              All {items.length > 0 && `(${items.length})`}
            </button>
            {TYPES.map(([t, config]) => {
              const count = items.filter((i) => i.type === t).length;
              if (count === 0) return null;
              return (
                <button key={t} type="button" onClick={() => setFilter(t)} className={"rounded-full px-3 py-1.5 text-xs font-medium border-2 transition " + (filter === t ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500 hover:border-sky-200")}>
                  {config.emoji} {config.label} ({count})
                </button>
              );
            })}
          </div>

          {loading ? (
            <p className="text-slate-500 text-center py-12">Loading...</p>
          ) : items.length === 0 ? (
            <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
              <p className="text-3xl">🌟</p>
              <p className="text-slate-600 font-medium">Your wishlist is empty</p>
              <p className="text-sm text-slate-400">Add destinations, stays, restaurants, and activities you want to do!</p>
              <button type="button" onClick={() => setAddOpen(true)} className="btn-primary text-sm mt-2">+ Add something</button>
            </div>
          ) : (
            <div className="space-y-6">
              {TYPES.map(([t, config]) => {
                const group = grouped[t];
                if (!group || group.length === 0) return null;
                return (
                  <div key={t}>
                    <h2 className="font-display text-base font-semibold text-slate-700 mb-3">{config.emoji} {config.label}s</h2>
                    <div className="space-y-3">
                      {group.map((item) => (
                        <div key={item.id} className="card p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={"text-xs font-medium rounded-full px-2 py-0.5 " + config.color}>{config.emoji} {config.label}</span>
                                {item.price && <span className="text-xs text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">{item.price}</span>}
                              </div>
                              <p className="font-medium text-slate-800">{item.name}</p>
                              {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                              {item.notes && <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 mt-1">📝 {item.notes}</p>}
                              {item.venue && <p className="text-xs text-slate-400">📍 {item.venue}</p>}
                              <p className="text-xs text-slate-300">Added {formatDate(item.createdAt)}</p>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setAddingTrip(addingTrip?.itemId === item.id ? null : { itemId: item.id })}
                                className="rounded-xl px-3 py-1.5 text-xs font-medium btn-primary"
                              >
                                + Add to trip
                              </button>
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
                          {addingTrip?.itemId === item.id && (
                            <div className="rounded-xl border-2 border-sky-100 bg-sky-50 p-3 space-y-2">
                              <p className="text-xs font-medium text-sky-700">Which trip?</p>
                              {trips.length === 0 ? (
                                <p className="text-xs text-slate-400">No trips yet — <Link href="/trips/new" className="text-sky-500 hover:underline">create one first</Link></p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {trips.map((trip) => (
                                    <button key={trip.id} type="button" onClick={() => handleAddToTrip(item, trip.id)} disabled={addingToTripId === trip.id} className="rounded-lg bg-white border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 transition">
                                      {addingToTripId === trip.id ? "Adding..." : trip.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <button type="button" onClick={() => setAddingTrip(null)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "shared" && (
        <div className="space-y-6">
          {boardsLoading ? (
            <p className="text-slate-500 text-center py-12">Loading...</p>
          ) : allBoards.length === 0 ? (
            <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
              <p className="text-3xl">🗺️</p>
              <p className="text-slate-600 font-medium">No shared boards yet</p>
              <p className="text-sm text-slate-400">Create a board and invite your crew, or accept an invite link from someone else!</p>
              <button type="button" onClick={() => setBoardAddOpen(true)} className="btn-primary text-sm mt-2">+ Create first board</button>
            </div>
          ) : (
            <>
              {/* My boards */}
              {myBoards.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">My boards</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {myBoards.map((board) => (
                      <div key={board.id} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition">
                        <Link href={"/boards/" + board.id}>
                          <div className={"bg-gradient-to-br " + board.gradient + " h-24 flex items-center justify-center"}>
                            <span className="text-5xl drop-shadow-lg">{board.emoji}</span>
                          </div>
                        </Link>
                        <div className="p-4 space-y-3">
                          <div>
                            <Link href={"/boards/" + board.id}>
                              <h2 className="font-display text-base font-semibold text-slate-800 hover:text-sky-600 transition">{board.title}</h2>
                            </Link>
                            {board.description && <p className="text-xs text-slate-500 mt-0.5">{board.description}</p>}
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => copyBoardLink(board)} className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-sky-300 hover:text-sky-600 transition">
                              {copied === board.id ? "Copied!" : "📋 Share link"}
                            </button>
                            <button type="button" onClick={() => handleDeleteBoard(board.id)} className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-medium text-red-400 hover:border-red-300 hover:text-red-600 transition">
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Joined boards */}
              {joinedBoards.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Joined boards</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {joinedBoards.map((board) => (
                      <div key={board.id} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition">
                        <Link href={"/boards/" + board.id}>
                          <div className={"bg-gradient-to-br " + board.gradient + " h-24 flex items-center justify-center"}>
                            <span className="text-5xl drop-shadow-lg">{board.emoji}</span>
                          </div>
                        </Link>
                        <div className="p-4 space-y-3">
                          <div>
                            <Link href={"/boards/" + board.id}>
                              <h2 className="font-display text-base font-semibold text-slate-800 hover:text-sky-600 transition">{board.title}</h2>
                            </Link>
                            {board.description && <p className="text-xs text-slate-500 mt-0.5">{board.description}</p>}
                          </div>
                          <div className="flex gap-2">
                            <Link href={"/boards/" + board.id} className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-sky-300 hover:text-sky-600 transition text-center">
                              View board →
                            </Link>
                            <button type="button" onClick={() => handleLeaveBoard(board.id)} className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-medium text-red-400 hover:border-red-300 hover:text-red-600 transition">
                              Leave
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === "globe" && (
        <SpinTheGlobe />
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setAddOpen(false); resetForm(); }} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">Add to wishlist</h3>
              <button type="button" onClick={() => { setAddOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map(([t, config]) => (
                    <button key={t} type="button" onClick={() => setType(t)} className={"rounded-xl border-2 px-3 py-2 text-sm font-medium transition text-left " + (type === t ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600 hover:border-sky-200")}>
                      {config.emoji} {config.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {type === "destination" ? "Destination name" : type === "stay" ? "Property name" : type === "restaurant" ? "Restaurant name" : "Activity name"}
                </label>
                <input type="text" className="input" placeholder={type === "destination" ? "e.g. Patagonia, Chile" : type === "stay" ? "e.g. Airbnb in Buenos Aires" : type === "restaurant" ? "e.g. Don Julio" : "e.g. White water rafting"} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </div>
              {type !== "destination" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location (optional)</label>
                  <input type="text" className="input" placeholder="e.g. Santiago, Chile" value={venue} onChange={(e) => setVenue(e.target.value)} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <input type="text" className="input" placeholder="A short description..." value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                <input type="text" className="input" placeholder="Why you want to go, who told you about it..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price (optional)</label>
                <input type="text" className="input" placeholder="e.g. $50/person, $$" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link (optional)</label>
                <input type="text" className="input" placeholder="Airbnb, TripAdvisor, website..." value={link} onChange={(e) => setLink(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary text-sm" disabled={saving}>{saving ? "Saving..." : "Add to wishlist"}</button>
                <button type="button" onClick={() => { setAddOpen(false); resetForm(); }} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {boardAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setBoardAddOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">New shared board</h3>
              <button type="button" onClick={() => setBoardAddOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <div className={"bg-gradient-to-br " + boardGradient + " h-20 rounded-xl flex items-center justify-center"}>
              <span className="text-4xl drop-shadow">{boardEmoji}</span>
            </div>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Board name</label>
                <input type="text" className="input" placeholder="e.g. Santiago 2025" value={boardTitle} onChange={e => setBoardTitle(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <input type="text" className="input" placeholder="What's this trip about?" value={boardDesc} onChange={e => setBoardDesc(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pick an emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => setBoardEmoji(e)} className={"rounded-xl p-2 text-xl transition border-2 " + (boardEmoji === e ? "border-sky-400 bg-sky-50" : "border-transparent hover:border-slate-200")}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pick a color</label>
                <div className="grid grid-cols-4 gap-2">
                  {GRADIENTS.map((g) => (
                    <button key={g.value} type="button" onClick={() => setBoardGradient(g.value)} className={"rounded-xl h-10 bg-gradient-to-br transition " + g.value + (boardGradient === g.value ? " ring-2 ring-offset-2 ring-sky-400" : "")} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary text-sm" disabled={boardSaving}>{boardSaving ? "Creating..." : "Create board"}</button>
                <button type="button" onClick={() => setBoardAddOpen(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}