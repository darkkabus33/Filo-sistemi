"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { postForm } from "@/lib/client";

export default function ModalForm({
  trigger,
  title,
  description,
  endpoint,
  children,
  submitLabel = "Kaydet",
  triggerClass = "rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-500",
  wide = false,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  /** Stable REST endpoint, e.g. "/api/vehicles" */
  endpoint: string;
  children: ReactNode;
  submitLabel?: string;
  triggerClass?: string;
  wide?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await postForm(endpoint, fd);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "İşlem tamamlanamadı.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={triggerClass}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {trigger}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6">
          <div
            className={`my-6 w-full rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl ${
              wide ? "max-w-3xl" : "max-w-xl"
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-100">{title}</h3>
                {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onSubmit} className="px-5 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
              {error && (
                <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
                >
                  {busy ? "Kaydediliyor..." : submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
