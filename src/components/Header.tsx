"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getTrips } from "@/lib/store";
import type { Trip } from "@/types";

export function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsOpen, setTripsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTrips().then((all) => {
      const today = new Date().toISOString().split("T")[0];
      setTrips(all.filter((t) => t.endDate >= today).slice(0, 5));
    });
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setTripsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function close() {
    setMenuOpen(false);
    setTripsOpen(false);
  }

  return (
    <header className="border-b-2 border-sky-100 bg-white/95 shadow-sm shadow-sky-100/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight text-sky-600 sm:text-3xl">
          Wingspann ✈️
        </Link>

        <div className="relative" ref={menuRef}>
          {/* Hamburger button */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-xl border-2 border-slate-200 px-3 py-2 text-slate-600 hover:border-sky-300 hover:text-sky-600 transition flex flex-col gap-1.5 items-center justify-center w-10 h-10"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-current transition-all ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-12 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden">
              
              {/* Nav links */}
              <div className="p-2 space-y-0.5">
                <Link href="/" onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition">
                  ✈️ My Trips
                </Link>
                <Link href="/" onClick={() => { close(); }} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition">
                  📅 Calendar
                </Link>
                <Link href="/wishlist" onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition">
                  🌟 Wishlist
                </Link>
              </div>

              {/* Upcoming trips */}
              {trips.length > 0 && (
                <>
                  <div className="border-t border-slate-100 mx-2" />
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={() => setTripsOpen((o) => !o)}
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition"
                    >
                      <span>🗺️ Upcoming trips</span>
                      <span className="text-slate-400 text-xs">{tripsOpen ? "▲" : "▼"}</span>
                    </button>
                    {tripsOpen && (
                      <div className="mt-1 space-y-0.5">
                        {trips.map((trip) => (
                          <Link
                            key={trip.id}
                            href={"/trips/" + trip.id}
                            onClick={close}
                            className="flex flex-col rounded-xl px-3 py-2 hover:bg-sky-50 transition"
                          >
                            <span className="text-sm font-medium text-slate-700">{trip.name}</span>
                            <span className="text-xs text-slate-400">{trip.destination}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* New trip + logout */}
              <div className="border-t border-slate-100 mx-2" />
              <div className="p-2 space-y-0.5">
                <Link href="/trips/new" onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sky-600 hover:bg-sky-50 transition">
                  + New trip
                </Link>
                <button
                  type="button"
                  onClick={() => { close(); handleLogout(); }}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:bg-red-50 hover:text-red-500 transition text-left"
                >
                  Log out
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </header>
  );
}
