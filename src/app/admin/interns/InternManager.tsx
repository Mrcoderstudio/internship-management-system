"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ProgressBar, StatusBadge, formatDate } from "@/components/ui";
import type { InternProgress } from "@/lib/queries";

type Detail = {
  intern: { id: number; name: string; email: string; phone: string | null; skills: string | null };
  summary: { assigned: number; completed: number; pending: number; submitted: number; rejected: number; score: number; progress: number };
  assignments: { id: number; title: string; status: string; score: number; coins: number; deadline: string | null; feedback: string | null }[];
};

export default function InternManager({ interns }: { interns: InternProgress[] }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", skills: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [query, setQuery] = useState("");

  const filtered = interns.filter(
    (i) =>
      i.name.toLowerCase().includes(query.toLowerCase()) ||
      i.email.toLowerCase().includes(query.toLowerCase()) ||
      (i.skills || "").toLowerCase().includes(query.toLowerCase()),
  );

  async function addIntern(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/admin/interns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Failed to add intern");
    setForm({ name: "", email: "", password: "", phone: "", skills: "" });
    setShowAdd(false);
    router.refresh();
  }

  async function removeIntern(id: number, name: string) {
    if (!confirm(`Remove ${name}? All their assignments will be deleted.`)) return;
    const res = await fetch(`/api/admin/interns/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (detail?.intern.id === id) setDetail(null);
      router.refresh();
    } else alert("Failed to remove intern");
  }

  async function openDetail(id: number) {
    const res = await fetch(`/api/admin/interns/${id}`);
    if (res.ok) setDetail(await res.json());
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input className="input sm:max-w-xs" placeholder="Search by name, email, skill…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className="btn-primary" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? "Close" : "+ Add intern"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addIntern} className="card mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Temporary password</label>
            <input className="input" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Skills</label>
            <input className="input" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, SQL" />
          </div>
          {error && <p className="text-sm text-red-300 md:col-span-2">{error}</p>}
          <div className="md:col-span-2">
            <button className="btn-primary" disabled={busy}>
              {busy ? "Saving…" : "Create intern"}
            </button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Intern</th>
              <th>Skills</th>
              <th>Progress</th>
              <th>Completed</th>
              <th>Pending</th>
              <th>Score</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No interns found.
                </td>
              </tr>
            )}
            {filtered.map((i) => {
              const pct = i.assigned ? Math.round((i.completed / i.assigned) * 100) : 0;
              return (
                <tr key={i.id}>
                  <td>
                    <p className="font-medium text-white">{i.name}</p>
                    <p className="text-xs text-slate-400">{i.email}</p>
                    {i.phone && <p className="text-xs text-slate-500">{i.phone}</p>}
                  </td>
                  <td className="max-w-[200px] truncate text-slate-300">{i.skills || "—"}</td>
                  <td className="min-w-[140px]">
                    <div className="mb-1 text-xs text-slate-400">{pct}%</div>
                    <ProgressBar value={pct} />
                  </td>
                  <td className="text-emerald-300">{i.completed}</td>
                  <td className="text-amber-300">{i.pending + i.submitted + i.rejected}</td>
                  <td className="font-semibold text-cyan-soft">{i.score}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button className="btn-ghost px-3 py-1" onClick={() => openDetail(i.id)}>
                        View
                      </button>
                      <button className="btn-danger px-3 py-1" onClick={() => removeIntern(i.id, i.name)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={() => setDetail(null)}>
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-b-none sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{detail.intern.name}</h3>
                <p className="text-sm text-slate-400">{detail.intern.email}</p>
                {detail.intern.phone && <p className="text-sm text-slate-500">{detail.intern.phone}</p>}
                {detail.intern.skills && <p className="mt-1 text-sm text-cyan-soft">{detail.intern.skills}</p>}
              </div>
              <button className="btn-ghost px-3 py-1" onClick={() => setDetail(null)}>
                ✕
              </button>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Assigned", detail.summary.assigned, "text-white"],
                ["Completed", detail.summary.completed, "text-emerald-300"],
                ["Pending", detail.summary.pending + detail.summary.submitted + detail.summary.rejected, "text-amber-300"],
                ["Score", detail.summary.score, "text-cyan-soft"],
              ].map(([l, v, c]) => (
                <div key={l as string} className="rounded-lg border border-white/10 bg-navy-950/60 p-3">
                  <p className="text-xs uppercase text-slate-400">{l}</p>
                  <p className={`text-xl font-bold ${c}`}>{v}</p>
                </div>
              ))}
            </div>
            <ProgressBar value={detail.summary.progress} />
            <p className="mt-1 text-xs text-slate-400">{detail.summary.progress}% complete</p>
            <h4 className="mb-2 mt-5 font-semibold text-white">Assignments</h4>
            {detail.assignments.length === 0 ? (
              <p className="text-sm text-slate-400">No tasks assigned yet.</p>
            ) : (
              <ul className="space-y-2">
                {detail.assignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-navy-950/50 p-3 text-sm">
                    <div>
                      <p className="font-medium text-white">{a.title}</p>
                      <p className="text-xs text-slate-400">
                        Deadline {formatDate(a.deadline)} · {a.coins} coins
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={a.status} />
                      {a.status === "approved" && <p className="mt-1 text-xs text-cyan-soft">+{a.score} pts</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
