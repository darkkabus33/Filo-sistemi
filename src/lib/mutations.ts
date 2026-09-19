import { db } from "@/db";
import { drivers, kmLogs, services, users, vehicles, type User } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";

export class AppError extends Error {}

function s(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}
function num(fd: FormData, key: string): number {
  const raw = s(fd, key).replace(/\s/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  const v = Number(raw);
  return Number.isFinite(v) ? v : 0;
}
function dt(fd: FormData, key: string): string | null {
  const v = s(fd, key);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
}

function provinceFor(user: User, fd: FormData): string {
  if (user.role === "admin") return s(fd, "province") || "İSTANBUL";
  return user.province ?? "İSTANBUL";
}

/** Throws if the user may not touch this province. */
function assertProvince(user: User, province: string) {
  if (user.role !== "admin" && province !== user.province) {
    throw new AppError("Bu kayıt sizin ilinize ait değil.");
  }
}

/* ---------------- Vehicles ---------------- */

export async function saveVehicle(user: User, fd: FormData) {
  const id = Number(s(fd, "id")) || 0;
  const plate = s(fd, "plate").toUpperCase();
  if (!plate) throw new AppError("Plaka zorunludur.");

  const province = provinceFor(user, fd);
  const driverIdRaw = s(fd, "driverId");
  const driverId = driverIdRaw ? Number(driverIdRaw) : null;

  if (id) {
    const cur = (await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1))[0];
    if (!cur) throw new AppError("Araç bulunamadı.");
    assertProvince(user, cur.province);
  }

  const dupe = (
    await db.select({ id: vehicles.id }).from(vehicles).where(eq(vehicles.plate, plate)).limit(1)
  )[0];
  if (dupe && dupe.id !== id) throw new AppError(`"${plate}" plakası zaten kayıtlı.`);

  // Validate driver existence and province if assigned
  let assignedAt = dt(fd, "assignedAt");
  if (driverId) {
    const drv = (await db.select().from(drivers).where(eq(drivers.id, driverId)).limit(1))[0];
    if (!drv) throw new AppError("Seçilen sürücü bulunamadı.");
    assertProvince(user, drv.province);
    if (!assignedAt) {
      const { todayISO } = await import("@/lib/fleet");
      assignedAt = todayISO();
    }
  } else {
    assignedAt = null;
  }

  const payload = {
    plate,
    brand: s(fd, "brand") || "-",
    model: s(fd, "model") || "-",
    modelYear: Math.round(num(fd, "modelYear")) || new Date().getFullYear(),
    color: s(fd, "color") || null,
    chassisNo: s(fd, "chassisNo") || null,
    fuelType: s(fd, "fuelType") || "Dizel",
    province,
    driverId,
    assignedAt,
    currentKm: Math.max(0, Math.round(num(fd, "currentKm"))),
    lastServiceKm: Math.max(0, Math.round(num(fd, "lastServiceKm"))),
    serviceIntervalKm: Math.round(num(fd, "serviceIntervalKm")) || 15000,
    annualServiceDate: dt(fd, "annualServiceDate"),
    inspectionDate: dt(fd, "inspectionDate"),
    insuranceDate: dt(fd, "insuranceDate"),
    kaskoDate: dt(fd, "kaskoDate"),
    note: s(fd, "note") || null,
  };

  // Strictly enforce 1-to-1: clear this driver from any other vehicle first
  if (driverId) {
    await db
      .update(vehicles)
      .set({ driverId: null, assignedAt: null })
      .where(eq(vehicles.driverId, driverId));
  }

  if (id) {
    await db.update(vehicles).set(payload).where(eq(vehicles.id, id));
    return { id };
  }
  const inserted = await db.insert(vehicles).values(payload).returning({ id: vehicles.id });
  return { id: inserted[0]?.id ?? 0 };
}

export async function deleteVehicle(user: User, id: number) {
  if (!id) throw new AppError("Geçersiz kayıt.");
  const cur = (await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1))[0];
  if (!cur) return { id };
  assertProvince(user, cur.province);
  await db.delete(services).where(eq(services.vehicleId, id));
  await db.delete(kmLogs).where(eq(kmLogs.vehicleId, id));
  await db.delete(vehicles).where(eq(vehicles.id, id));
  return { id };
}

/* ---------------- Drivers ---------------- */

export async function saveDriver(user: User, fd: FormData) {
  const id = Number(s(fd, "id")) || 0;
  const fullName = s(fd, "fullName");
  if (!fullName) throw new AppError("Ad soyad zorunludur.");

  if (id) {
    const cur = (await db.select().from(drivers).where(eq(drivers.id, id)).limit(1))[0];
    if (!cur) throw new AppError("Sürücü bulunamadı.");
    assertProvince(user, cur.province);
  }

  const rotationScore = Math.max(0, Math.round(num(fd, "rotationScore")));

  const payload = {
    fullName,
    phone: s(fd, "phone") || null,
    identityNo: s(fd, "identityNo") || null,
    licenseNo: s(fd, "licenseNo") || null,
    licenseClass: s(fd, "licenseClass") || null,
    province: provinceFor(user, fd),
    rotationScore,
    hireDate: dt(fd, "hireDate"),
    note: s(fd, "note") || null,
  };

  if (id) {
    await db.update(drivers).set(payload).where(eq(drivers.id, id));
    return { id };
  }
  const inserted = await db.insert(drivers).values(payload).returning({ id: drivers.id });
  return { id: inserted[0]?.id ?? 0 };
}

export async function deleteDriver(user: User, id: number) {
  if (!id) throw new AppError("Geçersiz kayıt.");
  const cur = (await db.select().from(drivers).where(eq(drivers.id, id)).limit(1))[0];
  if (!cur) return { id };
  assertProvince(user, cur.province);
  await db.update(vehicles).set({ driverId: null, assignedAt: null }).where(eq(vehicles.driverId, id));
  await db.delete(drivers).where(eq(drivers.id, id));
  return { id };
}

/* ---------------- Services ---------------- */

export async function saveService(user: User, fd: FormData) {
  const id = Number(s(fd, "id")) || 0;
  const vehicleId = Number(s(fd, "vehicleId"));
  if (!vehicleId) throw new AppError("Araç seçilmelidir.");

  const veh = (await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1))[0];
  if (!veh) throw new AppError("Araç bulunamadı.");
  assertProvince(user, veh.province);

  const km = Math.max(0, Math.round(num(fd, "km")));
  const nextDate = dt(fd, "nextDate");
  const type = s(fd, "type") || "diger";

  const payload = {
    vehicleId,
    type,
    serviceDate: dt(fd, "serviceDate") ?? new Date().toISOString().slice(0, 10),
    km,
    title: s(fd, "title") || "Servis kaydı",
    description: s(fd, "description") || null,
    company: s(fd, "company") || null,
    invoiceNo: s(fd, "invoiceNo") || null,
    cost: Math.max(0, num(fd, "cost")).toFixed(2),
    nextDate,
    createdBy: user.username,
  };

  if (id) {
    await db.update(services).set(payload).where(eq(services.id, id));
  } else {
    await db.insert(services).values(payload);
  }

  const patch: Partial<typeof vehicles.$inferInsert> = {};
  if (km > veh.currentKm) patch.currentKm = km;
  if (type === "yillik_bakim" || type === "periyodik_bakim" || type === "yag") {
    if (km > veh.lastServiceKm) patch.lastServiceKm = km;
    if (nextDate && type !== "yag") patch.annualServiceDate = nextDate;
  }
  if (type === "fenni_muayene" && nextDate) patch.inspectionDate = nextDate;
  if (type === "sigorta" && nextDate) patch.insuranceDate = nextDate;
  if (type === "kasko" && nextDate) patch.kaskoDate = nextDate;
  if (Object.keys(patch).length) {
    await db.update(vehicles).set(patch).where(eq(vehicles.id, vehicleId));
  }
  return { id: vehicleId };
}

export async function deleteService(user: User, id: number) {
  if (!id) throw new AppError("Geçersiz kayıt.");
  const row = (await db.select().from(services).where(eq(services.id, id)).limit(1))[0];
  if (!row) return { id };
  const veh = (
    await db.select().from(vehicles).where(eq(vehicles.id, row.vehicleId)).limit(1)
  )[0];
  if (veh) assertProvince(user, veh.province);
  await db.delete(services).where(eq(services.id, id));
  return { id };
}

export async function addKmLog(user: User, fd: FormData) {
  const vehicleId = Number(s(fd, "vehicleId"));
  const km = Math.round(num(fd, "km"));
  if (!vehicleId) throw new AppError("Araç seçilmelidir.");
  if (km <= 0) throw new AppError("Geçerli bir KM değeri giriniz.");

  const veh = (await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).limit(1))[0];
  if (!veh) throw new AppError("Araç bulunamadı.");
  assertProvince(user, veh.province);

  await db.insert(kmLogs).values({
    vehicleId,
    km,
    logDate: dt(fd, "logDate") ?? new Date().toISOString().slice(0, 10),
    note: s(fd, "note") || null,
  });
  await db.update(vehicles).set({ currentKm: km }).where(eq(vehicles.id, vehicleId));
  return { id: vehicleId };
}

/* ---------------- Users ---------------- */

export async function saveUser(user: User, fd: FormData) {
  if (user.role !== "admin") throw new AppError("Bu işlem için yetkiniz yok.");
  const id = Number(s(fd, "id")) || 0;
  const username = s(fd, "username").toLowerCase().replace(/\s+/g, "");
  const password = s(fd, "password");
  if (!username) throw new AppError("Kullanıcı adı zorunludur.");

  const dupe = (
    await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1)
  )[0];
  if (dupe && dupe.id !== id) throw new AppError(`"${username}" kullanıcı adı zaten kullanılıyor.`);

  const role = s(fd, "role") === "admin" ? "admin" : "il_muduru";
  const base = {
    username,
    fullName: s(fd, "fullName") || username,
    role,
    province: role === "admin" ? null : s(fd, "province") || "İSTANBUL",
    phone: s(fd, "phone") || null,
    active: s(fd, "active") !== "false",
  };

  if (id) {
    await db
      .update(users)
      .set(password ? { ...base, passwordHash: hashPassword(password) } : base)
      .where(eq(users.id, id));
    return { id };
  }
  if (!password) throw new AppError("Yeni kullanıcı için şifre zorunludur.");
  const inserted = await db
    .insert(users)
    .values({ ...base, passwordHash: hashPassword(password) })
    .returning({ id: users.id });
  return { id: inserted[0]?.id ?? 0 };
}

export async function deleteUser(user: User, id: number) {
  if (user.role !== "admin") throw new AppError("Bu işlem için yetkiniz yok.");
  if (!id) throw new AppError("Geçersiz kayıt.");
  if (id === user.id) throw new AppError("Kendi hesabınızı silemezsiniz.");
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  const target = (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
  if (target?.role === "admin" && admins.length <= 1) {
    throw new AppError("Sistemde en az bir yönetici kalmalıdır.");
  }
  await db.delete(users).where(eq(users.id, id));
  return { id };
}
