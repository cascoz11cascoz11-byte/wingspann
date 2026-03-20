"use client";
import { useEffect, useRef, useState } from "react";
import type { Activity } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  event: "#0ea5e9",
  meal: "#f59e0b",
  stay: "#8b5cf6",
  travel: "#64748b",
  other: "#94a3b8",
};

const TYPE_LABELS: Record<string, string> = {
  event: "Event",
  meal: "Meal",
  stay: "Stay",
  travel: "Travel",
  other: "Other",
};

function getDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}

function groupByDate(activities: Activity[]): string[] {
  const dates = [...new Set(activities.map((a) => a.date))].sort();
  return dates;
}

export function MapTab({ activities, destination }: { activities: Activity[]; destination: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [loaded, setLoaded] = useState(false);

  const withLocation = activities.filter((a) => a.location);
  const dates = groupByDate(withLocation);

  const filtered = selectedDate === "all"
    ? withLocation
    : withLocation.filter((a) => a.date === selectedDate);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || typeof window === "undefined") return;
    if ((window as any).google?.maps) { setLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?key=" + apiKey;
    script.async = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current) return;
    const google = (window as any).google;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: 0, lng: 0 },
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    const map = mapInstanceRef.current;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (filtered.length === 0) return;

    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();
    let geocoded = 0;

    filtered.forEach((activity) => {
      geocoder.geocode({ address: activity.location }, (results: any, status: any) => {
        if (status !== "OK" || !results[0]) { geocoded++; return; }
        const pos = results[0].geometry.location;
        bounds.extend(pos);

        const color = TYPE_COLORS[activity.type] ?? "#94a3b8";
        const label = getDayLabel(activity.date);

        const marker = new google.maps.Marker({
          position: pos,
          map,
          label: {
            text: label,
            color: "#fff",
            fontSize: "10px",
            fontWeight: "bold",
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
            scale: 18,
          },
          title: activity.title,
        });

        marker.addListener("click", () => {
          const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(activity.location!);
          const content = [
            '<div style="font-family:sans-serif;padding:4px 2px;min-width:160px">',
            '<p style="font-weight:600;margin:0 0 4px">' + activity.title + '</p>',
            '<p style="color:#64748b;font-size:12px;margin:0 0 8px">' + (activity.location ?? '') + '</p>',
            '<a href="' + directionsUrl + '" target="_blank" style="background:#0ea5e9;color:#fff;padding:4px 10px;border-radius:8px;font-size:12px;text-decoration:none">Directions</a>',
            '</div>'
          ].join('');
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
        });

        markersRef.current.push(marker);
        geocoded++;
        if (geocoded === filtered.length) {
          if (filtered.length === 1) {
            map.setCenter(pos);
            map.setZoom(14);
          } else {
            map.fitBounds(bounds);
          }
        }
      });
    });
  }, [loaded, filtered]);

  if (withLocation.length === 0) {
    return (
      <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
        <p className="text-3xl">🗺️</p>
        <p className="text-slate-600 font-medium">No locations yet</p>
        <p className="text-sm text-slate-400">Add locations to your activities to see them on the map.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick==> setSelectedDate("all")}
          className={"rounded-full px-3 py-1 text-xs font-medium border-2 transition " + (selectedDate === "all" ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500 hover:border-sky-200")}
        >
          All days
        </button>
        {dates.map((date) => (
          <button
            key={date}
            type="button"
            onClick={() => setSelectedDate(date)}
            className={"rounded-full px-3 py-1 text-xs font-medium border-2 transition " + (selectedDate === date ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500 hover:border-sky-200")}
          >
            {getDayLabel(date)} · {new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </button>
        ))}
      </div>

      <div ref={mapRef} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 380 }} />

      <div className="flex flex-wrap gap-2">
        {Objct.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-500">{TYPE_LABELS[type]}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((activity) => (
          <div key={activity.id} className="card p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: TYPE_COLORS[activity.type] ?? "#94a3b8" }} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{activity.title}</p>
                <p className="text-xs text-slate-500 truncate">📍 {activity.location}</p>
              </div>
            </div>
            
              href={"https://www.google.com/maps/dir/?i=1&destination=" + encodeURIComponent(activity.location!)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 text-xs font-medium transition shrink-0"
            >
              Directions
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
