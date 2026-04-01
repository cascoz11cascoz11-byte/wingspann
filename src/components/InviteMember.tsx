"use client";

import { useState, useEffect } from "react";
import { addMember, getFriends } from "@/lib/store";
import type { Friend } from "@/lib/store";

interface InviteMemberProps {
  tripId: string;
  onInvited: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function InviteMember({ tripId, onInvited }: InviteMemberProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);

  useEffect(() => {
    if (open) getFriends().then(setFriends);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await addMember(tripId, { name, email, status: "pending" });
    setName("");
    setEmail("");
    setSaving(false);
    setOpen(false);
    onInvited();
  }

  async function handleAddFriend(friend: Friend) {
    setAddingFriendId(friend.id);
    await addMember(tripId, { name: friend.name, email: friend.email, status: "pending" });
    setAddingFriendId(null);
    setOpen(false);
    onInvited();
  }

  function close() {
    setOpen(false);
    setName("");
    setEmail("");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-primary text-sm">
        Invite people
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">Invite people</h3>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            {friends.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">Your friends</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {friends.map((friend) => (
                    <div key={friend.id} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt={friend.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-xs font-medium text-sky-700 shrink-0">
                          {getInitials(friend.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{friend.name}</p>
                        <p className="text-xs text-slate-400 truncate">{friend.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddFriend(friend)}
                        disabled={addingFriendId === friend.id}
                        className="btn-primary text-xs px-3 py-1.5 shrink-0"
                      >
                        {addingFriendId === friend.id ? "Adding..." : "+ Add"}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-medium text-slate-500 mb-2">Or invite someone new</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input type="text" className="input" placeholder="e.g. Grandma Linda" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" className="input" placeholder="e.g. grandma@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary text-sm" disabled={saving}>
                  {saving ? "Sending..." : "Send invite"}
                </button>
                <button type="button" onClick={close} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}