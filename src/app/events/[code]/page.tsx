"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getStandaloneEventByInviteCode, updateStandaloneEventMemberStatus } from "@/lib/store";
import type { StandaloneEvent } from "@/lib/store";

function formatDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return (h % 12 || 12) + ":" + m.toString().padStart(2, "0") + " " + ampm;
}

export default function EventRSVPPage() {
  const { code } = useParams() as { code: string };
  const [event, setEvent] = useState<StandaloneEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [responding, setResponding] = useState(false);
  const [response, setResponse] = useState<"accepted" | "declined" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const e = await getStandaloneEventByInviteCode(code);
      setEvent(e ?? null);
      setLoading(false);
    }
    load();
  }, [code]);

  async function handleRespond(status: "accepted" | "declined") {
    if (!event || !email) return;
    setResponding(true);
    const ok = await updateStandaloneEventMemberStatus(event.id, email, status);
    if (ok) setResponse(status);
    else setError("Couldn't find your invite. Check your email address.");
    setResponding(false);
  }

  if (loading) return <div className="py-12 text-center text-slate-500">Loading...</div>;
  if (!event) return <div className="py-12 text-center text-slate-500">Event not found.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="card p-6 space-y-4 text-center">
          <p className="text-3xl">🎉</p>
          <h1 className="font-display text-2xl font-semibold text-sky-700">{event.title}</h1>
          <div className="space-y-1 text-slate-600">
            <p>{formatDate(event.date)}</p>
            {event.time && <p>{formatTime(event.time)}</p>}
            {event.location && <p className="text-sm text-slate-500">📍 {event.location}</p>}
          </div>

          {response ? (
            <div className={"rounded-xl px-4 py-3 text-sm font-medium " + (response === "accepted" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>
              {response === "accepted" ? "You're going! See you there 🎉" : "Got it, maybe next time!"}
            </div>
          ) : (
            <div className="space-y-3 text-left">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your email</label>
                <input
                  type="email"
                  className="input"
                  placeholder="Enter the email you were invited with"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => handleRespond("accepted")} disabled={!email || responding} className="btn-primary flex-1">
                  {responding ? "Saving..." : "I'm going!"}
                </button>
                <button type="button" onClick={() => handleRespond("declined")} disabled={!email || responding} className="btn-secondary flex-1">
                  Can't make it
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}