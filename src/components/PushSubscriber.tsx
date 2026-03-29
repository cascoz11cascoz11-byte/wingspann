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
      // 1. Ask for permission
      let permission = await PushNotifications.checkPermissions();
      if (permission.receive === "prompt") {
        permission = await PushNotifications.requestPermissions();
      }
      if (permission.receive !== "granted") {
        console.warn("Push notifications not granted.");
        return;
      }

      // 2. Register with Apple (APNs) — no Firebase needed
      await PushNotifications.register();
    }

    // 3. When Apple gives us a device token, save it to Supabase
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

    // 4. Handle errors
    const errorSub = PushNotifications.addListener("registrationError", (err) => {
      console.error("Push registration error:", err);
    });

    // 5. Handle incoming notifications while app is open
    const notifSub = PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("Notification received:", notification);
      // You can show an in-app alert here if you want
    });

    // 6. Handle tap on notification (app was in background)
    const actionSub = PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("Notification tapped:", action.notification);
      // You can navigate to specific screens here based on action.notification.data
    });

    registerPush();

    return () => {
      tokenSub.then(s => s.remove());
      errorSub.then(s => s.remove());
      notifSub.then(s => s.remove());
      actionSub.then(s => s.remove());
    };
  }, []);

  return null;
}