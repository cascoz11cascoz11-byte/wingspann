import { createClient } from "@supabase/supabase-js";
import type { Trip, Activity, FamilyMember } from "@/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getTrips(): Promise<Trip[]> {
  const { data: trips } = await supabase.from("trips").select("*, members(*), activities(*)").order("created_at", { ascending: false });
  return (trips ?? []).map(mapTrip);
}

export async function getTrip(id: string): Promise<Trip | undefined> {
  const { data } = await supabase.from("trips").select("*, members(*), activities(*)").eq("id", id).single();
  return data ? mapTrip(data) : undefined;
}

export async function getTripByInviteCode(code: string): Promise<Trip | undefined> {
  const { data } = await supabase.from("trips").select("*, members(*), activities(*)").eq("invite_code", code).single();
  return data ? mapTrip(data) : undefined;
}

export async function createTrip(data: Omit<Trip, "id" | "createdAt" | "activities" | "members">): Promise<Trip> {
  const { data: trip } = await supabase.from("trips").insert({
    name: data.name,
    destination: data.destination,
    start_date: data.startDate,
    end_date: data.endDate,
    description: data.description,
    cover_image: data.coverImage,
    created_by: data.createdBy,
  }).select("*, members(*), activities(*)").single();
  return mapTrip(trip);
}

export async function addMember(tripId: string, member: Omit<FamilyMember, "id">): Promise<FamilyMember | undefined> {
  const { data } = await supabase.from("members").insert({
    trip_id: tripId,
    name: member.name,
    email: member.email,
    status: "pending",
  }).select().single();
  return data ? { id: data.id, name: data.name, email: data.email, status: data.status } : undefined;
}

export async function removeMember(tripId: string, memberId: string): Promise<boolean> {
  const { error } = await supabase.from("members").delete().eq("id", memberId).eq("trip_id", tripId);
  return !error;
}

export async function addActivity(tripId: string, activity: Omit<Activity, "id" | "createdAt">): Promise<Activity | undefined> {
  const { data } = await supabase.from("activities").insert({
    trip_id: tripId,
    title: activity.title,
    description: activity.description,
    date: activity.date,
    time: activity.time,
    location: activity.location,
    link: activity.link,
    type: activity.type,
  }).select().single();
  return data ? mapActivity(data) : undefined;
}

export async function updateActivity(tripId: string, activityId: string, updates: Partial<Activity>): Promise<Activity | undefined> {
  const { data } = await supabase.from("activities").update({
    title: updates.title,
    description: updates.description,
    date: updates.date,
    time: updates.time,
    location: updates.location,
    link: updates.link,
    type: updates.type,
  }).eq("id", activityId).eq("trip_id", tripId).select().single();
  return data ? mapActivity(data) : undefined;
}

export async function removeActivity(tripId: string, activityId: string): Promise<boolean> {
  const { error } = await supabase.from("activities").delete().eq("id", activityId).eq("trip_id", tripId);
  return !error;
}

function mapTrip(data: any): Trip {
  return {
    id: data.id,
    name: data.name,
    destination: data.destination,
    startDate: data.start_date,
    endDate: data.end_date,
    description: data.description,
    coverImage: data.cover_image,
    createdAt: data.created_at,
    createdBy: data.created_by,
    inviteCode: data.invite_code,
    members: (data.members ?? []).map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatar: m.avatar,
      status: m.status,
    })),
    activities: (data.activities ?? []).map(mapActivity).sort((a: Activity, b: Activity) =>
      a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || "")
    ),
  };
}

function mapActivity(data: any): Activity {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    date: data.date,
    time: data.time,
    location: data.location,
    link: data.link,
    type: data.type,
    createdAt: data.created_at,
  };
}
