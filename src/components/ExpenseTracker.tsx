"use client";
import { useState, useEffect } from "react";
import { getExpenses, addExpense, removeExpense } from "@/lib/store";
import type { Expense } from "@/lib/store";
import type { FamilyMember } from "@/types";

interface ExpenseTrackerProps {
  tripId: string;
  members: FamilyMember[];
}

type SplitMode = "even" | "selected" | "custom";

function formatCurrency(amount: number): string {
  return "$" + amount.toFixed(2).replace(/\.00$/, "");
}

function calculateBalances(expenses: Expense[]): { from: string; fromName: string; to: string; toName: string; amount: number }[] {
  const balances: Record<string, number> = {};
  const names: Record<string, string> = {};

  for (const expense of expenses) {
    // Payer gets credited
    balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + expense.amount;
    names[expense.paidBy] = expense.paidByName;
    // Each split member gets debited
    for (const split of expense.splits) {
      balances[split.memberId] = (balances[split.memberId] ?? 0) - split.amount;
      names[split.memberId] = split.memberName;
    }
  }

  // Simplify to who owes who
  const debtors = Object.entries(balances).filter(([, b]) => b < 0).sort((a, b) => a[1] - b[1]);
  const creditors = Object.entries(balances).filter(([, b]) => b > 0).sort((a, b) => b[1] - a[1]);

  const result: { from: string; fromName: string; to: string; toName: string; amount: number }[] = [];
  const d = debtors.map(([id, bal]) => ({ id, bal }));
  const c = creditors.map(([id, bal]) => ({ id, bal }));

  let di = 0; let ci = 0;
  while (di < d.length && ci < c.length) {
    const debt = Math.min(-d[di].bal, c[ci].bal);
    if (debt > 0.005) {
      result.push({ from: d[di].id, fromName: names[d[di].id], to: c[ci].id, toName: names[c[ci].id], amount: Math.round(debt * 100) / 100 });
    }
    d[di].bal += debt;
    c[ci].bal -= debt;
    if (Math.abs(d[di].bal) < 0.005) di++;
    if (Math.abs(c[ci].bal) < 0.005) ci++;
  }

  return result;
}

export function ExpenseTracker({ tripId, members }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(members[0]?.id ?? "");
  const [splitMode, setSplitMode] = useState<SplitMode>("even");
  const [selectedMembers, setSelectedMembers] = useState<string[]>(members.map(m => m.id));
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, [tripId]);

  async function load() {
    setLoading(true);
    setExpenses(await getExpenses(tripId));
    setLoading(false);
  }

  function resetForm() {
    setTitle(""); setAmount(""); setPaidBy(members[0]?.id ?? "");
    setSplitMode("even"); setSelectedMembers(members.map(m => m.id));
    setCustomAmounts({}); setSaving(false);
  }

  function toggleMember(id: string) {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  }

  function getSplits(): { memberId: string; memberName: string; amount: number }[] {
    const total = parseFloat(amount) || 0;
    if (splitMode === "even") {
      const each = Math.round((total / members.length) * 100) / 100;
      return members.map(m => ({ memberId: m.id, memberName: m.name, amount: each }));
    }
    if (splitMode === "selected") {
      const active = members.filter(m => selectedMembers.includes(m.id));
      const each = active.length > 0 ? Math.round((total / active.length) * 100) / 100 : 0;
      return active.map(m => ({ memberId: m.id, memberName: m.name, amount: each }));
    }
    // custom
    return members.map(m => ({ memberId: m.id, memberName: m.name, amount: parseFloat(customAmounts[m.id] || "0") || 0 })).filter(s => s.amount > 0);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const paidByMember = members.find(m => m.id === paidBy);
    const splits = getSplits();
    await addExpense(tripId, {
      title,
      amount: parseFloat(amount),
      paidBy,
      paidByName: paidByMember?.name ?? "",
      splits,
    });
    await load();
    resetForm();
    setAddOpen(false);
  }

  async function handleRemove(id: string) {
    if (!confirm("Remove this expense?")) return;
    await removeExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const balances = calculateBalances(expenses);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Total spent</p>
          <p className="font-display text-2xl font-semibold text-sky-700">{formatCurrency(total)}</p>
        </div>
        <button type="button" onClick={() => setAddOpen(true)} className="btn-primary text-sm">
          + Add expense
        </button>
      </div>

      {/* Balances */}
      {balances.length > 0 && (
        <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4 space-y-2">
          <p className="text-xs font-semibold text-sky-700 mb-3">💸 Who owes who</p>
          {balances.map((b, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-white border border-sky-100 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-slate-700">{b.fromName}</span>
                <span className="text-slate-400">owes</span>
                <span className="font-medium text-slate-700">{b.toName}</span>
              </div>
              <span className="font-semibold text-emerald-600">{formatCurrency(b.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {balances.length === 0 && expenses.length > 0 && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-center">
          <p className="text-sm font-medium text-emerald-700">🎉 Everyone is settled up!</p>
        </div>
      )}

      {/* Expense list */}
      {loading ? (
        <p className="text-slate-500 text-center py-8">Loading...</p>
      ) : expenses.length === 0 ? (
        <div className="card border-dashed border-sky-200 p-8 text-center space-y-2">
          <p className="text-2xl">💸</p>
          <p className="text-slate-600 font-medium">No expenses yet</p>
          <p className="text-sm text-slate-400">Add your first expense to start tracking who owes what.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500">All expenses</p>
          {expenses.map((expense) => (
            <div key={expense.id} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <p className="font-medium text-slate-800">{expense.title}</p>
                  <p className="text-xs text-slate-500">{expense.paidByName} paid {formatCurrency(expense.amount)}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {expense.splits.map((s) => (
                      <span key={s.memberId} className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs">
                        {s.memberName}: {formatCurrency(s.amount)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-semibold text-slate-700">{formatCurrency(expense.amount)}</span>
                  <button type="button" onClick={() => handleRemove(expense.id)} className="text-xs text-red-300 hover:text-red-500 transition">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add expense modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setAddOpen(false); resetForm(); }} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-sky-700">Add expense</h3>
              <button type="button" onClick={() => { setAddOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">What for?</label>
                <input type="text" className="input" placeholder="e.g. Dinner, Airbnb, Gas" value={title} onChange={e => setTitle(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                <input type="number" className="input" placeholder="0.00" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Paid by</label>
                <select className="input" value={paidBy} onChange={e => setPaidBy(e.target.value)}>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Split</label>
                <div className="flex gap-2 mb-3">
                  {([["even", "Evenly"], ["selected", "Select people"], ["custom", "Custom"]] as [SplitMode, string][]).map(([mode, label]) => (
                    <button key={mode} type="button" onClick={() => setSplitMode(mode)} className={"rounded-xl border-2 px-3 py-1.5 text-xs font-medium transition " + (splitMode === mode ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-600 hover:border-sky-200")}>
                      {label}
                    </button>
                  ))}
                </div>

                {splitMode === "selected" && (
                  <div className="flex flex-wrap gap-2">
                    {members.map(m => (
                      <button key={m.id} type="button" onClick={() => toggleMember(m.id)} className={"rounded-full px-3 py-1 text-xs font-medium border-2 transition " + (selectedMembers.includes(m.id) ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500 hover:border-sky-200")}>
                        {selectedMembers.includes(m.id) ? "✓ " : ""}{m.name}
                      </button>
                    ))}
                  </div>
                )}

                {splitMode === "custom" && (
                  <div className="space-y-2">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center gap-3">
                        <span className="text-sm text-slate-700 flex-1">{m.name}</span>
                        <input
                          type="number"
                          className="input w-28 text-sm"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={customAmounts[m.id] ?? ""}
                          onChange={e => setCustomAmounts(prev => ({ ...prev, [m.id]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-slate-400">
                      Total split: {formatCurrency(Object.values(customAmounts).reduce((s, v) => s + (parseFloat(v) || 0), 0))}
                      {" / "}{formatCurrency(parseFloat(amount) || 0)}
                    </p>
                  </div>
                )}

                {splitMode === "even" && amount && (
                  <p className="text-xs text-slate-400">
                    {formatCurrency(Math.round((parseFloat(amount) / members.length) * 100) / 100)} per person ({members.length} people)
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" className="btn-primary text-sm" disabled={saving}>{saving ? "Adding..." : "Add expense"}</button>
                <button type="button" onClick={() => { setAddOpen(false); resetForm(); }} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}