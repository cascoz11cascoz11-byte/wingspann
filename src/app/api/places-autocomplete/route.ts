import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

export async function GET(req: NextRequest) {
  const input = new URL(req.url).searchParams.get("input");
  if (!input) return NextResponse.json({ predictions: [] });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${GOOGLE_API_KEY}&types=geocode|establishment`
  );
  const data = await res.json();
  return NextResponse.json({ predictions: data.predictions ?? [] });
}
