import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getVehicle, getVehicleKmLogs, getVehicleServices, listDrivers } from "@/lib/data";
import { Card, Empty, Field, Plate, UrgencyBadge, inputClass } from "@/components/ui";
import ModalForm from "@/components/ModalForm";
import VehicleFields from "@/components/VehicleFields";
import ServiceFields from "@/components/ServiceFields";
import PrintButton from "@/components/PrintButton";
import ActionButton from "@/components/ActionButton";
import {
  dayLabel,
  daysUntil,
  fmtDate,
  fmtKm,
  fmtMoney,
  serviceTypeLabel,
  todayISO,
  urgencyOf,
} from "@/lib/fleet";

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const vehicle = await getVehicle(user, Number(id));
  if (!vehicle) notFound();

  const [rows, logs, drivers] = await Promise.all([
    getVehicleServices(vehicle.id),
    getVehicleKmLogs(vehicle.id),
    listDrivers(user),
  ]);

  const total = rows.reduce((s, r) => s + Number(r.cost), 0);
  const kmSinceService = vehicle.currentKm - vehicle.lastServiceKm;
  const kmLeft = vehicle.serviceIntervalKm - kmSinceService;
  const assignedDriver = drivers.find((d) => d.id === vehicle.driverId);

  const reminders = [
    { label: "Yıllık Bakım", date: vehicle.annualServiceDate, icon: "🔧" },
    { label: "Fenni Muayene", date: vehicle.inspectionDate, icon: "📋" },
    { label: "Trafik Sigortası", date: vehicle.insuranceDate, icon: "🛡" },
    { label: "Kasko", date: vehicle.kaskoDate, icon: "🏦" },
  ];

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/panel/araclar" className="text-sm text-slate-400 hover:text-slate-200">
            ← Araçlar
          </Link>
          <Plate value={vehicle.plate} />
          <span className="text-lg font-semibold text-slate-100">
            {vehicle.brand} {vehicle.model}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          <ModalForm
            trigger="+ Servis / Bakım Kaydı"
            title={`${vehicle.plate} · Yeni Servis Kaydı`}
            endpoint="/api/services"
            wide
          >
            <ServiceFields vehicleId={vehicle.id} defaultKm={vehicle.currentKm} />
          </ModalForm>
          <ModalForm
            trigger="KM Güncelle"
            title={`${vehicle.plate} · KM Girişi`}
            endpoint="/api/km-logs"
            triggerClass="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
          >
            <input type="hidden" name="vehicleId" value={vehicle.id} />
            <Field label="Güncel KM">
              <input type="number" name="km" defaultValue={vehicle.currentKm} className={inputClass} />
            </Field>
            <Field label="Tarih">
              <input type="date" name="logDate" defaultValue={todayISO()} className={inputClass} />
            </Field>
            <Field label="Not" className="sm:col-span-2">
              <input name="note" className={inputClass} />
            </Field>
          </ModalForm>
          <ModalForm
            trigger="Düzenle"
            title={`${vehicle.plate} · Araç Bilgilerini Düzenle`}
            endpoint="/api/vehicles"
            triggerClass="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            wide
          >
            <VehicleFields
              vehicle={vehicle}
              drivers={drivers.map((d) => ({
                id: d.id,
                fullName: d.fullName,
                province: d.province,
                rotationScore: d.rotationScore,
                plate: d.plate,
              }))}
              isAdmin={user.role === "admin"}
              province={user.province}
            />
          </ModalForm>
          <ActionButton
            endpoint="/api/vehicles/delete"
            payload={{ id: String(vehicle.id) }}
            label="Sil"
            confirmText={`${vehicle.plate} aracı ve tüm servis kayıtları silinsin mi?`}
            redirectTo="/panel/araclar"
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
          />
        </div>
      </div>

      {/* Zimmet Raporu */}
      <section className="print-plain rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-50">ARAÇ ZİMMET RAPORU</h2>
            <p className="text-xs text-slate-400">
              Rapor Tarihi: {fmtDate(todayISO())} · Belge No: ZR-{vehicle.id.toString().padStart(4, "0")}
            </p>
          </div>
          <Plate value={vehicle.plate} />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-sky-400">
              Araç Bilgileri
            </h3>
            <dl className="space-y-1.5 text-sm">
              <Row k="Plaka" v={vehicle.plate} />
              <Row k="Marka / Model" v={`${vehicle.brand} ${vehicle.model}`} />
              <Row k="Model Yılı" v={String(vehicle.modelYear)} />
              <Row k="Renk" v={vehicle.color ?? "-"} />
              <Row k="Yakıt" v={vehicle.fuelType ?? "-"} />
              <Row k="Şasi No" v={vehicle.chassisNo ?? "-"} />
              <Row k="Bağlı Olduğu İl" v={vehicle.province} />
              <Row k="Güncel KM" v={fmtKm(vehicle.currentKm)} />
            </dl>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-violet-400">
              Zimmetli Sürücü
            </h3>
            <dl className="space-y-1.5 text-sm">
              <Row k="Ad Soyad" v={vehicle.driverName ?? "Zimmetsiz"} />
              <Row k="Telefon" v={vehicle.driverPhone ?? "-"} />
              <Row k="Rotasyon Puanı" v={assignedDriver ? `${assignedDriver.rotationScore ?? 0} Puan (Adil Görev)` : "-"} />
              <Row k="Zimmet Tarihi" v={fmtDate(vehicle.assignedAt)} />
              <Row k="Toplam Servis" v={`${rows.length} kayıt`} />
              <Row k="Toplam Masraf" v={fmtMoney(total)} />
              <Row k="Yıllık Bakım" v={fmtDate(vehicle.annualServiceDate)} />
              <Row k="Fenni Muayene" v={fmtDate(vehicle.inspectionDate)} />
              <Row k="Sigorta / Kasko" v={`${fmtDate(vehicle.insuranceDate)} / ${fmtDate(vehicle.kaskoDate)}`} />
            </dl>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 border-t border-slate-800 pt-4 text-xs text-slate-400">
          <div>
            <p className="mb-8">Teslim Eden (İl Müdürü)</p>
            <p className="border-t border-slate-700 pt-1">İmza</p>
          </div>
          <div>
            <p className="mb-8">Teslim Alan ({vehicle.driverName ?? "-"})</p>
            <p className="border-t border-slate-700 pt-1">İmza</p>
          </div>
        </div>
      </section>

      <div className="no-print grid grid-cols-1 gap-4 lg:grid-cols-4">
        {reminders.map((r) => {
          const days = daysUntil(r.date);
          return (
            <div
              key={r.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4"
            >
              <p className="text-xs text-slate-400">
                {r.icon} {r.label}
              </p>
              <p className="mt-1.5 text-base font-semibold text-slate-100">{fmtDate(r.date)}</p>
              <div className="mt-2">
                <UrgencyBadge urgency={urgencyOf(days)} label={dayLabel(days)} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="no-print grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="KM Bakım Durumu" icon={<span>🛣</span>}>
          <p className="text-sm text-slate-300">
            Son bakımdan bu yana <strong>{fmtKm(kmSinceService)}</strong>
          </p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full ${kmLeft <= 0 ? "bg-red-500" : kmLeft < 2000 ? "bg-amber-400" : "bg-emerald-500"}`}
              style={{
                width: `${Math.min(100, (kmSinceService / Math.max(1, vehicle.serviceIntervalKm)) * 100)}%`,
              }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {kmLeft > 0
              ? `Sonraki bakıma ${fmtKm(kmLeft)} kaldı (aralık: ${fmtKm(vehicle.serviceIntervalKm)})`
              : `Bakım zamanı geçti! ${fmtKm(Math.abs(kmLeft))} aşıldı.`}
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-400">
            {logs.slice(0, 5).map((l) => (
              <li key={l.id} className="flex justify-between border-b border-slate-800/70 pb-1">
                <span>{fmtDate(l.logDate)}</span>
                <span className="text-slate-300">{fmtKm(l.km)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2" title="Servis & Bakım Geçmişi" icon={<span>🛠</span>}>
          {rows.length === 0 ? (
            <Empty text="Bu araç için servis kaydı yok." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-2">Tarih</th>
                    <th className="py-2">Tür</th>
                    <th className="py-2">İşlem</th>
                    <th className="py-2">KM</th>
                    <th className="py-2 text-right">Tutar</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 text-xs text-slate-400">{fmtDate(r.serviceDate)}</td>
                      <td className="py-2">
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                          {serviceTypeLabel(r.type)}
                        </span>
                      </td>
                      <td className="py-2 text-slate-200">
                        {r.title}
                        {r.company && (
                          <span className="block text-[11px] text-slate-500">{r.company}</span>
                        )}
                      </td>
                      <td className="py-2 text-xs text-slate-400">{fmtKm(r.km)}</td>
                      <td className="py-2 text-right font-semibold text-emerald-300">
                        {fmtMoney(r.cost)}
                      </td>
                      <td className="py-2 text-right">
                        <ActionButton
                          endpoint="/api/services/delete"
                          payload={{ id: String(r.id) }}
                          label="Sil"
                          confirmText="Bu servis kaydı silinsin mi?"
                          className="text-xs text-red-400 hover:text-red-300"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="pt-3 text-right text-xs text-slate-400">
                      TOPLAM MASRAF
                    </td>
                    <td className="pt-3 text-right text-base font-bold text-emerald-300">
                      {fmtMoney(total)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-800/60 pb-1">
      <dt className="text-slate-400">{k}</dt>
      <dd className="text-right font-medium text-slate-100">{v}</dd>
    </div>
  );
}
