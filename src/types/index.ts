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
  location?: string;
  link?: string;
  type: "activity" | "meal" | "travel" | "stay" |"other";
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
