import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listDrivers } from "@/lib/data";
import { Field, Plate, inputClass } from "@/components/ui";
import ModalForm from "@/components/ModalForm";
import ActionButton from "@/components/ActionButton";
import { PROVINCES, fmtDate } from "@/lib/fleet";

export const dynamic = "force-dynamic";

type DriverRow = Awaited<ReturnType<typeof listDrivers>>[number];

function rotationBadge(score: number) {
  if (score <= 30) {
    return {
      label: `${score} Puan · Göreve Uygun`,
      cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    };
  }
  if (score <= 70) {
    return {
      label: `${score} Puan · Dengeli Dağılım`,
      cls: "bg-sky-500/15 text-sky-300 border-sky-500/40",
    };
  }
  return {
    label: `${score} Puan · Yüksek Yük`,
    cls: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  };
}

function DriverFields({
  driver,
  isAdmin,
  province,
}: {
  driver?: DriverRow;
  isAdmin: boolean;
  province: string | null;
}) {
  return (
    <>
      <input type="hidden" name="id" defaultValue={driver?.id ?? ""} />
      <Field label="Ad Soyad *">
        <input name="fullName" required defaultValue={driver?.fullName ?? ""} className={inputClass} />
      </Field>
      <Field label="Telefon">
        <input name="phone" defaultValue={driver?.phone ?? ""} className={inputClass} />
      </Field>
      <Field label="T.C. Kimlik No">
        <input name="identityNo" defaultValue={driver?.identityNo ?? ""} className={inputClass} />
      </Field>
      <Field label="Ehliyet No">
        <input name="licenseNo" defaultValue={driver?.licenseNo ?? ""} className={inputClass} />
      </Field>
      <Field label="Ehliyet Sınıfı">
        <input name="licenseClass" defaultValue={driver?.licenseClass ?? ""} className={inputClass} />
      </Field>
      <Field label="Rotasyon Puanı (Adil Görev)">
        <input
          name="rotationScore"
          type="number"
          min="0"
          defaultValue={driver?.rotationScore ?? 0}
          className={inputClass}
        />
      </Field>
      <Field label="İl">
        {isAdmin ? (
          <select name="province" defaultValue={driver?.province ?? PROVINCES[0]} className={inputClass}>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        ) : (
          <input value={province ?? ""} readOnly className={inputClass} />
        )}
      </Field>
      <Field label="İşe Giriş Tarihi">
        <input type="date" name="hireDate" defaultValue={driver?.hireDate ?? ""} className={inputClass} />
      </Field>
      <Field label="Not" className="sm:col-span-2">
        <textarea name="note" rows={2} defaultValue={driver?.note ?? ""} className={inputClass} />
      </Field>
    </>
  );
}

export default async function DriversPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const rows = await listDrivers(user);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">Sürücüler & Rotasyon</h1>
          <p className="mt-1 text-sm text-slate-400">
            {rows.length} sürücü · {rows.filter((r) => r.vehicleId).length} zimmetli araç · Rotasyon puanı ile adil görev takibi
          </p>
        </div>
        <ModalForm trigger="+ Yeni Sürücü" title="Yeni Sürücü Ekle" endpoint="/api/drivers">
          <DriverFields isAdmin={user.role === "admin"} province={user.province} />
        </ModalForm>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((d) => {
          const rot = rotationBadge(d.rotationScore ?? 0);
          return (
            <div key={d.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-100">{d.fullName}</p>
                  <p className="text-xs text-slate-400">
                    {d.province} · {d.phone ?? "-"}
                  </p>
                </div>
                {d.vehicleId && d.plate ? (
                  <Link href={`/panel/araclar/${d.vehicleId}`}>
                    <Plate value={d.plate} small />
                  </Link>
                ) : (
                  <span className="rounded-md border border-slate-700 px-2 py-0.5 text-[11px] text-slate-400">
                    Araçsız
                  </span>
                )}
              </div>

              <div className="mt-2.5">
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${rot.cls}`}
                >
                  ⚖ {rot.label}
                </span>
              </div>

              <dl className="mt-3 space-y-1 text-xs text-slate-400">
                <div className="flex justify-between">
                  <dt>Ehliyet</dt>
                  <dd className="text-slate-300">
                    {d.licenseNo ?? "-"} ({d.licenseClass ?? "-"})
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>İşe Giriş</dt>
                  <dd className="text-slate-300">{fmtDate(d.hireDate)}</dd>
                </div>
              </dl>
              <div className="mt-3 flex gap-2">
                <ModalForm
                  trigger="Düzenle"
                  title={`${d.fullName} · Düzenle`}
                  endpoint="/api/drivers"
                  triggerClass="flex-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                >
                  <DriverFields driver={d} isAdmin={user.role === "admin"} province={user.province} />
                </ModalForm>
                <ActionButton
                  endpoint="/api/drivers/delete"
                  payload={{ id: String(d.id) }}
                  label="Sil"
                  confirmText={`${d.fullName} silinsin mi? Zimmetli aracı boşa düşecek.`}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
