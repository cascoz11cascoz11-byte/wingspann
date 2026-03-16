"use client";

import Link from "next/link";
import { getTrips } from "@/lib/store";
import { useEffect, useState } from "react";
import type { Trip } from "@/types";

function formatDateRange(start: string, end: string) {
  const s = new Date(start + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const e = new Date(end + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return s + " – " + e;
}

function getCountdown(startDate: string, endDate: string): { label: string; color: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  if (today > end) return { label: "Past trip", color: "bg-slate-100 text-slate-400" };
  if (today >= start && today <= end) return { label: "Happening now!", color: "bg-emerald-100 text-emerald-700" };
  const days = Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 1) return { label: "Tomorrow!", color: "bg-amber-100 text-amber-700" };
  if (days <= 7) return { label: "In " + days + " days!", color: "bg-amber-100 text-amber-700" };
  if (days <= 30) return { label: "In " + days + " days", color: "bg-sky-100 text-sky-700" };
  return { label: "In " + days + " days", color: "bg-slate-100 text-slate-500" };
}

function isPast(endDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = endDate.split("-").map(Number);
  return new Date(y, m - 1, d) < today;
}

export function TripList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getTrips();
      setTrips(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="card flex items-center justify-center p-12 text-center">
        <p className="text-slate-500">Loading trips...</p>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center gap-4 rounded-2xl p-12 text-center">
        <p className="text-slate-600">No trips yet. Create your first one!</p>
        <Link href="/trips/new" className="btn-primary">Create a trip</Link>
      </div>
    );
  }

  const upcomingTrips = trips.filter((t) => !isPast(t.endDate));
  const pastTrips = trips.filter((t) => isPast(t.endDate));

  return (
    <div className="space-y-4">
      {upcomingTrips.length === 0 && !showPast && (
        <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
          <p className="text-2xl">✈️</p>
          <p className="text-slate-600 font-medium">No upcoming trips!</p>
          <Link href="/trips/new" className="btn-primary text-sm inline-block mt-1">Plan a trip</Link>
        </div>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {(showPast ? trips : upcomingTrips).map((trip) => {
          const countdown = getCountdown(trip.startDate, trip.endDate);
          return (
            <li key={trip.id}>
              <Link href={"/trips/" + trip.id} className={"card block p-5 transition hover:border-sky-300 hover:shadow-md " + (isPast(trip.endDate) ? "opacity-60" : "")}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <h2 className="font-display text-lg font-semibold text-sky-700">{trip.name}</h2>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={"rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 " + countdown.color}>
                      {countdown.label}
                    </span>
                    {trip.isInvited && (
                      <span className="rounded-full bg-violet-100 text-violet-700 px-2.5 py-0.5 text-xs font-medium shrink-0">
                        Invited
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-600">{trip.destination}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDateRange(trip.startDate, trip.endDate)}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span>{trip.members.length} members</span>
                  <span>·</span>
                  <span>{trip.activities.length} activities</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {pastTrips.length > 0 && (
        <button
          type="button"
          onClick={() => setShowPast((p) => !p)}
          className="w-full rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-sm text-slate-400 hover:border-sky-200 hover:text-sky-500 transition"
        >
          {showPast ? "Hide past trips" : "Show " + pastTrips.length + " past trip" + (pastTrips.length === 1 ? "" : "s")}
        </button>
      )}
    </div>
  );
}
