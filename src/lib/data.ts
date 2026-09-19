import { db } from "@/db";
import { drivers, services, vehicles, kmLogs, type User } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { daysUntil, urgencyOf, type Urgency } from "@/lib/fleet";

export type VehicleRow = {
  id: number;
  plate: string;
  brand: string;
  model: string;
  modelYear: number;
  province: string;
  currentKm: number;
  lastServiceKm: number;
  serviceIntervalKm: number;
  annualServiceDate: string | null;
  inspectionDate: string | null;
  insuranceDate: string | null;
  kaskoDate: string | null;
  fuelType: string | null;
  color: string | null;
  chassisNo: string | null;
  assignedAt: string | null;
  note: string | null;
  driverId: number | null;
  driverName: string | null;
  driverPhone: string | null;
  totalCost: number;
  serviceCount: number;
};

function scope(user: User) {
  return user.role === "admin" ? undefined : eq(vehicles.province, user.province ?? "-");
}

export async function listVehicles(user: User): Promise<VehicleRow[]> {
  const rows = await db
    .select({
      id: vehicles.id,
      plate: vehicles.plate,
      brand: vehicles.brand,
      model: vehicles.model,
      modelYear: vehicles.modelYear,
      province: vehicles.province,
      currentKm: vehicles.currentKm,
      lastServiceKm: vehicles.lastServiceKm,
      serviceIntervalKm: vehicles.serviceIntervalKm,
      annualServiceDate: vehicles.annualServiceDate,
      inspectionDate: vehicles.inspectionDate,
      insuranceDate: vehicles.insuranceDate,
      kaskoDate: vehicles.kaskoDate,
      fuelType: vehicles.fuelType,
      color: vehicles.color,
      chassisNo: vehicles.chassisNo,
      assignedAt: vehicles.assignedAt,
      note: vehicles.note,
      driverId: vehicles.driverId,
      driverName: drivers.fullName,
      driverPhone: drivers.phone,
      totalCost: sql<number>`coalesce((select sum(${services.cost}) from ${services} where ${services.vehicleId} = ${vehicles.id}), 0)::float`,
      serviceCount: sql<number>`(select count(*) from ${services} where ${services.vehicleId} = ${vehicles.id})::int`,
    })
    .from(vehicles)
    .leftJoin(drivers, eq(drivers.id, vehicles.driverId))
    .where(scope(user))
    .orderBy(vehicles.plate);
  return rows;
}

export type AlertItem = {
  vehicleId: number;
  plate: string;
  province: string;
  driverName: string | null;
  kind: string;
  kindLabel: string;
  date: string | null;
  days: number | null;
  urgency: Urgency;
};

const KINDS: Array<{ key: keyof VehicleRow; kind: string; label: string }> = [
  { key: "annualServiceDate", kind: "yillik_bakim", label: "Yıllık Bakım" },
  { key: "inspectionDate", kind: "fenni_muayene", label: "Fenni Muayene" },
  { key: "insuranceDate", kind: "sigorta", label: "Trafik Sigortası" },
  { key: "kaskoDate", kind: "kasko", label: "Kasko" },
];

export function buildAlerts(rows: VehicleRow[]): AlertItem[] {
  const items: AlertItem[] = [];
  for (const v of rows) {
    for (const k of KINDS) {
      const date = v[k.key] as string | null;
      const days = daysUntil(date);
      items.push({
        vehicleId: v.id,
        plate: v.plate,
        province: v.province,
        driverName: v.driverName,
        kind: k.kind,
        kindLabel: k.label,
        date,
        days,
        urgency: urgencyOf(days),
      });
    }
  }
  return items.sort((a, b) => (a.days ?? 99999) - (b.days ?? 99999));
}

export async function getVehicle(user: User, id: number) {
  const rows = await listVehicles(user);
  return rows.find((v) => v.id === id) ?? null;
}

export async function getVehicleServices(vehicleId: number) {
  return db
    .select()
    .from(services)
    .where(eq(services.vehicleId, vehicleId))
    .orderBy(desc(services.serviceDate), desc(services.id));
}

export async function getVehicleKmLogs(vehicleId: number) {
  return db
    .select()
    .from(kmLogs)
    .where(eq(kmLogs.vehicleId, vehicleId))
    .orderBy(desc(kmLogs.logDate))
    .limit(12);
}

export async function listDrivers(user: User) {
  const where = user.role === "admin" ? undefined : eq(drivers.province, user.province ?? "-");
  return db
    .select({
      id: drivers.id,
      fullName: drivers.fullName,
      phone: drivers.phone,
      identityNo: drivers.identityNo,
      licenseNo: drivers.licenseNo,
      licenseClass: drivers.licenseClass,
      province: drivers.province,
      rotationScore: drivers.rotationScore,
      hireDate: drivers.hireDate,
      active: drivers.active,
      note: drivers.note,
      plate: vehicles.plate,
      vehicleId: vehicles.id,
    })
    .from(drivers)
    .leftJoin(vehicles, eq(vehicles.driverId, drivers.id))
    .where(where)
    .orderBy(desc(drivers.rotationScore), drivers.fullName);
}

export type ExpenseRow = {
  id: number;
  vehicleId: number;
  plate: string;
  province: string;
  driverName: string | null;
  type: string;
  serviceDate: string;
  km: number;
  title: string;
  description: string | null;
  company: string | null;
  invoiceNo: string | null;
  cost: number;
};

export async function listExpenses(user: User): Promise<ExpenseRow[]> {
  const where =
    user.role === "admin" ? undefined : eq(vehicles.province, user.province ?? "-");
  return db
    .select({
      id: services.id,
      vehicleId: services.vehicleId,
      plate: vehicles.plate,
      province: vehicles.province,
      driverName: drivers.fullName,
      type: services.type,
      serviceDate: services.serviceDate,
      km: services.km,
      title: services.title,
      description: services.description,
      company: services.company,
      invoiceNo: services.invoiceNo,
      cost: sql<number>`${services.cost}::float`,
    })
    .from(services)
    .innerJoin(vehicles, eq(vehicles.id, services.vehicleId))
    .leftJoin(drivers, eq(drivers.id, vehicles.driverId))
    .where(where)
    .orderBy(desc(services.serviceDate), desc(services.id));
}

export async function dashboardStats(user: User) {
  const rows = await listVehicles(user);
  const alerts = buildAlerts(rows);
  const overdue = alerts.filter((a) => a.urgency === "overdue");
  const soon = alerts.filter((a) => a.urgency === "soon");
  const totalCost = rows.reduce((s, v) => s + (v.totalCost || 0), 0);
  const totalKm = rows.reduce((s, v) => s + v.currentKm, 0);
  const driverCount = new Set(rows.map((v) => v.driverId).filter(Boolean)).size;
  const kmDue = rows.filter(
    (v) => v.currentKm - v.lastServiceKm >= v.serviceIntervalKm,
  ).length;
  return { rows, alerts, overdue, soon, totalCost, totalKm, driverCount, kmDue };
}

export async function costByType(user: User) {
  const where =
    user.role === "admin" ? undefined : eq(vehicles.province, user.province ?? "-");
  return db
    .select({
      type: services.type,
      total: sql<number>`sum(${services.cost})::float`,
      count: sql<number>`count(*)::int`,
    })
    .from(services)
    .innerJoin(vehicles, eq(vehicles.id, services.vehicleId))
    .where(where)
    .groupBy(services.type)
    .orderBy(desc(sql`sum(${services.cost})`));
}

export async function costByProvince(user: User) {
  const where =
    user.role === "admin" ? undefined : eq(vehicles.province, user.province ?? "-");
  return db
    .select({
      province: vehicles.province,
      total: sql<number>`coalesce(sum(${services.cost}),0)::float`,
      vehicleCount: sql<number>`count(distinct ${vehicles.id})::int`,
    })
    .from(vehicles)
    .leftJoin(services, eq(services.vehicleId, vehicles.id))
    .where(where)
    .groupBy(vehicles.province)
    .orderBy(desc(sql`coalesce(sum(${services.cost}),0)`));
}

export async function freeDrivers(user: User, includeId?: number | null) {
  const list = await listDrivers(user);
  return list.filter((d) => !d.vehicleId || d.vehicleId === includeId);
}

export async function vehiclesOfProvince(province: string) {
  return db.select().from(vehicles).where(and(eq(vehicles.province, province)));
}
