import { Field, inputClass } from "@/components/ui";
import { SERVICE_TYPES, todayISO } from "@/lib/fleet";

export default function ServiceFields({
  vehicleId,
  vehicles,
  defaultKm,
}: {
  vehicleId?: number;
  vehicles?: { id: number; plate: string }[];
  defaultKm?: number;
}) {
  return (
    <>
      {vehicleId ? (
        <input type="hidden" name="vehicleId" value={vehicleId} />
      ) : (
        <Field label="Araç *">
          <select name="vehicleId" required className={inputClass}>
            <option value="">Seçiniz</option>
            {(vehicles ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.plate}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="İşlem Türü">
        <select name="type" defaultValue="yillik_bakim" className={inputClass}>
          {SERVICE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="İşlem Tarihi">
        <input type="date" name="serviceDate" defaultValue={todayISO()} className={inputClass} />
      </Field>
      <Field label="KM">
        <input type="number" name="km" defaultValue={defaultKm ?? 0} className={inputClass} />
      </Field>
      <Field label="Başlık *" className="sm:col-span-2">
        <input
          name="title"
          required
          placeholder="Örn: Yıllık periyodik bakım"
          className={inputClass}
        />
      </Field>
      <Field label="Servis / Firma">
        <input name="company" className={inputClass} />
      </Field>
      <Field label="Fatura No">
        <input name="invoiceNo" className={inputClass} />
      </Field>
      <Field label="Tutar (₺)">
        <input type="number" step="0.01" name="cost" defaultValue={0} className={inputClass} />
      </Field>
      <Field label="Sonraki Tarih (hatırlatma)">
        <input type="date" name="nextDate" className={inputClass} />
      </Field>
      <Field label="Açıklama / Yapılan İşlemler" className="sm:col-span-2">
        <textarea name="description" rows={3} className={inputClass} />
      </Field>
    </>
  );
}
