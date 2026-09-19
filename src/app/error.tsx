"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FiloBakimPro] client error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-2xl">
          ⚠
        </div>
        <h1 className="text-lg font-bold text-slate-100">Bir sorun oluştu</h1>
        <p className="mt-2 text-sm text-slate-400">
          İşlem gerçekleştirilirken beklenmeyen bir durum oluştu. Yeniden deneyebilir veya ana panele dönebilirsiniz.
        </p>
        {error?.digest && (
          <p className="mt-2 font-mono text-[11px] text-slate-600">kod: {error.digest}</p>
        )}
        <div className="mt-5 flex flex-col gap-2">
          <button
            onClick={() => reset()}
            className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            Yeniden Dene
          </button>
          <div className="flex gap-2">
            <a
              href="/panel"
              className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              Ana Panele Dön
            </a>
            <a
              href="/api/auth/logout"
              className="flex-1 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
            >
              Çıkış Yap
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
