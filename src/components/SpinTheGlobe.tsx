import { NextResponse } from "next/server";

const countriesByRegion: Record<string, string[]> = {
  "🌍 Whole World": [
    "Japan", "Morocco", "Peru", "Iceland", "Tanzania", "Vietnam", "Portugal", "Colombia",
    "Jordan", "New Zealand", "Ethiopia", "Croatia", "Chile", "Georgia", "Bhutan",
    "Montenegro", "Rwanda", "Oman", "Bolivia", "Slovenia", "Kyrgyzstan", "Laos",
    "Namibia", "Armenia", "Ecuador", "Albania", "Madagascar", "Uzbekistan", "Panama", "Sri Lanka",
  ],
  "🇺🇸 United States": [
    "Alaska", "Hawaii", "Montana", "Utah", "Arizona", "New Mexico", "Oregon", "Washington",
    "Wyoming", "Colorado", "Idaho", "North Dakota", "South Dakota", "Vermont", "Maine",
    "Tennessee", "Louisiana", "West Virginia", "Mississippi", "Kentucky",
  ],
  "🌎 North America": [
    "Mexico", "Guatemala", "Belize", "Costa Rica", "Panama", "Cuba", "Jamaica",
    "Dominican Republic", "Puerto Rico", "Barbados", "Trinidad and Tobago", "Nicaragua",
    "Honduras", "El Salvador", "Haiti", "Bahamas", "Aruba", "Cayman Islands",
  ],
  "🌎 South America": [
    "Brazil", "Argentina", "Chile", "Peru", "Colombia", "Ecuador", "Bolivia",
    "Uruguay", "Paraguay", "Venezuela", "Guyana", "Suriname", "French Guiana",
  ],
  "🌍 Europe": [
    "Portugal", "Spain", "France", "Italy", "Greece", "Croatia", "Slovenia",
    "Montenegro", "Albania", "North Macedonia", "Bulgaria", "Romania", "Moldova",
    "Ukraine", "Poland", "Czech Republic", "Slovakia", "Hungary", "Austria",
    "Switzerland", "Germany", "Netherlands", "Belgium", "Denmark", "Norway",
    "Sweden", "Finland", "Estonia", "Latvia", "Lithuania", "Iceland", "Malta",
    "Cyprus", "Luxembourg", "Liechtenstein", "Monaco", "San Marino", "Kosovo",
    "Bosnia and Herzegovina", "Serbia",
  ],
  "🌍 Africa": [
    "Morocco", "Tunisia", "Egypt", "Ethiopia", "Tanzania", "Kenya", "Rwanda",
    "Uganda", "Ghana", "Senegal", "South Africa", "Namibia", "Botswana",
    "Zimbabwe", "Zambia", "Mozambique", "Madagascar", "Mauritius", "Seychelles",
    "Ivory Coast", "Cameroon", "Mali", "Benin", "Togo", "Cape Verde",
  ],
  "🌏 Asia": [
    "Japan", "Vietnam", "Thailand", "Cambodia", "Laos", "Myanmar", "Indonesia",
    "Philippines", "Malaysia", "Singapore", "Sri Lanka", "India", "Nepal",
    "Bhutan", "Bangladesh", "China", "South Korea", "Taiwan", "Mongolia",
    "Uzbekistan", "Kyrgyzstan", "Kazakhstan", "Georgia", "Armenia", "Azerbaijan",
    "Jordan", "Oman", "UAE", "Israel", "Lebanon", "Turkey",
  ],
  "🌏 Oceania": [
    "New Zealand", "Fiji", "Vanuatu", "Samoa", "Tonga", "Papua New Guinea",
    "Solomon Islands", "Palau", "Micronesia", "Marshall Islands", "Kiribati",
    "Tuvalu", "Cook Islands", "French Polynesia", "New Caledonia",
  ],
  "🌨️ Arctic / Antarctica": [
    "Iceland", "Greenland", "Svalbard", "Faroe Islands", "Northern Norway",
    "Northern Finland", "Northern Canada", "Alaska", "Antarctica",
  ],
};

const regionEmojis: Record<string, string> = {
  "Japan": "⛩️", "Morocco": "🕌", "Peru": "🏔️", "Iceland": "🌋", "Tanzania": "🦁",
  "Vietnam": "🍜", "Portugal": "🌊", "Colombia": "🌸", "Jordan": "🏺", "New Zealand": "🎿",
  "Ethiopia": "☕", "Croatia": "💧", "Chile": "🏔️", "Georgia": "🍷", "Bhutan": "🏯",
  "Montenegro": "🏖️", "Rwanda": "🦍", "Oman": "🏜️", "Bolivia": "🪞", "Slovenia": "🏔️",
  "default": "📍",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region") ?? "🌍 Whole World";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) return NextResponse.json({ error: "No Google Maps API key" }, { status: 500 });

  const countries = countriesByRegion[region] ?? countriesByRegion["🌍 Whole World"];
  const country = countries[Math.floor(Math.random() * countries.length)];

  try {
    // Search for top tourist attractions in the country
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=top+tourist+attractions+in+${encodeURIComponent(country)}&key=${apiKey}`
    );
    const searchData = await searchRes.json();
    const results = searchData.results ?? [];

    if (results.length < 3) {
      return NextResponse.json({
        name: country,
        country,
        emoji: regionEmojis[country] ?? regionEmojis["default"],
        facts: [
          "One of the world's most fascinating destinations.",
          "Rich in culture, history, and natural beauty.",
          "A must-visit for any serious traveler.",
        ],
      });
    }

    // Pick top 3 results
    const top3 = results.slice(0, 3);
    const facts = top3.map((place: any) => {
      const rating = place.rating ? ` (rated ${place.rating}/5)` : "";
      return `${place.name}${rating} — ${place.formatted_address?.split(",").slice(-2).join(",").trim() ?? country}`;
    });

    return NextResponse.json({
      name: country,
      country,
      emoji: regionEmojis[country] ?? regionEmojis["default"],
      facts,
    });
  } catch {
    return NextResponse.json({
      name: country,
      country,
      emoji: regionEmojis[country] ?? regionEmojis["default"],
      facts: [
        "One of the world's most fascinating destinations.",
        "Rich in culture, history, and natural beauty.",
        "A must-visit for any serious traveler.",
      ],
    });
  }
}