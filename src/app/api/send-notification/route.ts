import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const APNS_KEY_ID = process.env.APNS_KEY_ID!;
const APNS_TEAM_ID = process.env.APNS_TEAM_ID!;
const APNS_BUNDLE_ID = process.env.APNS_BUNDLE_ID!;
const APNS_PRIVATE_KEY = process.env.APNS_PRIVATE_KEY!.replace(/\\n/g, "\n");

function makeJWT() {
  return jwt.sign({}, APNS_PRIVATE_KEY, {
    algorithm: "ES256",
    keyid: APNS_KEY_ID,
    issuer: APNS_TEAM_ID,
    audience: "appstoreconnect-v1",
    expiresIn: "1h",
  });
}

export async function POST(req: NextRequest) {
  const { token, type, tripName, activityName } = await req.json();

  const messages: Record<string, { title: string; body: string }> = {
    invite: {
      title: "You've been invited! ✈️",
      body: `You were invited to join ${tripName}`,
    },
    join: {
      title: "Someone joined your trip! 🎉",
      body: `A new member joined ${tripName}`,
    },
    activity: {
      title: "Itinerary updated 📋",
      body: `${activityName} was added to ${tripName}`,
    },
  };

  const message = messages[type];
  if (!message) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const jwtToken = makeJWT();

  const response = await fetch(`https://api.push.apple.com/3/device/${token}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwtToken}`,
      "apns-topic": APNS_BUNDLE_ID,
      "apns-push-type": "alert",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      aps: {
        alert: {
          title: message.title,
          body: message.body,
        },
        sound: "default",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}