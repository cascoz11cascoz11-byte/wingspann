import Link from "next/link";
import { TripList } from "@/components/TripList";

export default function HomePage() {
  return (
    <div>
      <div className="mb-10 text-center sm:text-left">
        <p className="font-display text-2xl font-semibold text-amber-600 sm:text-3xl">
          Family adventures, perfectly planned
        </p>
        <p className="mt-2 text-slate-600">
          Create a trip, invite the crew, and plan your itinerary together.
        </p>
      </div>
      <TripList />
    </div>
  );
}
