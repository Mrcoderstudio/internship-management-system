import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, handleError, ok, requireApiUser } from "@/lib/api";
import { getInternTasks, getInternSummary } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    await requireApiUser("admin");
    const id = Number((await ctx.params).id);
    const [intern] = await db
      .select({ id: users.id, name: users.name, email: users.email, phone: users.phone, skills: users.skills, createdAt: users.createdAt })
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, "intern")))
      .limit(1);
    if (!intern) throw new ApiError(404, "Intern not found");
    const [summary, assignments] = await Promise.all([getInternSummary(id), getInternTasks(id)]);
    return ok({ intern, summary, assignments });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireApiUser("admin");
    const id = Number((await ctx.params).id);
    const deleted = await db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.role, "intern")))
      .returning({ id: users.id });
    if (deleted.length === 0) throw new ApiError(404, "Intern not found");
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
