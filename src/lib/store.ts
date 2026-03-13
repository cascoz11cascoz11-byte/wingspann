import { createClient } from "@/lib/supabase";
import type { Trip, Activity, FamilyMember } from "@/types";

export interface Car {
  id: string;
  tripId: string;
  name: string;
  seats: number;
  layout: string;
  assignments: { memberId: string; seatIndex: number }[];
  createdAt: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  name: string;
  category?: string;
  description?: string;
  venue?: string;
  price?: string;
  link?: string;
  distance?: string;
  createdAt: string;
}

export interface StandaloneEvent {
  id: string;
  createdBy: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  inviteCode: string;
  members: { id: string; name: string; email: string; status: string }[];
  createdAt: string;
}

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
    end_time: activity.endTime,
    check_out_date: activity.checkOutDate,
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
    end_time: updates.endTime,
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

export async function getCars(tripId: string): Promise<Car[]> {
  const { data } = await db().from("cars").select("*, car_assignments(*)").eq("trip_id", tripId).order("created_at", { ascending: true });
  return (data ?? []).map(mapCar);
}

export async function addCar(tripId: string, name: string, seats: number, layout: string = "2+3"): Promise<Car | undefined> {
  const { data } = await db().from("cars").insert({ trip_id: tripId, name, seats, layout }).select("*, car_assignments(*)").single();
  return data ? mapCar(data) : undefined;
}

export async function removeCar(carId: string): Promise<boolean> {
  const { error } = await db().from("cars").delete().eq("id", carId);
  return !error;
}

export async function assignSeat(carId: string, memberId: string, seatIndex: number): Promise<boolean> {
  await db().from("car_assignments").delete().eq("member_id", memberId);
  const { error } = await db().from("car_assignments").insert({ car_id: carId, member_id: memberId, seat_index: seatIndex });
  return !error;
}

export async function unassignSeat(carId: string, seatIndex: number): Promise<boolean> {
  const { error } = await db().from("car_assignments").delete().eq("car_id", carId).eq("seat_index", seatIndex);
  return !error;
}

// Wishlist
export async function getWishlist(): Promise<WishlistItem[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await db().from("wishlists").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []).map(mapWishlistItem);
}

export async function addToWishlist(item: Omit<WishlistItem, "id" | "userId" | "createdAt">): Promise<WishlistItem | undefined> {
  const userId = await getUserId();
  if (!userId) return undefined;
  const { data } = await db().from("wishlists").insert({
    user_id: userId,
    name: item.name,
    category: item.category,
    description: item.description,
    venue: item.venue,
    price: item.price,
    link: item.link,
    distance: item.distance,
  }).select().single();
  return data ? mapWishlistItem(data) : undefined;
}

export async function removeFromWishlist(id: string): Promise<boolean> {
  const { error } = await db().from("wishlists").delete().eq("id", id);
  return !error;
}

// Standalone events
export async function getStandaloneEvents(): Promise<StandaloneEvent[]> {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await db().from("standalone_events").select("*, standalone_event_members(*)").eq("created_by", userId).order("date", { ascending: true });
  return (data ?? []).map(mapStandaloneEvent);
}

export async function createStandaloneEvent(event: { title: string; date: string; time?: string; location?: string }): Promise<StandaloneEvent | undefined> {
  const userId = await getUserId();
  if (!userId) return undefined;
  const { data } = await db().from("standalone_events").insert({
    created_by: userId,
    title: event.title,
    date: event.date,
    time: event.time,
    location: event.location,
  }).select("*, standalone_event_members(*)").single();
  return data ? mapStandaloneEvent(data) : undefined;
}

export async function removeStandaloneEvent(id: string): Promise<boolean> {
  const { error } = await db().from("standalone_events").delete().eq("id", id);
  return !error;
}

export async function addStandaloneEventMember(eventId: string, name: string, email: string): Promise<boolean> {
  const { error } = await db().from("standalone_event_members").insert({ event_id: eventId, name, email, status: "pending" });
  return !error;
}

export async function getStandaloneEventByInviteCode(code: string): Promise<StandaloneEvent | undefined> {
  const { data } = await db().from("standalone_events").select("*, standalone_event_members(*)").eq("invite_code", code).single();
  return data ? mapStandaloneEvent(data) : undefined;
}

export async function updateStandaloneEventMemberStatus(eventId: string, email: string, status: "accepted" | "declined"): Promise<boolean> {
  const { error } = await db().from("standalone_event_members").update({ status }).eq("event_id", eventId).eq("email", email);
  return !error;
}

// Mappers
function mapCar(data: any): Car {
  return {
    id: data.id,
    tripId: data.trip_id,
    name: data.name,
    seats: data.seats,
    layout: data.layout ?? "2+3",
    assignments: (data.car_assignments ?? []).map((a: any) => ({
      memberId: a.member_id,
      seatIndex: a.seat_index,
    })),
    createdAt: data.created_at,
  };
}

function mapWishlistItem(data: any): WishlistItem {
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    category: data.category,
    description: data.description,
    venue: data.venue,
    price: data.price,
    link: data.link,
    distance: data.distance,
    createdAt: data.created_at,
  };
}

function mapStandaloneEvent(data: any): StandaloneEvent {
  return {
    id: data.id,
    createdBy: data.created_by,
    title: data.title,
    date: data.date,
    time: data.time,
    location: data.location,
    inviteCode: data.invite_code,
    members: (data.standalone_event_members ?? []).map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      status: m.status,
    })),
    createdAt: data.created_at,
  };
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
    endTime: data.end_time,
    checkOutDate: data.check_out_date,
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