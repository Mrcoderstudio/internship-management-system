import { db } from "@/db";
import { tasks } from "@/db/schema";
import { handleError, ok, readJson, requireApiUser } from "@/lib/api";
import { getTasksWithAssignments } from "@/lib/queries";
import { assignInterns, parseTaskInput, type TaskInput } from "@/lib/tasks";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser("admin");
    return ok({ tasks: await getTasksWithAssignments() });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireApiUser("admin");
    const body = await readJson<TaskInput>(req);
    const data = parseTaskInput(body);
    const [task] = await db.insert(tasks).values({ ...data, createdBy: admin.id }).returning();
    const assigned = await assignInterns(task.id, body.internIds || []);
    return ok({ task, assigned }, 201);
  } catch (err) {
    return handleError(err);
  }
}
