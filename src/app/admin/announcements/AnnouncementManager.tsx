"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { formatDate } from "@/components/ui";
import type { Announcement } from "@/db/schema";

export default function AnnouncementManager({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Failed to send");
    setMessage("");
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("Delete this announcement?")) return;
    const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <form onSubmit={send} className="card h-fit lg:col-span-1">
        <h2 className="mb-3 font-semibold text-white">New announcement</h2>
        <textarea
          className="input min-h-[140px]"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Reminder: weekly sync on Friday at 4pm…"
        />
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
        <button className="btn-primary mt-3 w-full" disabled={busy}>
          {busy ? "Sending…" : "📣 Send to all interns"}
        </button>
      </form>

      <div className="space-y-3 lg:col-span-2">
        {announcements.length === 0 ? (
          <div className="card py-10 text-center text-slate-400">No announcements yet.</div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className="card flex items-start justify-between gap-4">
              <div>
                <p className="whitespace-pre-line text-sm text-slate-100">{a.message}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDate(a.createdAt, true)}</p>
              </div>
              <button className="btn-danger px-3 py-1" onClick={() => remove(a.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
