import { eq } from "drizzle-orm";
import { db } from "@/db";
import { taskAssignments } from "@/db/schema";
import { ApiError, handleError, ok, readJson, requireApiUser } from "@/lib/api";
import { getAssignmentForIntern } from "@/lib/queries";

export const dynamic = "force-dynamic";

function validUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Intern submits (or resubmits) work for an assignment. [id] is the assignment id. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser("intern");
    const id = Number((await ctx.params).id);
    const assignment = await getAssignmentForIntern(id, user.id);
    if (!assignment) throw new ApiError(404, "Assignment not found");
    if (assignment.status === "approved") throw new ApiError(400, "This task is already approved");

    const body = await readJson<{ githubLink?: string; liveLink?: string; notes?: string }>(req);
    const githubLink = (body.githubLink || "").trim();
    const liveLink = (body.liveLink || "").trim();
    if (!githubLink) throw new ApiError(400, "GitHub link is required");
    if (!validUrl(githubLink)) throw new ApiError(400, "GitHub link must be a valid URL");
    if (liveLink && !validUrl(liveLink)) throw new ApiError(400, "Live link must be a valid URL");

    const [updated] = await db
      .update(taskAssignments)
      .set({
        githubLink,
        liveLink: liveLink || null,
        notes: body.notes?.trim() || null,
        status: "submitted",
        submittedAt: new Date(),
        feedback: null,
        score: 0,
      })
      .where(eq(taskAssignments.id, id))
      .returning();
    return ok({ assignment: updated });
  } catch (err) {
    return handleError(err);
  }
}
