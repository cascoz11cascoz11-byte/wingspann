import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";

let nativePushListenersAttached = false;

export async function initPush() {
  if (!Capacitor.isNativePlatform()) return;

  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === "prompt") {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== "granted") {
    console.log("❌ Permission denied");
    return;
  }

  await PushNotifications.register();

  if (nativePushListenersAttached) return;
  nativePushListenersAttached = true;

  PushNotifications.addListener("registration", (token) => {
    console.log("🔥 DEVICE TOKEN:", token.value);
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.error("❌ Registration error:", err);
  });
}
