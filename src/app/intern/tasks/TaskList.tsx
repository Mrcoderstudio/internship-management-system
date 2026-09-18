"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { StatusBadge, deadlineInfo, formatDate } from "@/components/ui";

export type InternTask = {
  id: number;
  status: string;
  submittedAt: Date | null;
  githubLink: string | null;
  liveLink: string | null;
  notes: string | null;
  feedback: string | null;
  score: number;
  taskId: number;
  title: string;
  description: string;
  requirements: string | null;
  deadline: Date | null;
  coins: number;
  assignedAt: Date;
};

const filters = ["all", "pending", "submitted", "approved", "rejected"] as const;

export default function TaskList({ tasks }: { tasks: InternTask[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [openId, setOpenId] = useState<number | null>(null);
  const [form, setForm] = useState({ githubLink: "", liveLink: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = tasks.filter((t) => filter === "all" || t.status === filter);

  function startSubmit(t: InternTask) {
    setOpenId(t.id);
    setForm({ githubLink: t.githubLink || "", liveLink: t.liveLink || "", notes: t.notes || "" });
    setError(null);
  }

  async function submit(e: FormEvent, id: number) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/intern/tasks/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Submission failed");
    setOpenId(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
              filter === f ? "bg-cyan-accent text-navy-950" : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            {f} ({f === "all" ? tasks.length : tasks.filter((t) => t.status === f).length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card py-12 text-center text-slate-400">No tasks in this view.</div>
      ) : (
        <div className="space-y-4">
          {list.map((t) => {
            const dl = deadlineInfo(t.deadline);
            const canSubmit = t.status === "pending" || t.status === "rejected" || t.status === "submitted";
            const isOpen = openId === t.id;
            return (
              <div key={t.id} className={`card ${t.status === "rejected" ? "border-red-500/30" : t.status === "approved" ? "border-emerald-500/30" : ""}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{t.title}</h3>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      <span className={dl.tone}>{dl.label}</span>
                      {t.deadline && <span> · Deadline {formatDate(t.deadline, true)}</span>} · Assigned {formatDate(t.assignedAt)}
                    </p>
                  </div>
                  <span className="shrink-0 self-start rounded-full bg-cyan-accent/15 px-3 py-1 text-xs font-bold text-cyan-soft">
                    {t.status === "approved" ? `+${t.score} earned` : `${t.coins} coins`}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Description</p>
                    <p className="whitespace-pre-line text-sm text-slate-200">{t.description}</p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Requirements</p>
                    <p className="whitespace-pre-line text-sm text-slate-200">{t.requirements || "—"}</p>
                  </div>
                </div>

                {(t.githubLink || t.liveLink || t.notes) && (
                  <div className="mt-4 rounded-lg border border-white/10 bg-navy-950/60 p-3 text-sm">
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-400">
                      Your submission · {formatDate(t.submittedAt, true)}
                    </p>
                    {t.githubLink && (
                      <p>
                        <span className="text-slate-400">GitHub: </span>
                        <a href={t.githubLink} target="_blank" rel="noreferrer" className="break-all text-cyan-soft hover:underline">
                          {t.githubLink}
                        </a>
                      </p>
                    )}
                    {t.liveLink && (
                      <p>
                        <span className="text-slate-400">Live: </span>
                        <a href={t.liveLink} target="_blank" rel="noreferrer" className="break-all text-cyan-soft hover:underline">
                          {t.liveLink}
                        </a>
                      </p>
                    )}
                    {t.notes && <p className="mt-1 whitespace-pre-line text-slate-300">{t.notes}</p>}
                  </div>
                )}

                {t.feedback && (
                  <div
                    className={`mt-3 rounded-lg border p-3 text-sm ${
                      t.status === "approved" ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
                    }`}
                  >
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Admin feedback</p>
                    <p className="whitespace-pre-line text-slate-100">{t.feedback}</p>
                  </div>
                )}

                {canSubmit && !isOpen && (
                  <div className="mt-4">
                    <button className={t.status === "submitted" ? "btn-ghost" : "btn-primary"} onClick={() => startSubmit(t)}>
                      {t.status === "rejected" ? "Resubmit work" : t.status === "submitted" ? "Edit submission" : "Submit work"}
                    </button>
                  </div>
                )}

                {isOpen && (
                  <form onSubmit={(e) => submit(e, t.id)} className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-cyan-accent/30 bg-navy-950/60 p-4 md:grid-cols-2">
                    <div>
                      <label className="label">GitHub link *</label>
                      <input className="input" type="url" required placeholder="https://github.com/you/repo" value={form.githubLink} onChange={(e) => setForm({ ...form, githubLink: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Live project link</label>
                      <input className="input" type="url" placeholder="https://your-app.vercel.app" value={form.liveLink} onChange={(e) => setForm({ ...form, liveLink: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Notes / comments</label>
                      <textarea className="input min-h-[80px]" placeholder="What did you build? Anything the reviewer should know?" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    {error && <p className="text-sm text-red-300 md:col-span-2">{error}</p>}
                    <div className="flex gap-2 md:col-span-2">
                      <button className="btn-primary" disabled={busy}>
                        {busy ? "Submitting…" : "Submit"}
                      </button>
                      <button type="button" className="btn-ghost" onClick={() => setOpenId(null)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
