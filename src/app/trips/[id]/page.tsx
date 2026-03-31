"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getTrip, deleteTrip, updateTrip } from "@/lib/store";
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
import { MapTab } from "@/components/MapTab";
import PhotoCircleLink from "@/components/PhotoCircleLink";
import { createClient } from "@/lib/supabase";

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
  if (today >= start && today <= end) return { label: "Happening now! 🎉", color: "bg-emerald-100 text-emerald-700" };
  const days = Math.round((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 1) return { label: "Tomorrow!", color: "bg-amber-100 text-amber-700" };
  if (days <= 7) return { label: "In " + days + " days!", color: "bg-amber-100 text-amber-700" };
  if (days <= 30) return { label: "In " + days + " days", color: "bg-sky-100 text-sky-700" };
  return { label: "In " + days + " days", color: "bg-slate-100 text-slate-500" };
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"itinerary" | "expenses" | "map">("itinerary");
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [membersCollapsed, setMembersCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !trip) return;
    setUploadingPhoto(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${trip.id}/cover.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("trip_image")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("trip_image")
        .getPublicUrl(path);
      await updateTrip(trip.id, { coverImage: publicUrl });
      await refreshTrip();
    } catch (err) {
      console.error(err);
    }
    setUploadingPhoto(false);
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
      {/* Hero */}
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 mb-6 overflow-hidden" style={{ minHeight: 280 }}>
        {trip.coverImage ? (
          <img src={trip.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400 via-violet-400 to-pink-400" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-sky-900/40 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />

        <div className="relative z-10 flex items-center justify-between px-4 pt-4">
          <Link href="/?tab=trips" className="flex items-center justify-center w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm hover:bg-white/30 transition">
            ←
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs text-white/70 hover:text-red-300 transition"
          >
            Delete trip
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-10 space-y-3">
          <span className={"inline-block rounded-full px-3 py-1 text-xs font-semibold " + countdown.color}>
            {countdown.label}
          </span>
          <h1 className="font-display text-3xl font-bold text-white drop-shadow-lg leading-tight">
            {trip.name}
          </h1>
          <p className="text-white/90 font-medium">{trip.destination}</p>
          <p className="text-white/70 text-sm">{formatDateRange(trip.startDate, trip.endDate)}</p>
          {trip.description && <p className="text-white/70 text-sm max-w-sm">{trip.description}</p>}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="mt-2 flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1.5 text-xs text-white hover:bg-white/30 transition"
          >
            {uploadingPhoto ? "Uploading..." : trip.coverImage ? "✏️ Change photo" : "📷 Add cover photo"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handlePhotoUpload} />
        </div>
      </div>

      {/* Invite buttons */}
      <div className="flex flex-col gap-2 mb-6">
        <button onClick={copyInviteLink} className="btn-secondary text-sm w-full">
          {copied ? "Copied!" : "Copy invite link"}
        </button>
        <PhotoCircleLink tripName={trip.name} />
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
              <button
                type="button"
                onClick={() => setMembersCollapsed((c) => !c)}
                className="font-display text-lg font-semibold text-sky-700 flex items-center gap-2"
              >
                Group members
                <span className="text-sm text-slate-400">{membersCollapsed ? "▼" : "▲"}</span>
              </button>
              <div className="flex gap-2">
                <CarOrganizer tripId={trip.id} members={trip.members} />
                <RoomPicker members={trip.members} />
                <InviteMember tripId={trip.id} onInvited={refreshTrip} />
              </div>
            </div>
            {!membersCollapsed && (
              <MemberList tripId={trip.id} members={trip.members} onUpdate={refreshTrip} />
            )}
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