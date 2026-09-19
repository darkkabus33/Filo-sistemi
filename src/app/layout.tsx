import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "FiloBakım Pro | Araç Bakım & Zimmet Takip Sistemi",
  description:
    "Fenni muayene, yıllık bakım, km takibi, servis masrafları ve araç zimmet raporları tek panelde.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-[#070b14] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
