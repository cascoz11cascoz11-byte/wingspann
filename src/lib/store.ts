import { createClient } from "@/lib/supabase";
import type { Trip, Activity, FamilyMember } from "@/types";

function db() {
  return createClient();
}

async function getUserId(): Promise<string | undefined> {
  const { data: { user } } = await db().auth.getUser();
  return user?.id;
}

export async function getTrips(): Promise<Trip[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data: trips } = await db().from("trips").select("*, members(*), activities(*, activity_participants(*))").eq("user_id", userId).order("created_at", { ascending: false });
  return (trips ?? []).map(mapTrip);
}

export async function getTrip(id: string): Promise<Trip | undefined> {
  const { data } = await db().from("trips").select("*, members(*), activities(*, activity_participants(*))").eq("id", id).single();
  return data ? mapTrip(data) : undefined;
}

export async function getTripByInviteCode(code: string): Promise<Trip | undefined> {
  const { data } = await db().from("trips").select("*, members(*), activities(*, activity_participants(*))").eq("invite_code", code).single();
  return data ? mapTrip(data) : undefined;
}

export async function createTrip(data: Omit<Trip, "id" | "createdAt" | "activities" | "members">): Promise<Trip> {
  const userId = await getUserId();
  const { data: trip, error } = await db().from("trips").insert({
    name: data.name,
    destination: data.destination,
    start_date: data.startDate,
    end_date: data.endDate,
    description: data.description,
    cover_image: data.coverImage,
    created_by: data.createdBy,
    user_id: userId,
  }).select("*, members(*), activities(*, activity_participants(*))").single();
  if (error) throw new Error(error.message);
  return mapTrip(trip);
}

export async function addMember(tripId: string, member: Omit<FamilyMember, "id">): Promise<FamilyMember | undefined> {
  const { data } = await db().from("members").insert({
    trip_id: tripId,
    name: member.name,
    email: member.email,
    status: member.status,
  }).select().single();
  return data ? { id: data.id, name: data.name, email: data.email, status: data.status } : undefined;
}

export async function removeMember(tripId: string, memberId: string): Promise<boolean> {
  const { error } = await db().from("members").delete().eq("id", memberId).eq("trip_id", tripId);
  return !error;
}

export async function addActivity(tripId: string, activity: Omit<Activity, "id" | "createdAt">): Promise<Activity | undefined> {
  const { data } = await db().from("activities").insert({
    trip_id: tripId,
    title: activity.title,
    description: activity.description,
    date: activity.date,
    time: activity.time,
    location: activity.location,
    link: activity.link,
    type: activity.type,
    travel_subtype: activity.travelSubtype,
    departure_location: activity.departureLocation,
    arrival_location: activity.arrivalLocation,
    arrival_time: activity.arrivalTime,
    flight_number: activity.flightNumber,
    drive_time: activity.driveTime,
  }).select().single();
  return data ? mapActivity(data) : undefined;
}

export async function updateActivity(tripId: string, activityId: string, updates: Partial<Activity>): Promise<Activity | undefined> {
  const { data } = await db().from("activities").update({
    title: updates.title,
    description: updates.description,
    date: updates.date,
    time: updates.time,
    location: updates.location,
    link: updates.link,
    type: updates.type,
    travel_subtype: updates.travelSubtype,
    departure_location: updates.departureLocation,
    arrival_location: updates.arrivalLocation,
    arrival_time: updates.arrivalTime,
    flight_number: updates.flightNumber,
    drive_time: updates.driveTime,
  }).eq("id", activityId).eq("trip_id", tripId).select().single();
  return data ? mapActivity(data) : undefined;
}

export async function updateActivityParticipants(activityId: string, memberIds: string[]): Promise<boolean> {
  const supabase = db();
  await supabase.from("activity_participants").delete().eq("activity_id", activityId);
  if (memberIds.length === 0) return true;
  const { error } = await supabase.from("activity_participants").insert(
    memberIds.map((memberId) => ({ activity_id: activityId, member_id: memberId }))
  );
  return !error;
}

export async function removeActivity(tripId: string, activityId: string): Promise<boolean> {
  const { error } = await db().from("activities").delete().eq("id", activityId).eq("trip_id", tripId);
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
    travelSubtype: data.travel_subtype,
    departureLocation: data.departure_location,
    arrivalLocation: data.arrival_location,
    arrivalTime: data.arrival_time,
    flightNumber: data.flight_number,
    driveTime: data.drive_time,
    participants: (data.activity_participants ?? []).map((p: any) => p.member_id),
    createdAt: data.created_at,
  };
}
