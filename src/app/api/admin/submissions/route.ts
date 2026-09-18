import { handleError, ok, requireApiUser } from "@/lib/api";
import { getSubmissions } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser("admin");
    return ok({ submissions: await getSubmissions() });
  } catch (err) {
    return handleError(err);
  }
}
