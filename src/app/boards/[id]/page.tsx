"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getBoard, getBoardItems, addBoardItem, removeBoardItem, toggleBoardItemHeart, createTrip } from "@/lib/store";
import type { Board, BoardItem } from "@/lib/store";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

const TYPE_CONFIG = {
  destination: { label: "Destination", emoji: "🌍", color: "bg-violet-100 text-violet-700" },
  stay:        { label: "Stay",        emoji: "🏠", color: "bg-emerald-100 text-emerald-700" },
  restaurant:  { label: "Restaurant",  emoji: "🍽️", color: "bg-amber-100 text-amber-700" },
  activity:    { label: "Activity",    emoji: "🎯", color: "bg-sky-100 text-sky-700" },
};

const TYPES = Object.entries(TYPE_CONFIG) as [BoardItem["type"], typeof TYPE_CONFIG[keyof typeof TYPE_CONFIG]][];

type SortMode = "hearts" | "type" | "recent";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function BoardPage() {
  const { id } = useParams() as { id: string };
  const [board, setBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("hearts");
  const [addOpen, setAddOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertStartDate, setConvertStartDate] = useState("");
  const [convertEndDate, setConvertEndDate] = useState("");
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Add form
  const [name, setName] = useState("");
  const [type, setType] = useState<BoardItem["type"]>("activity");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [venue, setVenue] = useState("");
  const [price, setPrice] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  async function load() {
    setLoading(true);
    const [b, i] = await Promise.all([getBoard(id), getBoardItems(id)]);
    setBoard(b ?? null);
    setItems(i);
    setLoading(false);
  }

  function getSorted(): BoardItem[] {
    if (sort === "hearts") return [...items].sort((a, b) => b.heartCount - a.heartCount);
    if (sort === "type") return [...items].sort((a, b) => a.type.localeCompare(b.type));
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const item = await addBoardItem(id, {
      name, type,
      description: description || undefined,
      notes: notes || undefined,
      venue: venue || undefined,
      price: price || undefined,
      link: link || undefined,
    });
    if (item) setItems((prev) => [item, ...prev]);
    setName(""); setType("activity"); setDescription(""); setNotes(""); setVenue(""); setPrice(""); setLink("");
    setAddOpen(false);
    setSaving(false);
  }

  async function handleHeart(itemId: string) {
    await toggleBoardItemHeart(itemId);
    setItems((prev) => prev.map((item) => item.id === itemId ? {
      ...item,
      heartCount: item.heartedByMe ? item.heartCount - 1 : item.heartCount + 1,
      heartedByMe: !item.heartedByMe,
    } : item));
    if (selectedItem?.id === itemId) {
      setSelectedItem((prev) => prev ? {
        ...prev,
        heartCount: prev.heartedByMe ? prev.heartCount - 1 : prev.heartCount + 1,
        heartedByMe: !prev.heartedByMe,
      } : null);
    }
  }

  async function handleRemove(itemId: string) {
    if (!confirm("Are you sure you want to remove this?")) return;
    await removeBoardItem(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    if (selectedItem?.id === itemId) setSelectedItem(null);
  }

  async function handleConvertToTrip() {
    if (!board) return;
    setConverting(true);
    const trip = await createTrip({
      name: board.title,
      destination: board.title,
      startDate: convertStartDate,
      endDate: convertEndDate,
      createdBy: board.createdBy,
      sourceBoardId: board.id,
    });
    if (trip) window.location.href = "/trips/" + trip.id;
    setConverting(false);
  }

  function copyLink() {
    if (!board) return;
    navigator.clipboard.writeText(window.location.origin + "/boards/join/" + board.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <div className="py-12 text-center text-slate-500">Loading...</div>;
  if (!board) return <div className="py-12 text-center text-slate-500">Board not found.</div>;

  const sorted = getSorted();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className={"bg-gradient-to-br " + board.gradient + " rounded-2xl p-6 text-white space-y-2"}>
        <div className="flex items-start justify-between">
          <span className="text-5xl drop-shadow">{board.emoji}</span>
          <Link href="/wishlist" className="text-white/70 hover:text-white text-sm">← Wishlist</Link>
        </div>
        <h1 className="font-display text-2xl font-bold">{board.title}</h1>
        {board.description && <p className="text-white/80 text-sm">{board.description}</p>}
        <div className="flex gap-2 pt-1 flex-wrap">
          <button type="button" onClick={copyLink} className="rounded-xl bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium transition">
            {copied ? "Copied!" : "📋 Share board"}
          </button>
          <button type="button" onClick={() => setAddOpen(true)} className="rounded-xl bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium transition">
            + Add idea
          </button>
          <button type="button" onClick={() => setConvertOpen(true)} className="rounded-xl bg-white/20 hover:bg-white/30 px-3 py-1.5 text-xs font-medium transition">
            ✈️ Turn into trip
          </button>
        </div>
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 flex-wrap">
        {([["hearts", "❤️ Most hearted"], ["type", "📂 By type"], ["recent", "🕐 Recently added"]] as [SortMode, string][]).map(([s, label]) => (
          <button key={s} type="button" onClick={() => setSort(s)} className={"rounded-full px-3 py-1.5 text-xs font-medium border-2 transition " + (sort === s ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500 hover:border-sky-200")}>
            {label}
          </button>
        ))}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
          <p className="text-2xl">💭</p>
          <p className="text-slate-600 font-medium">No ideas yet!</p>
          <p className="text-sm text-slate-400">Be the first to add something to this board.</p>
          <button type="button" onClick={() => setAddOpen(true)} className="btn-primary text-sm mt-2">+ Add first idea</button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => {
            const config = TYPE_CONFIG[item.type];
            const isMyItem = currentUserId && item.addedBy === currentUserId;
            return (
              <div
                key={item.id}
                className="card p-4 space-y-2 cursor-pointer hover:border-sky-200 transition"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={"text-xs font-medium rounded-full px-2 py-0.5 " + config.color}>{config.emoji} {config.label}</span>
                      {item.price && <span className="text-xs text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">{item.price}</span>}
                      {item.addedByName && <span className="text-xs text-slate-400">by {item.addedByName}</span>}
                      <span className="text-xs text-slate-300">{formatDate(item.createdAt)}</span>
                    </div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    {item.venue && <p className="text-xs text-slate-400">📍 {item.venue}</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 items-end" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => handleHeart(item.id)} className={"rounded-xl px-3 py-1.5 text-xs font-medium border-2 transition flex items-center gap-1 " + (item.heartedByMe ? "border-rose-300 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-400")}>
                      {item.heartedByMe ? "❤️" : "🤍"} {item.heartCount}
                    </button>
                    {isMyItem && (
                      <button type="button" onClick={() => handleRemove(item.id)} className="text-xs text-red-300 hover:text-red-500 transition">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Item detail popover */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedItem(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={"text-xs font-medium rounded-full px-2 py-0.5 " + TYPE_CONFIG[selectedItem.type].color}>
                  {TYPE_CONFIG[selectedItem.type].emoji} {TYPE_CONFIG[selectedItem.type].label}
                </span>
                {selectedItem.price && <span className="text-xs text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">{selectedItem.price}</span>}
              </div>
              <button type="button" onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none shrink-0">✕</button>
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-lg font-semibold text-slate-800">{selectedItem.name}</h3>
              {selectedItem.venue && <p className="text-sm text-slate-500">📍 {selectedItem.venue}</p>}
              {selectedItem.description && <p className="text-sm text-slate-600">{selectedItem.description}</p>}
              {selectedItem.notes && (
                <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                  <p className="text-xs font-medium text-amber-600 mb-0.5">📝 Notes</p>
                  <p className="text-sm text-amber-800">{selectedItem.notes}</p>
                </div>
              )}
              {selectedItem.addedByName && (
                <p className="text-xs text-slate-400">Added by {selectedItem.addedByName} · {formatDate(selectedItem.createdAt)}</p>
              )}
            </div>
            <div className="flex gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => handleHeart(selectedItem.id)}
                className={"rounded-xl px-4 py-2 text-sm font-medium border-2 transition flex items-center gap-1.5 " + (selectedItem.heartedByMe ? "border-rose-300 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-400")}
              >
                {selectedItem.heartedByMe ? "❤️" : "🤍"} {selectedItem.heartCount} {selectedItem.heartCount === 1 ? "heart" : "hearts"}
              </button>
              {selectedItem.link && (
                <a href={selectedItem.link} target="_blank" rel="noopener noreferrer" className="rounded-xl px-4 py-2 text-sm font-medium border border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600 transition">
                  🔗 Details
                </a>
              )}
              {currentUserId && selectedItem.addedBy === currentUserId && (
                <button type="button" onClick={() => handleRemove(selectedItem.id)} className="rounded-xl px-4 py-2 text-sm font-medium border border-red-100 text-red-400 hover:border-red-300 hover:text-red-600 transition ml-auto">
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Convert to trip modal */}
      {convertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConvertOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">✈️ Turn into trip</h3>
              <button type="button" onClick={() => setConvertOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <p className="text-sm text-slate-500">When are you going to <span className="font-medium text-slate-700">{board.title}</span>?</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start date</label>
                <input type="date" className="input" value={convertStartDate} onChange={e => setConvertStartDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End date</label>
                <input type="date" className="input" value={convertEndDate} onChange={e => setConvertEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setConvertOpen(false); handleConvertToTrip(); }}
                disabled={!convertStartDate || !convertEndDate || converting}
                className="btn-primary text-sm"
              >
                {converting ? "Creating..." : "Create trip"}
              </button>
              <button type="button" onClick={() => setConvertOpen(false)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">Add an idea</h3>
              <button type="button" onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input type="text" className="input" placeholder={type === "stay" ? "e.g. Airbnb in Providencia" : type === "restaurant" ? "e.g. Mercado Central" : type === "destination" ? "e.g. Valparaíso day trip" : "e.g. Cooking class"} value={name} onChange={e => setName(e.target.value)} required autoFocus />
              </div>
              {type !== "destination" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location (optional)</label>
                  <input type="text" className="input" placeholder="Address or neighborhood" value={venue} onChange={e => setVenue(e.target.value)} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <input type="text" className="input" placeholder="A short description..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
                <input type="text" className="input" placeholder="Why you want to do this..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price (optional)</label>
                <input type="text" className="input" placeholder="e.g. $50/person" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Link (optional)</label>
                <input type="text" className="input" placeholder="Airbnb, Google Maps, website..." value={link} onChange={e => setLink(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary text-sm" disabled={saving}>{saving ? "Adding..." : "Add to board"}</button>
                <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
