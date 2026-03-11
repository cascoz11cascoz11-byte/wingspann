"use client";
import { useState, useMemo } from "react";
import { removeActivity, updateActivityParticipants } from "@/lib/store";
import type { Activity, FamilyMember } from "@/types";
import { EditActivityForm } from "./EditActivityForm";

interface ActivityListProps { tripId: string; activities: Activity[]; members: FamilyMember[]; onUpdate: () => void; }

const TYPE_LABELS: Record<Activity["type"], string> = { event: "Event", meal: "Meal", travel: "Travel", accommodation: "Accommodations", stay: "Stay", other: "Other" };
const TYPE_COLORS: Record<Activity["type"], string> = { event: "bg-sky-100 text-sky-700", meal: "bg-amber-100 text-amber-700", travel: "bg-slate-200 text-slate-700", accommodation: "bg-green-100 text-green-700", stay: "bg-purple-100 text-purple-700", other: "bg-slate-100 text-slate-600" };

function formatDate(dateStr: string) { return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }); }

function formatTime(time: string) {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function calculateETA(departureTime: string, driveTime: string): string {
  try {
    const [h, m] = departureTime.split(":").map(Number);
    const match = driveTime.match(/(\d+)\s*hour[s]?\s*(\d+)?\s*min[s]?|(\d+)\s*min[s]?|(\d+)\s*hour[s]?/);
    if (!match) return "";
    let totalMinutes = h * 60 + m;
    if (match[1]) totalMinutes += parseInt(match[1]) * 60;
    if (match[2]) totalMinutes += parseInt(match[2]);
    if (match[3]) totalMinutes += parseInt(match[3]);
    if (match[4]) totalMinutes += parseInt(match[4]) * 60;
    const etaH = Math.floor(totalMinutes / 60) % 24;
    const etaM = totalMinutes % 60;
    const ampm = etaH >= 12 ? "PM" : "AM";
    const hour = etaH % 12 || 12;
    return `${hour}:${etaM.toString().padStart(2, "0")} ${ampm}`;
  } catch { return ""; }
}

function groupActivitiesByDay(activities: Activity[]): { date: string; activities: Activity[] }[] {
  const byDate = new Map<string, Activity[]>();
  for (const a of activities) { const list = byDate.get(a.date) ?? []; list.push(a); byDate.set(a.date, list); }
  return Array.from(byDate.keys()).sort().map((date) => ({ date, activities: byDate.get(date)! }));
}

export function ActivityList({ tripId, activities = [], members = [], onUpdate }: ActivityListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [savingParticipants, setSavingParticipants] = useState(false);
  const [localParticipants, setLocalParticipants] = useState<Record<string, string[]>>({});
  const byDay = useMemo(() => groupActivitiesByDay(activities), [activities]);

  function getParticipants(activity: Activity): string[] {
    return localParticipants[activity.id] ?? activity.participants ?? [];
  }

  function toggleParticipant(activityId: string, memberId: string, current: string[]) {
    const updated = current.includes(memberId)
      ? current.filter((id) => id !== memberId)
      : [...current, memberId];
    setLocalParticipants((prev) => ({ ...prev, [activityId]: updated }));
  }

  function selectAll(activityId: string) {
    setLocalParticipants((prev) => ({ ...prev, [activityId]: members.map((m) => m.id) }));
  }

  async function saveParticipants(activityId: string) {
    setSavingParticipants(true);
    const participants = localParticipants[activityId] ?? [];
    await updateActivityParticipants(activityId, participants);
    setSavingParticipants(false);
    setAssigningId(null);
    onUpdate();
  }

  async function handleRemove(activityId: string) {
    if (confirm("Remove this activity?")) { await removeActivity(tripId, activityId); setEditingId(null); onUpdate(); }
  }

  if (activities.length === 0) {
    return <div className="card border-dashed border-sky-200 p-6 text-center text-slate-500">No activities yet. Add your first one to build the itinerary.</div>;
  }

  return (
    <div className="space-y-8">
      {byDay.map(({ date, activities: dayActivities }) => (
        <section key={date}>
          <h3 className="mb-3 font-display text-lg font-semibold text-sky-700">{formatDate(date)}</h3>
          <ul className="space-y-3">
            {dayActivities.map((activity) => editingId === activity.id ? (
              <li key={activity.id}><EditActivityForm tripId={tripId} activity={activity} onSaved={() => { setEditingId(null); onUpdate(); }} onCancel={() => setEditingId(null)} /></li>
            ) : (
              <li key={activity.id} className="card overflow-hidden">
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-medium text-slate-800">{activity.title}</h4>
                      <span className={"rounded-full px-2 py-0.5 text-xs font-medium " + TYPE_COLORS[activity.type]}>{TYPE_LABELS[activity.type]}</span>
                      {activity.travelSubtype === "flight" && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">✈️ Flight</span>}
                      {activity.travelSubtype === "drive" && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">🚗 Drive</span>}
                    </div>

                    {activity.description && <p className="mt-1 text-sm text-slate-600">{activity.description}</p>}

                    {activity.travelSubtype === "drive" && activity.driveTime && activity.time && (
                      <div className="mt-2 rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-800">
                        🚗 Departing at {formatTime(activity.time)} · drive time of {activity.driveTime}
                        {calculateETA(activity.time, activity.driveTime) && ` · ETA: ${calculateETA(activity.time, activity.driveTime)}`}
                      </div>
                    )}

                    {activity.travelSubtype === "drive" && activity.driveTime && !activity.time && (
                      <div className="mt-2 rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-800">
                        🚗 Est. drive time: {activity.driveTime}
                      </div>
                    )}

                    {activity.travelSubtype === "flight" && (activity.departureLocation || activity.arrivalLocation) && (
                      <div className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800">
                        ✈️ {activity.departureLocation} → {activity.arrivalLocation}
                        {activity.time && ` · Departs ${formatTime(activity.time)}`}
                        {activity.arrivalTime && ` · Arrives ${formatTime(activity.arrivalTime)}`}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      {activity.time && activity.travelSubtype !== "drive" && activity.travelSubtype !== "flight" && <span>{formatTime(activity.time)}</span>}
                      {activity.location && <span className="truncate">📍 {activity.location}</span>}
                    </div>

                    {activity.link && <a href={activity.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-sky-600 hover:underline">🔗 View link</a>}

                    {getParticipants(activity).length > 0 && assigningId !== activity.id && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {getParticipants(activity).map((memberId) => {
                          const member = members.find((m) => m.id === memberId);
                          return member ? (
                            <span key={memberId} className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                              {member.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}

                    {assigningId === activity.id && (
                      <div className="mt-3 rounded-xl border-2 border-sky-100 bg-sky-50 p-3 space-y-2">
                        <p className="text-xs font-medium text-sky-700">Who is doing this?</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => selectAll(activity.id)}
                            className="rounded-full border-2 border-sky-300 bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-200"
                          >
                            All
                          </button>
                          {members.map((member) => {
                            const selected = getParticipants(activity).includes(member.id);
                            return (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => toggleParticipant(activity.id, member.id, getParticipants(activity))}
                                className={`rounded-full border-2 px-3 py-1 text-xs font-medium transition ${selected ? "border-sky-400 bg-sky-200 text-sky-800" : "border-slate-200 bg-white text-slate-600 hover:border-sky-200"}`}
                              >
                                {selected ? "✓ " : ""}{member.name}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => saveParticipants(activity.id)}
                            disabled={savingParticipants}
                            className="btn-primary text-xs py-1.5"
                          >
                            {savingParticipants ? "Saving..." : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssigningId(null)}
                            className="btn-secondary text-xs py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 items-end">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setEditingId(activity.id)} className="text-sm text-sky-600 hover:underline">Edit</button>
                      <button type="button" onClick={() => handleRemove(activity.id)} className="text-sm text-orange-600 hover:text-orange-700">Remove</button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAssigningId(assigningId === activity.id ? null : activity.id)}
                      className="text-xs text-slate-500 hover:text-sky-600"
                    >
                      👥 Assign people
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
