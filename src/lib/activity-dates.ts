import type { Activity } from "@/types";

/** All calendar/list days an activity occupies. Stays span check-in through check-out (inclusive). */
export function getActivityDates(activity: Activity): string[] {
  if (activity.type === "stay" && activity.checkOutDate && activity.checkOutDate >= activity.date) {
    const dates: string[] = [];
    const start = new Date(activity.date + "T12:00:00");
    const end = new Date(activity.checkOutDate + "T12:00:00");
    const cur = new Date(start);
    while (cur <= end) {
      dates.push(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }
  return [activity.date];
}

export function formatStayDateRange(checkIn: string, checkOut?: string): string {
  const fmt = (d: string) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  if (!checkOut || checkOut === checkIn) return fmt(checkIn);
  return fmt(checkIn) + " – " + fmt(checkOut);
}
