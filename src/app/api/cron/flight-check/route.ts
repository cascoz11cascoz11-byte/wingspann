import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ONESIGNAL_APP_ID = "68f645ed-1d8f-4e5c-97bb-1548062edcd8";
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY!;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkFlight(flightNumber: string, date: string) {
  try {
    const res = await fetch(
      "https://aerodatabox.p.rapidapi.com/flights/number/" + flightNumber + "/" + date,
      {
        headers: {
          "x-rapidapi-host": "aerodatabox.p.rapidapi.com",
          "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] ?? null;
  } catch { return null; }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== "Bearer " + process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const { data: flights } = await supabase
    .from("activities")
    .select("*, trips(user_id, name)")
    .eq("travel_subtype", "flight")
    .in("date", [today, tomorrow])
    .not("flight_number", "is", null);

  if (!flights || flights.length === 0) {
    return NextResponse.json({ message: "No flights to check" });
  }

  let notificationsSent = 0;

  for (const flight of flights) {
    const flightData = await checkFlight(flight.flight_number, flight.date);
    if (!flightData) continue;

    const status = flightData.status;
    if (status !== "Delayed" && status !== "Cancelled") continue;

    const userId = flight.trips?.user_id;
    if (!userId) continue;

    const title = status === "Cancelled" ? "✈️ Flight Cancelled" : "light Delayed";
    const body = "Flight " + flight.flight_number + " on " + flight.date + " is " + status.toLowerCase() + ".";

    // Save to notifications table
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "flight_status",
      title,
      body,
      link: "/trips/" + flight.trip_id,
    });

    // Send push
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("player_id")
      .eq("user_id", userId);

    if (subs && subs.length > 0) {
      const playerIds = subs.map((s: any) => s.player_id);
      await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + ONESIGNAL_API_KEY,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_player_ids: playerIds,
          headings: { en: title },
          contents: { en: body },
          url: "https://wingspann.vercel.app/trips/" + flight.trip_id,
        }),
      });
      notificationsSent++;
    }
  }

  return NextResponse.json({ message: "Done", notificationsSent });
}
