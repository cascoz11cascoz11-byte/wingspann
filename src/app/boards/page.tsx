"use client";
import { useEffect, useState } from "react";
import { getBoards, createBoard, deleteBoard } from "@/lib/store";
import type { Board } from "@/lib/store";
import Link from "next/link";

const GRADIENTS = [
  { label: "Sunset", value: "from-orange-400 to-pink-500" },
  { label: "Ocean", value: "from-sky-400 to-blue-600" },
  { label: "Forest", value: "from-emerald-400 to-teal-600" },
  { label: "Lavender", value: "from-violet-400 to-purple-600" },
  { label: "Golden", value: "from-amber-400 to-orange-500" },
  { label: "Rose", value: "from-rose-400 to-pink-600" },
  { label: "Arctic", value: "from-cyan-400 to-sky-600" },
  { label: "Jungle", value: "from-lime-400 to-emerald-600" },
];

const EMOJIS = ["🗺️","🌍","🌎","🌏","✈️","🏖️","🏔️","🌴","🗽","🏯","🎡","🍜","🍷","🎭","🎿","🤿","🧳","🌅"];

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🗺️");
  const [gradient, setGradient] = useState(GRADIENTS[0].value);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setBoards(await getBoards());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await createBoard({ title, description: description || undefined, emoji, gradient });
    await load();
    setTitle(""); setDescription(""); setEmoji("🗺️"); setGradient(GRADIENTS[0].value);
    setAddOpen(false);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this board?")) return;
    await deleteBoard(id);
    setBoards((prev) => prev.filter((b) => b.id !== id));
  }

  function copyLink(board: Board) {
    navigator.clipboard.writeText(window.location.origin + "/boards/join/" + board.inviteCode);
    setCopied(board.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-sky-700">🗺️ Dream Boards</h1>
          <p className="text-sm text-slate-500 mt-0.5">Collaborative trip mood boards</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="text-sm text-slate-500 hover:text-sky-600">← Back</Link>
          <button type="button" onClick={() => setAddOpen(true)} className="btn-primary text-sm">+ New board</button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-12">Loading...</p>
      ) : boards.length === 0 ? (
        <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
          <p className="text-3xl">🗺️</p>
          <p className="text-slate-600 font-medium">No dream boards yet</p>
          <p className="text-sm text-slate-400">Create a board for a destination and invite your crew to add ideas!</p>
          <button type="button" onClick={() => setAddOpen(true)} className="btn-primary text-sm mt-2">+ Create your first board</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {boards.map((board) => (
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
                  <button type="button" onClick={() => copyLink(board)} className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-sky-300 hover:text-sky-600 transition">
                    {copied === board.id ? "Copied!" : "📋 Share link"}
                  </button>
                  <button type="button" onClick={() => handleDelete(board.id)} className="rounded-xl border border-red-100 px-3 py-1.5 text-xs font-medium text-red-400 hover:border-red-300 hover:text-red-600 transition">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">New dream board</h3>
              <button type="button" onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            {/* Preview */}
            <div className={"bg-gradient-to-br " + gradient + " h-20 rounded-xl flex items-center justify-center"}>
              <span className="text-4xl drop-shadow">{emoji}</span>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Board name</label>
                <input type="text" className="input" placeholder="e.g. Santiago 2025" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <input type="text" className="input" placeholder="What's this trip about?" value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pick an emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((e) => (
                    <button key={e} type="button" onClick={() => setEmoji(e)} className={"rounded-xl p-2 text-xl transition border-2 " + (emoji === e ? "border-sky-400 bg-sky-50" : "border-transparent hover:border-slate-200")}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Pick a color</label>
                <div className="grid grid-cols-4 gap-2">
                  {GRADIENTS.map((g) => (
                    <button key={g.value} type="button" onClick={() => setGradient(g.value)} className={"rounded-xl h-10 bg-gradient-to-br transition " + g.value + (gradient === g.value ? " ring-2 ring-offset-2 ring-sky-400" : "")}>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary text-sm" disabled={saving}>{saving ? "Creating..." : "Create board"}</button>
                <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}