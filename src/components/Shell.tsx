"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

type NavItem = { href: string; label: string; icon: string };

const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/interns", label: "Interns", icon: "👥" },
  { href: "/admin/tasks", label: "Tasks", icon: "🗂️" },
  { href: "/admin/submissions", label: "Submissions", icon: "📥" },
  { href: "/admin/announcements", label: "Announcements", icon: "📣" },
];

const internNav: NavItem[] = [
  { href: "/intern/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/intern/tasks", label: "My Tasks", icon: "✅" },
  { href: "/intern/profile", label: "Profile", icon: "👤" },
];

export default function Shell({
  role,
  userName,
  children,
}: {
  role: "admin" | "intern";
  userName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const nav = role === "admin" ? adminNav : internNav;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-accent text-lg font-black text-navy-950 shadow-[0_0_20px_rgba(0,194,255,0.5)]">
          IH
        </div>
        <div>
          <p className="text-base font-bold text-white">InternHub</p>
          <p className="text-[11px] uppercase tracking-widest text-cyan-soft">{role} panel</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-cyan-accent/15 text-cyan-soft ring-1 ring-cyan-accent/40"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-4">
        <p className="truncate text-sm font-semibold text-white">{userName}</p>
        <p className="text-xs capitalize text-slate-400">{role}</p>
        <button onClick={logout} className="btn-ghost mt-3 w-full">
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-navy-900/70 backdrop-blur lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-white/10 bg-navy-900 shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-navy-950/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-white/10 p-2 text-slate-200"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-white">InternHub</span>
          <span className="w-9" />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
