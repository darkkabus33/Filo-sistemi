import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { db } from "@/db"; // Veya projenizdeki db bağlantı dosyasının yolu
import { documents } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const docType = formData.get("docType") as string;
    const docDate = formData.get("docDate") as string;
    const note = formData.get("note") as string;

    if (!file || !title || !docDate || !docType) {
      return NextResponse.json({ error: "Eksik alanlar var" }, { status: 400 });
    }

    // Vercel Blob'a dosyayı yükle
    const filename = `evraklar/${Date.now()}-${file.name}`;
    const blob = await put(filename, file, {
      access: "public",
    });

    // Veritabanına (Neon DB) kayıt ekle
    await db.insert(documents).values({
      docType,
      docDate,
      title,
      fileUrl: blob.url,
      note: note || null,
      createdBy: user.fullName,
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (err: any) {
    console.error("Evrak yükleme hatası:", err);
    return NextResponse.json({ error: err.message || "Yükleme başarısız" }, { status: 500 });
  }
}
