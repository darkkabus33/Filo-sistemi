import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { costByProvince, costByType, listExpenses, listVehicles } from "@/lib/data";
import { Card, Plate, StatCard } from "@/components/ui";
import ExpenseTable from "@/components/ExpenseTable";
import { fmtMoney, serviceTypeLabel } from "@/lib/fleet";

export const dynamic = "force-dynamic";

export default async function ExpenseReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [rows, vehicles, byType, byProvince] = await Promise.all([
    listExpenses(user),
    listVehicles(user),
    costByType(user),
    costByProvince(user),
  ]);

  const total = rows.reduce((s, r) => s + r.cost, 0);
  const thisYear = new Date().getFullYear();
  const yearTotal = rows
    .filter((r) => r.serviceDate.startsWith(String(thisYear)))
    .reduce((s, r) => s + r.cost, 0);

  const monthly = new Map<string, number>();
  for (const r of rows) {
    const key = r.serviceDate.slice(0, 7);
    monthly.set(key, (monthly.get(key) ?? 0) + r.cost);
  }
  const months = Array.from(monthly.entries()).sort().slice(-12);
  const maxMonth = Math.max(1, ...months.map(([, v]) => v));

  const topVehicles = [...vehicles].sort((a, b) => b.totalCost - a.totalCost).slice(0, 8);
  const maxType = Math.max(1, ...byType.map((t) => t.total));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">Gider Raporu</h1>
        <p className="mt-1 text-sm text-slate-400">
          Araç, işlem türü, il ve dönem bazında masraf analizi
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam Gider" value={fmtMoney(total)} icon="💳" tone="emerald" />
        <StatCard label={`${thisYear} Yılı Gideri`} value={fmtMoney(yearTotal)} icon="📅" tone="sky" />
        <StatCard
          label="Araç Başı Ortalama"
          value={fmtMoney(vehicles.length ? total / vehicles.length : 0)}
          icon="🚗"
          tone="violet"
        />
        <StatCard label="Kayıt Sayısı" value={String(rows.length)} icon="🧾" tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Aylık Gider Trendi" icon={<span>📈</span>} className="xl:col-span-2">
          <div className="flex h-44 items-end gap-2">
            {months.map(([m, v]) => (
              <div key={m} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400">{(v / 1000).toFixed(0)}k</span>
                <div
                  className="w-full rounded-t bg-gradient-to-t from-sky-600 to-violet-500"
                  style={{ height: `${Math.max(4, (v / maxMonth) * 120)}px` }}
                />
                <span className="text-[10px] text-slate-500">{m.slice(5)}.{m.slice(2, 4)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="İşlem Türüne Göre" icon={<span>📊</span>}>
          <ul className="space-y-3">
            {byType.map((t) => (
              <li key={t.type}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-300">
                    {serviceTypeLabel(t.type)}{" "}
                    <span className="text-slate-500">({t.count})</span>
                  </span>
                  <span className="font-semibold text-slate-100">{fmtMoney(t.total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
                    style={{ width: `${Math.max(4, (t.total / maxType) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="En Çok Masraf Yapan Araçlar" icon={<span>🚗</span>}>
          <ul className="space-y-2">
            {topVehicles.map((v) => (
              <li key={v.id}>
                <Link
                  href={`/panel/araclar/${v.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 hover:bg-slate-900"
                >
                  <Plate value={v.plate} small />
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-300">
                    {v.brand} {v.model} · {v.driverName ?? "—"}
                  </span>
                  <span className="text-sm font-semibold text-emerald-300">
                    {fmtMoney(v.totalCost)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="İl Bazlı Gider" icon={<span>🗺</span>}>
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2">İl</th>
                <th className="py-2">Araç</th>
                <th className="py-2 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {byProvince.map((p) => (
                <tr key={p.province}>
                  <td className="py-2 text-slate-200">{p.province}</td>
                  <td className="py-2 text-slate-400">{p.vehicleCount}</td>
                  <td className="py-2 text-right font-semibold text-emerald-300">
                    {fmtMoney(p.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card title="Tüm Gider Kayıtları" icon={<span>🧾</span>}>
        <ExpenseTable rows={rows} />
      </Card>
    </div>
  );
}
