"use client";

import { useEffect, useRef, useState } from "react";
import { getFriends, addFriend, removeFriend, updateFriend } from "@/lib/store";
import type { Friend } from "@/lib/store";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingFriendId = useRef<string | null>(null);

  async function load() {
    setLoading(true);
    setFriends(await getFriends());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await addFriend({ name, email });
    setName("");
    setEmail("");
    setSaving(false);
    setAddOpen(false);
    await load();
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this friend?")) return;
    await removeFriend(id);
    setFriends((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const friendId = uploadingFriendId.current;
    if (!file || !friendId) return;
    setUploadingFor(friendId);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${friendId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);
      await updateFriend(friendId, { avatarUrl: publicUrl });
      await load();
    } catch (err) {
      console.error(err);
    }
    setUploadingFor(null);
    uploadingFriendId.current = null;
    e.target.value = "";
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-sky-700">👯 Friends</h1>
          <p className="text-sm text-slate-500 mt-0.5">Your travel crew</p>
        </div>
        <div className="flex gap-2 items-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-sky-600">← Back</Link>
          <button type="button" onClick={() => setAddOpen(true)} className="btn-primary text-sm">+ Add</button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {loading ? (
        <p className="text-slate-500 text-center py-12">Loading...</p>
      ) : friends.length === 0 ? (
        <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
          <p className="text-3xl">👯</p>
          <p className="text-slate-600 font-medium">No friends yet</p>
          <p className="text-sm text-slate-400">Add your travel crew so you can quickly invite them to trips!</p>
          <button type="button" onClick={() => setAddOpen(true)} className="btn-primary text-sm mt-2">+ Add a friend</button>
        </div>
      ) : (
        <div className="space-y-3">
          {friends.map((friend) => (
            <div key={friend.id} className="card p-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  uploadingFriendId.current = friend.id;
                  fileInputRef.current?.click();
                }}
                className="relative shrink-0 group"
              >
                {friend.avatarUrl ? (
                  <img src={friend.avatarUrl} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sm font-medium text-sky-700">
                    {getInitials(friend.name)}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                  <span className="text-white text-xs">📷</span>
                </div>
                {uploadingFor === friend.id && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xs">...</span>
                  </div>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800">{friend.name}</p>
                <p className="text-xs text-slate-400">{friend.email}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(friend.id)}
                className="text-xs text-red-400 hover:text-red-600 transition shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">Add a friend</h3>
              <button type="button" onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input type="text" className="input" placeholder="e.g. Grandma Linda" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" className="input" placeholder="e.g. grandma@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary text-sm" disabled={saving}>{saving ? "Saving..." : "Add friend"}</button>
                <button type="button" onClick={() => setAddOpen(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}