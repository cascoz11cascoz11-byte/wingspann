"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTripByInviteCode, addMember } from "@/lib/store";
import { createClient } from "@/lib/supabase";
import type { Trip } from "@/types";

function formatDateRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const e = new Date(end).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  return `${s} - ${e}`;
}

export default function JoinTripPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    async function load() {
      const t = await getTripByInviteCode(code);
      setTrip(t ?? null);
      setLoading(false);
    }
    load();
  }, [code]);

  async function handleRSVP(status: "accepted" | "declined") {
    setResponding(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?redirect=/join/" + code);
      return;
    }
    await addMember(trip!.id, {
      name: user.email!,
      email: user.email!,
      status,
    });
    if (status === "accepted") {
      router.push("/trips/" + trip!.id);
    } else {
      router.push("/");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-50">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-50">
        <div className="card w-full max-w-md p-8 text-center">
          <p className="text-2xl">😕</p>
          <h1 className="mt-2 font-display text-xl font-bold text-slate-700">Invalid invite link</h1>
          <p className="mt-1 text-slate-500">This invite link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sky-50 px-4 py-12">
      <div className="card w-full max-w-lg p-8">
        <div className="text-center">
          <p className="text-4xl">✈️</p>
          <h1 className="mt-4 font-display text-2xl font-bold text-sky-600">You are invited!</h1>
          <p className="mt-1 text-slate-500">Here are the trip details</p>
        </div>

        <div className="mt-6 rounded-2xl bg-sky-50 p-6 space-y-2">
          <h2 className="font-display text-2xl font-bold text-sky-700">{trip.name}</h2>
          <p className="text-slate-600">📍 {trip.destination}</p>
          <p className="text-slate-600">📅 {formatDateRange(trip.startDate, trip.endDate)}</p>
          {trip.description && <p className="text-slate-500 mt-2">{trip.description}</p>}
        </div>

        {trip.activities.length > 0 && (
          <div className="mt-6">
            <h3 className="font-display text-lg font-semibold text-sky-700 mb-3">Trip activities</h3>
            <ul className="space-y-2">
              {trip.activities.slice(0, 5).map((activity) => (
                <li key={activity.id} className="flex items-center gap-3 rounded-xl bg-white border border-sky-100 p-3">
                  <span className="text-lg">
                    {activity.type === "meal" ? "🍽️" : activity.type === "travel" ? "🚗" : "🎉"}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{activity.title}</p>
                    {activity.date && <p className="text-xs text-slate-500">{new Date(activity.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{activity.time ? ` at ${activity.time}` : ""}</p>}
                  </div>
                </li>
              ))}
              {trip.activities.length > 5 && (
                <p className="text-sm text-slate-500 text-center">+ {trip.activities.length - 5} more activities</p>
              )}
            </ul>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={() => handleRSVP("accepted")}
            disabled={responding}
            className="btn-primary flex-1"
          >
            {responding ? "Saving..." : "Yes, I am in! 🙌"}
          </button>
          <button
            onClick={() => handleRSVP("declined")}
            disabled={responding}
            className="btn-secondary flex-1"
          >
            {responding ? "Saving..." : "Can not make it 😢"}
          </button>
        </div>
      </div>
    </div>
  );
}
