import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { taskAssignments, tasks } from "@/db/schema";
import { ApiError, handleError, ok, readJson, requireApiUser } from "@/lib/api";
import { assignInterns } from "@/lib/tasks";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Assign task to one or multiple interns. Body: { internIds: number[] } */
export async function POST(req: Request, ctx: Ctx) {
  try {
    await requireApiUser("admin");
    const id = Number((await ctx.params).id);
    const [task] = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, id)).limit(1);
    if (!task) throw new ApiError(404, "Task not found");
    const body = await readJson<{ internIds?: number[] }>(req);
    if (!Array.isArray(body.internIds) || body.internIds.length === 0) {
      throw new ApiError(400, "Select at least one intern");
    }
    const assigned = await assignInterns(id, body.internIds);
    return ok({ assigned });
  } catch (err) {
    return handleError(err);
  }
}

/** Unassign an intern from a task. Body: { internId: number } */
export async function DELETE(req: Request, ctx: Ctx) {
  try {
    await requireApiUser("admin");
    const id = Number((await ctx.params).id);
    const body = await readJson<{ internId?: number }>(req);
    const internId = Number(body.internId);
    if (!internId) throw new ApiError(400, "internId is required");
    await db
      .delete(taskAssignments)
      .where(and(eq(taskAssignments.taskId, id), eq(taskAssignments.internId, internId)));
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
