import { getCurrentUser } from "@/lib/auth";
import { AppError } from "@/lib/mutations";
import { ensureSeeded } from "@/lib/seed";
import type { User } from "@/db/schema";
import { revalidatePath } from "next/cache";

export type Handler = (user: User, fd: FormData) => Promise<{ id?: number } | void>;

/**
 * Wraps a mutation in a stable REST endpoint.
 * Always returns JSON (never throws), so the UI can show a proper message
 * instead of crashing into an error boundary.
 */
export async function handle(req: Request, fn: Handler): Promise<Response> {
  try {
    await ensureSeeded();
    const user = await getCurrentUser();
    if (!user) {
      return Response.json(
        { ok: false, error: "Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.", auth: true },
        { status: 401 },
      );
    }
    let fd: FormData;
    try {
      fd = await req.formData();
    } catch {
      fd = new FormData();
      const body = await req.json().catch(() => ({}));
      for (const [k, v] of Object.entries(body ?? {})) fd.set(k, String(v));
    }
    const result = (await fn(user, fd)) ?? {};
    revalidatePath("/panel", "layout");
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const message =
      err instanceof AppError
        ? err.message
        : "İşlem tamamlanamadı. Lütfen bilgileri kontrol edip tekrar deneyin.";
    if (!(err instanceof AppError)) console.error("[FiloBakimPro] mutation error:", err);
    return Response.json({ ok: false, error: message }, { status: 400 });
  }
}

export function idOf(fd: FormData): number {
  const v = fd.get("id");
  return Number(typeof v === "string" ? v : 0) || 0;
}
