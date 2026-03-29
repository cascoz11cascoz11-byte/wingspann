"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

export function PushSubscriber() {
  useEffect(() => {
    async function saveFCMToken(token: string) {
      try {
        console.log("Saving FCM token to Supabase:", token);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log("No user logged in, cannot save token");
          return;
        }
        const { error } = await supabase.from("push_subscriptions").upsert({
          user_id: user.id,
          fcm_token: token,
        }, { onConflict: "user_id" });
        if (error) console.error("Supabase upsert error:", error);
        else console.log("FCM token saved successfully!");
      } catch (e) {
        console.error("Failed to save FCM token:", e);
      }
    }

    // Listen for event
    const handler = (event: any) => {
      console.log("fcmToken event received:", event.detail);
      const token = event.detail?.token;
      if (token) {
        (window as any).__fcmToken = token;
        saveFCMToken(token);
      }
    };
    window.addEventListener("fcmToken", handler);

    // Also poll in case event already fired before this component mounted
    const interval = setInterval(() => {
      const token = (window as any).__fcmToken;
      if (token) {
        clearInterval(interval);
        saveFCMToken(token);
      }
    }, 1000);

    // Also update AppDelegate to store on window too
    return () => {
      window.removeEventListener("fcmToken", handler);
      clearInterval(interval);
    };
  }, []);

  return null;
}
