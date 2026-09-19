import { Field, inputClass } from "@/components/ui";
import { PROVINCES } from "@/lib/fleet";

type DriverOpt = {
  id: number;
  fullName: string;
  province: string;
  rotationScore?: number;
  plate?: string | null;
};

export default function VehicleFields({
  vehicle,
  drivers,
  isAdmin,
  province,
}: {
  vehicle?: {
    id: number;
    plate: string;
    brand: string;
    model: string;
    modelYear: number;
    color: string | null;
    chassisNo: string | null;
    fuelType: string | null;
    province: string;
    driverId: number | null;
    assignedAt: string | null;
    currentKm: number;
    lastServiceKm: number;
    serviceIntervalKm: number;
    annualServiceDate: string | null;
    inspectionDate: string | null;
    insuranceDate: string | null;
    kaskoDate: string | null;
    note: string | null;
  } | null;
  drivers: DriverOpt[];
  isAdmin: boolean;
  province: string | null;
}) {
  const v = vehicle ?? null;
  return (
    <>
      <input type="hidden" name="id" defaultValue={v?.id ?? ""} />
      <Field label="Plaka *">
        <input
          name="plate"
          required
          defaultValue={v?.plate ?? ""}
          placeholder="34 ABC 123"
          className={inputClass}
        />
      </Field>
      <Field label="Marka">
        <input name="brand" defaultValue={v?.brand ?? ""} className={inputClass} />
      </Field>
      <Field label="Model">
        <input name="model" defaultValue={v?.model ?? ""} className={inputClass} />
      </Field>
      <Field label="Model Yılı">
        <input
          name="modelYear"
          type="number"
          defaultValue={v?.modelYear ?? new Date().getFullYear()}
          className={inputClass}
        />
      </Field>
      <Field label="Renk">
        <input name="color" defaultValue={v?.color ?? ""} className={inputClass} />
      </Field>
      <Field label="Şasi No">
        <input name="chassisNo" defaultValue={v?.chassisNo ?? ""} className={inputClass} />
      </Field>
      <Field label="Yakıt">
        <select name="fuelType" defaultValue={v?.fuelType ?? "Dizel"} className={inputClass}>
          {["Dizel", "Benzin", "LPG", "Hibrit", "Elektrik"].map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Field>
      <Field label="İl">
        {isAdmin ? (
          <select name="province" defaultValue={v?.province ?? PROVINCES[0]} className={inputClass}>
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
      <Field label="Zimmetli Sürücü (1 Araç = 1 Sürücü)">
        <select name="driverId" defaultValue={v?.driverId ? String(v.driverId) : ""} className={inputClass}>
          <option value="">Zimmetsiz (Araç Boşta)</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName} ({d.province}) · Rotasyon: {d.rotationScore ?? 0} P
              {d.plate && d.plate !== v?.plate ? ` ⚠ (Mevcut Zimmet: ${d.plate})` : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Zimmet Tarihi">
        <input type="date" name="assignedAt" defaultValue={v?.assignedAt ?? ""} className={inputClass} />
      </Field>
      <Field label="Güncel KM">
        <input type="number" name="currentKm" defaultValue={v?.currentKm ?? 0} className={inputClass} />
      </Field>
      <Field label="Son Bakım KM">
        <input
          type="number"
          name="lastServiceKm"
          defaultValue={v?.lastServiceKm ?? 0}
          className={inputClass}
        />
      </Field>
      <Field label="Bakım Aralığı (KM)">
        <input
          type="number"
          name="serviceIntervalKm"
          defaultValue={v?.serviceIntervalKm ?? 15000}
          className={inputClass}
        />
      </Field>
      <Field label="Yıllık Bakım Tarihi">
        <input
          type="date"
          name="annualServiceDate"
          defaultValue={v?.annualServiceDate ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label="Fenni Muayene Tarihi">
        <input
          type="date"
          name="inspectionDate"
          defaultValue={v?.inspectionDate ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label="Trafik Sigortası Bitiş">
        <input
          type="date"
          name="insuranceDate"
          defaultValue={v?.insuranceDate ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label="Kasko Bitiş">
        <input type="date" name="kaskoDate" defaultValue={v?.kaskoDate ?? ""} className={inputClass} />
      </Field>
      <Field label="Not" className="sm:col-span-2">
        <textarea name="note" rows={2} defaultValue={v?.note ?? ""} className={inputClass} />
      </Field>
    </>
  );
}
