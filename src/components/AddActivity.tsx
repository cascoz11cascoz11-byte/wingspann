"use client";

import { useState, useEffect } from "react";
import { addActivity } from "@/lib/store";
import type { Activity } from "@/types";

interface AddActivityProps {
  tripId: string;
  onAdded: () => void;
}

const ACTIVITY_TYPES: { value: Activity["type"]; label: string }[] = [
  { value: "event", label: "Event" },
  { value: "meal", label: "Meal" },
  { value: "travel", label: "Travel" },
  { value: "stay", label: "Stay" },
  { value: "other", label: "Other" },
];

export function AddActivity({ tripId, onAdded }: AddActivityProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState<Activity["type"]>("event");
  const [travelSubtype, setTravelSubtype] = useState<"flight" | "drive" | "other">("flight");
  const [departureLocation, setDepartureLocation] = useState("");
  const [arrivalLocation, setArrivalLocation] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [flightNumber, setFlightNumber] = useState("");
  const [driveTime, setDriveTime] = useState("");
  const [calculatingDrive, setCalculatingDrive] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (travelSubtype !== "drive" || !departureLocation || !arrivalLocation) return;
    const timeout = setTimeout(async () => {
      setCalculatingDrive(true);
      try {
        const res = await fetch(`/api/drive-time?origin=${encodeURIComponent(departureLocation)}&destination=${encodeURIComponent(arrivalLocation)}`);
        const data = await res.json();
        if (data.duration) setDriveTime(data.duration);
        else setDriveTime("");
      } catch {
        setDriveTime("");
      }
      setCalculatingDrive(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [departureLocation, arrivalLocation, travelSubtype]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setDate("");
    setCheckOutDate("");
    setTime("");
    setEndTime("");
    setLocation("");
    setLink("");
    setType("event");
    setTravelSubtype("flight");
    setDepartureLocation("");
    setArrivalLocation("");
    setArrivalTime("");
    setFlightNumber("");
    setDriveTime("");
    setSaving(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    let finalTitle = title;
    if (type === "travel") {
      if (travelSubtype === "drive") finalTitle = `Drive: ${departureLocation} → ${arrivalLocation}`;
      if (travelSubtype === "flight") finalTitle = `Flight ${flightNumber}: ${departureLocation} → ${arrivalLocation}`;
      if (travelSubtype === "other") finalTitle = title;
    }

    await addActivity(tripId, {
      title: finalTitle,
      description: description || undefined,
      date,
      checkOutDate: type === "stay" ? checkOutDate || undefined : undefined,
      time: time || undefined,
      endTime: endTime || undefined,
      location: location || undefined,
      link: link || undefined,
      type,
      travelSubtype: type === "travel" ? travelSubtype : undefined,
      departureLocation: departureLocation || undefined,
      arrivalLocation: arrivalLocation || undefined,
      arrivalTime: arrivalTime || undefined,
      flightNumber: flightNumber || undefined,
      driveTime: driveTime || undefined,
    });

    resetForm();
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary text-sm">
        Add activity
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5">
      <h3 className="font-display text-sm font-semibold text-sky-700">New activity</h3>

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

          {travelSubtype === "drive" && (
            <div className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
              {calculatingDrive
                ? "🚗 Calculating drive time..."
                : driveTime
                ? `🚗 Est. drive time: ${driveTime}`
                : "Enter locations above to calculate drive time"}
            </div>
          )}

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

      {/* Stay fields */}
      {type === "stay" && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              className="input mt-1"
              placeholder="e.g. Beach House, Airbnb Santiago"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Location</label>
            <input
              type="text"
              className="input mt-1"
              placeholder="e.g. Santiago, Chile"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Check in</label>
              <input
                type="date"
                className="input mt-1"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Check out</label>
              <input
                type="date"
                className="input mt-1"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Link (optional)</label>
            <input
              type="text"
              className="input mt-1"
              placeholder="Airbnb, VRBO, hotel link..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
        </>
      )}

      {/* All other non-travel, non-stay fields */}
      {(type !== "travel" || travelSubtype === "other") && type !== "stay" && (
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Start time</label>
              <input
                type="time"
                className="input mt-1"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">End time (optional)</label>
              <input
                type="time"
                className="input mt-1"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Location (optional)</label>
            <input
              type="text"
              className="input mt-1"
              placeholder="e.g. Gulf Shores, AL"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
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

      {type !== "stay" && (
        <>
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
            <label className="block text-sm font-medium text-slate-700">Link (optional)</label>
            <input
              type="text"
              className="input mt-1"
              placeholder="Paste a URL or leave blank"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
        </>
      )}

      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn-primary text-sm" disabled={saving}>
          {saving ? "Adding..." : "Add to itinerary"}
        </button>
        <button type="button" onClick={() => { resetForm(); setOpen(false); }} className="btn-secondary text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}