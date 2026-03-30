"use client";
import { useState } from "react";
import { addToWishlist, getTrips, addActivity } from "@/lib/store";
import type { Trip } from "@/types";
import Link from "next/link";

interface Destination {
  name: string;
  country: string;
  emoji: string;
  facts: string[];
}

const REGIONS = [
  "🌍 Whole World",
  "🇺🇸 United States",
  "🌎 North America",
  "🌎 South America",
  "🌍 Europe",
  "🌍 Africa",
  "🌏 Asia",
  "🌏 Oceania",
  "🌨️ Arctic / Antarctica",
];

export function SpinTheGlobe() {
  const [spinning, setSpinning] = useState(false);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("🌍 Whole World");

  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripPickerOpen, setTripPickerOpen] = useState(false);
  const [addingToTripId, setAddingToTripId] = useState<string | null>(null);
  const [addedToTrip, setAddedToTrip] = useState(false);

  async function spin() {
    setSpinning(true);
    setDestination(null);
    setAdded(false);
    setTripPickerOpen(false);
    setAddedToTrip(false);
    try {
      const res = await fetch("/api/spin-globe?region=" + encodeURIComponent(selectedRegion));
      const data = await res.json();
      setDestination(data);
    } catch (e) {
      console.error(e);
    }
    setSpinning(false);
  }

  async function addToMyWishlist() {
    if (!destination) return;
    setAdding(true);
    await addToWishlist({
      name: destination.name + ", " + destination.country,
      type: "destination",
      description: destination.facts.join(" • "),
    });
    setAdding(false);
    setAdded(true);
  }

  async function openTripPicker() {
    const all = await getTrips();
    setTrips(all);
    setTripPickerOpen(true);
  }

  async function handleAddToTrip(tripId: string) {
    if (!destination) return;
    setAddingToTripId(tripId);
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;
    await addActivity(tripId, {
      title: destination.name + ", " + destination.country,
      description: destination.facts.join(" • "),
      date: trip.startDate,
      type: "event",
    });
    setAddingToTripId(null);
    setTripPickerOpen(false);
    setAddedToTrip(true);
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold text-sky-700">Throw a Dart at a Spinning Globe 🌍</h2>
        <p className="text-sm text-slate-500">Let fate decide your next adventure!</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {REGIONS.map((region) => (
          <button
            key={region}
            type="button"
            onClick={() => setSelectedRegion(region)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              selectedRegion === region
                ? "border-sky-400 bg-sky-50 text-sky-700"
                : "border-slate-200 text-slate-600 hover:border-sky-200",
            ].join(" ")}
          >
            {region}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={spin}
        disabled={spinning}
        className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-violet-500 shadow-lg text-6xl transition hover:scale-105 active:scale-95"
      >
        <span className={spinning ? "animate-spin inline-block" : ""}>🌍</span>
      </button>
      {spinning && (
        <p className="text-sm text-slate-500 animate-pulse">Finding your next adventure...</p>
      )}
      {destination && !spinning && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4 text-left">
          <div className="text-center space-y-1">
            <p className="text-4xl">{destination.emoji}</p>
            <h3 className="font-display text-xl font-bold text-slate-800">{destination.name}</h3>
{destination.country !== destination.name && (
  <p className="text-sm text-slate-500">{destination.country}</p>
)}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide">Top 3 things to do</p>
            {destination.facts.map((fact, i) => (
              <div key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="font-bold text-sky-500">{i + 1}.</span>
                <span>{fact}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={addToMyWishlist}
              disabled={adding || added}
              className="btn-primary text-sm flex-1"
            >
              {added ? "Added to wishlist ✓" : adding ? "Adding..." : "Add to wishlist 🌟"}
            </button>
            <button
              type="button"
              onClick={openTripPicker}
              disabled={addedToTrip}
              className="btn-secondary text-sm flex-1"
            >
              {addedToTrip ? "Added to trip ✓" : "+ Add to trip"}
            </button>
          </div>

          {tripPickerOpen && (
            <div className="rounded-xl border-2 border-sky-100 bg-sky-50 p-3 space-y-2">
              <p className="text-xs font-medium text-sky-700">Which trip?</p>
              {trips.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No trips yet —{" "}
                  <Link href="/trips/new" className="text-sky-500 hover:underline">
                    create one first
                  </Link>
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {trips.map((trip) => (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => handleAddToTrip(trip.id)}
                      disabled={addingToTripId === trip.id}
                      className="rounded-lg bg-white border border-sky-200 px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100 transition"
                    >
                      {addingToTripId === trip.id ? "Adding..." : trip.name}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => setTripPickerOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel
              </button>
            </div>
          )}

          <button type="button" onClick={spin} className="btn-secondary text-sm w-full">
            Throw again
          </button>
        </div>
      )}
      {!destination && !spinning && (
        <p className="text-sm text-slate-400">Tap the globe to discover your next destination!</p>
      )}
    </div>
  );
}