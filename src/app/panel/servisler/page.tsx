import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listExpenses, listVehicles } from "@/lib/data";
import ExpenseTable from "@/components/ExpenseTable";
import ModalForm from "@/components/ModalForm";
import ServiceFields from "@/components/ServiceFields";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [rows, vehicles] = await Promise.all([listExpenses(user), listVehicles(user)]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">Servis & Bakım Kayıtları</h1>
          <p className="mt-1 text-sm text-slate-400">
            Yapılan tüm bakım, muayene, sigorta ve onarım işlemleri
          </p>
        </div>
        <ModalForm
          trigger="+ Yeni Servis Kaydı"
          title="Yeni Servis / Bakım Kaydı"
          description="İşlem sonrası hatırlatma tarihi girerseniz araç kartı otomatik güncellenir."
          endpoint="/api/services"
          wide
        >
          <ServiceFields vehicles={vehicles.map((v) => ({ id: v.id, plate: v.plate }))} />
        </ModalForm>
      </div>

      <ExpenseTable rows={rows} deletable />
    </div>
  );
}
