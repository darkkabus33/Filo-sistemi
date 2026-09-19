import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { costByProvince, costByType, dashboardStats } from "@/lib/data";
import { Card, Dot, Plate, StatCard, UrgencyBadge, Empty } from "@/components/ui";
import { dayLabel, fmtDate, fmtKm, fmtMoney, serviceTypeLabel } from "@/lib/fleet";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { rows, alerts, overdue, soon, totalCost, totalKm, driverCount, kmDue } =
    await dashboardStats(user);
  const byType = await costByType(user);
  const byProvince = await costByProvince(user);
  const upcoming = alerts.filter((a) => a.days !== null && a.days <= 45).slice(0, 8);
  const maxType = Math.max(1, ...byType.map((t) => t.total));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">Filo Genel Durum</h1>
          <p className="mt-1 text-sm text-slate-400">
            Bakım, muayene ve sigorta hatırlatmalarına genel bakış
            {user.role !== "admin" && ` · ${user.province}`}
          </p>
        </div>
        <Link
          href="/panel/uyarilar"
          className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
        >
          🔔 Uyarı Merkezi
        </Link>
      </div>

      {overdue.length > 0 && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <span className="font-semibold">{overdue.length} işlem gecikmiş durumda!</span> Lütfen
          Uyarı Merkezi&apos;nden kontrol edin.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Toplam Araç" value={String(rows.length)} icon="🚗" tone="sky" />
        <StatCard label="Sürücü" value={String(driverCount)} icon="👥" tone="violet" />
        <StatCard
          label="Geciken"
          value={String(overdue.length)}
          sub={`${soon.length} işlem 15 gün içinde`}
          icon="⚠"
          tone="red"
        />
        <StatCard
          label="Toplam Bakım Gideri"
          value={fmtMoney(totalCost)}
          sub={`${byType.reduce((s, t) => s + t.count, 0)} servis kaydı`}
          icon="💳"
          tone="emerald"
        />
        <StatCard label="Toplam KM" value={fmtKm(totalKm)} icon="🛣" tone="slate" />
        <StatCard
          label="KM Bakımı Gelen"
          value={String(kmDue)}
          sub="Periyodik bakım aralığı doldu"
          icon="🛠"
          tone="amber"
        />
        <StatCard
          label="Araç Başı Ortalama Gider"
          value={fmtMoney(rows.length ? totalCost / rows.length : 0)}
          icon="📈"
          tone="sky"
        />
        <StatCard
          label="Ortalama Filo Yaşı"
          value={
            rows.length
              ? `${(
                  rows.reduce((s, v) => s + (new Date().getFullYear() - v.modelYear), 0) /
                  rows.length
                ).toFixed(1)} yıl`
              : "-"
          }
          icon="📅"
          tone="violet"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card
          className="xl:col-span-2"
          title="Yaklaşan & Geciken Hatırlatmalar"
          icon={<span>⏰</span>}
          action={
            <Link href="/panel/uyarilar" className="text-xs text-sky-400 hover:text-sky-300">
              Tümü →
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <Empty text="Yaklaşan hatırlatma yok." />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((a, i) => (
                <li key={`${a.vehicleId}-${a.kind}-${i}`}>
                  <Link
                    href={`/panel/araclar/${a.vehicleId}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5 transition hover:border-slate-700 hover:bg-slate-900"
                  >
                    <Dot urgency={a.urgency} />
                    <Plate value={a.plate} small />
                    <span className="min-w-0 flex-1 truncate text-xs text-slate-300">
                      {a.kindLabel} · {fmtDate(a.date)}
                    </span>
                    <UrgencyBadge urgency={a.urgency} label={dayLabel(a.days)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Gider Dağılımı" icon={<span>📊</span>}>
          {byType.length === 0 ? (
            <Empty text="Kayıt yok." />
          ) : (
            <ul className="space-y-3">
              {byType.map((t) => (
                <li key={t.type}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{serviceTypeLabel(t.type)}</span>
                    <span className="font-semibold text-slate-100">{fmtMoney(t.total)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500"
                      style={{ width: `${Math.max(4, (t.total / maxType) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="İl Bazlı Özet" icon={<span>🗺</span>}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {byProvince.map((p) => (
            <div
              key={p.province}
              className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3"
            >
              <p className="text-xs font-semibold tracking-wide text-slate-200">{p.province}</p>
              <p className="mt-1 text-lg font-bold text-emerald-300">{fmtMoney(p.total)}</p>
              <p className="text-[11px] text-slate-400">{p.vehicleCount} araç</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
