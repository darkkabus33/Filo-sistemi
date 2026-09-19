import { cookies, headers } from "next/headers";
import crypto from "crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { eq } from "drizzle-orm";

const COOKIE = "fbp_session";
const SECRET = process.env.SESSION_SECRET ?? "filobakim-pro-dev-secret-2026-secure-key";

// Derive 256-bit symmetric key for A256GCM
const ENCRYPTION_KEY = crypto.createHash("sha256").update(SECRET).digest();

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 32).toString("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

/**
 * Creates an encrypted JWE session cookie (A256GCM).
 * Note: SameSite=None REQUIRES Secure=true in modern browsers.
 * If the connection is HTTP (e.g. local dev), SameSite must be 'lax' without Secure.
 */
export async function createSession(userId: number) {
  const jwt = await new EncryptJWT({ uid: userId })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .encrypt(ENCRYPTION_KEY);

  const h = await headers();
  const forwardedProto = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim().toLowerCase();
  const isHttps =
    forwardedProto === "https" ||
    process.env.NEXT_PUBLIC_APP_URL?.startsWith("https") ||
    process.env.VERCEL_URL !== undefined;

  const store = await cookies();
  store.set(COOKIE, jwt, {
    httpOnly: true,
    sameSite: isHttps ? "none" : "lax",
    secure: Boolean(isHttps),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;

  try {
    const { payload } = await jwtDecrypt(raw, ENCRYPTION_KEY);
    const userId = Number(payload.uid);
    if (!userId || !Number.isFinite(userId)) return null;

    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = rows[0];
    if (!user || !user.active) return null;
    return user;
  } catch (err) {
    console.error("[Auth] session decrypt or lookup failed:", err);
    return null;
  }
}

export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}
