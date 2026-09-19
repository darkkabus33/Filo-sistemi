import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
        <p className="text-4xl">🚧</p>
        <h1 className="mt-3 text-lg font-bold text-slate-100">Kayıt bulunamadı</h1>
        <p className="mt-2 text-sm text-slate-400">
          Aradığınız sayfa veya araç kaydı mevcut değil.
        </p>
        <Link
          href="/panel"
          className="mt-5 inline-block rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500"
        >
          Panele Dön
        </Link>
      </div>
    </div>
  );
}
