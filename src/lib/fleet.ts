export const SERVICE_TYPES = [
  { value: "yillik_bakim", label: "Yıllık Bakım" },
  { value: "periyodik_bakim", label: "Periyodik (KM) Bakım" },
  { value: "fenni_muayene", label: "Fenni Muayene" },
  { value: "sigorta", label: "Trafik Sigortası" },
  { value: "kasko", label: "Kasko" },
  { value: "donanim_demirbas", label: "Donanım / Demirbaş" },
  { value: "onarim", label: "Onarım / Arıza" },
  { value: "lastik", label: "Lastik" },
  { value: "yag", label: "Yağ / Filtre" },
  { value: "diger", label: "Diğer" },
] as const;

export function serviceTypeLabel(value: string): string {
  return SERVICE_TYPES.find((t) => t.value === value)?.label ?? value;
}

export const PROVINCES = [
  "İSTANBUL",
  "ANKARA",
  "İZMİR",
  "BURSA",
  "KONYA",
  "ANTALYA",
  "ADANA",
  "TRABZON",
  "GAZİANTEP",
  "SAMSUN",
  "KAYSERİ",
  "DİYARBAKIR",
  "ERZURUM",
  "MERSİN",
  "ESKİŞEHİR",
  "SİVAS",
  "VAN",
];

/**
 * Always returns current calendar date in Turkey (Europe/Istanbul, UTC+3)
 * as 'YYYY-MM-DD'. This prevents late-night (00:00-03:00) UTC rollback bugs.
 */
export function todayISO(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

export function parseISODateParts(
  dateStr: string | null | undefined,
): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const match = dateStr.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/**
 * Calculates calendar day difference between dateStr and today in Europe/Istanbul.
 * Negative number = overdue by X days.
 * 0 = today.
 * Positive number = X days remaining.
 * Calculated via UTC noon calendar timestamps to eliminate any daylight saving or
 * client machine local timezone distortion.
 */
export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = parseISODateParts(dateStr);
  const today = parseISODateParts(todayISO());
  if (!target || !today) return null;

  const targetUtc = Date.UTC(target.year, target.month - 1, target.day, 12, 0, 0);
  const todayUtc = Date.UTC(today.year, today.month - 1, today.day, 12, 0, 0);
  return Math.round((targetUtc - todayUtc) / 86400000);
}

export type Urgency = "overdue" | "soon" | "upcoming" | "ok";

export function urgencyOf(days: number | null): Urgency {
  if (days === null) return "ok";
  if (days < 0) return "overdue";
  if (days <= 15) return "soon";
  if (days <= 45) return "upcoming";
  return "ok";
}

export function dayLabel(days: number | null): string {
  if (days === null) return "Tarih yok";
  if (days < 0) return `${Math.abs(days)} gün gecikti`;
  if (days === 0) return "Bugün";
  return `${days} gün kaldı`;
}

export function urgencyClass(u: Urgency): string {
  switch (u) {
    case "overdue":
      return "bg-red-500/15 text-red-300 border-red-500/40";
    case "soon":
      return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    case "upcoming":
      return "bg-sky-500/15 text-sky-300 border-sky-500/40";
    default:
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
  }
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "-";
  const parts = parseISODateParts(d);
  if (!parts) return d;
  const day = String(parts.day).padStart(2, "0");
  const month = String(parts.month).padStart(2, "0");
  return `${day}.${month}.${parts.year}`;
}

export function fmtMoney(v: string | number | null | undefined): string {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return `${(n || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺`;
}

export function fmtKm(v: number | null | undefined): string {
  return `${(v ?? 0).toLocaleString("tr-TR")} km`;
}
