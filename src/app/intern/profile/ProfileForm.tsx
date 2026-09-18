"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export default function ProfileForm({ profile }: { profile: { name: string; email: string; phone: string | null; skills: string | null } }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: profile.name, phone: profile.phone || "", skills: profile.skills || "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/intern/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error || "Failed to save" });
    setMsg({ ok: true, text: "Profile updated" });
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card space-y-4">
      <h2 className="font-semibold text-white">Edit profile</h2>
      <div>
        <label className="label">Name</label>
        <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="label">Email</label>
        <input className="input opacity-60" value={profile.email} disabled />
      </div>
      <div>
        <label className="label">Phone</label>
        <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div>
        <label className="label">Skills</label>
        <input className="input" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="React, Python, SQL" />
      </div>
      {msg && <p className={`text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</p>}
      <button className="btn-primary" disabled={busy}>
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
