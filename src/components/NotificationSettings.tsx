"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface Settings {
  activity_added: boolean;
  member_joined: boolean;
  trip_invited: boolean;
  trip_changed: boolean;
  wishlist_invited: boolean;
}

export function NotificationSettings() {
  const [settings, setSettings] = useState<Settings>({
    activity_added: true,
    member_joined: true,
    trip_invited: true,
    trip_changed: true,
    wishlist_invited: true,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const res = await fetch("/api/notification-settings", {
        headers: { "x-user-id": user.id },
      });
      const data = await res.json();
      setSettings({
        activity_added: data.activity_added ?? true,
        member_joined: data.member_joined ?? true,
        trip_invited: data.trip_invited ?? true,
        trip_changed: data.trip_changed ?? true,
        wishlist_invited: data.wishlist_invited ?? true,
      });
    }
    load();
  }, []);

  async function save() {
    if (!userId) return;
    setSaving(true);
    await fetch("/api/notification-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, settings }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const toggles = [
    { key: "activity_added", label: "Activity added to trip", emoji: "📋" },
    { key: "member_joined", label: "Member joined trip", emoji: "🎉" },
    { key: "trip_invited", label: "Invited to a trip", emoji: "✈️" },
    { key: "trip_changed", label: "Trip details changed", emoji: "✏️" },
    { key: "wishlist_invited", label: "Invited to a wishlist", emoji: "🌟" },
  ];

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-sky-700">Notification Settings</h2>
      <p className="text-sm text-slate-500">Choose which notifications you'd like to receive.</p>
      <div className="space-y-3">
        {toggles.map(({ key, label, emoji }) => (
          <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <span className="text-sm text-slate-700">{emoji} {label}</span>
            <button
              type="button"
              onClick={() => setSettings(s => ({ ...s, [key]: !s[key as keyof Settings] }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[key as keyof Settings] ? "bg-sky-500" : "bg-slate-200"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${settings[key as keyof Settings] ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="btn-primary w-full text-sm"
      >
        {saved ? "Saved! ✓" : saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}