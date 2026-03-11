import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const flightNumber = searchParams.get("flight");
  const date = searchParams.get("date");

  if (!flightNumber || !date) {
    return NextResponse.json({ error: "Missing flight number or date" }, { status: 400 });
  }

  const url = `https://aerodatabox.p.rapidapi.com/flights/number/${flightNumber}/${date}`;

  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
      "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Flight not found" }, { status: 404 });
  }

  const data = await res.json();
  const flight = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    status: flight?.status ?? null,
    departure: {
      airport: flight?.departure?.airport?.name ?? null,
      scheduled: flight?.departure?.scheduledTime?.local ?? null,
      actual: flight?.departure?.actualTime?.local ?? null,
      gate: flight?.departure?.gate ?? null,
      terminal: flight?.departure?.terminal ?? null,
    },
    arrival: {
      airport: flight?.arrival?.airport?.name ?? null,
      scheduled: flight?.arrival?.scheduledTime?.local ?? null,
      actual: flight?.arrival?.actualTime?.local ?? null,
      gate: flight?.arrival?.gate ?? null,
      terminal: flight?.arrival?.terminal ?? null,
    },
  });
}