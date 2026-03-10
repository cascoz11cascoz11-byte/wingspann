"use client";

import { useState } from "react";
import { addMember } from "@/lib/store";

interface InviteMemberProps {
  tripId: string;
  onInvited: () => void;
}

export function InviteMember({ tripId, onInvited }: InviteMemberProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addMember(tripId, { name, email });
    setName("");
    setEmail("");
    setOpen(false);
    onInvited();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary text-sm"
      >
        Invite family
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-2">
        <input
          type="text"
          className="input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary whitespace-nowrap text-sm">
          Send invite
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setName("");
            setEmail("");
          }}
          className="btn-secondary text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
