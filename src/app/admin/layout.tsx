import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import Shell from "@/components/Shell";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/intern/dashboard");
  return (
    <Shell role="admin" userName={user.name}>
      {children}
    </Shell>
  );
}
