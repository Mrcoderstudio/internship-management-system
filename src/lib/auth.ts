import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

const SESSION_COOKIE = "ims_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  return (
    process.env.FLASK_SECRET_KEY ||
    process.env.SESSION_SECRET ||
    "dev-insecure-secret-change-me"
  );
}

// ---------- Password hashing (scrypt, similar to werkzeug's scheme) ----------
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// ---------- Signed session cookie ----------
type SessionPayload = { uid: number; role: string; exp: number };

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function encodeSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${sign(data)}`;
}

export function decodeSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;
  const expected = sign(data);
  if (expected.length !== sig.length) return null;
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString()) as SessionPayload;
    if (payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(user: Pick<User, "id" | "role">) {
  const token = encodeSession({
    uid: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export type SafeUser = Omit<User, "password">;

export async function getCurrentUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const payload = decodeSession(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const [user] = await db.select().from(users).where(eq(users.id, payload.uid)).limit(1);
  if (!user) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...safe } = user;
  return safe;
}

// ---------- Admin bootstrap from environment ----------
export function adminCredentials() {
  return {
    email: (process.env.ADMIN_EMAIL || "admin@ims.local").toLowerCase(),
    password: process.env.ADMIN_PASSWORD || "admin123",
  };
}

/** Ensures the admin account defined by ADMIN_EMAIL / ADMIN_PASSWORD exists. */
export async function ensureAdmin(): Promise<User> {
  const { email, password } = adminCredentials();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    if (existing.role !== "admin") {
      const [updated] = await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.id, existing.id))
        .returning();
      return updated;
    }
    return existing;
  }
  const [created] = await db
    .insert(users)
    .values({
      name: "Administrator",
      email,
      password: hashPassword(password),
      role: "admin",
      skills: "Management",
    })
    .returning();
  return created;
}
