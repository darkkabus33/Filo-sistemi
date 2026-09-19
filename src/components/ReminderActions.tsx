"use client";

import { useState } from "react";

export default function ReminderActions({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
        >
          ✉ E-posta Önizle
        </button>
        <button
          onClick={() => {
            setSent(true);
            setTimeout(() => setSent(false), 3000);
          }}
          className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500"
        >
          {sent ? "✓ Hatırlatma oluşturuldu" : "➤ Hatırlatma Gönder"}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
              <h3 className="text-sm font-semibold text-slate-100">Hatırlatma E-postası Önizleme</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>
            <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap p-5 text-xs leading-relaxed text-slate-300">
              {text}
            </pre>
            <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-3">
              <button
                onClick={() => navigator.clipboard?.writeText(text)}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
              >
                Kopyala
              </button>
              <a
                href={`mailto:?subject=${encodeURIComponent("Filo Bakım Hatırlatmaları")}&body=${encodeURIComponent(text)}`}
                className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500"
              >
                E-posta Aç
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
