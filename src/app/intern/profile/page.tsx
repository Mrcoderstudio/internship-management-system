import { PageHeader, ProgressBar, formatDate } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getInternSummary } from "@/lib/queries";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function InternProfilePage() {
  const user = (await getCurrentUser())!;
  const summary = await getInternSummary(user.id);
  const skills = (user.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <PageHeader title="Profile" subtitle="Your details and performance summary." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-accent to-navy-600 text-2xl font-black text-navy-950 shadow-[0_0_30px_rgba(0,194,255,0.35)]">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              <p className="text-slate-300">{user.email}</p>
              <p className="text-sm text-slate-400">{user.phone || "No phone added"}</p>
              <p className="mt-1 text-xs text-slate-500">Member since {formatDate(user.createdAt)}</p>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3 font-semibold text-white">Skills</h3>
            {skills.length === 0 ? (
              <p className="text-sm text-slate-400">No skills listed yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="rounded-full border border-cyan-accent/30 bg-cyan-accent/10 px-3 py-1 text-xs font-semibold text-cyan-soft">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="mb-4 font-semibold text-white">Performance</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Tasks assigned", summary.assigned, "text-white"],
                ["Completed", summary.completed, "text-emerald-300"],
                ["In review", summary.submitted, "text-cyan-soft"],
                ["Total score", summary.score, "text-violet-300"],
              ].map(([l, v, c]) => (
                <div key={l as string} className="rounded-lg border border-white/10 bg-navy-950/60 p-3">
                  <p className="text-xs uppercase text-slate-400">{l}</p>
                  <p className={`text-2xl font-bold ${c}`}>{v}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>Completion</span>
                <span className="text-cyan-soft">{summary.progress}%</span>
              </div>
              <ProgressBar value={summary.progress} />
            </div>
          </div>
        </div>

        <ProfileForm profile={{ name: user.name, email: user.email, phone: user.phone, skills: user.skills }} />
      </div>
    </>
  );
}
