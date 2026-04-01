"use client";

import { useState } from "react";
import { addMember } from "@/lib/store";
import { createClient } from "@/lib/supabase";

interface InviteMemberProps {
  tripId: string;
  onInvited: () => void;
}

export function InviteMember({ tripId, onInvited }: InviteMemberProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await addMember(tripId, {
      name,
      email: user?.email ?? "",
      status: "pending",
    });
    setName("");
    setSaving(false);
    setOpen(false);
    onInvited();
  }

  function close() {
    setOpen(false);
    setName("");
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
              <h3 className="font-display text-lg font-semibold text-sky-700">Add a person</h3>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <p className="text-sm text-slate-500">Add someone manually, or share the invite link so they can join themselves.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Grandma Linda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary text-sm" disabled={saving}>
                  {saving ? "Adding..." : "Add person"}
                </button>
                <button type="button" onClick={close} className="btn-secondary text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}