import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  date,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("il_muduru"), // admin | il_muduru
  province: text("province"),
  phone: text("phone"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  identityNo: text("identity_no"),
  licenseNo: text("license_no"),
  licenseClass: text("license_class"),
  province: text("province").notNull().default("İSTANBUL"),
  rotationScore: integer("rotation_score").notNull().default(0),
  hireDate: date("hire_date"),
  note: text("note"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  plate: text("plate").notNull().unique(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  modelYear: integer("model_year").notNull().default(2020),
  color: text("color"),
  chassisNo: text("chassis_no"),
  fuelType: text("fuel_type").default("Dizel"),
  province: text("province").notNull().default("İSTANBUL"),
  driverId: integer("driver_id"),
  assignedAt: date("assigned_at"),
  currentKm: integer("current_km").notNull().default(0),
  lastServiceKm: integer("last_service_km").notNull().default(0),
  serviceIntervalKm: integer("service_interval_km").notNull().default(15000),
  annualServiceDate: date("annual_service_date"),
  inspectionDate: date("inspection_date"),
  insuranceDate: date("insurance_date"),
  kaskoDate: date("kasko_date"),
  note: text("note"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  type: text("type").notNull(), // yillik_bakim | fenni_muayene | sigorta | kasko | onarim | lastik | yakit | diger
  serviceDate: date("service_date").notNull(),
  km: integer("km").notNull().default(0),
  title: text("title").notNull(),
  description: text("description"),
  company: text("company"),
  invoiceNo: text("invoice_no"),
  cost: numeric("cost", { precision: 12, scale: 2 }).notNull().default("0"),
  nextDate: date("next_date"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const kmLogs = pgTable("km_logs", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  logDate: date("log_date").notNull(),
  km: integer("km").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;
export type Service = typeof services.$inferSelect;
export type KmLog = typeof kmLogs.$inferSelect;
