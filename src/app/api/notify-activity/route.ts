import { getFirebaseAccessToken } from "@/lib/firebase-token";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

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
    const supabase = getSupabase();
    if (!supabase) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

    const { tripId, activityTitle, addedByUserId } = await req.json();
    if (!tripId || !activityTitle) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { data: trip } = await supabase.from("trips").select("user_id, name, members(email)").eq("id", tripId).single();
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const memberEmails = (trip.members ?? []).map((m: any) => m.email);
    const allUserIds: string[] = [trip.user_id].filter((id) => id && id !== addedByUserId);

    if (memberEmails.length > 0) {
      const { data: users } = await supabase.auth.admin.listUsers();
      const matchedIds = (users?.users ?? [])
        .filter((u) => memberEmails.includes(u.email ?? "") && u.id !== addedByUserId)
        .map((u) => u.id);
      allUserIds.push(...matchedIds);
    }

    const uniqueUserIds = allUserIds.filter((id, i, arr) => arr.indexOf(id) === i);
    if (uniqueUserIds.length === 0) return NextResponse.json({ message: "No one to notify" });

    const title = trip.name + " — new activity!";
    const body = activityTitle + " was added to your trip.";
    const link = "/trips/" + tripId;

    await supabase.from("notifications").insert(
      uniqueUserIds.map((userId) => ({ user_id: userId, type: "activity_added", title, body, link }))
    );

    const { data: subs } = await supabase.from("push_subscriptions").select("fcm_token").in("user_id", uniqueUserIds);
    if (subs && subs.length > 0) {
      await Promise.all(subs.map((s: any) => s.fcm_token && sendFCMNotification(s.fcm_token, title, body, link)));
    }

    return NextResponse.json({ message: "Notified", count: uniqueUserIds.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
