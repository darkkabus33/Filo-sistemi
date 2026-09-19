"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ExpenseRow } from "@/lib/data";
import { SERVICE_TYPES, fmtDate, fmtKm, fmtMoney, serviceTypeLabel } from "@/lib/fleet";
import { Plate } from "@/components/ui";
import ActionButton from "@/components/ActionButton";

export default function ExpenseTable({
  rows,
  deletable = false,
}: {
  rows: ExpenseRow[];
  deletable?: boolean;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const term = q.toLocaleLowerCase("tr");
    return rows.filter((r) => {
      if (type && r.type !== type) return false;
      if (from && r.serviceDate < from) return false;
      if (to && r.serviceDate > to) return false;
      if (!term) return true;
      return [r.plate, r.title, r.company ?? "", r.driverName ?? "", r.invoiceNo ?? "", r.province]
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(term);
    });
  }, [rows, q, type, from, to]);

  const total = filtered.reduce((s, r) => s + r.cost, 0);

  function exportCsv() {
    const head = [
      "Tarih",
      "Plaka",
      "İl",
      "Sürücü",
      "Tür",
      "İşlem",
      "Firma",
      "Fatura",
      "KM",
      "Tutar (TL)",
    ];

    const escapeCsv = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rowsData = filtered.map((r) => [
      escapeCsv(r.serviceDate),
      escapeCsv(r.plate),
      escapeCsv(r.province),
      escapeCsv(r.driverName ?? ""),
      escapeCsv(serviceTypeLabel(r.type)),
      escapeCsv(r.title),
      escapeCsv(r.company ?? ""),
      escapeCsv(r.invoiceNo ?? ""),
      escapeCsv(r.km),
      escapeCsv(Number(r.cost).toFixed(2).replace(".", ",")), // Turkish decimal comma for Excel
    ]);

    const csvString = [
      head.map((h) => `"${h}"`).join(";"),
      ...rowsData.map((row) => row.join(";")),
    ].join("\r\n");

    // Explicit UTF-8 BOM bytes (0xEF, 0xBB, 0xBF)
    // Guarantees Excel opens Turkish characters (ş, ğ, ı, İ, ç, ö, ü) without distortion
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filobakim-gider-raporu.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const sel =
    "rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-500";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Plaka, işlem, firma ara..."
          className={`${sel} min-w-[200px] flex-1`}
        />
        <select value={type} onChange={(e) => setType(e.target.value)} className={sel}>
          <option value="">Tüm işlem türleri</option>
          {SERVICE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={sel} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={sel} />
        <button
          onClick={exportCsv}
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20"
        >
          ⬇ CSV
        </button>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm">
        <span className="text-slate-400">{filtered.length} kayıt</span>
        <span className="font-bold text-emerald-300">Toplam: {fmtMoney(total)}</span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-3 py-3">Tarih</th>
              <th className="px-3 py-3">Plaka</th>
              <th className="px-3 py-3">Tür</th>
              <th className="px-3 py-3">İşlem</th>
              <th className="px-3 py-3">Firma / Fatura</th>
              <th className="px-3 py-3">KM</th>
              <th className="px-3 py-3 text-right">Tutar</th>
              {deletable && <th className="px-3 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-900/60">
                <td className="px-3 py-2.5 text-xs text-slate-400">{fmtDate(r.serviceDate)}</td>
                <td className="px-3 py-2.5">
                  <Link href={`/panel/araclar/${r.vehicleId}`}>
                    <Plate value={r.plate} small />
                  </Link>
                </td>
                <td className="px-3 py-2.5">
                  <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                    {serviceTypeLabel(r.type)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-slate-200">
                  {r.title}
                  <span className="block text-[11px] text-slate-500">
                    {r.driverName ?? "-"} · {r.province}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-400">
                  {r.company ?? "-"}
                  <span className="block text-slate-600">{r.invoiceNo ?? ""}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-slate-400">{fmtKm(r.km)}</td>
                <td className="px-3 py-2.5 text-right font-semibold text-emerald-300">
                  {fmtMoney(r.cost)}
                </td>
                {deletable && (
                  <td className="px-3 py-2.5 text-right">
                    <ActionButton
                      endpoint="/api/services/delete"
                      payload={{ id: String(r.id) }}
                      label="Sil"
                      confirmText="Bu servis kaydı silinsin mi?"
                      className="text-xs text-red-400 hover:text-red-300"
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
