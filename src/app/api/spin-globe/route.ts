import { NextResponse } from "next/server";

const countriesByRegion: Record<string, string[]> = {
  "🌍 Whole World": [
    "Japan", "Morocco", "Peru", "Iceland", "Tanzania", "Vietnam", "Portugal", "Colombia",
    "Jordan", "New Zealand", "Ethiopia", "Croatia", "Chile", "Georgia", "Bhutan",
    "Montenegro", "Rwanda", "Oman", "Bolivia", "Slovenia", "Kyrgyzstan", "Laos",
    "Namibia", "Armenia", "Ecuador", "Albania", "Madagascar", "Uzbekistan", "Panama", "Sri Lanka",
  ],
  "🇺🇸 United States": [
    "Alaska", "Hawaii", "Montana", "Utah", "Arizona", "New Mexico", "Oregon", "Washington State",
    "Wyoming", "Colorado", "Idaho", "Vermont", "Maine", "Tennessee", "Louisiana",
    "West Virginia", "Mississippi", "Kentucky", "South Carolina", "New Hampshire",
  ],
  "🌎 North America": [
    "Mexico", "Guatemala", "Belize", "Costa Rica", "Panama", "Cuba", "Jamaica",
    "Dominican Republic", "Barbados", "Nicaragua", "Honduras", "Bahamas",
  ],
  "🌎 South America": [
    "Brazil", "Argentina", "Chile", "Peru", "Colombia", "Ecuador", "Bolivia",
    "Uruguay", "Paraguay", "Venezuela", "Guyana", "Suriname",
  ],
  "🌍 Europe": [
    "Portugal", "Spain", "France", "Italy", "Greece", "Croatia", "Slovenia",
    "Montenegro", "Albania", "Bulgaria", "Romania", "Poland", "Czech Republic",
    "Hungary", "Austria", "Switzerland", "Germany", "Netherlands", "Denmark",
    "Norway", "Sweden", "Finland", "Estonia", "Latvia", "Lithuania", "Iceland",
    "Malta", "Cyprus", "Bosnia and Herzegovina", "Serbia", "Kosovo",
  ],
  "🌍 Africa": [
    "Morocco", "Tunisia", "Egypt", "Ethiopia", "Tanzania", "Kenya", "Rwanda",
    "Uganda", "Ghana", "Senegal", "South Africa", "Namibia", "Botswana",
    "Zimbabwe", "Zambia", "Mozambique", "Madagascar", "Mauritius", "Seychelles",
  ],
  "🌏 Asia": [
    "Japan", "Vietnam", "Thailand", "Cambodia", "Laos", "Myanmar", "Indonesia",
    "Philippines", "Malaysia", "Singapore", "Sri Lanka", "India", "Nepal",
    "Bhutan", "China", "South Korea", "Taiwan", "Mongolia",
    "Uzbekistan", "Kyrgyzstan", "Georgia", "Armenia", "Jordan", "Oman", "Turkey",
  ],
  "🌏 Oceania": [
    "New Zealand", "Fiji", "Vanuatu", "Samoa", "Tonga", "Papua New Guinea",
    "French Polynesia", "New Caledonia", "Cook Islands",
  ],
  "🌨️ Arctic / Antarctica": [
    "Iceland", "Greenland", "Svalbard", "Faroe Islands", "Northern Norway",
    "Northern Finland", "Antarctica",
  ],
};

const emojiMap: Record<string, string> = {
  "Japan": "⛩️", "Morocco": "🕌", "Peru": "🏔️", "Iceland": "🌋", "Tanzania": "🦁",
  "Vietnam": "🍜", "Portugal": "🌊", "Colombia": "🌸", "Jordan": "🏺", "New Zealand": "🎿",
  "Ethiopia": "☕", "Croatia": "💧", "Chile": "🏔️", "Georgia": "🍷", "Bhutan": "🏯",
  "Montenegro": "🏖️", "Rwanda": "🦍", "Oman": "🏜️", "Bolivia": "🪞", "Slovenia": "🏔️",
  "Alaska": "🐻", "Hawaii": "🌺", "Montana": "🦌", "Utah": "🏜️", "Arizona": "🌵",
  "New Mexico": "🌶️", "Oregon": "🌲", "Washington State": "🌧️", "Wyoming": "🦬", "Colorado": "⛷️",
  "Mexico": "🌮", "Costa Rica": "🌿", "Cuba": "💃", "Jamaica": "🏄",
  "Brazil": "🎭", "Argentina": "💃", "Ecuador": "🦜", "Fiji": "🏝️",
  "France": "🥐", "Italy": "🍕", "Greece": "🏛️", "Spain": "💃", "Germany": "🍺",
  "Norway": "🌊", "Sweden": "🫎", "Finland": "🌲", "Egypt": "🐪", "Kenya": "🦒",
  "South Africa": "🦁", "India": "🕌", "Thailand": "🛕", "Indonesia": "🌴",
  "Svalbard": "🐻‍❄️", "Antarctica": "🐧", "Greenland": "🧊", "Faroe Islands": "🐑",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region") ?? "🌍 Whole World";

  const countries = countriesByRegion[region] ?? countriesByRegion["🌍 Whole World"];
  const country = countries[Math.floor(Math.random() * countries.length)];
  const emoji = emojiMap[country] ?? "📍";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      name: country,
      country,
      emoji,
      facts: ["No API key configured.", "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to Vercel.", "Then redeploy."],
    });
  }

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=top+tourist+attractions+in+${encodeURIComponent(country)}&type=tourist_attraction&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) throw new Error("Places API error: " + res.status);

    const data = await res.json();

    if (!data.results || data.results.length === 0) throw new Error("No results");

    const top3 = data.results.slice(0, 3);
    const facts = top3.map((place: any) => {
      const rating = place.rating ? ` — rated ${place.rating}/5` : "";
      return `${place.name}${rating}`;
    });

    return NextResponse.json({ name: country, country, emoji, facts });
  } catch (e) {
    // Fallback — still return the country, just with generic facts
    return NextResponse.json({
      name: country,
      country,
      emoji,
      facts: [
        "One of the world's most captivating destinations.",
        "Rich in culture, history, and breathtaking scenery.",
        "Add it to your wishlist and start dreaming!",
      ],
    });
  }
}