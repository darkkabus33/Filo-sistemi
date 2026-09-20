import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { del } from "@vercel/blob";

export const dynamic = "force-dynamic";

// EVRAKLARI LİSTELEME
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) return NextResponse.json({ error: "Tarih belirtilmedi" }, { status: 400 });

    const list = await db.select().from(documents).where(eq(documents.docDate, date));
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// EVRAK SİLME
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });

    const body = await request.json();
    const { id, fileUrl } = body;

    if (!id || !fileUrl) return NextResponse.json({ error: "Eksik veri" }, { status: 400 });

    // 1. Dosyayı Vercel Blob'dan sil (Kotayı geri kazandırır)
    await del(fileUrl);
    
    // 2. Kaydı Neon veritabanından sil
    await db.delete(documents).where(eq(documents.id, id));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
