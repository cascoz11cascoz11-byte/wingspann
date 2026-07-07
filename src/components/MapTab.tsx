"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Activity } from "@/types";
import { addActivity, getTripWishlist, scheduleTripWishlistItem, type TripWishlistItem } from "@/lib/store";

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

const WISHLIST_COLOR = "#ec4899";

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate + "T12:00:00");
  const end = new Date(endDate + "T12:00:00");
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatTripDay(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function wishlistItemToActivityType(type: TripWishlistItem["type"]): Activity["type"] {
  if (type === "restaurant") return "meal";
  if (type === "stay") return "stay";
  return "event";
}

function getDayLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short" });
}

function getDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

interface MapPoint {
  id: string;
  title: string;
  location: string;
  color: string;
  label: string;
  isWishlist: boolean;
  date?: string;
  wishlistItem?: TripWishlistItem;
}

export function MapTab({
  activities,
  destination,
  tripId,
  tripStartDate,
  tripEndDate,
  onAdded,
}: {
  activities: Activity[];
  destination: string;
  tripId: string;
  tripStartDate: string;
  tripEndDate: string;
  onAdded: () => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [loaded, setLoaded] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<TripWishlistItem[]>([]);
  const [schedulingItem, setSchedulingItem] = useState<TripWishlistItem | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const openScheduleRef = useRef<(item: TripWishlistItem) => void>(() => {});

  const tripDates = useMemo(() => getDatesInRange(tripStartDate, tripEndDate), [tripStartDate, tripEndDate]);

  const withLocation = activities.filter((a) => a.location);
  const dates = withLocation.map((a) => a.date).filter((d, i, arr) => arr.indexOf(d) === i).sort();
  const filteredActivities = selectedDate === "all" ? withLocation : withLocation.filter((a) => a.date === selectedDate);

  const wishlistWithLocation = useMemo(
    () => wishlistItems.filter((item) => item.venue),
    [wishlistItems]
  );

  const loadWishlist = useCallback(async () => {
    setWishlistItems(await getTripWishlist(tripId));
  }, [tripId]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const openSchedule = useCallback((item: TripWishlistItem) => {
    setSchedulingItem(item);
    setScheduleDate(tripStartDate);
    setScheduleTime("");
  }, [tripStartDate]);

  openScheduleRef.current = openSchedule;

  async function handleSchedule() {
    if (!schedulingItem || !scheduleDate) return;
    setScheduling(true);
    await addActivity(tripId, {
      title: schedulingItem.name,
      description: schedulingItem.description,
      date: scheduleDate,
      time: scheduleTime || undefined,
      location: schedulingItem.venue,
      link: schedulingItem.link,
      type: wishlistItemToActivityType(schedulingItem.type),
    });
    await scheduleTripWishlistItem(schedulingItem.id);
    await loadWishlist();
    setScheduling(false);
    setSchedulingItem(null);
    onAdded();
  }

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || typeof window === "undefined") return;
    if ((window as any).google?.maps) {
      setLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://maps.googleapis.com/maps/api/js?key=" + apiKey;
    script.async = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  const mapPoints: MapPoint[] = useMemo(() => [
    ...filteredActivities.map((activity) => ({
      id: activity.id,
      title: activity.title,
      location: activity.location!,
      color: TYPE_COLORS[activity.type] ?? "#94a3b8",
      label: getDayLabel(activity.date),
      isWishlist: false,
      date: activity.date,
    })),
    ...(showWishlist
      ? wishlistWithLocation.map((item) => ({
          id: "wishlist-" + item.id,
          title: item.name,
          location: item.venue!,
          color: WISHLIST_COLOR,
          label: "★",
          isWishlist: true,
          wishlistItem: item,
        }))
      : []),
  ], [filteredActivities, showWishlist, wishlistWithLocation]);

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

    if (mapPoints.length === 0) return;

    const geocoder = new google.maps.Geocoder();
    const bounds = new google.maps.LatLngBounds();
    let geocoded = 0;

    mapPoints.forEach((point) => {
      geocoder.geocode({ address: point.location }, (results: any, status: any) => {
        if (status !== "OK" || !results[0]) {
          geocoded++;
          return;
        }
        const pos = results[0].geometry.location;
        bounds.extend(pos);

        const marker = new google.maps.Marker({
          position: pos,
          map,
          label: { text: point.label, color: "#fff", fontSize: "10px", fontWeight: "bold" },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: point.color,
            fillOpacity: point.isWishlist ? 0.85 : 1,
            strokeColor: point.isWishlist ? "#fff" : "#fff",
            strokeWeight: point.isWishlist ? 3 : 2,
            scale: point.isWishlist ? 16 : 18,
          },
          title: point.title,
          zIndex: point.isWishlist ? 1 : 2,
        });

        marker.addListener("click", () => {
          if (point.isWishlist && point.wishlistItem) {
            openScheduleRef.current(point.wishlistItem);
            return;
          }
          const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(point.location);
          const html = '<div style="font-family:sans-serif;padding:4px 2px;min-width:160px">'
            + '<p style="font-weight:600;margin:0 0 4px">' + point.title + '</p>'
            + '<p style="color:#64748b;font-size:12px;margin:0 0 8px">' + point.location + '</p>'
            + '<a href="' + directionsUrl + '" target="_blank" style="background:#0ea5e9;color:#fff;padding:4px 10px;border-radius:8px;font-size:12px;text-decoration:none">Directions</a>'
            + '</div>';
          infoWindowRef.current.setContent(html);
          infoWindowRef.current.open(map, marker);
        });

        markersRef.current.push(marker);
        geocoded++;

        if (geocoded === mapPoints.length) {
          if (mapPoints.length === 1) {
            map.setCenter(pos);
            map.setZoom(14);
          } else {
            map.fitBounds(bounds);
          }
        }
      });
    });
  }, [loaded, mapPoints]);

  const hasAnythingOnMap = withLocation.length > 0 || wishlistWithLocation.length > 0;

  if (!hasAnythingOnMap) {
    return (
      <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
        <p className="text-3xl">🗺️</p>
        <p className="text-slate-600 font-medium">No locations yet</p>
        <p className="text-sm text-slate-400">Add locations to your activities or wishlist items to see them on the map.</p>
      </div>
    );
  }

  const listPoints = mapPoints;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {withLocation.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setSelectedDate("all")}
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
                {getDateLabel(date)}
              </button>
            ))}
          </>
        )}
        {wishlistWithLocation.length > 0 && (
          <button
            type="button"
            onClick={() => setShowWishlist((v) => !v)}
            className={"rounded-xl border-2 px-3 py-1.5 text-sm font-medium transition "
              + (showWishlist ? "border-pink-400 bg-pink-50 text-pink-700" : "border-slate-200 text-slate-600 hover:border-pink-200")}
          >
            🌟 Wishlist {showWishlist ? "on" : "off"}
          </button>
        )}
      </div>

      {listPoints.length === 0 ? (
        <div className="card border-dashed border-sky-200 p-6 text-center text-sm text-slate-500">
          No activities for this day. Try &ldquo;All days&rdquo; or turn on wishlist markers.
        </div>
      ) : (
        <div ref={mapRef} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 380 }} />
      )}

      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-500">{TYPE_LABELS[type]}</span>
          </div>
        ))}
        {wishlistWithLocation.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: WISHLIST_COLOR }} />
            <span className="text-xs text-slate-500">Wishlist</span>
          </div>
        )}
      </div>

      {listPoints.length > 0 && (
        <div className="space-y-2">
          {listPoints.map((point) => (
            <div key={point.id} className="card p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: point.color }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {point.isWishlist && <span className="text-pink-500 mr-1">🌟</span>}
                    {point.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">📍 {point.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {point.isWishlist && point.wishlistItem && (
                  <button
                    type="button"
                    onClick={() => openSchedule(point.wishlistItem!)}
                    className="rounded-xl border-2 border-sky-200 bg-sky-50 text-sky-700 px-3 py-1.5 text-xs font-medium hover:border-sky-300 transition"
                  >
                    Add to day
                  </button>
                )}
                <a
                  href={"https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(point.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 text-xs font-medium transition"
                >
                  Directions
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {schedulingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSchedulingItem(null)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800">Add to itinerary</p>
              <button type="button" onClick={() => setSchedulingItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="rounded-xl bg-pink-50 border border-pink-100 px-3 py-2.5">
              <p className="text-sm font-semibold text-slate-800">{schedulingItem.name}</p>
              {schedulingItem.venue && (
                <p className="text-xs text-slate-500 mt-0.5">{schedulingItem.venue}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Day</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                {tripDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setScheduleDate(d)}
                    className={"rounded-xl px-3 py-2 text-xs font-medium transition text-left "
                      + (scheduleDate === d ? "bg-sky-500 text-white" : "bg-slate-50 border border-slate-200 text-slate-600 hover:border-sky-300")}
                  >
                    {formatTripDay(d)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                Time <span className="font-normal normal-case">(optional)</span>
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="input"
              />
            </div>
            <button
              type="button"
              onClick={handleSchedule}
              disabled={scheduling || !scheduleDate}
              className="btn-primary w-full text-sm"
            >
              {scheduling ? "Adding..." : "Add to itinerary"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
