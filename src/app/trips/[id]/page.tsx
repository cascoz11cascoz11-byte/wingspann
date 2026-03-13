"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTrip } from "@/lib/store";
import type { Trip } from "@/types";
import Link from "next/link";
import { InviteMember } from "@/components/InviteMember";
import { MemberList } from "@/components/MemberList";
import { ActivityList } from "@/components/ActivityList";
import { AddActivity } from "@/components/AddActivity";
import { RoomPicker } from "@/components/RoomPicker";
import { CarOrganizer } from "@/components/CarOrganizer";
import { ActivityFinder } from "@/components/ActivityFinder";

function formatDateRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const e = new Date(end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${s} - ${e}`;
}

export default function TripDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);

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
    const link = `${window.location.origin}/join/${trip.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <div>
      <Link href="/" className="mb-6 inline-block text-sm text-slate-600 hover:text-sky-600">
        Back to trips
      </Link>
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-sky-700">{trip.name}</h1>
            <p className="mt-1 text-slate-600">{trip.destination}</p>
            <p className="mt-1 text-sm text-slate-500">{formatDateRange(trip.startDate, trip.endDate)}</p>
            {trip.description && <p className="mt-2 text-slate-600">{trip.description}</p>}
          </div>
          <button
            onClick={copyInviteLink}
            className="btn-secondary shrink-0 text-sm"
          >
            {copied ? "Copied!" : "Copy invite link"}
          </button>
        </div>
      </div>

      <div className="space-y-10">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-sky-700">Family members</h2>
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
              />
              <AddActivity tripId={trip.id} onAdded={refreshTrip} />
            </div>
          </div>
          <ActivityList tripId={trip.id} activities={trip.activities} members={trip.members} onUpdate={refreshTrip} />
        </section>
      </div>
    </div>
  );
}