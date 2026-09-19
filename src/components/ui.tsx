import type { ReactNode } from "react";
import { urgencyClass, type Urgency } from "@/lib/fleet";

export function Card({
  children,
  className = "",
  title,
  icon,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-sm shadow-lg shadow-black/20 ${className}`}
    >
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-200">
            {icon}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Plate({ value, small = false }: { value: string; small?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-amber-300/60 bg-amber-400 font-mono font-bold tracking-wider text-black ${
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      }`}
    >
      {value}
    </span>
  );
}

export function UrgencyBadge({ urgency, label }: { urgency: Urgency; label: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${urgencyClass(urgency)}`}
    >
      {label}
    </span>
  );
}

export function Dot({ urgency }: { urgency: Urgency }) {
  const color =
    urgency === "overdue"
      ? "bg-red-500"
      : urgency === "soon"
        ? "bg-amber-400"
        : urgency === "upcoming"
          ? "bg-sky-400"
          : "bg-emerald-400";
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "slate",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  tone?: "slate" | "sky" | "violet" | "red" | "emerald" | "amber";
}) {
  const tones: Record<string, string> = {
    slate: "text-slate-300 bg-slate-800/70",
    sky: "text-sky-300 bg-sky-500/15",
    violet: "text-violet-300 bg-violet-500/15",
    red: "text-red-300 bg-red-500/15",
    emerald: "text-emerald-300 bg-emerald-500/15",
    amber: "text-amber-300 bg-amber-500/15",
  };
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-50">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <span className={`rounded-xl p-2 text-lg ${tones[tone]}`}>{icon}</span>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-xs ${className}`}>
      <span className="mb-1 block font-medium text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20";

export function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-500">
      {text}
    </p>
  );
}
