import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Tarih belirtilmedi" }, { status: 400 });
    }

    // Seçilen tarihe göre evrakları getir
    const list = await db
      .select()
      .from(documents)
      .where(eq(documents.docDate, date));

    return NextResponse.json(list);
  } catch (err: any) {
    console.error("Evrak listeleme hatası:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
