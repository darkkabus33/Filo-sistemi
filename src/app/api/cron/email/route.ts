import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { buildAlerts, listVehicles } from "@/lib/data";
import { dayLabel, fmtDate, fmtKm } from "@/lib/fleet";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Dışarıdan izinsiz mail tetiklemesini engellemek için Vercel güvenlik kontrolü
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Yetkisiz erişim", { status: 401 });
  }

  try {
    // Admin yetkisiyle tüm filoyu çekiyoruz
    const rows = await listVehicles({ role: "admin", province: null } as any);

    // Sadece 30 gün altı yaklaşanları ve günü geçenleri filtrele
    const alerts = buildAlerts(rows).filter((a) => a.days !== null && a.days <= 30);
    const kmDue = rows.filter((v) => v.currentKm - v.lastServiceKm >= v.serviceIntervalKm);

    if (alerts.length === 0 && kmDue.length === 0) {
      return NextResponse.json({ ok: true, message: "Uyarı yok, mail atılmadı." });
    }

    const mailText = [
      "Sayın Nurullah Bey,\n",
      "Filodaki aşağıdaki araçlar için bakım, muayene veya sigorta işlemleri yaklaşmakta veya gecikmiş durumdadır:\n",
      ...alerts.map(a => `- ${a.plate} (${a.province}) | ${a.kindLabel} | ${fmtDate(a.date)} | ${dayLabel(a.days)}`),
      "\n",
      ...kmDue.map(v => `- ${v.plate} | KM Bakımı Geldi | Son bakımdan bu yana ${fmtKm(v.currentKm - v.lastServiceKm)} yol yaptı`),
      "\nBilgilerinize sunulur.\nFiloBakım Pro - Otomatik Bildirim Sistemi"
    ].join("\n");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"FiloBakım Uyarısı" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Bildirimlerin geleceği adres (Kendi mailiniz)
      subject: "Araç Bakım ve Muayene Uyarıları",
      text: mailText,
    });

    return NextResponse.json({ ok: true, message: "Otomatik mail başarıyla gönderildi." });
  } catch (error) {
    console.error("Cron Mail Hatası:", error);
    return NextResponse.json({ ok: false, error: "Mail gönderilemedi." }, { status: 500 });
  }
}
