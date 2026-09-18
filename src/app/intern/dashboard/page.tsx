import Link from "next/link";
import { PageHeader, ProgressBar, StatCard, StatusBadge, deadlineInfo, formatDate } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getAnnouncements, getInternSummary, getInternTasks } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function InternDashboard() {
  const user = (await getCurrentUser())!;
  const [summary, tasks, announcements] = await Promise.all([
    getInternSummary(user.id),
    getInternTasks(user.id),
    getAnnouncements(5),
  ]);
  const upcoming = tasks.filter((t) => t.status !== "approved").slice(0, 5);

  return (
    <>
      <PageHeader title={`Hi, ${user.name.split(" ")[0]} 👋`} subtitle="Here's what's on your plate." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned tasks" value={summary.assigned} accent="cyan" />
        <StatCard label="In progress" value={summary.pending + summary.rejected} accent="amber" hint={`${summary.submitted} awaiting review`} />
        <StatCard label="Completed" value={summary.completed} accent="emerald" />
        <StatCard label="Score" value={summary.score} accent="violet" hint="Total coins earned" />
      </div>

      <div className="card mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-white">Overall progress</h2>
          <span className="text-sm font-bold text-cyan-soft">{summary.progress}%</span>
        </div>
        <ProgressBar value={summary.progress} />
        <p className="mt-2 text-xs text-slate-400">
          {summary.completed} of {summary.assigned} tasks approved
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Upcoming deadlines</h2>
            <Link href="/intern/tasks" className="text-sm text-cyan-soft hover:underline">
              All tasks →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-400">
              {tasks.length === 0 ? "No tasks assigned yet. Check back soon!" : "All caught up — nice work! 🎉"}
            </p>
          ) : (
            <ul className="divide-y divide-white/5">
              {upcoming.map((t) => {
                const dl = deadlineInfo(t.deadline);
                return (
                  <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{t.title}</p>
                      <p className="text-xs text-slate-400">
                        <span className={dl.tone}>{dl.label}</span> · {formatDate(t.deadline, true)} · {t.coins} coins
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold text-white">📣 Announcements</h2>
          {announcements.length === 0 ? (
            <p className="text-sm text-slate-400">No announcements yet.</p>
          ) : (
            <ul className="space-y-3">
              {announcements.map((a) => (
                <li key={a.id} className="rounded-lg border border-cyan-accent/20 bg-cyan-accent/5 p-3">
                  <p className="whitespace-pre-line text-sm text-slate-100">{a.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(a.createdAt, true)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
