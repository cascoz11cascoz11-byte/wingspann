"use client";
import { useState } from "react";
import type { Activity } from "@/types";

export function MapTab({ activities, destination }: { activities: Activity[]; destination: string }) {
  const withLocation = activities.filter((a) => a.location);
  const [selected, setSelected] = useState<Activity | null>(null);
  const mapLocation = selected?.location ?? destination;

  function getDirectionsUrl(location: string) {
    return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(location);
  }

  function getMapsEmbedUrl(location: string) {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    return "https://www.google.com/maps/embed/v1/place?key=" + key + "&q=" + encodeURIComponent(location);
  }

  if (withLocation.length === 0) {
    return (
      <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
        <p className="text-3xl">Map</p>
        <p className="text-slate-600 font-medium">No locations yet</p>
        <p className="text-sm text-slate-400">Add locations to your activities to see them on the map.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <iframe width="100%" height="320" style={{ border: 0 }} loading="lazy" allowFullScreen src={getMapsEmbedUrl(mapLocation)} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500">Tap an activity to see it on the map</p>
        {withLocation.map((activity) => (
          <button key={activity.id} type="button" onClick={() => setSelected(selected?.id === activity.id ? null : activity)} className={"card w-full p-4 text-left transition " + (selected?.id === activity.id ? "border-sky-400 bg-sky-50" : "hover:border-sky-200")}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm">{activity.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{activity.location}</p>
              </div>
              <a href={getDirectionsUrl(activity.location!)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 text-xs font-medium transition shrink-0">
                Directions
              </a>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
