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
    const { tripId, activityTitle, addedByUserId } = await req.json();
    if (!tripId || !activityTitle) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { data: trip } = await supabase
      .from("trips")
      .select("user_id, name, members(email)")
      .eq("id", tripId)
      .single();

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

    const uniqueUserIds = [...new Set(allUserIds)];
    if (uniqueUserIds.length === 0) {
      return NextResponse.json({ message: "No one to notify" });
    }

    // Save to notifications table
    await supabase.from("notifications").insert(
      uniqueUserIds.map((userId) => ({
        user_id: userId,
        type: "activity_added",
        title: trip.name + " — new activity!",
        body: activityTitle + " was added to your trip.",
        link: "/trips/" + tripId,
      }))
    );

    // Send push notification
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("player_id")
      .in("useid", uniqueUserIds);

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
          headings: { en: trip.name + " — new activity!" },
          contents: { en: activityTitle + " was added to your trip." },
          url: "https://wingspann.vercel.app/trips/" + tripId,
        }),
      });
    }

    return NextResponse.json({ message: "Notified", count: uniqueUserIds.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
