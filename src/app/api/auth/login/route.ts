import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, verifyPassword } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const acceptHeader = req.headers.get("accept") ?? "";
  const ct = req.headers.get("content-type") ?? "";
  const wantsJson = acceptHeader.includes("application/json") || ct.includes("application/json");

  try {
    await ensureSeeded();

    let username = "";
    let password = "";

    if (ct.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      username = String(body.username ?? "");
      password = String(body.password ?? "");
    } else {
      const fd = await req.formData();
      username = String(fd.get("username") ?? "");
      password = String(fd.get("password") ?? "");
    }

    username = username.trim().toLowerCase();
    password = password.trim();

    if (!username || !password) {
      if (wantsJson) {
        return Response.json({ ok: false, error: "Kullanıcı adı ve şifre zorunludur." }, { status: 400 });
      }
      return Response.redirect(new URL("/login?error=missing", req.url), 303);
    }

    const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const user = rows[0];

    if (!user || !verifyPassword(password, user.passwordHash)) {
      if (wantsJson) {
        return Response.json({ ok: false, error: "Kullanıcı adı veya şifre hatalı." }, { status: 401 });
      }
      return Response.redirect(new URL("/login?error=invalid", req.url), 303);
    }

    if (!user.active) {
      if (wantsJson) {
        return Response.json(
          { ok: false, error: "Hesabınız pasif durumda. Yöneticinize başvurun." },
          { status: 403 },
        );
      }
      return Response.redirect(new URL("/login?error=inactive", req.url), 303);
    }

    await createSession(user.id);

    if (wantsJson) {
      return Response.json({ ok: true, redirect: "/panel" });
    }

    // Native form submit -> redirect to /panel
    return Response.redirect(new URL("/panel", req.url), 303);
  } catch (err) {
    console.error("[Login] error:", err);
    if (wantsJson) {
      return Response.json(
        { ok: false, error: "Giriş sırasında sunucu hatası oluştu. Lütfen tekrar deneyin." },
        { status: 500 },
      );
    }
    return Response.redirect(new URL("/login?error=server", req.url), 303);
  }
}
