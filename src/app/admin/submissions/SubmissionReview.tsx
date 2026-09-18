"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusBadge, formatDate } from "@/components/ui";

export type SubmissionRow = {
  id: number;
  status: string;
  submittedAt: Date | null;
  githubLink: string | null;
  liveLink: string | null;
  notes: string | null;
  feedback: string | null;
  score: number;
  taskId: number;
  taskTitle: string;
  taskCoins: number;
  deadline: Date | null;
  internId: number;
  internName: string;
  internEmail: string;
};

const filters = ["all", "submitted", "approved", "rejected", "pending"] as const;

export default function SubmissionReview({ submissions }: { submissions: SubmissionRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [active, setActive] = useState<SubmissionRow | null>(null);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = submissions.filter((s) => filter === "all" || s.status === filter);
  const counts = Object.fromEntries(filters.map((f) => [f, f === "all" ? submissions.length : submissions.filter((s) => s.status === f).length]));

  function open(s: SubmissionRow) {
    setActive(s);
    setFeedback(s.feedback || "");
    setScore(String(s.score || s.taskCoins));
    setError(null);
  }

  async function review(action: "approve" | "reject" | "reopen") {
    if (!active) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/submissions/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, feedback, score: action === "approve" ? Number(score) : undefined }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Failed to update");
    setActive(null);
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
            {f} <span className="opacity-70">({counts[f]})</span>
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Intern</th>
              <th>Task</th>
              <th>Links</th>
              <th>Notes</th>
              <th>Submitted</th>
              <th>Status</th>
              <th className="text-right">Review</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No submissions in this view.
                </td>
              </tr>
            )}
            {list.map((s) => (
              <tr key={s.id}>
                <td>
                  <p className="font-medium text-white">{s.internName}</p>
                  <p className="text-xs text-slate-400">{s.internEmail}</p>
                </td>
                <td>
                  <p className="text-white">{s.taskTitle}</p>
                  <p className="text-xs text-slate-400">{s.taskCoins} coins</p>
                </td>
                <td className="space-y-1 text-xs">
                  {s.githubLink ? (
                    <a href={s.githubLink} target="_blank" rel="noreferrer" className="block truncate text-cyan-soft hover:underline">
                      GitHub ↗
                    </a>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                  {s.liveLink && (
                    <a href={s.liveLink} target="_blank" rel="noreferrer" className="block truncate text-cyan-soft hover:underline">
                      Live ↗
                    </a>
                  )}
                </td>
                <td className="max-w-[220px] truncate text-slate-300" title={s.notes || ""}>
                  {s.notes || <span className="text-slate-500">—</span>}
                </td>
                <td className="text-slate-400">{formatDate(s.submittedAt, true)}</td>
                <td>
                  <StatusBadge status={s.status} />
                  {s.status === "approved" && <p className="mt-1 text-xs text-cyan-soft">{s.score} pts</p>}
                </td>
                <td className="text-right">
                  <button className="btn-ghost px-3 py-1" onClick={() => open(s)} disabled={s.status === "pending"}>
                    {s.status === "submitted" ? "Review" : "Details"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={() => setActive(null)}>
          <div className="card max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-b-none sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{active.taskTitle}</h3>
                <p className="text-sm text-slate-400">
                  by <span className="text-white">{active.internName}</span> · submitted {formatDate(active.submittedAt, true)}
                </p>
              </div>
              <StatusBadge status={active.status} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-navy-950/60 p-3">
                <p className="text-xs uppercase text-slate-400">GitHub</p>
                {active.githubLink ? (
                  <a href={active.githubLink} target="_blank" rel="noreferrer" className="break-all text-sm text-cyan-soft hover:underline">
                    {active.githubLink}
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">Not provided</p>
                )}
              </div>
              <div className="rounded-lg border border-white/10 bg-navy-950/60 p-3">
                <p className="text-xs uppercase text-slate-400">Live project</p>
                {active.liveLink ? (
                  <a href={active.liveLink} target="_blank" rel="noreferrer" className="break-all text-sm text-cyan-soft hover:underline">
                    {active.liveLink}
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">Not provided</p>
                )}
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-white/10 bg-navy-950/60 p-3">
              <p className="text-xs uppercase text-slate-400">Intern notes</p>
              <p className="whitespace-pre-line text-sm text-slate-200">{active.notes || "—"}</p>
            </div>

            <div className="mt-4">
              <label className="label">Feedback to intern</label>
              <textarea className="input min-h-[90px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Great work! Consider adding tests…" />
            </div>
            <div className="mt-3 max-w-[200px]">
              <label className="label">Score (default {active.taskCoins} coins)</label>
              <input className="input" type="number" min={0} value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-success" disabled={busy} onClick={() => review("approve")}>
                ✓ Approve &amp; mark completed
              </button>
              <button className="btn-danger" disabled={busy} onClick={() => review("reject")}>
                ✕ Reject
              </button>
              {active.status !== "submitted" && (
                <button className="btn-ghost" disabled={busy} onClick={() => review("reopen")}>
                  Reopen as pending
                </button>
              )}
              <button className="btn-ghost ml-auto" onClick={() => setActive(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
