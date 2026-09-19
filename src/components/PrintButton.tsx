"use client";

export default function PrintButton({ label = "🖨 Zimmet Raporu Yazdır" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
    >
      {label}
    </button>
  );
}
