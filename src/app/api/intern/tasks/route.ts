import { handleError, ok, requireApiUser } from "@/lib/api";
import { getInternSummary, getInternTasks } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireApiUser("intern");
    const [assignments, summary] = await Promise.all([getInternTasks(user.id), getInternSummary(user.id)]);
    return ok({ assignments, summary });
  } catch (err) {
    return handleError(err);
  }
}
