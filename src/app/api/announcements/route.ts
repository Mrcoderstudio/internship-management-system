import { db } from "@/db";
import { announcements } from "@/db/schema";
import { ApiError, handleError, ok, readJson, requireApiUser } from "@/lib/api";
import { getAnnouncements } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Any authenticated user can read announcements. */
export async function GET() {
  try {
    await requireApiUser();
    return ok({ announcements: await getAnnouncements(50) });
  } catch (err) {
    return handleError(err);
  }
}

/** Admin only: broadcast a message to all interns. */
export async function POST(req: Request) {
  try {
    await requireApiUser("admin");
    const body = await readJson<{ message?: string }>(req);
    const message = (body.message || "").trim();
    if (!message) throw new ApiError(400, "Message is required");
    const [created] = await db.insert(announcements).values({ message }).returning();
    return ok({ announcement: created }, 201);
  } catch (err) {
    return handleError(err);
  }
}
