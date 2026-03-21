import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ONESIGNAL_APP_ID = "68f645ed-1d8f-4e5c-97bb-1548062edcd8";
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { tripId, tripName, memberNames, joinedByUserId } = await req.json();
    if (!tripId) return NextResponse.json({ error: "Missing tripId" }, { status: 400 });

    const { data: trip } = await supabase.from("trips").select("user_id").eq("id", tripId).single();
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const ownerId = trip.user_id;
    if (!ownerId || ownerId === joinedByUserId) {
      return NextResponse.json({ message: "No one to notify" });
    }

    const title = memberNames + " joined " + tripName + "!";
    const body = "Head over to the trip to see who's coming.";

    await supabase.from("notifications").insert({
      user_id: ownerId,
      type: "member_joined",
      title,
      body,
      link: "/trips/" + tripId,
    });

    const { data: subs } = await supabase.from("push_subscriptions").select("player_id").eq("user_id", ownerId);
    if (subs && subs.length > 0) {
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + ONESIGNAL_API_KEY,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_player_ids: subs.map((s: any) => s.player_id),
          headings: { en: title },
          contents: { en: body },
          url: "https://wingspann.vercel.app/trips/" + tripId,
        }),
      });
    }

    return NextResponse.json({ message: "Notified" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
