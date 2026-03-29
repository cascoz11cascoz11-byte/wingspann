"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

export function PushSubscriber() {
  useEffect(() => {
    let saved = false;

    async function saveFCMToken(token: string) {
      if (saved) return;
      saved = true;
      try {
        console.log("Saving FCM token:", token.substring(0, 20) + "...");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        console.log("Current user:", user?.id ?? "NOT LOGGED IN");
        if (!user) {
          saved = false;
          return;
        }
        const res = await fetch("/api/save-fcm-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: user.id, fcm_token: token }),
        });
        const data = await res.json();
        console.log("Save result:", JSON.stringify(data));
      } catch (e) {
        saved = false;
        console.error("Failed to save FCM token:", e);
      }
    }

    // Check immediately on mount
    const existingToken = (window as any).__fcmToken;
    if (existingToken) {
      console.log("Found existing FCM token on mount!");
      saveFCMToken(existingToken);
    }

    // Listen for future token events
    const handler = (event: any) => {
      console.log("fcmToken event fired!");
      const token = event.detail?.token;
      if (token) saveFCMToken(token);
    };
    window.addEventListener("fcmToken", handler);

    // Poll every 500ms for up to 30 seconds
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const token = (window as any).__fcmToken;
      console.log(`Poll attempt ${attempts}, token exists: ${!!token}`);
      if (token) {
        clearInterval(interval);
        saveFCMToken(token);
      }
      if (attempts >= 60) clearInterval(interval);
    }, 500);

    return () => {
      window.removeEventListener("fcmToken", handler);
      clearInterval(interval);
    };
  }, []);

  return null;
}
