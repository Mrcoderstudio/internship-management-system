import type { ReactNode } from "react";

export default function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-accent text-xl font-black text-navy-950 shadow-[0_0_30px_rgba(0,194,255,0.5)]">
            IH
          </div>
          <div>
            <p className="text-xl font-bold text-white">InternHub</p>
            <p className="text-xs uppercase tracking-widest text-cyan-soft">Internship Management</p>
          </div>
        </div>
        <div className="card">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-slate-400">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
