"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

export function PushSubscriber() {
  useEffect(() => {
    async function registerFCMToken() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        // Listen for FCM token from native bridge
        const { App } = await import("@capacitor/app");
        
        // Get token via custom plugin event or window
        const win = window as any;
        
        // Poll for FCM token that AppDelegate posts
        let attempts = 0;
        const interval = setInterval(async () => {
          attempts++;
          const token = win.__fcmToken;
          if (token) {
            clearInterval(interval);
            await saveFCMToken(token);
          }
          if (attempts > 20) clearInterval(interval);
        }, 1000);

      } catch (e) {
        console.error("FCM registration error:", e);
      }
    }

    async function saveFCMToken(token: string) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        fcm_token: token,
      }, { onConflict: "user_id" });
      console.log("FCM token saved:", token);
    }

    registerFCMToken();
  }, []);
  return null;
}
