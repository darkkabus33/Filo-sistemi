import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeeded } from "@/lib/seed";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  await ensureSeeded();
  const user = await getCurrentUser();
  if (user) redirect("/panel");

  const sp = await searchParams;
  const errorParam = sp?.error;
  let serverError: string | null = null;
  if (errorParam === "invalid") serverError = "Kullanıcı adı veya şifre hatalı.";
  else if (errorParam === "missing") serverError = "Kullanıcı adı ve şifre zorunludur.";
  else if (errorParam === "inactive") serverError = "Hesabınız pasif durumda. Yöneticinize başvurun.";

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 text-3xl">
            🚚
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">FiloBakım Pro</h1>
          <p className="mt-1 text-sm text-slate-400">
            Araç bakım, fenni muayene, sigorta ve zimmet takip sistemi
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl shadow-black/40">
          {serverError && (
            <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {serverError}
            </p>
          )}
          <LoginForm />
        </div>

        <div className="mt-5 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 text-xs text-slate-400">
          <p className="mb-2 font-semibold text-slate-300">Demo giriş bilgileri</p>
          <ul className="space-y-1">
            <li>
              <span className="text-sky-300">Ana Panel (Yönetici):</span> admin / admin123
            </li>
            <li>
              <span className="text-violet-300">İl Müdürü örneği:</span> istanbul / istanbul34
            </li>
            <li>
              <span className="text-violet-300">Diğer:</span> ankara / ankara06 — izmir / izmir35
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
