"use client";

import { useState } from "react";
import { addActivity } from "@/lib/store";
import type { Activity } from "@/types";

interface AddActivityProps {
  tripId: string;
  onAdded: () => void;
}

const ACTIVITY_TYPES: Activity["type"][] = ["activity", "meal", "travel", "other"];

export function AddActivity({ tripId, onAdded }: AddActivityProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState<Activity["type"]>("activity");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addActivity(tripId, {
      title,
      description: description || undefined,
      date,
      time: time || undefined,
      location: location || undefined,
      link: link || undefined,
      type,
    });
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");
    setLocation("");
    setLink("");
    setType("activity");
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary text-sm"
      >
        Add activity
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card space-y-4 p-5"
    >
      <h3 className="font-display text-sm font-semibold text-sky-700">
        New activity
      </h3>
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
        <label className="block text-sm font-medium text-slate-700">
          Description (optional)
        </label>
        <textarea
          rows={2}
          className="input mt-1 resize-none"
          placeholder="Details..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Location (optional)
        </label>
        <input
          type="text"
          className="input mt-1"
          placeholder="Where?"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Link (optional)
        </label>
        <input
          type="text"
          className="input mt-1"
          placeholder="Paste a URL or leave blank"
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Type</label>
        <select
          className="input mt-1"
          value={type}
          onChange={(e) => setType(e.target.value as Activity["type"])}
        >
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn-primary text-sm">
          Add to itinerary
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="btn-secondary text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
