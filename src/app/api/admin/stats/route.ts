import { handleError, ok, requireApiUser } from "@/lib/api";
import { getAdminStats, getInternProgress } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser("admin");
    const [stats, progress] = await Promise.all([getAdminStats(), getInternProgress()]);
    return ok({ stats, progress });
  } catch (err) {
    return handleError(err);
  }
}
