"use client";
import { useState, useEffect } from "react";
import { getCars, addCar, removeCar, assignSeat, unassignSeat } from "@/lib/store";
import type { Car } from "@/lib/store";
import type { FamilyMember } from "@/types";

interface CarOrganizerProps {
  tripId: string;
  members: FamilyMember[];
}

const SEAT_COLORS = [
  "bg-sky-400", "bg-amber-400", "bg-rose-400", "bg-violet-400",
  "bg-emerald-400", "bg-orange-400", "bg-pink-400", "bg-teal-400",
];

const LAYOUTS: { label: string; value: string; rows: number[] }[] = [
  { label: "2+3 — Sedan / Standard SUV", value: "2+3", rows: [2, 3] },
  { label: "2+2+3 — Large SUV / Minivan", value: "2+2+3", rows: [2, 2, 3] },
  { label: "2+3+3 — Full Size Van", value: "2+3+3", rows: [2, 3, 3] },
];

function getLayoutRows(layout: string): number[] {
  return LAYOUTS.find((l) => l.value === layout)?.rows ?? [2, 3];
}

function getMemberColor(memberId: string, members: FamilyMember[]): string {
  const index = members.findIndex((m) => m.id === memberId);
  return SEAT_COLORS[index % SEAT_COLORS.length];
}

function getSeatLabel(seatIndex: number): string {
  if (seatIndex === 0) return "Driver";
  if (seatIndex === 1) return "Shotgun";
  return `Seat ${seatIndex + 1}`;
}

export function CarOrganizer({ tripId, members }: CarOrganizerProps) {
  const [open, setOpen] = useState(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingCar, setAddingCar] = useState(false);
  const [newCarName, setNewCarName] = useState("");
  const [newCarLayout, setNewCarLayout] = useState("2+3");
  const [draggingMemberId, setDraggingMemberId] = useState<string | null>(null);
  const [draggingFrom, setDraggingFrom] = useState<{ carId: string; seatIndex: number } | null>(null);
  const [trunkMembers, setTrunkMembers] = useState<Record<string, string[]>>({});
  const [dragOver, setDragOver] = useState<string | null>(null); // "unassigned" | "trunk:carId" | "seat:carId:seatIndex"

  async function load() {
    setLoading(true);
    const data = await getCars(tripId);
    setCars(data);
    setLoading(false);
  }

  useEffect(() => {
    if (open) load();
  }, [open]);

  const assignedMemberIds = cars.flatMap((c) => c.assignments.map((a) => a.memberId));
  const trunkMemberIds = Object.values(trunkMembers).flat();
  const unassignedMembers = members.filter(
    (m) => !assignedMemberIds.includes(m.id) && !trunkMemberIds.includes(m.id)
  );

  async function handleAddCar() {
    if (!newCarName.trim()) return;
    const layout = newCarLayout;
    const rows = getLayoutRows(layout);
    const seats = rows.reduce((a, b) => a + b, 0);
    const car = await addCar(tripId, newCarName.trim(), seats, layout);
    if (car) setCars((prev) => [...prev, car]);
    setNewCarName("");
    setNewCarLayout("2+3");
    setAddingCar(false);
  }

  async function handleRemoveCar(carId: string) {
    if (!confirm("Remove this car?")) return;
    await removeCar(carId);
    setCars((prev) => prev.filter((c) => c.id !== carId));
    setTrunkMembers((prev) => { const n = { ...prev }; delete n[carId]; return n; });
  }

  function handleDrop(carId: string, seatIndex: number) {
    if (!draggingMemberId) return;
    const targetCar = cars.find((c) => c.id === carId);
    const occupied = targetCar?.assignments.find((a) => a.seatIndex === seatIndex);
    if (occupied) return;

    // Optimistic update — remove from old location, add to new
    setCars((prev) => prev.map((car) => {
      let assignments = car.assignments.filter((a) => a.memberId !== draggingMemberId);
      if (car.id === carId) {
        assignments = [...assignments, { memberId: draggingMemberId!, seatIndex }];
      }
      return { ...car, assignments };
    }));

    // Remove from trunk if needed
    setTrunkMembers((prev) => {
      const updated = { ...prev };
      for (const cid in updated) {
        updated[cid] = updated[cid].filter((id) => id !== draggingMemberId);
      }
      return updated;
    });

    // Sync to DB in background
    if (draggingFrom) {
      unassignSeat(draggingFrom.carId, draggingFrom.seatIndex);
    }
    assignSeat(carId, draggingMemberId!, seatIndex);

    setDraggingMemberId(null);
    setDraggingFrom(null);
    setDragOver(null);
  }

  function handleDropToUnassigned() {
    if (!draggingFrom || !draggingMemberId) return;

    // Optimistic update
    setCars((prev) => prev.map((car) => ({
      ...car,
      assignments: car.assignments.filter((a) => a.memberId !== draggingMemberId),
    })));

    // Sync to DB
    unassignSeat(draggingFrom.carId, draggingFrom.seatIndex);

    setDraggingMemberId(null);
    setDraggingFrom(null);
    setDragOver(null);
  }

  function handleDropToTrunk(carId: string) {
    if (!draggingMemberId) return;

    // Remove from seat optimistically
    if (draggingFrom) {
      setCars((prev) => prev.map((car) => ({
        ...car,
        assignments: car.assignments.filter((a) => a.memberId !== draggingMemberId),
      })));
      unassignSeat(draggingFrom.carId, draggingFrom.seatIndex);
    }

    setTrunkMembers((prev) => ({
      ...prev,
      [carId]: [...(prev[carId] ?? []).filter((id) => id !== draggingMemberId), draggingMemberId!],
    }));

    setDraggingMemberId(null);
    setDraggingFrom(null);
    setDragOver(null);
  }

  function removeTrunkMember(carId: string, memberId: string) {
    setTrunkMembers((prev) => ({
      ...prev,
      [carId]: (prev[carId] ?? []).filter((id) => id !== memberId),
    }));
  }

  function close() {
    setOpen(false);
    setCars([]);
    setAddingCar(false);
    setDragOver(null);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary text-sm">
        🚗 Cars
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} />

          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">🚗 Car organizer</h3>
              <button type="button" onClick={close} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500 text-center py-4">Loading...</p>
            ) : (
              <>
                {/* Unassigned */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver("unassigned"); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={handleDropToUnassigned}
                  className={`rounded-xl border-2 border-dashed p-3 transition ${dragOver === "unassigned" ? "border-sky-400 bg-sky-50" : "border-slate-200"}`}
                >
                  <p className="text-xs font-medium text-slate-500 mb-2">Unassigned — drag into a seat</p>
                  <div className="flex flex-wrap gap-2 min-h-[36px]">
                    {unassignedMembers.length === 0 && (
                      <p className="text-xs text-slate-400">Everyone is assigned!</p>
                    )}
                    {unassignedMembers.map((member) => (
                      <div
                        key={member.id}
                        draggable
                        onDragStart={() => { setDraggingMemberId(member.id); setDraggingFrom(null); }}
                        onDragEnd={() => { setDraggingMemberId(null); setDraggingFrom(null); setDragOver(null); }}
                        className={`rounded-full px-3 py-1 text-xs font-medium text-white cursor-grab active:cursor-grabbing select-none transition-opacity ${draggingMemberId === member.id ? "opacity-40" : "opacity-100"} ${getMemberColor(member.id, members)}`}
                      >
                        {member.name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cars */}
                <div className="space-y-6">
                  {cars.map((car) => {
                    const rows = getLayoutRows(car.layout ?? "2+3");
                    let seatCounter = 0;
                    const trunk = trunkMembers[car.id] ?? [];

                    return (
                      <div key={car.id} className="rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-b border-slate-200">
                          <p className="font-medium text-slate-800">🚗 {car.name}</p>
                          <button type="button" onClick={() => handleRemoveCar(car.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                        </div>

                        <div className="p-4 space-y-2">
                          {rows.map((rowSize, rowIndex) => {
                            const rowSeats = Array.from({ length: rowSize }).map(() => seatCounter++);
                            return (
                              <div key={rowIndex}>
                                {rowIndex > 0 && <div className="border-t border-dashed border-slate-100 my-2" />}
                                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${rowSize}, 1fr)` }}>
                                  {rowSeats.map((seatIndex) => {
                                    const assignment = car.assignments.find((a) => a.seatIndex === seatIndex);
                                    const member = assignment ? members.find((m) => m.id === assignment.memberId) : null;
                                    const label = getSeatLabel(seatIndex);
                                    const dropKey = `seat:${car.id}:${seatIndex}`;

                                    return (
                                      <div
                                        key={seatIndex}
                                        onDragOver={(e) => { e.preventDefault(); if (!member) setDragOver(dropKey); }}
                                        onDragLeave={() => setDragOver(null)}
                                        onDrop={() => handleDrop(car.id, seatIndex)}
                                        className={`relative rounded-xl border-2 h-16 flex flex-col items-center justify-center text-xs font-medium transition-all ${
                                          member
                                            ? `${getMemberColor(member.id, members)} text-white border-transparent`
                                            : dragOver === dropKey
                                            ? "border-sky-400 bg-sky-50 scale-105"
                                            : "border-dashed border-slate-200 text-slate-400 hover:border-sky-200 hover:bg-sky-50"
                                        }`}
                                      >
                                        {member ? (
                                          <div
                                            draggable
                                            onDragStart={() => { setDraggingMemberId(member.id); setDraggingFrom({ carId: car.id, seatIndex }); }}
                                            onDragEnd={() => { setDraggingMemberId(null); setDraggingFrom(null); setDragOver(null); }}
                                            className={`w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none px-1 text-center gap-0.5 transition-opacity ${draggingMemberId === member.id ? "opacity-40" : "opacity-100"}`}
                                          >
                                            <span className="text-white/70 text-[10px]">{label}</span>
                                            <span>{member.name}</span>
                                          </div>
                                        ) : (
                                          <span>{label}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          {/* Trunk */}
                          <div className="border-t border-dashed border-slate-100 mt-2 pt-2">
                            <div
                              onDragOver={(e) => { e.preventDefault(); setDragOver(`trunk:${car.id}`); }}
                              onDragLeave={() => setDragOver(null)}
                              onDrop={() => handleDropToTrunk(car.id)}
                              className={`rounded-xl border-2 border-dashed px-3 py-2 min-h-[48px] flex flex-wrap gap-2 items-center transition ${dragOver === `trunk:${car.id}` ? "border-amber-400 bg-amber-100" : "border-amber-200 bg-amber-50"}`}
                            >
                              <span className="text-xs text-amber-500 font-medium mr-1">🐾 Trunk</span>
                              {trunk.length === 0 && dragOver !== `trunk:${car.id}` && (
                                <span className="text-xs text-amber-300">Drop pets here</span>
                              )}
                              {trunk.map((memberId) => {
                                const m = members.find((mem) => mem.id === memberId);
                                if (!m) return null;
                                return (
                                  <div
                                    key={memberId}
                                    draggable
                                    onDragStart={() => { setDraggingMemberId(memberId); setDraggingFrom(null); }}
                                    onDragEnd={() => { setDraggingMemberId(null); setDraggingFrom(null); setDragOver(null); }}
                                    className={`rounded-full px-3 py-1 text-xs font-medium text-white cursor-grab select-none flex items-center gap-1 ${getMemberColor(memberId, members)}`}
                                  >
                                    {m.name}
                                    <button type="button" onClick={() => removeTrunkMember(car.id, memberId)} className="ml-1 text-white/70 hover:text-white">✕</button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add car */}
                {addingCar ? (
                  <div className="rounded-xl border-2 border-sky-100 bg-sky-50 p-4 space-y-3">
                    <p className="text-sm font-medium text-sky-700">Add a car</p>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Dad's Tahoe"
                      value={newCarName}
                      onChange={(e) => setNewCarName(e.target.value)}
                      autoFocus
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Layout</label>
                      <div className="space-y-2">
                        {LAYOUTS.map((l) => (
                          <button
                            key={l.value}
                            type="button"
                            onClick={() => setNewCarLayout(l.value)}
                            className={`w-full text-left rounded-xl border-2 px-3 py-2 text-sm transition ${newCarLayout === l.value ? "border-sky-400 bg-sky-100 text-sky-700 font-medium" : "border-slate-200 text-slate-600 hover:border-sky-200"}`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleAddCar} className="btn-primary text-sm">Add car</button>
                      <button type="button" onClick={() => setAddingCar(false)} className="btn-secondary text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingCar(true)}
                    className="w-full rounded-xl border-2 border-dashed border-sky-200 py-3 text-sm text-sky-600 hover:bg-sky-50 transition"
                  >
                    + Add a car
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
