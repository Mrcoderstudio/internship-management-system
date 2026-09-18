import { eq } from "drizzle-orm";
import { db } from "@/db";
import { taskAssignments, tasks } from "@/db/schema";
import { ApiError, handleError, ok, readJson, requireApiUser } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Review a submission.
 * Body: { action: "approve" | "reject" | "reopen", feedback?: string, score?: number }
 * - approve → status=approved (marks completed), score defaults to task coins
 * - reject  → status=rejected, score=0, intern can resubmit
 * - reopen  → status=pending (clear review)
 */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireApiUser("admin");
    const id = Number((await ctx.params).id);
    const body = await readJson<{ action?: string; feedback?: string; score?: number | string }>(req);

    const [row] = await db
      .select({ id: taskAssignments.id, coins: tasks.coins })
      .from(taskAssignments)
      .innerJoin(tasks, eq(tasks.id, taskAssignments.taskId))
      .where(eq(taskAssignments.id, id))
      .limit(1);
    if (!row) throw new ApiError(404, "Submission not found");

    const feedback = body.feedback?.trim() || null;
    let update: Partial<typeof taskAssignments.$inferInsert>;

    switch (body.action) {
      case "approve": {
        const score = body.score === undefined || body.score === "" ? row.coins : Number(body.score);
        if (!Number.isFinite(score) || score < 0) throw new ApiError(400, "Invalid score");
        update = { status: "approved", feedback, score: Math.round(score) };
        break;
      }
      case "reject":
        update = { status: "rejected", feedback, score: 0 };
        break;
      case "reopen":
        update = { status: "pending", feedback, score: 0 };
        break;
      default:
        throw new ApiError(400, "action must be approve, reject or reopen");
    }

    const [updated] = await db.update(taskAssignments).set(update).where(eq(taskAssignments.id, id)).returning();
    return ok({ assignment: updated });
  } catch (err) {
    return handleError(err);
  }
}
