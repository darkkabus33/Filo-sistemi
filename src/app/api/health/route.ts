import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ensureSeeded } from "@/lib/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    // Creates missing tables and demo data if the database is empty.
    await ensureSeeded();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
