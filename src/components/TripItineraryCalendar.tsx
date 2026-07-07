"use client";

import { useMemo, useState } from "react";
import type { Activity } from "@/types";
import { formatFlightTitle } from "@/lib/airport";
import { formatStayDateRange, getActivityDates } from "@/lib/activity-dates";
import { EditActivityForm } from "./EditActivityForm";

interface TripItineraryCalendarProps {
  activities: Activity[];
  tripStartDate: string;
  tripEndDate: string;
  tripId: string;
  editingId: string | null;
  onEdit: (id: string) => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onRemove: (id: string) => void;
}

const TYPE_COLORS: Record<Activity["type"], string> = {
  event: "bg-sky-400",
  meal: "bg-amber-400",
  travel: "bg-slate-400",
  stay: "bg-violet-400",
  other: "bg-slate-300",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatMonthYear(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDateLabel(year: number, month: number, day: number) {
  return new Date(year, month, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return (h % 12 || 12) + ":" + m.toString().padStart(2, "0") + " " + ampm;
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getActivityLabel(activity: Activity): string {
  if (activity.travelSubtype === "flight") {
    return formatFlightTitle(
      activity.flightNumber ?? "",
      activity.departureLocation ?? "",
      activity.arrivalLocation ?? ""
    );
  }
  return activity.title;
}

function getInitialMonth(tripStartDate: string, tripEndDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(tripStartDate + "T12:00:00");
  const end = new Date(tripEndDate + "T12:00:00");
  if (today >= start && today <= end) {
    return { year: today.getFullYear(), month: today.getMonth() };
  }
  return { year: start.getFullYear(), month: start.getMonth() };
}

export function TripItineraryCalendar({
  activities,
  tripStartDate,
  tripEndDate,
  tripId,
  editingId,
  onEdit,
  onCancelEdit,
  onSaved,
  onRemove,
}: TripItineraryCalendarProps) {
  const initial = getInitialMonth(tripStartDate, tripEndDate);
  const today = new Date();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const tripSpanDates = useMemo(() => {
    const set = new Set<string>();
    const start = new Date(tripStartDate + "T12:00:00");
    const end = new Date(tripEndDate + "T12:00:00");
    const cur = new Date(start);
    while (cur <= end) {
      set.add(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return set;
  }, [tripStartDate, tripEndDate]);

  const activityMap = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const activity of activities) {
      for (const dateKey of getActivityDates(activity)) {
        const list = map.get(dateKey) ?? [];
        list.push(activity);
        map.set(dateKey, list);
      }
    }
    for (const [, list] of Array.from(map)) {
      list.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    }
    return map;
  }, [activities]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  }

  function getActivitiesForDay(day: number): Activity[] {
    return activityMap.get(toDateKey(year, month, day)) ?? [];
  }

  function isToday(day: number) {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  }

  function isInTripSpan(day: number) {
    return tripSpanDates.has(toDateKey(year, month, day));
  }

  const selectedActivities = selectedDay ? getActivitiesForDay(selectedDay) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-sky-300 hover:text-sky-600 transition">
          ←
        </button>
        <h3 className="font-display text-lg font-semibold text-sky-700">{formatMonthYear(year, month)}</h3>
        <button type="button" onClick={nextMonth} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-sky-300 hover:text-sky-600 transition">
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={"empty-" + i} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayActivities = getActivitiesForDay(day);
          const inTrip = isInTripSpan(day);
          const hasActivities = dayActivities.length > 0;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={
                "relative rounded-xl p-1.5 min-h-[56px] flex flex-col items-center transition text-left "
                + (isToday(day) ? "ring-2 ring-sky-400 " : "")
                + (inTrip ? "bg-sky-50/80 " : "")
                + (isSelected ? "bg-sky-100 ring-2 ring-sky-300 " : "hover:bg-slate-50 ")
                + (hasActivities || inTrip ? "cursor-pointer" : "cursor-default")
              }
            >
              <span className={"text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full " + (isToday(day) ? "bg-sky-500 text-white" : "text-slate-700")}>
                {day}
              </span>
              <div className="w-full mt-1 space-y-0.5">
                {dayActivities.slice(0, 2).map((activity) => (
                  <div
                    key={activity.id}
                    className={"rounded-sm px-1 py-0.5 text-[10px] font-medium text-white truncate " + TYPE_COLORS[activity.type]}
                    title={getActivityLabel(activity)}
                  >
                    {getActivityLabel(activity)}
                  </div>
                ))}
                {dayActivities.length > 2 && (
                  <div className="text-[10px] text-slate-400 pl-1">+{dayActivities.length - 2} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDay !== null && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-sky-700">{formatDateLabel(year, month, selectedDay)}</p>
            <button type="button" onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          {selectedActivities.length === 0 ? (
            <p className="text-sm text-slate-500">No activities scheduled for this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedActivities.map((activity) => (
                editingId === activity.id ? (
                  <EditActivityForm
                    key={activity.id}
                    tripId={tripId}
                    activity={activity}
                    onSaved={onSaved}
                    onCancel={onCancelEdit}
                  />
                ) : (
                  <div key={activity.id} className="rounded-xl bg-white border border-slate-100 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800">{getActivityLabel(activity)}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => onEdit(activity.id)} className="text-xs text-sky-600 hover:underline">Edit</button>
                        <button type="button" onClick={() => onRemove(activity.id)} className="text-xs text-orange-600 hover:text-orange-700">Remove</button>
                      </div>
                    </div>
                    {activity.type === "stay" && activity.checkOutDate && (
                      <p className="text-xs text-slate-500">🏨 {formatStayDateRange(activity.date, activity.checkOutDate)}</p>
                    )}
                    {activity.time && activity.type !== "stay" && (
                      <p className="text-xs text-slate-500">{formatTime(activity.time)}{activity.endTime ? " – " + formatTime(activity.endTime) : ""}</p>
                    )}
                    {activity.location && (
                      <p className="text-xs text-slate-500 truncate">📍 {activity.location}</p>
                    )}
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-400">Light blue days are within your trip dates. Tap a day to see and edit its activities.</p>
    </div>
  );
}
