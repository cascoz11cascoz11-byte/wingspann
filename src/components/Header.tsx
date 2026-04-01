"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { getTrips, getNotifications, markNotificationsRead, getUnreadCount } from "@/lib/store";
import type { Trip } from "@/types";
import type { AppNotification } from "@/lib/store";

const TYPE_CONFIG: Record<string, { emoji: string; color: string }> = {
  activity_added: { emoji: "🎯", color: "bg-sky-100 text-sky-700" },
  flight_status:  { emoji: "✈️", color: "bg-amber-100 text-amber-700" },
  member_joined:  { emoji: "👋", color: "bg-emerald-100 text-emerald-700" },
  event_rsvp:     { emoji: "🎉", color: "bg-violet-100 text-violet-700" },
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m ago";
  if (hours < 24) return hours + "h ago";
  if (days < 7) return days + "d ago";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsOpen, setTripsOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTrips().then((all) => {
      const today = new Date().toISOString().split("T")[0];
      setTrips(all.filter((t) => t.endDate >= today).slice(0, 5));
    });
    getUnreadCount().then(setUnreadCount);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setTripsOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function openNotifications() {
    setNotifOpen((o) => !o);
    if (!notifOpen) {
      setNotifLoading(true);
      const data = await getNotifications();
      setNotifications(data);
      setNotifLoading(false);
      setUnreadCount(0);
      await markNotificationsRead();
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleRefresh() {
    setSpinning(true);
    setTimeout(() => window.location.reload(), 300);
  }

  function close() {
    setMenuOpen(false);
    setTripsOpen(false);
  }

  return (
    // The safe-top class handles iOS notch spacing via CSS (not inline style).
    // Inline style with env(safe-area-inset-top) on a fixed element gets
    // re-evaluated on every iOS scroll tick, causing the blank space on pull-up.
    <header className="fixed left-0 right-0 top-0 z-50 w-full border-b-2 border-sky-100 bg-white shadow-sm shadow-sky-100/50 safe-top">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link href="/">
            <img src="/logo.png" alt="Wingspann" className="h-10 w-auto" />
          </Link>
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Refresh"
            className="text-slate-400 hover:text-sky-500 transition-colors text-xl leading-none"
            style={{
              display: "inline-block",
              transform: spinning ? "rotate(360deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            ↻
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={openNotifications}
              aria-label="Notifications"
              className="relative rounded-xl border-2 border-slate-200 hover:border-sky-300 hover:text-sky-600 transition flex items-center justify-center w-10 h-10 text-slate-600"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Notifications</p>
                  <button type="button" onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifLoading ? (
                    <p className="text-sm text-slate-500 text-center py-6">Loading...</p>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 space-y-1">
                      <p className="text-2xl">🔔</p>
                      <p className="text-sm text-slate-500">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {notifications.map((n) => {
                        const config = TYPE_CONFIG[n.type] ?? { emoji: "🔔", color: "bg-slate-100 text-slate-600" };
                        const content = (
                          <div className={"flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-50 " + (!n.read ? "bg-sky-50/50" : "")}>
                            <div className={"rounded-full w-8 h-8 flex items-center justify-center shrink-0 text-sm " + config.color}>
                              {config.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={"text-xs text-slate-800 " + (!n.read ? "font-semibold" : "font-medium")}>{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                              <p className="text-xs text-slate-300 mt-0.5">{formatTime(n.createdAt)}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-1" />}
                          </div>
                        );
                        return n.link ? (
                          <Link key={n.id} href={n.link} onClick={() => setNotifOpen(false)}>{content}</Link>
                        ) : (
                          <div key={n.id}>{content}</div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Hamburger */}
          <div className="relative" ref={menuRef}>
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

            {menuOpen && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl z-50 overflow-hidden">
                <div className="p-2 space-y-0.5">
                  <Link href="/" onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition">
                    🏠 Home
                  </Link>
                  <Link href="/wishlist" onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition">
                    🌟 Wishlist
                  </Link>
                  <Link href="/notification-settings" onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition">
                    🔔 Notification Settings
                  </Link>
                </div>

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
                            <Link key={trip.id} href={"/trips/" + trip.id} onClick={close} className="flex flex-col rounded-xl px-3 py-2 hover:bg-sky-50 transition">
                              <span className="text-sm font-medium text-slate-700">{trip.name}</span>
                              <span className="text-xs text-slate-400">{trip.destination}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

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
      </div>
    </header>
  );
}
