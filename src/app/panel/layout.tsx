import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import { buildAlerts, listVehicles } from "@/lib/data";
import Shell from "@/components/Shell";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = await listVehicles(user);
  const overdue = buildAlerts(rows).filter((a) => a.urgency === "overdue").length;

  return (
    <Shell
      user={{
        fullName: user.fullName,
        role: user.role,
        province: user.province,
        username: user.username,
      }}
      overdueCount={overdue}
    >
      {children}
    </Shell>
  );
}
