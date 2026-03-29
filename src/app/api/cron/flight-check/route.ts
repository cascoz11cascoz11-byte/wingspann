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

async function checkFlight(flightNumber: string, date: string) {
  try {
    const res = await fetch(
      "https://aerodatabox.p.rapidapi.com/flights/number/" + flightNumber + "/" + date,
      { headers: { "x-rapidapi-host": "aerodatabox.p.rapidapi.com", "x-rapidapi-key": process.env.RAPIDAPI_KEY! } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] ?? null;
  } catch { return null; }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabase();
  if (!supabase) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const { data: flights } = await supabase
    .from("activities").select("*, trips(user_id, name)")
    .eq("travel_subtype", "flight").in("date", [today, tomorrow]).not("flight_number", "is", null);

  if (!flights || flights.length === 0) return NextResponse.json({ message: "No flights to check" });

  let notificationsSent = 0;

  for (const flight of flights) {
    const flightData = await checkFlight(flight.flight_number, flight.date);
    if (!flightData) continue;
    const status = flightData.status;
    if (status !== "Delayed" && status !== "Cancelled") continue;

    const userId = flight.trips?.user_id;
    if (!userId) continue;

    const title = status === "Cancelled" ? "✈️ Flight Cancelled" : "✈️ Flight Delayed";
    const body = "Flight " + flight.flight_number + " on " + flight.date + " is " + status.toLowerCase() + ".";
    const link = "/trips/" + flight.trip_id;

    await supabase.from("notifications").insert({ user_id: userId, type: "flight_status", title, body, link });

    const { data: subs } = await supabase.from("push_subscriptions").select("fcm_token").eq("user_id", userId);
    if (subs && subs.length > 0) {
    Promise.all(subs.map((s: any) => s.fcm_token && sendFCMNotification(s.fcm_token, title, body, link)));
      notificationsSent++;
    }
  }

  return NextResponse.json({ message: "Done", notificationsSent });
}
