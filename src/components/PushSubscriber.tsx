"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

export function PushSubscriber() {
  useEffect(() => {
    async function registerPlayerId() {
      try {
        const win = window as any;
        if (!win.OneSignal) return;

        win.OneSignalDeferred = win.OneSignalDeferred || [];
        win.OneSignalDeferred.push(async (OneSignal: any) => {
          const playerId = await OneSignal.User.PushSubscription.id;
          if (!playerId) return;

          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          await supabase.from("push_subscriptions").upsert({
            user_id: user.id,
            player_id: playerId,
          }, { onConflict: "user_id,player_id" });
        });
      } catch (e) {
        console.error("Push subscription error:", e);
      }
    }

    // Wait a bit for OneSignal to initialize
    setTimeout(registerPlayerId, 3000);
  }, []);

  return null;
}