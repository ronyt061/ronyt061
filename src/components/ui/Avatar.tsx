import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

export function Avatar({
  name,
  size = 24,
  className
}: {
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const text = initials(name || null);
  const seed = (name || "?").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = seed % 360;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background: `hsl(${hue} 28% 48%)`
      }}
      aria-label={name || "unknown"}
    >
      {text}
    </span>
  );
}
