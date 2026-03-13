"use client";
import { useState } from "react";
import type { Trip, Activity } from "@/types";
import Link from "next/link";

interface HomeCalendarProps {
  trips: Trip[];
}

const TRIP_COLORS = [
  "bg-sky-400", "bg-amber-400", "bg-rose-400", "bg-violet-400",
  "bg-emerald-400", "bg-orange-400", "bg-pink-400", "bg-teal-400",
];

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

interface CalendarEvent {
  tripId: string;
  tripName: string;
  tripColor: string;
  activity?: Activity;
  isTripSpan: boolean;
  label: string;
}

export function HomeCalendar({ trips }: HomeCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [popover, setPopover] = useState<{ day: number; events: CalendarEvent[] } | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setPopover(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setPopover(null);
  }

  // Build event map: dateStr -> CalendarEvent[]
  const eventMap = new Map<string, CalendarEvent[]>();

  trips.forEach((trip, tripIndex) => {
    const color = TRIP_COLORS[tripIndex % TRIP_COLORS.length];

    // Mark all days of trip span
    const start = new Date(trip.startDate + "T12:00:00");
    const end = new Date(trip.endDate + "T12:00:00");
    const cur = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().split("T")[0];
      const list = eventMap.get(key) ?? [];
      list.push({ tripId: trip.id, tripName: trip.name, tripColor: color, isTripSpan: true, label: trip.name });
      eventMap.set(key, list);
      cur.setDate(cur.getDate() + 1);
    }

    // Mark individual activities
    trip.activities.forEach((activity) => {
      if (activity.type === "stay") return;
      const list = eventMap.get(activity.date) ?? [];
      list.push({ tripId: trip.id, tripName: trip.name, tripColor: color, activity, isTripSpan: false, label: activity.title });
      eventMap.set(activity.date, list);
    });
  });

  function getEventsForDay(day: number): CalendarEvent[] {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return eventMap.get(key) ?? [];
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-sky-300 hover:text-sky-600 transition">
          ←
        </button>
        <h2 className="font-display text-lg font-semibold text-slate-700">{formatMonthYear(year, month)}</h2>
        <button type="button" onClick={nextMonth} className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:border-sky-300 hover:text-sky-600 transition">
          →
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={"empty-" + i} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const events = getEventsForDay(day);
          const spanEvents = events.filter(e => e.isTripSpan);
          const activityEvents = events.filter(e => !e.isTripSpan);
          const hasEvents = events.length > 0;

          return (
            <button
              key={day}
              type="button"
              onClick={() => hasEvents ? setPopover(popover?.day === day ? null : { day, events }) : null}
              className={`relative rounded-xl p-1.5 min-h-[56px] flex flex-col items-center transition text-left
                ${isToday(day) ? "ring-2 ring-sky-400" : ""}
                ${hasEvents ? "cursor-pointer hover:bg-sky-50" : "cursor-default"}
                ${popover?.day === day ? "bg-sky-50" : ""}
              `}
            >
              <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? "bg-sky-500 text-white" : "text-slate-700"}`}>
                {day}
              </span>
              <div className="w-full mt-1 space-y-0.5">
                {spanEvents.slice(0, 1).map((e, idx) => (
                  <div key={idx} className={`rounded-sm px-1 py-0.5 text-[10px] font-medium text-white truncate ${e.tripColor}`}>
                    {e.tripName}
                  </div>
                ))}
                {activityEvents.slice(0, 1).map((e, idx) => (
                  <div key={idx} className="rounded-sm px-1 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 truncate">
                    {e.label}
                  </div>
                ))}
                {events.length > 2 && (
                  <div className="text-[10px] text-slate-400 pl-1">+{events.length - 2} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Popover */}
      {popover && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-sky-700">{formatDateLabel(year, month, popover.day)}</p>
            <button type="button" onClick={() => setPopover(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          <div className="space-y-2">
            {popover.events.map((e, idx) => (
              <div key={idx} className="rounded-xl bg-white border border-slate-100 p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={"w-2 h-2 rounded-full shrink-0 " + e.tripColor} />
                    <p className="text-sm font-medium text-slate-800">{e.label}</p>
                  </div>
                  <Link href={"/trips/" + e.tripId} className="text-xs text-sky-500 hover:underline shrink-0">
                    View trip
                  </Link>
                </div>
                <p className="text-xs text-slate-500 pl-4">{e.tripName}</p>
                {e.activity?.time && (
                  <p className="text-xs text-slate-400 pl-4">{formatTime(e.activity.time)}</p>
                )}
                {e.activity?.location && (
                  <p className="text-xs text-slate-400 pl-4">📍 {e.activity.location}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      {trips.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-2">
          {trips.map((trip, i) => (
            <div key={trip.id} className="flex items-center gap-1.5">
              <div className={"w-2.5 h-2.5 rounded-full " + TRIP_COLORS[i % TRIP_COLORS.length]} />
              <span className="text-xs text-slate-500">{trip.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}