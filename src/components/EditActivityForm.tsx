"use client";

import { useState, useEffect } from "react";
import { updateActivity } from "@/lib/store";
import type { Activity } from "@/types";

const ACTIVITY_TYPES: Activity["type"][] = ["activity", "meal", "travel", "other"];

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

  useEffect(() => {
    setTitle(activity.title);
    setDescription(activity.description ?? "");
    setDate(activity.date);
    setTime(activity.time ?? "");
    setLocation(activity.location ?? "");
    setLink(activity.link ?? "");
    setType(activity.type);
  }, [activity]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateActivity(tripId, activity.id, {
      title,
      description: description || undefined,
      date,
      time: time || undefined,
      location: location || undefined,
      link: link || undefined,
      type,
    });
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5">
      <h3 className="font-display text-sm font-semibold text-sky-700">Edit activity</h3>
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
        <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
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
          Save changes
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
