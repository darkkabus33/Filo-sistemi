import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listDrivers, listVehicles } from "@/lib/data";
import VehicleTable from "@/components/VehicleTable";
import ModalForm from "@/components/ModalForm";
import VehicleFields from "@/components/VehicleFields";
import ActionButton from "@/components/ActionButton";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = await listVehicles(user);
  const drivers = await listDrivers(user);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">Araçlar</h1>
          <p className="mt-1 text-sm text-slate-400">
            Her araç bir sürücüye zimmetlidir. Detay için araca tıklayın.
          </p>
        </div>
        <ModalForm
          trigger="+ Yeni Araç"
          title="Yeni Araç Ekle"
          description="Araç bilgilerini ve zimmet edilecek sürücüyü seçin."
          endpoint="/api/vehicles"
          wide
        >
          <VehicleFields
            vehicle={null}
            drivers={drivers.map((d) => ({
              id: d.id,
              fullName: d.fullName,
              province: d.province,
              rotationScore: d.rotationScore,
              plate: d.plate,
            }))}
            isAdmin={user.role === "admin"}
            province={user.province}
          />
        </ModalForm>
      </div>

      <VehicleTable rows={rows} />
    </div>
  );
}
