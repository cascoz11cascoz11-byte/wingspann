"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

export function PushSubscriber() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== "ios") return;

    const supabase = createClient();

    async function registerPush() {
      let permission = await PushNotifications.checkPermissions();
      if (permission.receive === "prompt") {
        permission = await PushNotifications.requestPermissions();
      }
      if (permission.receive !== "granted") {
        console.warn("Push notifications not granted.");
        return;
      }
      await PushNotifications.register();
    }

    // Clear badge whenever the page becomes visible
    function clearBadge() {
      PushNotifications.removeAllDeliveredNotifications();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") clearBadge();
    });

    // Clear on load too
    clearBadge();

    const tokenSub = PushNotifications.addListener("registration", async (token) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("push_tokens").upsert({
        user_id: user.id,
        token: token.value,
        platform: "ios",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    });

    const errorSub = PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error:", err);
    });

    const notifSub = PushNotifications.addListener("pushNotificationReceived", () => {
      // App is open — clear badge immediately
      PushNotifications.removeAllDeliveredNotifications();
    });

    const actionSub = PushNotifications.addListener("pushNotificationActionPerformed", () => {
      // User tapped notification — clear badge
      PushNotifications.removeAllDeliveredNotifications();
    });

    registerPush();

    return () => {
      document.removeEventListener("visibilitychange", clearBadge);
      tokenSub.then(s => s.remove());
      errorSub.then(s => s.remove());
      notifSub.then(s => s.remove());
      actionSub.then(s => s.remove());
    };
  }, []);

  return null;
}