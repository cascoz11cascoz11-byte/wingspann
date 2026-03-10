# Wingspann

A Next.js app for planning family vacations. Create trips, invite family members, and build a shared itinerary together.

## Features

- **Create trips** – Name, destination, dates, and optional description
- **Invite family** – Add members by name and email; see pending vs accepted status
- **Itinerary** – Add activities with title, date, time, location, and type (activity, meal, travel, other)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create a trip, invite family, and add activities from the trip detail page.

## Tech stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- In-memory store for demo (replace with API/database for production)

## Project structure

- `src/app/` – Routes: home (trip list), `/trips/new`, `/trips/[id]`
- `src/components/` – TripList, InviteMember, MemberList, AddActivity, ActivityList, Header
- `src/lib/store.ts` – Trip/member/activity CRUD (client-side, in-memory)
- `src/types/` – Trip, FamilyMember, Activity types
