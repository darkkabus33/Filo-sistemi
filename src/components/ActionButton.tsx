"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postForm } from "@/lib/client";

export default function ActionButton({
  endpoint,
  payload,
  label,
  confirmText,
  className = "",
  redirectTo,
  busyLabel = "...",
}: {
  endpoint: string;
  payload?: Record<string, string>;
  label: string;
  confirmText?: string;
  className?: string;
  redirectTo?: string;
  busyLabel?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (busy) return;
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    const res = await postForm(endpoint, payload ?? {});
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "İşlem tamamlanamadı.");
      setTimeout(() => setError(null), 5000);
      return;
    }
    const target = res.redirect ?? redirectTo;
    if (target) {
      window.location.href = target;
      return;
    }
    router.refresh();
  }

  return (
    <span className="relative inline-flex">
      <button type="button" onClick={run} disabled={busy} className={className}>
        {busy ? busyLabel : label}
      </button>
      {error && (
        <span className="absolute right-0 top-full z-40 mt-1 w-56 rounded-lg border border-red-500/40 bg-slate-900 px-3 py-2 text-[11px] text-red-300 shadow-xl">
          {error}
        </span>
      )}
    </span>
  );
}
