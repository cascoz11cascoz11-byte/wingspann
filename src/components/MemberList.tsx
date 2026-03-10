"use client";

import { removeMember } from "@/lib/store";
import type { FamilyMember } from "@/types";

interface MemberListProps {
  tripId: string;
  members: FamilyMember[];
  onUpdate: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MemberList({ tripId, members = [], onUpdate }: MemberListProps) {
  async function handleRemove(memberId: string) {
    if (confirm("Remove this family member from the trip?")) {
      await removeMember(tripId, memberId);
      onUpdate();
    }
  }

  if (members.length === 0) {
    return (
      <div className="card border-dashed border-sky-200 p-6 text-center text-slate-500">
        No members yet. Invite family to join the trip.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {members.map((member) => (
        <li
          key={member.id}
          className="card flex items-center justify-between gap-4 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-medium text-sky-700">
              {getInitials(member.name)}
            </div>
            <div>
              <p className="font-medium text-slate-800">{member.name}</p>
              <p className="text-sm text-slate-500">{member.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                member.status === "accepted"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {member.status === "accepted" ? "Accepted" : "Pending"}
            </span>
            {member.email !== "you@example.com" && (
              <button
                type="button"
                onClick={() => handleRemove(member.id)}
                className="text-sm text-orange-500 hover:text-orange-600"
              >
                Remove
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
