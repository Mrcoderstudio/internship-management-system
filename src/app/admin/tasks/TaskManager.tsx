"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { StatusBadge, deadlineInfo, formatDate } from "@/components/ui";

type Assignment = { id: number; taskId: number; internId: number; status: string; internName: string };
export type TaskRow = {
  id: number;
  title: string;
  description: string;
  requirements: string | null;
  deadline: Date | null;
  coins: number;
  createdAt: Date;
  assignments: Assignment[];
};
type InternOpt = { id: number; name: string; email: string };

const emptyForm = { title: "", description: "", requirements: "", deadline: "", coins: "10" };

function toInputDate(d: Date | null) {
  if (!d) return "";
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function TaskManager({ tasks, interns }: { tasks: TaskRow[]; interns: InternOpt[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [assignFor, setAssignFor] = useState<TaskRow | null>(null);
  const [assignSel, setAssignSel] = useState<number[]>([]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setSelected([]);
    setError(null);
    setShowForm(true);
  }

  function startEdit(t: TaskRow) {
    setEditingId(t.id);
    setForm({
      title: t.title,
      description: t.description,
      requirements: t.requirements || "",
      deadline: toInputDate(t.deadline),
      coins: String(t.coins),
    });
    setError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      ...form,
      coins: Number(form.coins),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      internIds: editingId ? undefined : selected,
    };
    const res = await fetch(editingId ? `/api/admin/tasks/${editingId}` : "/api/admin/tasks", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Failed to save task");
    setShowForm(false);
    setForm(emptyForm);
    setSelected([]);
    setEditingId(null);
    router.refresh();
  }

  async function remove(t: TaskRow) {
    if (!confirm(`Delete "${t.title}"? All assignments and submissions for it will be removed.`)) return;
    const res = await fetch(`/api/admin/tasks/${t.id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    else alert("Failed to delete task");
  }

  async function submitAssign(e: FormEvent) {
    e.preventDefault();
    if (!assignFor) return;
    setBusy(true);
    const res = await fetch(`/api/admin/tasks/${assignFor.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internIds: assignSel }),
    });
    setBusy(false);
    if (res.ok) {
      setAssignFor(null);
      setAssignSel([]);
      router.refresh();
    } else {
      const d = await res.json();
      alert(d.error || "Failed to assign");
    }
  }

  async function unassign(taskId: number, internId: number, name: string) {
    if (!confirm(`Unassign ${name} from this task?`)) return;
    const res = await fetch(`/api/admin/tasks/${taskId}/assign`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internId }),
    });
    if (res.ok) router.refresh();
  }

  function toggle(list: number[], id: number, set: (v: number[]) => void) {
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  const InternPicker = ({ value, onChange, exclude = [] }: { value: number[]; onChange: (v: number[]) => void; exclude?: number[] }) => {
    const options = interns.filter((i) => !exclude.includes(i.id));
    if (options.length === 0) return <p className="text-sm text-slate-400">No interns available.</p>;
    return (
      <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-navy-950/60 p-2">
        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs font-semibold uppercase text-slate-400 hover:bg-white/5">
          <input
            type="checkbox"
            checked={value.length === options.length}
            onChange={(e) => onChange(e.target.checked ? options.map((o) => o.id) : [])}
            className="accent-cyan-accent"
          />
          Select all
        </label>
        {options.map((i) => (
          <label key={i.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-white/5">
            <input type="checkbox" checked={value.includes(i.id)} onChange={() => toggle(value, i.id, onChange)} className="accent-cyan-accent" />
            <span className="text-white">{i.name}</span>
            <span className="text-xs text-slate-500">{i.email}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button className="btn-primary" onClick={() => (showForm ? setShowForm(false) : startCreate())}>
          {showForm ? "Close" : "+ Create task"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={save} className="card mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <h3 className="font-semibold text-white md:col-span-2">{editingId ? "Edit task" : "New task"}</h3>
          <div className="md:col-span-2">
            <label className="label">Title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <textarea className="input min-h-[90px]" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Requirements</label>
            <textarea className="input min-h-[70px]" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="One per line…" />
          </div>
          <div>
            <label className="label">Deadline</label>
            <input className="input" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div>
            <label className="label">Coins / points</label>
            <input className="input" type="number" min={0} required value={form.coins} onChange={(e) => setForm({ ...form, coins: e.target.value })} />
          </div>
          {!editingId && (
            <div className="md:col-span-2">
              <label className="label">Assign to interns (optional)</label>
              <InternPicker value={selected} onChange={setSelected} />
            </div>
          )}
          {error && <p className="text-sm text-red-300 md:col-span-2">{error}</p>}
          <div className="flex gap-2 md:col-span-2">
            <button className="btn-primary" disabled={busy}>
              {busy ? "Saving…" : editingId ? "Save changes" : "Create task"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {tasks.length === 0 ? (
        <div className="card py-12 text-center text-slate-400">No tasks yet. Create your first task above.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {tasks.map((t) => {
            const dl = deadlineInfo(t.deadline);
            const approved = t.assignments.filter((a) => a.status === "approved").length;
            return (
              <div key={t.id} className="card flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{t.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Created {formatDate(t.createdAt)} · <span className={dl.tone}>{dl.label}</span>
                      {t.deadline && <span className="text-slate-500"> ({formatDate(t.deadline, true)})</span>}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-cyan-accent/15 px-3 py-1 text-xs font-bold text-cyan-soft">{t.coins} coins</span>
                </div>
                <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-slate-300">{t.description}</p>
                {t.requirements && (
                  <div className="mt-3 rounded-lg border border-white/5 bg-navy-950/50 p-3">
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Requirements</p>
                    <p className="line-clamp-3 whitespace-pre-line text-xs text-slate-300">{t.requirements}</p>
                  </div>
                )}
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                    Assigned ({t.assignments.length}) · {approved} approved
                  </p>
                  {t.assignments.length === 0 ? (
                    <p className="text-xs text-slate-500">Not assigned to anyone yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {t.assignments.map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-navy-950/60 py-1 pl-3 pr-1 text-xs">
                          <span className="text-white">{a.internName}</span>
                          <StatusBadge status={a.status} />
                          <button
                            onClick={() => unassign(t.id, a.internId, a.internName)}
                            className="rounded-full px-1.5 text-slate-500 hover:bg-red-500/20 hover:text-red-300"
                            title="Unassign"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <button
                    className="btn-primary px-3 py-1.5"
                    onClick={() => {
                      setAssignFor(t);
                      setAssignSel([]);
                    }}
                  >
                    Assign
                  </button>
                  <button className="btn-ghost px-3 py-1.5" onClick={() => startEdit(t)}>
                    Edit
                  </button>
                  <button className="btn-danger px-3 py-1.5" onClick={() => remove(t)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {assignFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={() => setAssignFor(null)}>
          <form onSubmit={submitAssign} className="card w-full max-w-lg rounded-b-none sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white">Assign “{assignFor.title}”</h3>
            <p className="mb-4 text-sm text-slate-400">Select one or more interns.</p>
            <InternPicker value={assignSel} onChange={setAssignSel} exclude={assignFor.assignments.map((a) => a.internId)} />
            <div className="mt-4 flex gap-2">
              <button className="btn-primary" disabled={busy || assignSel.length === 0}>
                {busy ? "Assigning…" : `Assign ${assignSel.length || ""}`.trim()}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setAssignFor(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
