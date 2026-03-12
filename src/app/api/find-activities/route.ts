import { NextRequest, NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY!;

const GOOGLE_CATEGORY_QUERIES: Record<string, string> = {
  restaurants: "restaurants food dining",
  outdoor: "outdoor activities parks hiking nature",
  museums: "museums art galleries cultural attractions",
  family: "family activities entertainment amusement",
  comestoyou: "private chef hibachi yoga instructor massage therapist in-home entertainment",
};

const TICKETMASTER_CATEGORIES: Record<string, string> = {
  concerts: "Music",
  sports: "Sports",
  theater: "Arts & Theatre",
};

function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(miles: number): string {
  if (miles < 1) return "< 1 mile away";
  return `${Math.round(miles)} miles away`;
}

async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.results?.[0]) return data.results[0].geometry.location;
  return null;
}

async function searchGooglePlaces(query: string, lat: number, lng: number, category: string) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=80000&key=${GOOGLE_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return (data.results ?? [])
    .map((p: any) => {
      const placeLat = p.geometry?.location?.lat;
      const placeLng = p.geometry?.location?.lng;
      const miles = placeLat && placeLng ? distanceMiles(lat, lng, placeLat, placeLng) : 999;
      return {
        name: p.name,
        category,
        description: p.types?.slice(0, 2).join(", ") ?? "",
        date: p.opening_hours ? (p.opening_hours.open_now ? "Open now" : "Check hours") : "See details",
        venue: p.formatted_address,
        price: p.price_level ? "$".repeat(p.price_level) : undefined,
        link: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
        miles,
        distance: formatDistance(miles),
      };
    })
    .filter((p: any) => p.miles <= 50)
    .sort((a: any, b: any) => a.miles - b.miles)
    .slice(0, 4);
}

async function searchTicketmaster(classificationName: string, category: string, lat: number, lng: number) {
  const today = new Date().toISOString().split("T")[0];
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&classificationName=${encodeURIComponent(classificationName)}&latlong=${lat},${lng}&radius=50&unit=miles&startDateTime=${today}T00:00:00Z&size=8&sort=date,asc`;
  const res = await fetch(url);
  const data = await res.json();
  const events = data._embedded?.events ?? [];
  return events
    .map((e: any) => {
      const venue = e._embedded?.venues?.[0];
      const dateInfo = e.dates?.start;
      const priceRange = e.priceRanges?.[0];
      const venueLat = parseFloat(venue?.location?.latitude ?? "0");
      const venueLng = parseFloat(venue?.location?.longitude ?? "0");
      const miles = venueLat && venueLng ? distanceMiles(lat, lng, venueLat, venueLng) : 999;
      return {
        name: e.name,
        category,
        description: e.info ?? e.pleaseNote ?? classificationName + " event",
        date: dateInfo?.localDate
          ? new Date(dateInfo.localDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + (dateInfo.localTime ? " at " + dateInfo.localTime.slice(0, 5) : "")
          : "See details",
        venue: venue ? venue.name + ", " + venue.city?.name : undefined,
        price: priceRange ? "$" + Math.round(priceRange.min) + "-$" + Math.round(priceRange.max) : undefined,
        link: e.url,
        miles,
        distance: formatDistance(miles),
      };
    })
    .filter((e: any) => e.miles <= 50)
    .slice(0, 4);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get("location");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const categories = (searchParams.get("categories") ?? "").split(",").filter(Boolean);

  if (!location && (!lat || !lng)) {
    return NextResponse.json({ error: "location or lat/lng required" }, { status: 400 });
  }

  let coords: { lat: number; lng: number } | null = null;
  if (lat && lng) {
    coords = { lat: parseFloat(lat), lng: parseFloat(lng) };
  } else if (location) {
    coords = await geocode(location);
  }

  if (!coords) {
    return NextResponse.json({ error: "Could not find location" }, { status: 400 });
  }

  const activeCategories = categories.length > 0 ? categories : [
    ...Object.keys(TICKETMASTER_CATEGORIES),
    ...Object.keys(GOOGLE_CATEGORY_QUERIES),
  ];

  const results: any[] = [];

  await Promise.all(
    activeCategories.map(async (cat) => {
      if (TICKETMASTER_CATEGORIES[cat]) {
        const items = await searchTicketmaster(TICKETMASTER_CATEGORIES[cat], cat, coords!.lat, coords!.lng);
        results.push(...items);
      } else if (GOOGLE_CATEGORY_QUERIES[cat]) {
        const items = await searchGooglePlaces(GOOGLE_CATEGORY_QUERIES[cat], coords!.lat, coords!.lng, cat);
        results.push(...items);
      }
    })
  );

  results.sort((a, b) => a.miles - b.miles);

  return NextResponse.json({ results });
}