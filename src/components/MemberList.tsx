"use client";

import { useState } from "react";
import { removeMember, updateMemberStatus } from "@/lib/store";
import type { FamilyMember } from "@/types";

interface MemberListProps {
  tripId: string;
  members: FamilyMember[];
  onUpdate: () => void;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function MemberList({ tripId, members = [], onUpdate }: MemberListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleRemove(memberId: string) {
    if (confirm("Remove this group member from the trip?")) {
      await removeMember(tripId, memberId);
      onUpdate();
    }
  }

  async function handleStatusChange(memberId: string, status: "accepted" | "pending" | "declined") {
    setUpdatingId(memberId);
    await updateMemberStatus(memberId, status);
    await onUpdate();
    setUpdatingId(null);
  }

  if (members.length === 0) {
    return (
      <div className="card border-dashed border-sky-200 p-6 text-center text-slate-500">
        No members yet. Invite people to join the trip.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {members.map((member) => (
        <li key={member.id} className="card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-medium text-sky-700">
              {getInitials(member.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{member.name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {updatingId === member.id ? (
                <span className="text-xs text-slate-400">Saving...</span>
              ) : (
                <div className="relative">
                  <select
                    value={member.status}
                    onChange={(e) => handleStatusChange(member.id, e.target.value as "accepted" | "pending" | "declined")}
                    className={"appearance-none rounded-lg border pl-2.5 pr-6 py-1 text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-300 " + (
                      member.status === "accepted" ? "bg-green-50 border-green-200 text-green-700" :
                      member.status === "declined" ? "bg-red-50 border-red-200 text-red-600" :
                      "bg-amber-50 border-amber-200 text-amber-700"
                    )}
                  >
                    <option value="accepted">Accepted</option>
                    <option value="pending">Pending</option>
                    <option value="declined">Declined</option>
                  </select>
                  <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-xs opacity-50">▾</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleRemove(member.id)}
                className="text-xs text-orange-500 hover:text-orange-600 whitespace-nowrap"
              >
                Remove
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}