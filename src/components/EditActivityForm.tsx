"use client";

import { useState, useEffect } from "react";
import { updateActivity } from "@/lib/store";
import type { Activity } from "@/types";

const ACTIVITY_TYPES: { value: Activity["type"]; label: string }[] = [
  { value: "event", label: "Event" },
  { value: "meal", label: "Meal" },
  { value: "travel", label: "Travel" },
  { value: "accommodation", label: "Accommodations" },
  { value: "stay", label: "Stay" },
  { value: "other", label: "Other" },
];

interface EditActivityFormProps {
  tripId: string;
  activity: Activity;
  onSaved: () => void;
  onCancel: () => void;
}

export function EditActivityForm({ tripId, activity, onSaved, onCancel }: EditActivityFormProps) {
  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState(activity.description ?? "");
  const [date, setDate] = useState(activity.date);
  const [time, setTime] = useState(activity.time ?? "");
  const [location, setLocation] = useState(activity.location ?? "");
  const [link, setLink] = useState(activity.link ?? "");
  const [type, setType] = useState<Activity["type"]>(activity.type);
  const [travelSubtype, setTravelSubtype] = useState<"flight" | "drive" | "other">(activity.travelSubtype ?? "flight");
  const [departureLocation, setDepartureLocation] = useState(activity.departureLocation ?? "");
  const [arrivalLocation, setArrivalLocation] = useState(activity.arrivalLocation ?? "");
  const [arrivalTime, setArrivalTime] = useState(activity.arrivalTime ?? "");
  const [flightNumber, setFlightNumber] = useState(activity.flightNumber ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(activity.title);
    setDescription(activity.description ?? "");
    setDate(activity.date);
    setTime(activity.time ?? "");
    setLocation(activity.location ?? "");
    setLink(activity.link ?? "");
    setType(activity.type);
    setTravelSubtype(activity.travelSubtype ?? "flight");
    setDepartureLocation(activity.departureLocation ?? "");
    setArrivalLocation(activity.arrivalLocation ?? "");
    setArrivalTime(activity.arrivalTime ?? "");
    setFlightNumber(activity.flightNumber ?? "");
  }, [activity]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    let finalTitle = title;
    if (type === "travel") {
      if (travelSubtype === "drive") finalTitle = `Drive: ${departureLocation} → ${arrivalLocation}`;
      if (travelSubtype === "flight") finalTitle = `Flight ${flightNumber}: ${departureLocation} → ${arrivalLocation}`;
      if (travelSubtype === "other") finalTitle = title;
    }

    await updateActivity(tripId, activity.id, {
      title: finalTitle,
      description: description || undefined,
      date,
      time: time || undefined,
      location: location || undefined,
      link: link || undefined,
      type,
      travelSubtype: type === "travel" ? travelSubtype : undefined,
      departureLocation: departureLocation || undefined,
      arrivalLocation: arrivalLocation || undefined,
      arrivalTime: arrivalTime || undefined,
      flightNumber: flightNumber || undefined,
    });

    setSaving(false);
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5">
      <h3 className="font-display text-sm font-semibold text-sky-700">Edit activity</h3>

      <div>
        <label className="block text-sm font-medium text-slate-700">Category</label>
        <select
          className="input mt-1"
          value={type}
          onChange={(e) => setType(e.target.value as Activity["type"])}
        >
          {ACTIVITY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {type === "travel" && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Travel type</label>
          <div className="mt-2 flex gap-3">
            {[
              { value: "flight", label: "✈️ Flight" },
              { value: "drive", label: "🚗 Drive" },
              { value: "other", label: "🚌 Other" },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTravelSubtype(t.value as "flight" | "drive" | "other")}
                className={`rounded-xl border-2 px-4 py-2 text-sm font-medium transition ${travelSubtype === t.value ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600 hover:border-sky-200"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {type === "travel" && travelSubtype === "flight" && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Flight number</label>
          <input
            type="text"
            className="input mt-1"
            placeholder="e.g. AA1234"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
            required
          />
        </div>
      )}

      {type === "travel" && (travelSubtype === "drive" || travelSubtype === "flight") && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {travelSubtype === "drive" ? "Departing from" : "Departure airport"}
            </label>
            <input
              type="text"
              className="input mt-1"
              placeholder={travelSubtype === "drive" ? "e.g. Charlotte, NC" : "e.g. CLT - Charlotte"}
              value={departureLocation}
              onChange={(e) => setDepartureLocation(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {travelSubtype === "drive" ? "Arriving at" : "Arrival airport"}
            </label>
            <input
              type="text"
              className="input mt-1"
              placeholder={travelSubtype === "drive" ? "e.g. Outer Banks, NC" : "e.g. ORF - Norfolk"}
              value={arrivalLocation}
              onChange={(e) => setArrivalLocation(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Departure time</label>
              <input
                type="time"
                className="input mt-1"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Arrival time</label>
              <input
                type="time"
                className="input mt-1"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {(type !== "travel" || travelSubtype === "other") && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input
              type="text"
              className="input mt-1"
              placeholder="e.g. Beach day"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Date</label>
              <input
                type="date"
                className="input mt-1"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Time</label>
              <input
                type="time"
                className="input mt-1"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {type === "travel" && travelSubtype !== "other" && (
        <div>
          <label className="block text-sm font-medium text-slate-700">Date</label>
          <input
            type="date"
            className="input mt-1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
        <textarea
          rows={2}
          className="input mt-1 resize-none"
          placeholder="Details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Location (optional)</label>
        <input
          type="text"
          className="input mt-1"
          placeholder="Where?"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Link (optional)</label>
        <input
          type="text"
          className="input mt-1"
          placeholder="Paste a URL or leave blank"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn-primary text-sm" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
