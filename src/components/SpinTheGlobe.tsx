import { NextResponse } from "next/server";

const regionCoordinates: Record<string, { lat: number; lng: number; radius: number }> = {
  "🌍 Whole World":        { lat: 20,    lng: 0,     radius: 20000000 },
  "🇺🇸 United States":    { lat: 39.5,  lng: -98.35, radius: 3000000 },
  "🌎 North America":      { lat: 54,    lng: -105,   radius: 4000000 },
  "🌎 South America":      { lat: -15,   lng: -60,    radius: 4000000 },
  "🌍 Europe":             { lat: 54,    lng: 15,     radius: 3000000 },
  "🌍 Africa":             { lat: 0,     lng: 25,     radius: 5000000 },
  "🌏 Asia":               { lat: 34,    lng: 100,    radius: 5000000 },
  "🌏 Oceania":            { lat: -25,   lng: 140,    radius: 4000000 },
  "🌨️ Arctic / Antarctica": { lat: -82, lng: 0,      radius: 3000000 },
};

const surprisingKeywords = [
  "ancient ruins", "hidden waterfall", "volcanic island", "salt flats",
  "canyon", "floating village", "cave temple", "glacier", "desert oasis",
  "historic fortress", "underground city", "coral reef", "hot springs",
  "fjord", "mysterious lake", "abandoned city", "fairy chimney",
  "night market", "sacred mountain", "jungle temple",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region") ?? "🌍 Whole World";
  const coords = regionCoordinates[region] ?? regionCoordinates["🌍 Whole World"];
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) return NextResponse.json({ error: "No Google Maps API key" }, { status: 500 });

  // Pick a random surprising keyword
  const keyword = surprisingKeywords[Math.floor(Math.random() * surprisingKeywords.length)];

  // Random offset within the region so we don't always get the same results
  const latOffset = (Math.random() - 0.5) * 20;
  const lngOffset = (Math.random() - 0.5) * 20;
  const lat = coords.lat + latOffset;
  const lng = coords.lng + lngOffset;

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${Math.min(coords.radius, 500000)}&keyword=${encodeURIComponent(keyword)}&type=tourist_attraction&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  const results = data.results ?? [];
  if (results.length === 0) {
    return NextResponse.json({ error: "No results found, try again!" }, { status: 404 });
  }

  // Pick a random result from top 10
  const place = results[Math.floor(Math.random() * Math.min(results.length, 10))];

  // Get place details for more info
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,editorial_summary,rating,user_ratings_total,types&key=${apiKey}`;
  const detailsRes = await fetch(detailsUrl);
  const detailsData = await detailsRes.json();
  const details = detailsData.result ?? {};

  const name = details.name ?? place.name;
  const address = details.formatted_address ?? place.vicinity ?? "";
  const country = address.split(",").pop()?.trim() ?? region;
  const summary = details.editorial_summary?.overview ?? "";
  const rating = details.rating ? `Rated ${details.rating}/5 by ${details.user_ratings_total?.toLocaleString()} visitors.` : "";
  const types = (details.types ?? [])
    .filter((t: string) => !["point_of_interest", "establishment"].includes(t))
    .map((t: string) => t.replace(/_/g, " "))
    .slice(0, 2)
    .join(", ");

  const facts = [
    summary || `A ${keyword} destination in ${country}.`,
    rating || `Known for ${types || "its unique character"}.`,
    `Found in: ${address}`,
  ].filter(Boolean).slice(0, 3);

  const emojiMap: Record<string, string> = {
    "ancient ruins": "🏛️", "hidden waterfall": "💧", "volcanic island": "🌋",
    "salt flats": "🏜️", "canyon": "🏔️", "floating village": "🚣",
    "cave temple": "⛩️", "glacier": "🧊", "desert oasis": "🌴",
    "historic fortress": "🏰", "underground city": "🕳️", "coral reef": "🐠",
    "hot springs": "♨️", "fjord": "🏔️", "mysterious lake": "🌊",
    "abandoned city": "👻", "fairy chimney": "🍄", "night market": "🏮",
    "sacred mountain": "⛰️", "jungle temple": "🌿",
  };

  return NextResponse.json({
    name,
    country,
    emoji: emojiMap[keyword] ?? "📍",
    facts,
  });
}