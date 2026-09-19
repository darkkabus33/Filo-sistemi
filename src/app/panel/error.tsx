"use client";

import { useEffect } from "react";

export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FiloBakimPro] panel error:", error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-red-500/30 bg-slate-900/80 p-8 text-center shadow-xl">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-2xl">
        ⚠
      </div>
      <h2 className="text-base font-bold text-slate-100">Bu bölüm yüklenirken bir hata oluştu</h2>
      <p className="mt-1 text-sm text-slate-400">
        İçerik yüklenemedi. Diğer menülere sol taraftan erişmeye devam edebilir veya bu bölümü yeniden deneyebilirsiniz.
      </p>
      {error?.digest && (
        <p className="mt-2 font-mono text-[11px] text-slate-600">Hata Kodu: {error.digest}</p>
      )}
      <div className="mt-5 flex justify-center gap-2">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sky-500"
        >
          Yeniden Dene
        </button>
        <a
          href="/panel"
          className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 transition hover:bg-slate-800"
        >
          Ana Panele Dön
        </a>
      </div>
    </div>
  );
}
