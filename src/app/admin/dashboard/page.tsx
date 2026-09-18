import Link from "next/link";
import { PageHeader, ProgressBar, StatCard, StatusBadge, formatDate } from "@/components/ui";
import { getAdminStats, getAnnouncements, getInternProgress, getSubmissions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, progress, submissions, announcements] = await Promise.all([
    getAdminStats(),
    getInternProgress(),
    getSubmissions(),
    getAnnouncements(3),
  ]);
  const recent = submissions.filter((s) => s.status === "submitted").slice(0, 6);
  const top = [...progress].sort((a, b) => b.score - a.score).slice(0, 5);

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Overview of your internship program." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total interns" value={stats.totalInterns} accent="cyan" hint="Registered intern accounts" />
        <StatCard label="Active tasks" value={stats.activeTasks} accent="violet" hint={`${stats.totalTasks} tasks created`} />
        <StatCard label="Pending submissions" value={stats.pendingSubmissions} accent="amber" hint="Awaiting review" />
        <StatCard label="Completed tasks" value={stats.completedTasks} accent="emerald" hint="Approved assignments" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Submissions awaiting review</h2>
            <Link href="/admin/submissions" className="text-sm text-cyan-soft hover:underline">
              View all →
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400">No submissions waiting. 🎉</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Intern</th>
                    <th>Task</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => (
                    <tr key={s.id}>
                      <td className="font-medium text-white">{s.internName}</td>
                      <td>{s.taskTitle}</td>
                      <td className="text-slate-400">{formatDate(s.submittedAt, true)}</td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-4 font-semibold text-white">Top interns</h2>
            {top.length === 0 ? (
              <p className="text-sm text-slate-400">No interns yet.</p>
            ) : (
              <ul className="space-y-3">
                {top.map((i, idx) => {
                  const pct = i.assigned ? Math.round((i.completed / i.assigned) * 100) : 0;
                  return (
                    <li key={i.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-white">
                          <span className="mr-2 text-slate-500">#{idx + 1}</span>
                          {i.name}
                        </span>
                        <span className="font-semibold text-cyan-soft">{i.score} pts</span>
                      </div>
                      <ProgressBar value={pct} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-white">Latest announcements</h2>
              <Link href="/admin/announcements" className="text-sm text-cyan-soft hover:underline">
                Manage →
              </Link>
            </div>
            {announcements.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing announced yet.</p>
            ) : (
              <ul className="space-y-3">
                {announcements.map((a) => (
                  <li key={a.id} className="rounded-lg border border-white/5 bg-navy-950/50 p-3">
                    <p className="text-sm text-slate-200">{a.message}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(a.createdAt, true)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
