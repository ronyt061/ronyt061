import { cn } from "@/lib/utils";

export function ComplexityBar({ score, className }: { score: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, score));
  const fill =
    pct >= 60 ? "bg-red-500" : pct >= 30 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <span
      className={cn("inline-flex h-1 w-10 overflow-hidden rounded-full bg-ink-100", className)}
      title={`Complexity ${pct}/100`}
    >
      <span className={cn("block h-full", fill)} style={{ width: `${pct}%` }} />
    </span>
  );
}
