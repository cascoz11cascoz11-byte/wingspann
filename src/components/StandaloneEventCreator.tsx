"use client";
import { useState } from "react";
import { createStandaloneEvent, addStandaloneEventMember } from "@/lib/store";
import type { StandaloneEvent } from "@/lib/store";

export function StandaloneEventCreator() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"create" | "invite">("create");
  const [event, setEvent] = useState<StandaloneEvent | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const created = await createStandaloneEvent({ title, date, time: time || undefined, location: location || undefined });
    if (created) { setEvent(created); setStep("invite"); }
    setSaving(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    setInviting(true);
    await addStandaloneEventMember(event.id, inviteName, inviteEmail);
    setEvent((prev) => prev ? {
      ...prev,
      members: [...prev.members, { id: Math.random().toString(), name: inviteName, email: inviteEmail, status: "pending" }]
    } : prev);
    setInviteName("");
    setInviteEmail("");
    setInviting(false);
  }

  function copyLink() {
    if (!event) return;
    navigator.clipboard.writeText(window.location.origin + "/events/" + event.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function close() {
    setOpen(false);
    setStep("create");
    setEvent(null);
    setTitle("");
    setDate("");
    setTime("");
    setLocation("");
    setInviteName("");
    setInviteEmail("");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-sm whitespace-nowrap">
        🎉 New event
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">
                {step === "create" ? "🎉 New event" : "Invite people"}
              </h3>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            {step === "create" && (
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Event name</label>
                  <input type="text" className="input" placeholder="e.g. Beach bonfire" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time (optional)</label>
                  <input type="time" className="input" value={time} onChange={e => setTime(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location (optional)</label>
                  <input type="text" className="input" placeholder="e.g. Sunset Beach" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" className="btn-primary text-sm" disabled={saving}>{saving ? "Creating..." : "Create event"}</button>
                  <button type="button" onClick={close} className="btn-secondary text-sm">Cancel</button>
                </div>
              </form>
            )}

            {step === "invite" && event && (
              <div className="space-y-4">
                <div className="rounded-xl bg-sky-50 border border-sky-100 p-3 space-y-1">
                  <p className="font-medium text-slate-800">{event.title}</p>
                  <p className="text-xs text-slate-500">{new Date(event.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                  {event.location && <p className="text-xs text-slate-400">📍 {event.location}</p>}
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Share invite link</p>
                  <button type="button" onClick={copyLink} className="w-full rounded-xl border-2 border-dashed border-sky-200 px-3 py-2 text-sm text-sky-600 hover:bg-sky-50 transition text-center">
                    {copied ? "Copied!" : "📋 Copy invite link"}
                  </button>
                </div>

                <form onSubmit={handleInvite} className="space-y-2">
                  <p className="text-xs font-medium text-slate-500">Or add people directly</p>
                  <input type="text" className="input" placeholder="Name" value={inviteName} onChange={e => setInviteName(e.target.value)} required />
                  <input type="email" className="input" placeholder="Email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                  <button type="submit" className="btn-primary text-sm w-full" disabled={inviting}>{inviting ? "Adding..." : "Add person"}</button>
                </form>

                {event.members.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">Invited</p>
                    {event.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{m.name}</p>
                          <p className="text-xs text-slate-400">{m.email}</p>
                        </div>
                        <span className={"rounded-full px-2 py-0.5 text-xs font-medium " + (m.status === "accepted" ? "bg-emerald-100 text-emerald-600" : m.status === "declined" ? "bg-red-100 text-red-500" : "bg-amber-100 text-amber-600")}>
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button type="button" onClick={close} className="btn-secondary text-sm w-full">Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}