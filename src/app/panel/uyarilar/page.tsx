import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { buildAlerts, listVehicles, type AlertItem } from "@/lib/data";
import { Card, Dot, Empty, Plate, UrgencyBadge } from "@/components/ui";
import ReminderActions from "@/components/ReminderActions";
import { dayLabel, fmtDate, fmtKm } from "@/lib/fleet";

export const dynamic = "force-dynamic";

function Group({ title, icon, items }: { title: string; icon: string; items: AlertItem[] }) {
  return (
    <Card
      title={`${title}`}
      icon={<span>{icon}</span>}
      action={
        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
          {items.length}
        </span>
      }
    >
      {items.length === 0 ? (
        <Empty text="Kayıt yok." />
      ) : (
        <ul className="space-y-2">
          {items.map((a, i) => (
            <li key={`${a.vehicleId}-${a.kind}-${i}`}>
              <Link
                href={`/panel/araclar/${a.vehicleId}`}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5 hover:border-slate-700 hover:bg-slate-900"
              >
                <Dot urgency={a.urgency} />
                <Plate value={a.plate} small />
                <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
                  {fmtDate(a.date)} · {a.driverName ?? "—"}
                </span>
                <UrgencyBadge urgency={a.urgency} label={dayLabel(a.days)} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = await listVehicles(user);
  const alerts = buildAlerts(rows).filter((a) => a.days !== null && a.days <= 60);

  const annual = alerts.filter((a) => a.kind === "yillik_bakim");
  const inspection = alerts.filter((a) => a.kind === "fenni_muayene");
  const insurance = alerts.filter((a) => a.kind === "sigorta" || a.kind === "kasko");
  const kmDue = rows.filter((v) => v.currentKm - v.lastServiceKm >= v.serviceIntervalKm);

  const mailText = [
    "Sayın İlgili,",
    "",
    "Aşağıdaki araçlar için bakım/muayene/sigorta işlemleri yaklaşmakta veya gecikmiş durumdadır:",
    "",
    ...alerts.map(
      (a) =>
        `- ${a.plate} (${a.province}) | ${a.kindLabel} | ${fmtDate(a.date)} | ${dayLabel(a.days)}`,
    ),
    "",
    ...kmDue.map(
      (v) =>
        `- ${v.plate} | KM Bakımı | ${fmtKm(v.currentKm - v.lastServiceKm)} bakım yapılmadan yol yapıldı`,
    ),
    "",
    "Bilgilerinize sunarız.",
    "FiloBakım Pro",
  ].join("\n");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-50">
            🔔 Uyarı Merkezi
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Bakım, fenni muayene ve sigorta/kasko hatırlatmaları (60 gün)
          </p>
        </div>
        <ReminderActions text={mailText} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Group title="Yıllık Bakım" icon="🔧" items={annual} />
        <Group title="Fenni Muayene" icon="📋" items={inspection} />
        <Group title="Sigorta / Kasko" icon="🛡" items={insurance} />
        <Card
          title="KM Bakımı Gelen Araçlar"
          icon={<span>🛣</span>}
          action={
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
              {kmDue.length}
            </span>
          }
        >
          {kmDue.length === 0 ? (
            <Empty text="KM bakımı gelen araç yok." />
          ) : (
            <ul className="space-y-2">
              {kmDue.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/panel/araclar/${v.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5 hover:bg-slate-900"
                  >
                    <Dot urgency="overdue" />
                    <Plate value={v.plate} small />
                    <span className="min-w-0 flex-1 truncate text-xs text-slate-400">
                      {fmtKm(v.currentKm)} · son bakım {fmtKm(v.lastServiceKm)}
                    </span>
                    <UrgencyBadge
                      urgency="overdue"
                      label={`${fmtKm(v.currentKm - v.lastServiceKm - v.serviceIntervalKm)} aşım`}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
