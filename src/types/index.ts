export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "pending" | "accepted" | "declined";
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  link?: string;
  type: "event" | "meal" | "travel" | "accommodation" | "stay" | "other";
  travelSubtype?: "drive" | "flight" | "other";
  departureLocation?: string;
  arrivalLocation?: string;
  arrivalTime?: string;
  flightNumber?: string;
  driveTime?: string;
  participants?: string[];
  createdAt: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  coverImage?: string;
  members: FamilyMember[];
  activities: Activity[];
  createdAt: string;
  createdBy: string;
  inviteCode?: string;
}
