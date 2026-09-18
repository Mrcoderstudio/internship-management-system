import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { taskAssignments, users } from "@/db/schema";
import { ApiError } from "@/lib/api";

export type TaskInput = {
  title?: string;
  description?: string;
  requirements?: string;
  deadline?: string | null;
  coins?: number | string;
  internIds?: number[];
};

export function parseTaskInput(body: TaskInput) {
  const title = (body.title || "").trim();
  const description = (body.description || "").trim();
  if (!title) throw new ApiError(400, "Title is required");
  if (!description) throw new ApiError(400, "Description is required");
  const coins = Number(body.coins ?? 10);
  if (!Number.isFinite(coins) || coins < 0) throw new ApiError(400, "Coins must be a non-negative number");
  let deadline: Date | null = null;
  if (body.deadline) {
    deadline = new Date(body.deadline);
    if (Number.isNaN(deadline.getTime())) throw new ApiError(400, "Invalid deadline");
  }
  return {
    title,
    description,
    requirements: body.requirements?.trim() || null,
    coins: Math.round(coins),
    deadline,
  };
}

/** Assign a task to one or more interns (skips duplicates). Returns count of new assignments. */
export async function assignInterns(taskId: number, internIds: number[]) {
  const ids = Array.from(new Set(internIds.map(Number).filter((n) => Number.isInteger(n) && n > 0)));
  if (ids.length === 0) return 0;
  const valid = await db
    .select({ id: users.id })
    .from(users)
    .where(and(inArray(users.id, ids), eq(users.role, "intern")));
  const existing = await db
    .select({ internId: taskAssignments.internId })
    .from(taskAssignments)
    .where(eq(taskAssignments.taskId, taskId));
  const existingSet = new Set(existing.map((e) => e.internId));
  const toInsert = valid.filter((v) => !existingSet.has(v.id)).map((v) => ({ taskId, internId: v.id }));
  if (toInsert.length === 0) return 0;
  await db.insert(taskAssignments).values(toInsert);
  return toInsert.length;
}
