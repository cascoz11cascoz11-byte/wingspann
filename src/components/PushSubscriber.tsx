"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

export function PushSubscriber() {
  useEffect(() => {
    async function saveFCMToken(token: string) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase.from("push_subscriptions").upsert({
          user_id: user.id,
          fcm_token: token,
        }, { onConflict: "user_id" });
        console.log("FCM token saved:", token);
      } catch (e) {
        console.error("Failed to save FCM token:", e);
      }
    }

    // Listen for FCM token event from native layer
    const handler = (event: any) => {
      const token = event.detail?.token || event.token;
      if (token) saveFCMToken(token);
    };

    window.addEventListener("fcmToken", handler);
    return () => window.removeEventListener("fcmToken", handler);
  }, []);

  return null;
}
