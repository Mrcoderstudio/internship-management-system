import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { adminCredentials, createSession, ensureAdmin, verifyPassword } from "@/lib/auth";
import { ApiError, handleError, ok, readJson } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await readJson<{ email?: string; password?: string }>(req);
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    if (!email || !password) throw new ApiError(400, "Email and password are required");

    // Bootstrap the admin account from environment variables on first login.
    if (email === adminCredentials().email) await ensureAdmin();

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || !verifyPassword(password, user.password)) {
      throw new ApiError(401, "Invalid email or password");
    }

    await createSession(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...safe } = user;
    return ok({ user: safe });
  } catch (err) {
    return handleError(err);
  }
}
