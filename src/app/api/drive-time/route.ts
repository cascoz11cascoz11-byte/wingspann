import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");

  if (!origin || !destination) {
    return NextResponse.json({ error: "Missing origin or destination" }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();
  const duration = data?.rows?.[0]?.elements?.[0]?.duration?.text;

  return NextResponse.json({ duration: duration ?? null });
}