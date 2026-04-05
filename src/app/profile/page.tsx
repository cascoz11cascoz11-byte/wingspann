"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      setEmail(user.email ?? "");
      setDisplayName(user.user_metadata?.display_name ?? "");
      setLoading(false);
    }
    load();
  }, []);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameLoading(true);
    setNameError("");
    setNameSaved(false);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName.trim() },
    });
    if (error) {
      setNameError(error.message);
    } else {
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
    }
    setNameLoading(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSaved(false);

    if (newPassword !== confirmPassword) {
      setPwError("Passwords don't match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }

    setPwLoading(true);

    // Re-authenticate first with current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      setPwError("Current password is incorrect.");
      setPwLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPwError(error.message);
    } else {
      setPwSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSaved(false), 3000);
    }
    setPwLoading(false);
  }

  if (loading) {
    return <div className="py-12 text-center text-slate-500">Loading...</div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-sky-700">👤 Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">{email}</p>
        </div>
        <Link href="/" className="text-sm text-slate-500 hover:text-sky-600">← Back</Link>
      </div>

      {/* Display name */}
      <div className="card p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-slate-700">Display name</h2>
        <p className="text-xs text-slate-400">This is how your name appears to other trip members.</p>
        <form onSubmit={handleSaveName} className="space-y-3">
          <input
            type="text"
            className="input"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          {nameError && <p className="text-sm text-red-500">{nameError}</p>}
          {nameSaved && <p className="text-sm text-emerald-600">✓ Name saved!</p>}
          <button
            type="submit"
            className="btn-primary text-sm"
            disabled={nameLoading || !displayName.trim()}
          >
            {nameLoading ? "Saving..." : "Save name"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-slate-700">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current password</label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm new password</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {pwError && <p className="text-sm text-red-500">{pwError}</p>}
          {pwSaved && <p className="text-sm text-emerald-600">✓ Password updated!</p>}
          <button
            type="submit"
            className="btn-primary text-sm"
            disabled={pwLoading}
          >
            {pwLoading ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}