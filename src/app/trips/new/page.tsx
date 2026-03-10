"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTrip } from "@/lib/store";
import Link from "next/link";

export default function NewTripPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const trip = await createTrip({
      name,
      destination,
      startDate,
      endDate,
      description: description || undefined,
      createdBy: "you@example.com",
    });
    router.push(`/trips/${trip.id}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-slate-600 hover:text-sky-600"
      >
        ← Back to trips
      </Link>
      <h1 className="font-display text-2xl font-semibold text-sky-700">
        Create a new trip
      </h1>
      <p className="mt-1 text-slate-600">
        Add the basics. You can invite family and add activities next.
      </p>
      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Trip name
          </label>
          <input
            id="name"
            type="text"
            className="input mt-1"
            placeholder="e.g. Summer Beach Week"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-slate-700">
            Destination
          </label>
          <input
            id="destination"
            type="text"
            className="input mt-1"
            placeholder="e.g. Outer Banks, NC"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">
              Start date
            </label>
            <input
              id="startDate"
              type="date"
              className="input mt-1"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">
              End date
            </label>
            <input
              id="endDate"
              type="date"
              className="input mt-1"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description (optional)
          </label>
          <textarea
            id="description"
            rows={3}
            className="input mt-1 resize-none"
            placeholder="A few notes about the trip..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Create trip"}
          </button>
          <Link href="/" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

