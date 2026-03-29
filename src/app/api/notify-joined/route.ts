import { getFirebaseAccessToken } from "@/lib/firebase-token";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function sendFCMNotification(token: string, title: string, body: string, link: string) {
  const res = await fetch("https://fcm.googleapis.com/v1/projects/wingspann-81463/messages:send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + await getFirebaseAccessToken(),
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        webpush: { fcm_options: { link: "https://wingspann.vercel.app" + link } },
      },
    }),
  });
  return res.ok;
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

    const { data: subs } = await supabase.from("push_subscriptions").select("fcm_token").eq("user_id", ownerId);
    if (subs && subs.length > 0) {
      await Promise.all(subs.map((s: any) => s.fcm_token && sendFCMNotification(s.fcm_token, title, body, link)));
    }

    return NextResponse.json({ message: "Notified" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
