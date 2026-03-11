"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTripByInviteCode, addMember } from "@/lib/store";
import { createClient } from "@/lib/supabase";
import type { Trip } from "@/types";

export default function JoinTripPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const t = await getTripByInviteCode(code);
      setTrip(t ?? null);
      setLoading(false);
    }
    load();
  }, [code]);

  async function handleJoin() {
    setJoining(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?redirect=/join/" + code);
      return;
    }
    await addMember(trip!.id, {
      name: user.email!,
      email: user.email!,
      status: "accepted",
    });
    router.push("/trips/" + trip!.id);
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
    <div className="flex min-h-screen items-center justify-center bg-sky-50 px-4">
      <div className="card w-full max-w-md p-8 text-center">
        <p className="text-4xl">✈️</p>
        <h1 className="mt-4 font-display text-2xl font-bold text-sky-600">You have been invited!</h1>
        <p className="mt-2 text-slate-600">Join the trip</p>
        <div className="mt-4 rounded-2xl bg-sky-50 p-4">
          <p className="font-display text-xl font-bold text-sky-700">{trip.name}</p>
          <p className="text-slate-500">{trip.destination}</p>
        </div>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <button
          onClick={handleJoin}
          disabled={joining}
          className="btn-primary mt-6 w-full"
        >
          {joining ? "Joining..." : "Join this trip"}
        </button>
      </div>
    </div>
  );
}