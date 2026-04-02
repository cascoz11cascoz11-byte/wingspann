"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

interface Settings {
  activity_added: boolean;
  member_joined: boolean;
  trip_invited: boolean;
  trip_changed: boolean;
  wishlist_invited: boolean;
}

export function NotificationSettings() {
  const router = useRouter();
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  async function handleDeleteAccount() {
    if (!userId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to delete account");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (e) {
      setDeleteError("Something went wrong. Please try again or contact support.");
      setDeleting(false);
    }
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

      {/* Delete Account */}
      <div className="pt-6 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Danger Zone</h3>
        <p className="text-xs text-slate-400 mb-3">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 hover:border-red-300"
        >
          🗑️ Delete My Account
        </button>
      </div>

      {/* Confirm Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <p className="text-3xl">⚠️</p>
              <h3 className="text-lg font-bold text-slate-900">Delete Account?</h3>
              <p className="text-sm text-slate-500">
                This will permanently delete your account and all your trips, itineraries, and data. 
                <span className="font-semibold text-red-500"> This cannot be undone.</span>
              </p>
            </div>
            {deleteError && (
              <p className="text-xs text-red-500 text-center">{deleteError}</p>
            )}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                disabled={deleting}
                className="w-full rounded-2xl border-2 border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
