import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { token, type, tripName, activityName, userId } = await req.json();

  const APNS_KEY_ID = Deno.env.get("APNS_KEY_ID")!;
  const APNS_TEAM_ID = Deno.env.get("APNS_TEAM_ID")!;
  const APNS_BUNDLE_ID = Deno.env.get("APNS_BUNDLE_ID")!;
  const APNS_PRIVATE_KEY = Deno.env.get("APNS_PRIVATE_KEY")!.replace(/\\n/g, "\n");

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const messages: Record<string, { title: string; body: string }> = {
    invite: { title: "You've been invited! ✈️", body: `You were invited to join ${tripName}` },
    join: { title: "Someone joined your trip! 🎉", body: `A new member joined ${tripName}` },
    activity: { title: "Itinerary updated 📋", body: `${activityName} was added to ${tripName}` },
  };

  const message = messages[type];
  if (!message) return new Response(JSON.stringify({ error: "Invalid type" }), { status: 400 });

  try {
    // Look up how many unread notifications this user has, for the badge count
    let badgeCount = 1;
    if (userId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: unreadCount, error: countError } = await supabase.rpc("get_unread_count", { uid: userId });
      if (!countError && typeof unreadCount === "number") {
        badgeCount = unreadCount;
      }
    }

    const pemContents = APNS_PRIVATE_KEY
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\s/g, "");

    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["sign"]
    );

    const header = { alg: "ES256", kid: APNS_KEY_ID };
    const payload = { iss: APNS_TEAM_ID, iat: Math.floor(Date.now() / 1000) };

    const encode = (obj: object) => btoa(JSON.stringify(obj))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const headerB64 = encode(header);
    const payloadB64 = encode(payload);
    const signingInput = `${headerB64}.${payloadB64}`;

    const signature = await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      privateKey,
      new TextEncoder().encode(signingInput)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const jwtToken = `${signingInput}.${signatureB64}`;

    const host = "https://api.push.apple.com";

    const response = await fetch(`${host}/3/device/${token}`, {
      method: "POST",
      headers: {
        authorization: `bearer ${jwtToken}`,
        "apns-topic": APNS_BUNDLE_ID,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        aps: {
          alert: { title: message.title, body: message.body },
          sound: "default",
          badge: badgeCount,
        },
      }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: responseText }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
});