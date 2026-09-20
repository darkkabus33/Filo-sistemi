"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

const NAV = [
  { href: "/panel", label: "Genel Durum", icon: "▦" },
  { href: "/panel/araclar", label: "Araçlar", icon: "🚗" },
  { href: "/panel/suruculer", label: "Sürücüler", icon: "👥" },
  { href: "/panel/servisler", label: "Servis & Bakım", icon: "🛠" },
  { href: "/panel/giderler", label: "Gider Raporu", icon: "📊" },
  { href: "/panel/evraklar", label: "Evrak Kayıt", icon: "📁" },
  { href: "/panel/kullanicilar", label: "İl Müdürleri", icon: "🛡", adminOnly: true },
  { href: "/panel/uyarilar", label: "Uyarı Merkezi", icon: "🔔" },
];

export default function Shell({
  children,
  user,
  overdueCount,
}: {
  children: ReactNode;
  user: { fullName: string; role: string; province: string | null; username: string };
  overdueCount: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isAdmin = user.role === "admin";
  const items = NAV.filter((n) => !n.adminOnly || isAdmin);

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {items.map((item) => {
        const active =
          item.href === "/panel" ? pathname === "/panel" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-sky-600 text-white shadow-lg shadow-sky-900/40"
                : "text-slate-300 hover:bg-slate-800/70"
            }`}
          >
            <span className="w-5 text-center">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.href === "/panel/uyarilar" && overdueCount > 0 && (
              <span className="rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-300">
                {overdueCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="border-t border-slate-800 p-3">
      <div className="mb-2 rounded-xl bg-slate-800/50 px-3 py-2">
        <p className="truncate text-xs font-semibold text-slate-200">{user.fullName}</p>
        <p className="text-[11px] text-slate-400">
          {isAdmin ? "Ana Panel Yöneticisi" : `İl Müdürü · ${user.province ?? "-"}`}
        </p>
      </div>
      <a
        href="/api/auth/logout"
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
      >
        ⎋ Çıkış Yap
      </a>
    </div>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950/70 lg:flex">
        <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-4">
          <span className="text-xl">🚚</span>
          <span className="font-bold tracking-tight text-slate-100">FiloBakım Pro</span>
        </div>
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex h-full w-72 flex-col border-r border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
              <span className="font-bold text-slate-100">FiloBakım Pro</span>
              <button onClick={() => setOpen(false)} className="text-slate-400">
                ✕
              </button>
            </div>
            {nav}
            {footer}
          </div>
          <button
            aria-label="Kapat"
            className="flex-1 bg-black/60"
            onClick={() => setOpen(false)}
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-slate-800 bg-[#070b14]/85 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg border border-slate-800 px-3 py-1.5 text-slate-200"
          >
            ☰
          </button>
          <span className="font-semibold text-slate-100">FiloBakım Pro</span>
          <Link href="/panel/uyarilar" className="relative px-2 text-lg">
            🔔
            {overdueCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {overdueCount}
              </span>
            )}
          </Link>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
