"use client";
import { useState, useMemo } from "react";
import { removeActivity } from "@/lib/store";
import type { Activity } from "@/types";
import { EditActivityForm } from "./EditActivityForm";
interface ActivityListProps { tripId: string; activities: Activity[]; onUpdate: () => void; }
const TYPE_LABELS: Record<Activity["type"], string> = { activity: "Activity", meal: "Meal", travel: "Travel", other: "Other" };
const TYPE_COLORS: Record<Activity["type"], string> = { activity: "bg-sky-100 text-sky-700", meal: "bg-amber-100 text-amber-700", travel: "bg-slate-200 text-slate-700", other: "bg-slate-100 text-slate-600" };
function formatDate(dateStr: string) { return new Date(dateStr).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }); }
function groupActivitiesByDay(activities: Activity[]): { date: string; activities: Activity[] }[] {
  const byDate = new Map<string, Activity[]>();
  for (const a of activities) { const list = byDate.get(a.date) ?? []; list.push(a); byDate.set(a.date, list); }
  return [...byDate.keys()].sort().map((date) => ({ date, activities: byDate.get(date)! }));
}
export function ActivityList({ tripId, activities = [], onUpdate }: ActivityListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const byDay = useMemo(() => groupActivitiesByDay(activities), [activities]);
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
                    </div>
                    {activity.description && <p className="mt-1 text-sm text-slate-600">{activity.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      {activity.time && <span>{activity.time}</span>}
                      {activity.location && <span className="truncate">📍 {activity.location}</span>}
                    </div>
                    {activity.link && <a href={activity.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm text-sky-600 hover:underline">🔗 View link</a>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => setEditingId(activity.id)} className="text-sm text-sky-600 hover:underline">Edit</button>
                    <button type="button" onClick={() => handleRemove(activity.id)} className="text-sm text-orange-600 hover:text-orange-700">Remove</button>
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
