"use client";

import Link from "next/link";
import { getTrips } from "@/lib/store";
import { useEffect, useState } from "react";
import type { Trip } from "@/types";

function formatDateRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const e = new Date(end).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${s} – ${e}`;
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
        <Link href="/trips/new" className="btn-primary">
          Create a trip
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {trips.map((trip) => (
        <li key={trip.id}>
          <Link
            href={`/trips/${trip.id}`}
            className="card block p-5 transition hover:border-sky-300 hover:shadow-md"
          >
            <h2 className="font-display text-lg font-semibold text-sky-700">
              {trip.name}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{trip.destination}</p>
            <p className="mt-2 text-xs text-slate-500">
              {formatDateRange(trip.startDate, trip.endDate)}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
              <span>{trip.members.length} members</span>
              <span>·</span>
              <span>{trip.activities.length} activities</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
