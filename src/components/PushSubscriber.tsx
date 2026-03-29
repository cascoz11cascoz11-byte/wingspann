"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";

export function PushSubscriber() {
  useEffect(() => {
    const supabase = createClient();

    async function saveFCMToken(token: string) {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Attempting save, user:", user?.id ?? "NOT LOGGED IN");
      if (!user) return;
      const res = await fetch("/api/save-fcm-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, fcm_token: token }),
      });
      const data = await res.json();
      console.log("Save result:", JSON.stringify(data));
    }

    // Listen for token event from native
    const handler = (event: any) => {
      const token = event.detail?.token;
      if (token) {
        (window as any).__fcmToken = token;
        saveFCMToken(token);
      }
    };
    window.addEventListener("fcmToken", handler);

    // When auth state changes (user logs in), save any existing token
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        const token = (window as any).__fcmToken;
        if (token && session?.user) {
          console.log("User just signed in, saving FCM token...");
          saveFCMToken(token);
        }
      }
    });

    // Poll for token
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const token = (window as any).__fcmToken;
      if (token) {
        clearInterval(interval);
        saveFCMToken(token);
      }
      if (attempts >= 60) clearInterval(interval);
    }, 500);

    return () => {
      window.removeEventListener("fcmToken", handler);
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return null;
}
