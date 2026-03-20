"use client";
import { useState, useEffect } from "react";
import { TripList } from "@/components/TripList";
import { HomeActivityFinder } from "@/components/HomeActivityFinder";
import { HomeCalendar } from "@/components/HomeCalendar";
import { StandaloneEventCreator } from "@/components/StandaloneEventCreator";
import Link from "next/link";
import { getTrips } from "@/lib/store";
import type { Trip } from "@/types";

type Tab = "trips" | "calendar";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("trips");
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    getTrips().then(setTrips);
  }, []);

  const activeTab = "border-b-2 border-sky-500 text-sky-600 font-semibold pb-2";
  const inactiveTab = "text-slate-500 hover:text-sky-500 pb-2 transition";

  return (
    <div>
      {/* Hero */}
      <div className="mb-6">
        <p className="font-display text-xl font-semibold text-amber-600">
          Family adventures, perfectly planned ✈️
        </p>
        <div className="mt-3 flex gap-2">
          <HomeActivityFinder trips={trips} />
          <StandaloneEventCreator />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200 mb-6">
        <button type="button" onClick={() => setTab("trips")} className={tab === "trips" ? activeTab : inactiveTab}>
          ✈️ Trips
        </button>
        <button type="button" onClick={() => setTab("calendar")} className={tab === "calendar" ? activeTab : inactiveTab}>
          📅 Calendar
        </button>
        <Link href="/wishlist" className="text-slate-500 hover:text-sky-500 pb-2 transition">
          🌟 Wishlist
        </Link>
      </div>

      {tab === "trips" && <TripList />}
      {tab === "calendar" && <HomeCalendar trips={trips} />}
    </div>
  );
}
