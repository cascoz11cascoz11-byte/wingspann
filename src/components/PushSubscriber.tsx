"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

export function PushSubscriber() {
  useEffect(() => {
    async function saveFCMToken(token: string) {
      try {
        console.log("Saving FCM token:", token);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        console.log("Current user:", user?.id ?? "none");
        if (!user) return;

        const res = await fetch("/api/save-fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, fcm_token: token }),
        });
        const data = await res.json();
        console.log("Save FCM token response:", JSON.stringify(data));
      } catch (e) {
        console.error("Failed to save FCM token:", e);
      }
    }

    // Listen for token event from native
    const handler = (event: any) => {
      console.log("fcmToken event received:", JSON.stringify(event.detail));
      const token = event.detail?.token;
      if (token) saveFCMToken(token);
    };
    window.addEventListener("fcmToken", handler);

    // Poll in case event fired before component mounted
    const interval = setInterval(() => {
      const token = (window as any).__fcmToken;
      if (token) {
        clearInterval(interval);
        saveFCMToken(token);
      }
    }, 500);

    return () => {
      window.removeEventListener("fcmToken", handler);
      clearInterval(interval);
    };
  }, []);

  return null;
}
