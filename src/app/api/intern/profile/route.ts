import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, handleError, ok, readJson, requireApiUser } from "@/lib/api";
import { getInternSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireApiUser("intern");
    const summary = await getInternSummary(user.id);
    return ok({ profile: user, summary });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireApiUser("intern");
    const body = await readJson<{ name?: string; phone?: string; skills?: string }>(req);
    const name = (body.name || "").trim();
    if (!name) throw new ApiError(400, "Name is required");
    const [updated] = await db
      .update(users)
      .set({ name, phone: body.phone?.trim() || null, skills: body.skills?.trim() || null })
      .where(eq(users.id, user.id))
      .returning({ id: users.id, name: users.name, email: users.email, phone: users.phone, skills: users.skills });
    return ok({ profile: updated });
  } catch (err) {
    return handleError(err);
  }
}
