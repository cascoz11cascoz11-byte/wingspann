"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBoardByInviteCode, getBoardItemsById, joinBoard, hasJoinedBoard } from "@/lib/store";
import type { Board, BoardItem } from "@/lib/store";
import Link from "next/link";

const TYPE_CONFIG: Record<string, { emoji: string; color: string }> = {
  destination: { emoji: "🌍", color: "bg-violet-100 text-violet-700" },
  stay:        { emoji: "🏠", color: "bg-emerald-100 text-emerald-700" },
  restaurant:  { emoji: "🍽️", color: "bg-amber-100 text-amber-700" },
  activity:    { emoji: "🎯", color: "bg-sky-100 text-sky-700" },
};

export default function BoardJoinPage() {
  const { code } = useParams() as { code: string };
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    async function load() {
      const b = await getBoardByInviteCode(code);
      if (!b) { setLoading(false); return; }
      const [boardItems, already] = await Promise.all([
        getBoardItemsById(b.id),
        hasJoinedBoard(b.id),
      ]);
      setBoard(b);
      setItems(boardItems);
      setAlreadyJoined(already);
      setLoading(false);
    }
    load();
  }, [code]);

  async function handleJoin() {
    if (!board) return;
    setJoining(true);
    await joinBoard(board.id);
    setJoining(false);
    setJoined(true);
  }

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Loading board...</div>;
  }

  if (!board) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-2xl">😕</p>
        <p className="text-slate-600 font-medium">Board not found</p>
        <Link href="/" className="text-sky-500 hover:underline text-sm">Go home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

      {/* Board hero */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div className={"bg-gradient-to-br " + board.gradient + " h-32 flex items-center justify-center"}>
          <span className="text-6xl drop-shadow-lg">{board.emoji}</span>
        </div>
        <div className="p-5 space-y-1">
          <h1 className="font-display text-xl font-bold text-slate-800">{board.title}</h1>
          {board.description && (
            <p className="text-sm text-slate-500">{board.description}</p>
          )}
          <p className="text-xs text-slate-400">{items.length} item{items.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Accept / already joined */}
      {joined ? (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-center space-y-3">
          <p className="text-2xl">🎉</p>
          <p className="text-sm font-semibold text-emerald-700">Added to your shared boards!</p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={() => router.push("/boards/" + board.id)}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-sm font-semibold transition"
            >
              View board →
            </button>
            <button
              type="button"
              onClick={() => router.push("/wishlist?tab=shared")}
              className="rounded-xl border border-emerald-200 text-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-50 transition"
            >
              My boards
            </button>
          </div>
        </div>
      ) : alreadyJoined ? (
        <div className="rounded-2xl bg-sky-50 border border-sky-200 p-5 text-center space-y-3">
          <p className="text-sm font-semibold text-sky-700">You already have this board saved ✓</p>
          <button
            type="button"
            onClick={() => router.push("/boards/" + board.id)}
            className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 text-sm font-semibold transition"
          >
            View board →
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
          <p className="text-sm text-slate-600 text-center">
            You were invited to this shared board. Add it to your boards so you can find it anytime.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining}
              className="flex-1 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white py-2.5 text-sm font-semibold transition"
            >
              {joining ? "Adding..." : "✓ Add to my boards"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/boards/" + board.id)}
              className="flex-1 rounded-xl border-2 border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600 py-2.5 text-sm font-semibold transition"
            >
              Just view →
            </button>
          </div>
        </div>
      )}

      {/* Preview of items */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            What's on this board
          </p>
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => {
              const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.activity;
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-2.5">
                  <span className={"text-xs font-semibold rounded-full px-2 py-0.5 mt-0.5 shrink-0 " + config.color}>
                    {config.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {item.addedByName && (
                        <span className="text-xs text-slate-400">Added by {item.addedByName}</span>
                      )}
                      {item.price && (
                        <span className="text-xs text-emerald-600">{item.price}</span>
                      )}
                      {item.heartCount > 0 && (
                        <span className="text-xs text-rose-400">♥ {item.heartCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {items.length > 5 && (
              <p className="text-xs text-slate-400 text-center">
                +{items.length - 5} more items on the board
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}