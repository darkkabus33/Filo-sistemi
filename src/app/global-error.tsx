"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FiloBakimPro] global error:", error);
  }, [error]);

  return (
    <html lang="tr">
      <body className="flex min-h-screen items-center justify-center bg-[#070b14] p-6 text-slate-100">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-6 text-center shadow-2xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-2xl">
            ⚠
          </div>
          <h1 className="text-lg font-bold text-slate-100">Uygulama yüklenemedi</h1>
          <p className="mt-2 text-sm text-slate-400">
            Kritik bir hata meydana geldi. Sayfayı yenileyerek devam edebilirsiniz.
          </p>
          {error?.digest && (
            <p className="mt-2 font-mono text-[11px] text-slate-600">Hata Kodu: {error.digest}</p>
          )}
          <div className="mt-5 flex justify-center gap-2">
            <button
              onClick={() => reset()}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500"
            >
              Tekrar Dene
            </button>
            <a
              href="/login"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              Girişe Dön
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
