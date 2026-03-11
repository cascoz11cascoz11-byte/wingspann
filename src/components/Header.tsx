"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function Header() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b-2 border-sky-100 bg-white/95 shadow-sm shadow-sky-100/50 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-2xl font-bold tracking-tight text-sky-600 sm:text-3xl"
        >
          Wingspann ✈️
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-xl px-3 py-2 text-slate-600 transition hover:bg-sky-50 hover:text-sky-600"
          >
            My Trips
          </Link>
          <Link href="/trips/new" className="btn-primary text-sm">
            New Trip
          </Link>
          <button
            onClick={handleLogout}
            className="btn-secondary text-sm"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
