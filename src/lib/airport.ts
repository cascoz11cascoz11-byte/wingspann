/** Extract a 3-letter IATA code from a Google Places or manual airport string. */
export function extractAirportCode(location: string): string {
  const trimmed = location.trim();
  if (!trimmed) return "";

  const inParens = trimmed.match(/\(([A-Z]{3})\)/);
  if (inParens) return inParens[1];

  const prefix = trimmed.match(/^([A-Z]{3})\s*[-–—]\s/i);
  if (prefix) return prefix[1].toUpperCase();

  if (/^[A-Z]{3}$/i.test(trimmed)) return trimmed.toUpperCase();

  const firstWord = trimmed.split(/[\s,]+/)[0];
  if (/^[A-Z]{3}$/i.test(firstWord)) return firstWord.toUpperCase();

  return "";
}

export function formatFlightTitle(
  flightNumber: string,
  departureLocation: string,
  arrivalLocation: string
): string {
  const fn = flightNumber.trim();
  const dep = extractAirportCode(departureLocation);
  const arr = extractAirportCode(arrivalLocation);
  const route = [dep, arr].filter(Boolean).join(" → ");

  if (fn && route) return `Flight ${fn}: ${route}`;
  if (fn) return `Flight ${fn}`;
  if (route) return `Flight: ${route}`;
  return "Flight";
}

export function formatFlightRoute(
  departureLocation: string,
  arrivalLocation: string
): string {
  const dep = extractAirportCode(departureLocation);
  const arr = extractAirportCode(arrivalLocation);
  if (dep && arr) return `${dep} → ${arr}`;
  return [dep, arr].filter(Boolean).join(" → ");
}
