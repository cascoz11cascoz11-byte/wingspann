"use client";
import { useEffect, useState } from "react";
import { getNotifications, markNotificationsRead } from "@/lib/store";
import type { AppNotification } from "@/lib/store";
import Link from "next/link";

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getNotifications();
      setNotifications(data);
      setLoading(false);
      await markNotificationsRead();
    }
    load();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-sky-700">🔔 Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">Recent activity on your trips</p>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-sky-600">← Back</Link>
      </div>

      {loading ? (
        <p className="text-slate-500 text-center py-12">Loading...</p>
      ) : notifications.length === 0 ? (
        <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
          <p className="text-3xl">🔔</p>
          <p className="text-slate-600 font-medium">No notifications yet</p>
          <p className="text-sm text-slate-400">We'll let you know when something happens on your trips!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => {
            const config = TYPE_CONFIG[n.type] ?? { emoji: "🔔", color: "bg-slate-100 text-slate-600" };
            const content = (
              <div className={"card p-4 flex items-start gap-3 transition " + (n.read ? "opacity-70" : "border-sky-200 bg-sky-50/30")}>
                <div className={"rounded-full w-9 h-9 flex items-center justify-center shrink-0 text-base " + config.color}>
                  {config.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={"text-sm font-medium text-slate-800 " + (!n.read ? "font-semibold" : "")}>{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                  <p className="text-xs text-slate-300 mt-1">{formatTime(n.createdAt)}</p>
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
        </div>
      )}
    </div>
  );
}