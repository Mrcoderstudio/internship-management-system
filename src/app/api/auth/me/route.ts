import { getCurrentUser } from "@/lib/auth";
import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return ok({ user: null }, 401);
  return ok({ user });
}
