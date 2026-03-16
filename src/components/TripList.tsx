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

  if (today > end) {
    return { label: "Past trip", color: "bg-slate-100 text-slate-400" };
  }
  if (today >= start && today <= end) {
    return { label: "Happening now!", color: "bg-emerald-100 text-emerald-700" };
  }
  const days = Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 1) return { label: "Tomorrow!", color: "bg-amber-100 text-amber-700" };
  if (days <= 7) return { label: "In " + days + " days!", color: "bg-amber-100 text-amber-700" };
  if (days <= 30) return { label: "In " + days + " days", color: "bg-sky-100 text-sky-700" };
  return { label: "In " + days + " days", color: "bg-slate-100 text-slate-500" };
}

export function TripList() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {trips.map((trip) => {
        const countdown = getCountdown(trip.startDate, trip.endDate);
        return (
          <li key={trip.id}>
            <Link href={"/trips/" + trip.id} className="card block p-5 transition hover:border-sky-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-sky-700">{trip.name}</h2>
                <span className={"rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 " + countdown.color}>
                  {countdown.label}
                </span>
                {trip.isInvited && (
                <span className="rounded-full bg-violet-100 text-violet-700 px-2.5 py-0.5 text-xs font-medium shrink-0">
                  Invited
                </span>
              )}
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
  );
}
