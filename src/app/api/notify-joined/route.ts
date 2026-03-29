import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendAPNSNotification(token: string, title: string, body: string) {
  await fetch("https://wingspann.vercel.app/api/send-notification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, type: "join", tripName: title, activityName: body }),
  });
}

export async function POST(req: Request) {
  try {
    const { tripId, tripName, memberNames, joinedByUserId } = await req.json();
    if (!tripId) return NextResponse.json({ error: "Missing tripId" }, { status: 400 });

    const { data: trip } = await supabase.from("trips").select("user_id").eq("id", tripId).single();
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const ownerId = trip.user_id;
    if (!ownerId || ownerId === joinedByUserId) return NextResponse.json({ message: "No one to notify" });

    const title = memberNames + " joined " + tripName + "!";
    const body = "Head over to the trip to see who's coming.";
    const link = "/trips/" + tripId;

    await supabase.from("notifications").insert({ user_id: ownerId, type: "member_joined", title, body, link });

    const { data: subs } = await supabase.from("push_tokens").select("token").eq("user_id", ownerId);
    if (subs && subs.length > 0) {
      await Promise.all(subs.map((s: any) => s.token && sendAPNSNotification(s.token, title, body)));
    }

    return NextResponse.json({ message: "Notified" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}