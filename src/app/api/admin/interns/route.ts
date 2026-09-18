import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { ApiError, handleError, ok, readJson, requireApiUser } from "@/lib/api";
import { getInternProgress } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireApiUser("admin");
    return ok({ interns: await getInternProgress() });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireApiUser("admin");
    const body = await readJson<{ name?: string; email?: string; password?: string; phone?: string; skills?: string }>(req);
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    if (!name || !email || !password) throw new ApiError(400, "Name, email and password are required");
    if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters");

    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const [intern] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashPassword(password),
        phone: body.phone?.trim() || null,
        skills: body.skills?.trim() || null,
        role: "intern",
      })
      .returning({ id: users.id, name: users.name, email: users.email });
    return ok({ intern }, 201);
  } catch (err) {
    return handleError(err);
  }
}
