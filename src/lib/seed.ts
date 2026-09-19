import { db } from "@/db";
import { users, drivers, vehicles, services, kmLogs } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { sql } from "drizzle-orm";

/**
 * The preview environment may start with an empty database.
 * Create every table if it is missing so the app can never crash with
 * "relation does not exist".
 */
async function ensureSchema(): Promise<void> {
  await db.execute(sql`
    create table if not exists users (
      id serial primary key,
      username text not null unique,
      password_hash text not null,
      full_name text not null,
      role text not null default 'il_muduru',
      province text,
      phone text,
      active boolean not null default true,
      created_at timestamptz not null default now()
    );
  `);
  await db.execute(sql`
    create table if not exists drivers (
      id serial primary key,
      full_name text not null,
      phone text,
      identity_no text,
      license_no text,
      license_class text,
      province text not null default 'İSTANBUL',
      rotation_score integer not null default 0,
      hire_date date,
      note text,
      active boolean not null default true,
      created_at timestamptz not null default now()
    );
  `);
  // Ensure column exists if table was created previously without rotation_score
  await db.execute(sql`
    alter table drivers add column if not exists rotation_score integer not null default 0;
  `);
  // Enforce strictly at PostgreSQL level that no driver can have more than one vehicle
  await db.execute(sql`
    create unique index if not exists idx_vehicles_driver_id_unique on vehicles (driver_id) where driver_id is not null;
  `);
  await db.execute(sql`
    create table if not exists vehicles (
      id serial primary key,
      plate text not null unique,
      brand text not null,
      model text not null,
      model_year integer not null default 2020,
      color text,
      chassis_no text,
      fuel_type text default 'Dizel',
      province text not null default 'İSTANBUL',
      driver_id integer,
      assigned_at date,
      current_km integer not null default 0,
      last_service_km integer not null default 0,
      service_interval_km integer not null default 15000,
      annual_service_date date,
      inspection_date date,
      insurance_date date,
      kasko_date date,
      note text,
      active boolean not null default true,
      created_at timestamptz not null default now()
    );
  `);
  await db.execute(sql`
    create table if not exists services (
      id serial primary key,
      vehicle_id integer not null,
      type text not null,
      service_date date not null,
      km integer not null default 0,
      title text not null,
      description text,
      company text,
      invoice_no text,
      cost numeric(12,2) not null default '0',
      next_date date,
      created_by text,
      created_at timestamptz not null default now()
    );
  `);
  await db.execute(sql`
    create table if not exists km_logs (
      id serial primary key,
      vehicle_id integer not null,
      log_date date not null,
      km integer not null,
      note text,
      created_at timestamptz not null default now()
    );
  `);
}

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const DRIVER_NAMES = [
  "Ahmet Yılmaz",
  "Mehmet Demir",
  "İbrahim Doğan",
  "Hatice Kaya",
  "Mustafa Çelik",
  "Fatma Şahin",
  "Ali Yıldız",
  "Hasan Aydın",
  "Emre Koç",
  "Zeynep Arslan",
  "Murat Özdemir",
  "Serkan Kurt",
  "Osman Polat",
  "Kemal Aslan",
  "Yusuf Erdoğan",
  "Selim Güneş",
  "Burak Taş",
];

type VehicleSeed = {
  plate: string;
  brand: string;
  model: string;
  year: number;
  province: string;
  km: number;
  annual: number;
  inspection: number;
  insurance: number;
  kasko: number;
};

const CITY_CODE: Record<string, { code: string; abbr: string }> = {
  İSTANBUL: { code: "34", abbr: "IST" },
  ANKARA: { code: "06", abbr: "ANK" },
  İZMİR: { code: "35", abbr: "IZM" },
  BURSA: { code: "16", abbr: "BRS" },
  KONYA: { code: "42", abbr: "KON" },
  ANTALYA: { code: "07", abbr: "ANT" },
  TRABZON: { code: "61", abbr: "TRB" },
};

const PLAN: Array<[string, string, string, number, number, number, number, number, number]> = [
  // province, brand, model, year, km, annualOffset, inspectionOffset, insuranceOffset, kaskoOffset
  ["İSTANBUL", "Ford", "Transit Custom", 2021, 142000, 27, -12, 40, 120],
  ["İSTANBUL", "Renault", "Clio", 2022, 86500, -8, 95, 180, 60],
  ["İSTANBUL", "Fiat", "Egea", 2020, 198400, 4, 10, -5, 75],
  ["İSTANBUL", "Volkswagen", "Caddy", 2023, 54200, 15, 210, 88, 150],
  ["İSTANBUL", "Toyota", "Corolla", 2021, 121300, 60, 32, 24, -18],
  ["İSTANBUL", "Ford", "Courier", 2019, 234500, 25, -3, 130, 44],
  ["ANKARA", "Fiat", "Doblo", 2020, 176900, -4, -6, 20, 96],
  ["ANKARA", "Peugeot", "Partner", 2022, 92400, 46, 5, 160, 210],
  ["ANKARA", "Renault", "Kangoo", 2021, 133700, -40, 70, 35, 18],
  ["İZMİR", "Dacia", "Duster", 2023, 41200, -30, 140, 55, 240],
  ["İZMİR", "Fiat", "Fiorino", 2019, 251800, 122, -15, 12, 30],
  ["İZMİR", "Hyundai", "i20", 2022, 78600, -2, -25, 65, 100],
  ["BURSA", "Ford", "Focus", 2020, 189200, 34, 48, -35, 8],
  ["BURSA", "Renault", "Megane", 2021, 147500, 72, 26, 42, 200],
  ["KONYA", "Volkswagen", "Transporter", 2022, 99800, 52, 115, -20, 62,],
  ["ANTALYA", "Citroen", "Berlingo", 2020, 205300, 18, 6, 90, 14],
  ["TRABZON", "Isuzu", "D-Max", 2023, 63400, 88, 58, 105, 36],
];

let bootstrapPromise: Promise<void> | null = null;

/** Safe entrypoint: never throws, so a page can always render. */
export async function ensureSeeded(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().catch((err) => {
      bootstrapPromise = null;
      console.error("[FiloBakimPro] bootstrap error:", err);
    });
  }
  await bootstrapPromise;
}

async function bootstrap(): Promise<void> {
  await ensureSchema();
  // Serialize seeding across concurrent requests / instances.
  await db.execute(sql`select pg_advisory_lock(918273645)`);
  try {
    await seedData();
  } finally {
    await db.execute(sql`select pg_advisory_unlock(918273645)`);
  }
}

async function seedData(): Promise<void> {
  const existing = await db.select({ c: sql<number>`count(*)::int` }).from(users);
  if ((existing[0]?.c ?? 0) > 0) return;

  await db.insert(users).values([
    {
      username: "admin",
      passwordHash: hashPassword("admin123"),
      fullName: "Genel Müdür (Ana Panel)",
      role: "admin",
      province: null,
      phone: "0850 000 00 00",
    },
    {
      username: "istanbul",
      passwordHash: hashPassword("istanbul34"),
      fullName: "İstanbul İl Müdürü",
      role: "il_muduru",
      province: "İSTANBUL",
      phone: "0212 000 00 00",
    },
    {
      username: "ankara",
      passwordHash: hashPassword("ankara06"),
      fullName: "Ankara İl Müdürü",
      role: "il_muduru",
      province: "ANKARA",
      phone: "0312 000 00 00",
    },
    {
      username: "izmir",
      passwordHash: hashPassword("izmir35"),
      fullName: "İzmir İl Müdürü",
      role: "il_muduru",
      province: "İZMİR",
      phone: "0232 000 00 00",
    },
  ]);

  const driverRows = await db
    .insert(drivers)
    .values(
      DRIVER_NAMES.map((name, i) => ({
        fullName: name,
        phone: `05${(30 + (i % 9)).toString()} ${100 + i} ${20 + i} ${10 + i}`,
        identityNo: `1234567${(1000 + i).toString()}`,
        licenseNo: `TR-${90000 + i * 37}`,
        licenseClass: i % 4 === 0 ? "C" : "B",
        province: PLAN[i][0],
        rotationScore: 15 + ((i * 7) % 80), // realistic rotation scores 15-95
        hireDate: addDays(-(400 + i * 53)),
        note: null,
      })),
    )
    .returning();

  const vehicleSeeds: VehicleSeed[] = PLAN.map((p, i) => {
    const province = p[0];
    const c = CITY_CODE[province];
    return {
      plate: `${c.code} ${c.abbr} ${1701 + i}`,
      brand: p[1],
      model: p[2],
      year: p[3],
      province,
      km: p[4],
      annual: p[5],
      inspection: p[6],
      insurance: p[7],
      kasko: p[8],
    };
  });

  const vehicleRows = await db
    .insert(vehicles)
    .values(
      vehicleSeeds.map((v, i) => ({
        plate: v.plate,
        brand: v.brand,
        model: v.model,
        modelYear: v.year,
        color: ["Beyaz", "Gri", "Siyah", "Mavi"][i % 4],
        chassisNo: `NM0${(100000 + i * 7919).toString()}TR`,
        fuelType: i % 5 === 0 ? "Benzin" : "Dizel",
        province: v.province,
        driverId: driverRows[i].id,
        assignedAt: addDays(-(300 + i * 11)),
        currentKm: v.km,
        lastServiceKm: v.km - (3000 + ((i * 1700) % 12000)),
        serviceIntervalKm: 15000,
        annualServiceDate: addDays(v.annual),
        inspectionDate: addDays(v.inspection),
        insuranceDate: addDays(v.insurance),
        kaskoDate: addDays(v.kasko),
        note: null,
      })),
    )
    .returning();

  const serviceValues: (typeof services.$inferInsert)[] = [];
  const kmValues: (typeof kmLogs.$inferInsert)[] = [];

  vehicleRows.forEach((v, i) => {
    if (i === 0) {
      serviceValues.push({
        vehicleId: v.id,
        type: "donanim_demirbas",
        serviceDate: addDays(-45),
        km: v.currentKm - 2500,
        title: "8+1 Sürücü Arkası MDF Sürgülü Bilgisayar Masası & Donanım Montajı",
        description: "Araç içi özel üretim sürgülü MDF bilgisayar masası, kablo kanalları ve montaj donanımları.",
        company: "Özel Karoser & Dizayn",
        invoiceNo: "FT-DMR-8801",
        cost: "14500.00",
        nextDate: null,
        createdBy: "admin",
      });
    }

    serviceValues.push({
      vehicleId: v.id,
      type: "yillik_bakim",
      serviceDate: addDays(-(330 - (i % 7) * 12)),
      km: Math.max(0, v.currentKm - 22000),
      title: "Yıllık periyodik bakım",
      description: "Yağ, yağ filtresi, hava filtresi, polen filtresi değişimi",
      company: `${v.province} Yetkili Servis`,
      invoiceNo: `FT-${20250 + i}`,
      cost: (4500 + i * 320).toFixed(2),
      nextDate: v.annualServiceDate,
      createdBy: "admin",
    });
    serviceValues.push({
      vehicleId: v.id,
      type: "fenni_muayene",
      serviceDate: addDays(-(365 - (i % 5) * 20)),
      km: Math.max(0, v.currentKm - 19000),
      title: "TÜVTÜRK araç muayenesi",
      description: "Periyodik fenni muayene ücreti",
      company: "TÜVTÜRK",
      invoiceNo: `TV-${71000 + i}`,
      cost: (2350 + (i % 4) * 120).toFixed(2),
      nextDate: v.inspectionDate,
      createdBy: "admin",
    });
    serviceValues.push({
      vehicleId: v.id,
      type: i % 3 === 0 ? "lastik" : i % 3 === 1 ? "onarim" : "yag",
      serviceDate: addDays(-(60 + i * 6)),
      km: Math.max(0, v.currentKm - 6000),
      title:
        i % 3 === 0
          ? "4 adet yaz lastiği değişimi"
          : i % 3 === 1
            ? "Fren balata ve disk değişimi"
            : "Ara yağ ve filtre bakımı",
      description: "Servis kaydı",
      company: i % 2 === 0 ? "Bosch Car Service" : "Özel Oto Servis",
      invoiceNo: `SR-${33100 + i}`,
      cost: (2800 + i * 415).toFixed(2),
      nextDate: null,
      createdBy: "admin",
    });
    if (i % 2 === 0) {
      serviceValues.push({
        vehicleId: v.id,
        type: "sigorta",
        serviceDate: addDays(-(200 + i * 3)),
        km: Math.max(0, v.currentKm - 15000),
        title: "Zorunlu trafik sigortası poliçesi",
        description: "Yıllık poliçe primi",
        company: "Anadolu Sigorta",
        invoiceNo: `PL-${88100 + i}`,
        cost: (6200 + i * 210).toFixed(2),
        nextDate: v.insuranceDate,
        createdBy: "admin",
      });
    }

    for (let k = 3; k >= 0; k--) {
      kmValues.push({
        vehicleId: v.id,
        logDate: addDays(-k * 30),
        km: v.currentKm - k * (1200 + (i % 5) * 220),
        note: k === 0 ? "Son okuma" : "Aylık km okuması",
      });
    }
  });

  await db.insert(services).values(serviceValues);
  await db.insert(kmLogs).values(kmValues);
}
