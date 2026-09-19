"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { VehicleRow } from "@/lib/data";
import { dayLabel, daysUntil, fmtDate, fmtKm, fmtMoney, urgencyOf } from "@/lib/fleet";
import { Plate, UrgencyBadge } from "@/components/ui";

export default function VehicleTable({ rows }: { rows: VehicleRow[] }) {
  const [q, setQ] = useState("");
  const [province, setProvince] = useState("");
  const [status, setStatus] = useState("");

  const provinces = useMemo(
    () => Array.from(new Set(rows.map((r) => r.province))).sort(),
    [rows],
  );

  const filtered = useMemo(() => {
    const term = q.toLocaleLowerCase("tr");
    return rows.filter((r) => {
      if (province && r.province !== province) return false;
      const worst = Math.min(
        ...[r.annualServiceDate, r.inspectionDate, r.insuranceDate, r.kaskoDate]
          .map((d) => daysUntil(d))
          .filter((x): x is number => x !== null),
      );
      if (status === "overdue" && !(worst < 0)) return false;
      if (status === "soon" && !(worst >= 0 && worst <= 30)) return false;
      if (status === "kmdue" && !(r.currentKm - r.lastServiceKm >= r.serviceIntervalKm))
        return false;
      if (!term) return true;
      return [r.plate, r.brand, r.model, r.driverName ?? "", r.province]
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(term);
    });
  }, [rows, q, province, status]);

  const sel =
    "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Plaka, marka veya sürücü ara..."
          className={`${sel} min-w-[220px] flex-1`}
        />
        <select value={province} onChange={(e) => setProvince(e.target.value)} className={sel}>
          <option value="">Tüm iller</option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={sel}>
          <option value="">Tüm durumlar</option>
          <option value="overdue">Gecikmiş işlemi olanlar</option>
          <option value="soon">30 gün içinde işlemi olanlar</option>
          <option value="kmdue">KM bakımı gelenler</option>
        </select>
      </div>

      <p className="text-xs text-slate-400">{filtered.length} araç listeleniyor</p>

      {/* mobile cards */}
      <div className="grid gap-3 lg:hidden">
        {filtered.map((r) => {
          const days = daysUntil(r.annualServiceDate);
          return (
            <Link
              key={r.id}
              href={`/panel/araclar/${r.id}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Plate value={r.plate} />
                <UrgencyBadge urgency={urgencyOf(days)} label={dayLabel(days)} />
              </div>
              <p className="mt-2 text-sm font-medium text-slate-200">
                {r.brand} {r.model} · {r.modelYear}
              </p>
              <p className="text-xs text-slate-400">
                {r.driverName ?? "Zimmetsiz"} · {r.province}
              </p>
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>{fmtKm(r.currentKm)}</span>
                <span className="text-emerald-300">{fmtMoney(r.totalCost)}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-slate-800 lg:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-3">Plaka</th>
              <th className="px-3 py-3">Araç</th>
              <th className="px-3 py-3">Sürücü</th>
              <th className="px-3 py-3">İl</th>
              <th className="px-3 py-3">KM</th>
              <th className="px-3 py-3">Yıllık Bakım</th>
              <th className="px-3 py-3">Fenni Muayene</th>
              <th className="px-3 py-3 text-right">Toplam Gider</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.map((r) => {
              const a = daysUntil(r.annualServiceDate);
              const m = daysUntil(r.inspectionDate);
              return (
                <tr key={r.id} className="transition hover:bg-slate-900/60">
                  <td className="px-3 py-2.5">
                    <Link href={`/panel/araclar/${r.id}`}>
                      <Plate value={r.plate} small />
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-slate-200">
                    <Link href={`/panel/araclar/${r.id}`} className="hover:text-sky-300">
                      {r.brand} {r.model}
                      <span className="ml-1 text-xs text-slate-500">{r.modelYear}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-slate-300">{r.driverName ?? "—"}</td>
                  <td className="px-3 py-2.5 text-slate-400">{r.province}</td>
                  <td className="px-3 py-2.5 text-slate-300">{fmtKm(r.currentKm)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{fmtDate(r.annualServiceDate)}</span>
                      <UrgencyBadge urgency={urgencyOf(a)} label={dayLabel(a)} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{fmtDate(r.inspectionDate)}</span>
                      <UrgencyBadge urgency={urgencyOf(m)} label={dayLabel(m)} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-semibold text-emerald-300">
                    {fmtMoney(r.totalCost)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
