import { cn } from "@/lib/utils";
import { Building2 } from "lucide-react";

const TIER: Record<string, string> = {
  gold: "bg-amber-100 text-amber-800 ring-amber-200",
  silver: "bg-ink-100 text-ink-700 ring-ink-200",
  bronze: "bg-orange-50 text-orange-700 ring-orange-200"
};

export function AccountChip({
  name,
  tier,
  className
}: {
  name: string;
  tier?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1",
        tier ? TIER[tier] || TIER.bronze : "bg-ink-100 text-ink-600 ring-ink-200",
        className
      )}
      title={tier ? `${name} · ${tier}` : name}
    >
      <Building2 size={9} />
      <span className="max-w-[100px] truncate">{name}</span>
    </span>
  );
}
