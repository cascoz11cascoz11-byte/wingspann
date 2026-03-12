import { NextRequest, NextResponse } from "next/server";

function weatherCodeToDescription(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rainy";
  if (code <= 79) return "Snowy";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

function weatherCodeToEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
  if (code === 3) return "☁️";
  if (code <= 49) return "🌫️";
  if (code <= 59) return "🌦️";
  if (code <= 69) return "🌧️";
  if (code <= 79) return "❄️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  if (code <= 99) return "⛈️";
  return "🌡️";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  if (!location || !date) {
    return NextResponse.json({ error: "Missing location or date" }, { status: 400 });
  }

  // Geocode using Google Maps API
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const geoRes = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${apiKey}`
  );
  const geoData = await geoRes.json();
  const result = geoData?.results?.[0];
  if (!result) return NextResponse.json({ error: "Location not found" }, { status: 404 });

  const { lat, lng } = result.geometry.location;

  if (time) {
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=auto&start_date=${date}&end_date=${date}`
    );
    const weatherData = await weatherRes.json();
    const hours = weatherData?.hourly?.time ?? [];
    const temps = weatherData?.hourly?.temperature_2m ?? [];
    const codes = weatherData?.hourly?.weathercode ?? [];

    const targetHour = parseInt(time.split(":")[0]);
    let closestIndex = 0;
    let closestDiff = Infinity;
    hours.forEach((h: string, i: number) => {
      const hour = new Date(h).getHours();
      const diff = Math.abs(hour - targetHour);
      if (diff < closestDiff) { closestDiff = diff; closestIndex = i; }
    });

    const temp = Math.round(temps[closestIndex]);
    const code = codes[closestIndex];
    return NextResponse.json({
      temp,
      description: weatherCodeToDescription(code),
      emoji: weatherCodeToEmoji(code),
      isHourly: true,
    });
  } else {
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=fahrenheit&timezone=auto&start_date=${date}&end_date=${date}`
    );
    const weatherData = await weatherRes.json();
    const max = weatherData?.daily?.temperature_2m_max?.[0];
    const min = weatherData?.daily?.temperature_2m_min?.[0];
    const code = weatherData?.daily?.weathercode?.[0];

    if (max === undefined) return NextResponse.json({ error: "No forecast available" }, { status: 404 });
    return NextResponse.json({
      max: Math.round(max),
      min: Math.round(min),
      description: weatherCodeToDescription(code),
      emoji: weatherCodeToEmoji(code),
      isHourly: false,
    });
  }
}