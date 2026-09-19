import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await destroySession();
  return Response.json({ ok: true, redirect: "/login" });
}

export async function GET(req: Request) {
  await destroySession();
  return Response.redirect(new URL("/login", req.url), 303);
}
