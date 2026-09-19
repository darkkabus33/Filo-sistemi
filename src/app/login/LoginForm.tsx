"use client";

import { useEffect, useState } from "react";

export default function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if error is in URL search params (e.g. redirected from native form POST)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "invalid") setError("Kullanıcı adı veya şifre hatalı.");
    else if (err === "missing") setError("Kullanıcı adı ve şifre zorunludur.");
    else if (err === "inactive") setError("Hesabınız pasif durumda. Yöneticinize başvurun.");
    else if (err === "server") setError("Giriş sırasında sunucu hatası oluştu. Lütfen tekrar deneyin.");
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const formEl = e.currentTarget;
    const fd = new FormData(formEl);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: fd,
        headers: {
          Accept: "application/json",
        },
      });

      let data: { ok?: boolean; error?: string; redirect?: string } = {};
      try {
        data = await res.json();
      } catch {
        // Not JSON
      }

      if (!res.ok || !data.ok) {
        setError(data.error ?? "Kullanıcı adı veya şifre hatalı.");
        setBusy(false);
        return;
      }

      // Successful login -> Redirect to panel
      window.location.href = data.redirect ?? "/panel";
    } catch {
      // In case fetch fails (network glitch, strict adblock, cross-origin sandbox),
      // safely fallback to standard HTML form POST which ALWAYS works!
      formEl.submit();
    }
  }

  const cls =
    "w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20";

  return (
    <form onSubmit={onSubmit} action="/api/auth/login" method="POST" className="space-y-4">
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-slate-300">Kullanıcı Adı</span>
        <input
          name="username"
          required
          autoComplete="username"
          placeholder="admin"
          className={cls}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-slate-300">Şifre</span>
        <input
          name="password"
          required
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className={cls}
        />
      </label>
      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="mt-2 w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60"
      >
        {busy ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}
