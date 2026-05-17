import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5Y2RvcGtlZnBoZ3Z6dnF0Y2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDAxOTEsImV4cCI6MjA4ODY3NjE5MX0.KZV1vo_jGPmaqIP7PTPLX-aZ0tqHCC0Z0u8EXbH8g08";

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const supabase = createClient(url, key);

  async function sendAPNSNotification(token: string, title: string, body: string) {
    await fetch("https://fycdopkefphgvzvqtccc.supabase.co/functions/v1/send-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ token, type: "join", tripName: title, activityName: body, sandbox: false }),
    });
  }

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