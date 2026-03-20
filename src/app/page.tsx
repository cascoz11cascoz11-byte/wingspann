"use client";
import { useState, useEffect } from "react";
import { TripList } from "@/components/TripList";
import { HomeActivityFinder } from "@/components/HomeActivityFinder";
import { HomeCalendar } from "@/components/HomeCalendar";
import { StandaloneEventCreator } from "@/components/StandaloneEventCreator";
import Link from "next/link";
import { getTrips, getNotifications, markNotificationsRead } from "@/lib/store";
import type { Trip, } from "@/types";
import type { AppNotification } from "@/lib/store";

type Tab = "notifications" | "trips" | "calendar";

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

function NotificationsTab() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOld, setShowOld] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getNotifications();
      setNotifications(data);
      setLoading(false);
      await markNotificationsRead();
    }
    load();
  }, []);

  if (loading) return <p className="text-slate-500 text-center py-12">Loading...</p>;

  const newNotifications = notifications.filter((n) => !n.read);
  const oldNotifications = notifications.filter((n) => n.read);
  const displayed = showOld ? notifications : newNotifications;

  if (notifications.length === 0) return (
    <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
      <p className="text-3xl">🔔</p>
      <p className="text-slate-600 font-medium">No notifications yet</p>
      <p className="text-sm text-slate-400">We'll let you know when something happens on your trips!</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {newNotifications.length === 0 && !showOld && (
        <div className="card border-dashed border-sky-200 p-6 text-center space-y-1">
          <p className="text-slate-600 font-medium">You're all caught up! 🎉</p>
          <p className="text-sm text-slate-400">No new notifications.</p>
        </div>
      )}

      {displayed.map((n) => {
        const config = TYPE_CONFIG[n.type] ?? { emoji: "🔔", color: "bg-slate-100 text-slate-600" };
        const content = (
          <div className={"card p-4 flex items-start gap-3 " + (n.read ? "opacity-60" : "border-sky-200 bg-sky-50/30")}>
            <div className={"rounded-full w-9 h-9 flex items-center justify-center shrink-0 text-base " + config.color}>
              {config.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className={"text-sm text-slate-800 " + (!n.read ? "font-semibold" : "font-medium")}>{n.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
              <p className="text-xs text-slate-400 mt-1">{formatTime(n.createdAt)}</p>
            </div>
            {!n.read && <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-1" />}
          </div>
        );
        return n.link ? (
          <Link key={n.id} href={n.link}>{content}</Link>
        ) : (
          <div key={n.id}>{content}</div>
        );
      })}

      {oldNotifications.length > 0 && (
        <button
          type="button"
          onClick={() => setShowOld((p) => !p)}
          className="w-full rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-sm text-slate-400 hover:border-sky-200 hover:text-sky-500 transition"
        >
          {showOld ? "Hide old notifications" : "Show " + oldNotifications.length + " older notification" + (oldNotifications.length === 1 ? "" : "s")}
        </button>
      )}
    </div>
  );
}

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("notifications");
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    getTrips().then(setTrips);
  }, []);

  const activeTab = "border-b-2 border-sky-500 text-sky-600 font-semibold pb-2";
  const inactiveTab = "text-slate-500 hover:text-sky-500 pb-2 transition";

  return (
    <div>
      {/* Hero */}
      <div className="mb-6">
        <p className="font-display text-xl font-semibold text-amber-600">
          Group adventures, perfectly planned ✈️
        </p>
        <div className="mt-3 flex gap-2">
          <HomeActivityFinder trips={trips} />
          <StandaloneEventCreator />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200 mb-6">
        <button type="button" onClick={() => setTab("notifications")} className={tab === "notifications" ? activeTab : inactiveTab}>
          🔔 Notifications
        </button>
        <button type="button" onClick={() => setTab("trips")} className={tab === "trips" ? activeTab : inactiveTab}>
          ✈️ Trips
        </button>
        <button type="button" onClick={() => setTab("calendar")} className={tab === "calendar" ? activeTab : inactiveTab}>
          📅 Calendar
        </button>
        <Link href="/wishlist" className="text-slate-500 hover:text-sky-500 pb-2 transition">
          🌟 Wishlist
        </Link>
      </div>

      {tab === "notifications" && <NotificationsTab />}
      {tab === "trips" && <TripList />}
      {tab === "calendar" && <HomeCalendar trips={trips} />}
    </div>
  );
}
