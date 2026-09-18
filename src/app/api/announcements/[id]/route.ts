import { eq } from "drizzle-orm";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { ApiError, handleError, ok, requireApiUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireApiUser("admin");
    const id = Number((await ctx.params).id);
    const deleted = await db.delete(announcements).where(eq(announcements.id, id)).returning({ id: announcements.id });
    if (deleted.length === 0) throw new ApiError(404, "Announcement not found");
    return ok({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
