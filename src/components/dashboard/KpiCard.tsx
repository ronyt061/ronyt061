import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  tone,
  href
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  delta?: string;
  tone?: "default" | "warn" | "bad" | "good";
  href?: string;
}) {
  const accent =
    tone === "bad"
      ? "from-red-50 to-white ring-red-100"
      : tone === "warn"
      ? "from-amber-50 to-white ring-amber-100"
      : tone === "good"
      ? "from-emerald-50 to-white ring-emerald-100"
      : "from-ink-50 to-white ring-ink-100";
  const iconColor =
    tone === "bad"
      ? "text-red-600"
      : tone === "warn"
      ? "text-amber-600"
      : tone === "good"
      ? "text-emerald-600"
      : "text-ink-500";

  const inner = (
    <div
      className={cn(
        "group flex h-full flex-col justify-between rounded-xl bg-gradient-to-b p-3 ring-1 transition-shadow",
        accent,
        href && "hover:shadow-sm"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{label}</span>
        <Icon size={13} className={iconColor} />
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-semibold text-ink-900">{value}</span>
        {delta && <span className="text-[11px] text-ink-500">{delta}</span>}
        {href && (
          <ArrowRight
            size={12}
            className="text-ink-300 opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
