import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, vehicles } from "@/db/schema";
import { sql } from "drizzle-orm";
import { Field, inputClass } from "@/components/ui";
import ModalForm from "@/components/ModalForm";
import ActionButton from "@/components/ActionButton";
import { PROVINCES } from "@/lib/fleet";

export const dynamic = "force-dynamic";

type UserRow = typeof users.$inferSelect;

function UserFields({ u }: { u?: UserRow }) {
  return (
    <>
      <input type="hidden" name="id" defaultValue={u?.id ?? ""} />
      <Field label="Ad Soyad / Ünvan *">
        <input name="fullName" required defaultValue={u?.fullName ?? ""} className={inputClass} />
      </Field>
      <Field label="Kullanıcı Adı *">
        <input name="username" required defaultValue={u?.username ?? ""} className={inputClass} />
      </Field>
      <Field label={u ? "Yeni Şifre (boş bırakılırsa değişmez)" : "Şifre *"}>
        <input name="password" type="text" placeholder="••••••" className={inputClass} />
      </Field>
      <Field label="Telefon">
        <input name="phone" defaultValue={u?.phone ?? ""} className={inputClass} />
      </Field>
      <Field label="Rol">
        <select name="role" defaultValue={u?.role ?? "il_muduru"} className={inputClass}>
          <option value="il_muduru">İl Müdürü (sadece kendi ili)</option>
          <option value="admin">Ana Panel Yöneticisi (tüm filo)</option>
        </select>
      </Field>
      <Field label="İl">
        <select name="province" defaultValue={u?.province ?? PROVINCES[0]} className={inputClass}>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Durum">
        <select name="active" defaultValue={u ? String(u.active) : "true"} className={inputClass}>
          <option value="true">Aktif</option>
          <option value="false">Pasif</option>
        </select>
      </Field>
    </>
  );
}

export default async function UsersPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/panel");

  const list = await db.select().from(users).orderBy(users.role, users.username);
  const counts = await db
    .select({ province: vehicles.province, c: sql<number>`count(*)::int` })
    .from(vehicles)
    .groupBy(vehicles.province);
  const countMap = new Map(counts.map((c) => [c.province, c.c]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">İl Müdürleri & Kullanıcılar</h1>
          <p className="mt-1 text-sm text-slate-400">
            İl müdürü ekleyin, şifre verin; her müdür yalnızca kendi ilindeki araçları görür.
          </p>
        </div>
        <ModalForm trigger="+ Yeni Kullanıcı" title="Yeni Kullanıcı / İl Müdürü" endpoint="/api/users">
          <UserFields />
        </ModalForm>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((u) => (
          <div key={u.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-100">{u.fullName}</p>
                <p className="text-xs text-slate-400">@{u.username}</p>
              </div>
              <span
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                  u.role === "admin"
                    ? "bg-sky-500/15 text-sky-300"
                    : "bg-violet-500/15 text-violet-300"
                }`}
              >
                {u.role === "admin" ? "Yönetici" : "İl Müdürü"}
              </span>
            </div>
            <dl className="mt-3 space-y-1 text-xs text-slate-400">
              <div className="flex justify-between">
                <dt>İl</dt>
                <dd className="text-slate-300">{u.province ?? "Tüm iller"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Yetkili Araç</dt>
                <dd className="text-slate-300">
                  {u.role === "admin"
                    ? `${counts.reduce((s, c) => s + c.c, 0)} araç`
                    : `${countMap.get(u.province ?? "") ?? 0} araç`}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Telefon</dt>
                <dd className="text-slate-300">{u.phone ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Durum</dt>
                <dd className={u.active ? "text-emerald-300" : "text-red-300"}>
                  {u.active ? "Aktif" : "Pasif"}
                </dd>
              </div>
            </dl>
            <div className="mt-3 flex gap-2">
              <ModalForm
                trigger="Düzenle / Şifre Ver"
                title={`${u.fullName} · Düzenle`}
                endpoint="/api/users"
                triggerClass="flex-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
              >
                <UserFields u={u} />
              </ModalForm>
              {u.id !== me.id && (
                <ActionButton
                  endpoint="/api/users/delete"
                  payload={{ id: String(u.id) }}
                  label="Sil"
                  confirmText={`${u.fullName} kullanıcısı silinsin mi?`}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
