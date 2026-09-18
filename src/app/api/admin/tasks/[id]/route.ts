import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { ApiError, handleError, ok, readJson, requireApiUser } from "@/lib/api";
import { parseTaskInput, type TaskInput } from "@/lib/tasks";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: Ctx) {
  try {
    await requireApiUser("admin");
    const id = Number((await ctx.params).id);
    const body = await readJson<TaskInput>(req);
    const data = parseTaskInput(body);
    const [task] = await db.update(tasks).set(data).where(eq(tasks.id, id)).returning();
    if (!task) throw new ApiError(404, "Task not found");
    return ok({ task });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    await requireApiUser("admin");
    const id = Number((await ctx.params).id);
    const deleted = await db.delete(tasks).where(eq(tasks.id, id)).returning({ id: tasks.id });
    if (deleted.length === 0) throw new ApiError(404, "Task not found");
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
