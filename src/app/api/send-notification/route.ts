export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { SignJWT, importPKCS8 } from "jose";

export async function POST(req: NextRequest) {
  const APNS_KEY_ID = process.env.APNS_KEY_ID;
  const APNS_TEAM_ID = process.env.APNS_TEAM_ID;
  const APNS_BUNDLE_ID = process.env.APNS_BUNDLE_ID;
  const APNS_PRIVATE_KEY = process.env.APNS_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_BUNDLE_ID || !APNS_PRIVATE_KEY) {
    return NextResponse.json({ error: "Missing APNS environment variables" }, { status: 500 });
  }

  const { token, type, tripName, activityName } = await req.json();

  const messages: Record<string, { title: string; body: string }> = {
    invite: { title: "You've been invited! ✈️", body: `You were invited to join ${tripName}` },
    join: { title: "Someone joined your trip! 🎉", body: `A new member joined ${tripName}` },
    activity: { title: "Itinerary updated 📋", body: `${activityName} was added to ${tripName}` },
  };

  const message = messages[type];
  if (!message) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  try {
    const privateKey = await importPKCS8(APNS_PRIVATE_KEY, "ES256");

    const jwtToken = await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: APNS_KEY_ID })
      .setIssuer(APNS_TEAM_ID)
      .setIssuedAt()
      .sign(privateKey);

    const response = await fetch(`https://api.push.apple.com/3/device/${token}`, {
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
        },
      }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      return NextResponse.json({ error: responseText, status: response.status }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}