"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTrip, deleteTrip } from "@/lib/store";
import type { Trip, Activity } from "@/types";
import Link from "next/link";
import { InviteMember } from "@/components/InviteMember";
import { MemberList } from "@/components/MemberList";
import { ActivityList } from "@/components/ActivityList";
import { AddActivity } from "@/components/AddActivity";
import { RoomPicker } from "@/components/RoomPicker";
import { CarOrganizer } from "@/components/CarOrganizer";
import { ActivityFinder } from "@/components/ActivityFinder";
import { ExpenseTracker } from "@/components/ExpenseTracker";

function formatDateRange(start: string, end: string) {
  const s = new Date(start + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const e = new Date(end + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return s + " - " + e;
}

function getCountdown(startDate: string, endDate: string): { label: string; color: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  if (today > end) return { label: "Past trip", color: "bg-slate-100 text-slate-400" };
  if (today >= start && today <= end) return { label: "Happening now!", color: "bg-emerald-100 text-emerald-700" };
  const days = Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 1) return { label: "Tomorrow!", color: "bg-amber-100 text-amber-700" };
  if (days <= 7) return { label: "In " + days + " days!", color: "bg-amber-100 text-amber-700" };
  if (days <= 30) return { label: "In " + days + " days", color: "bg-sky-100 text-sky-700" };
  return { label: "In " + days + " days", color: "bg-slate-100 text-slate-500" };
}

function MapTab({ activities, destination }: { activities: Activity[]; destination: string }) {
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
        <p className="text-3xl">🗺️</p>
        <p className="text-slate-600 font-medium">No locations yet</p>
        <p className="text-sm text-slate-400">Add locations to your activities to see them on the map.</p>
  </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <iframe
          width="100%"
          height="320"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={getMapsEmbedUrl(mapLocation)}
        />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500">Tap an activity to see it on the map</p>
        {withLocation.map((activity) => (
          <button
            key={activity.id}
            type="button"
            onClick={() => setSelected(selected?.id === activity.id ? null : activity)}
            className={"card w-full p-4 text-left transition " + (selected?.id === activity.id ? "border-sky-400 bg-sky-50" : "hover:border-sky-200")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm">{activity.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">📍 {activity.location}</p>
              </div>
              
                href={getDirectionsUrl(activity.location!)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 text-xs font-medium transition shrink-0"
              >
                Directions
              </a>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"itinerary" | "expenses" | "map">("itinerary");
  const [deleting, setDeleting] useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      const t = await getTrip(id);
      setTrip(t ?? null);
    }
    load();
  }, [id]);

  async function refreshTrip() {
    const t = await getTrip(id);
    if (!t) {
      setTrip(null);
    } else {
      setTrip({ ...t, members: [...(t.members ?? [])], activities: [...(t.activities ?? [])] });
    }
  }

  function copyInviteLink() {
    if (!trip?.inviteCode) return;
    const link = window.location.origin + "/join/" + trip.inviteCode;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteTrip(id);
    router.replace("/");
  }

  if (trip === undefined) {
    return <div className="py-12 text-center"><p className="text-slate-600">Loading...</p></div>;
  }

  if (trip === null) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-600">Trip not found.</p>
        <Link href="/" className="mt-4 inline-block text-sky-600 hover:underline">Back to trips</Link>
      </div>
    );
  }

  const countdown = getCountdown(trip.startDate, trip.endDate);
  const tabClass = (t: string) => "pb-2 text-sm font-medium transition border-b-2 whitespace-nowrap " + (activeTab === t ? "border-sky-500 text-sky-600" : "border-transparent text-slate-500 hover:text-sky-500");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-sm text-slate-600 hover:text-sky-600">
          Back to trips
        </Link>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="text-xs text-red-400 hover:text-red-600 transition"
        >
          Delete trip
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-sky-700">{trip.name}</h1>
            <p className="mt-1 text-slate-600">{trip.destination}</p>
            <p className="mt-1 text-sm text-slate-500">{formatDateRange(trip.startDate, trip.endDate)}</p>
            <span className={"mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium " + countdown.color}>
              {countdown.label}
            </span>
            {trip.description && <p className="mt-2 text-slate-600">{trip.description}</p>}
          </div>
          <button onClick={copyInviteLink} className="btn-secondary shrink-0 text-sm">
            {copied ? "Copied!" : "Copy invite link"}
          </button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-slate-200 mb-6 overflow-x-auto">
        <button type="button" onClick={() => setActiveTab("itinerary")} className={tabClass("itinerary")}>
          Itinerary
        </button>
        <button type="button" onClick={() => setActiveTab("map")} className={tabClass("map")}>
          Map
        </button>
        <button type="button" onClick={() => setActiveTab("expenses")} className={tabClass("expenses")}>
          Expenses
        </button>
      </div>

      {activeTab === "itinerary" && (
        <div className="space-y-10">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-sky-700">Group members</h2>
              <div className="flex gap-2">
                <CarOrganizer tripId={trip.id} members={trip.members} />
                <RoomPicker members={trip.members} />
                <InviteMember tripId={trip.id} onInvited={refreshTrip} />
              </div>
            </div>
            <MemberList tripId={trip.id} members={trip.members} onUpdate={refreshTrip} />
          </section>
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-sky-700">Itinerary</h2>
              <div className="flex gap-2">
                <ActivityFinder
                  tripId={trip.id}
                  tripDestination={trip.destination}
                  tripStartDate={trip.startDate}
                  tripEndDate={trip.endDate}
                  stays={trip.activities.filter((a) => a.type === "stay")}
                  onAdded={refreshTrip}
                />
                <AddActivity
                  tripId={trip.id}
                  tripStartDate={trip.startDate}
                  tripEndDate={trip.endDate}
                  sourceBoardId={trip.sourceBoardId}
                  onAdded={refreshTrip}
                />
              </div>
            </div>
            <ActivityList tripId={trip.id} activities={trip.activities} members={trip.members} onUpdate={refreshTrip} />
          </section>
        </div>
      )}

      {activeTab === "map" && (
        <MapTab activities={trip.activities} destination={trip.destination} />
      )}

      {activeTab === "expenses" && (
        <ExpenseTracker tripId={trip.id} members={trip.members} />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-slate-800">Delete trip?</h3>
            <p className="text-sm text-slate-500">
              This will permanently delete <span className="font-medium text-slate-700">{trip.name}</span> and all its activities, members, and expenses. This cannot be undone.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm font-medium transition flex-1"
              >
                {deleting ? "Deleting..." : "Yes, delete trip"}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary text-sm flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
