import { cn } from "@/lib/utils";
import { Frown, Meh, Smile } from "lucide-react";

export function SentimentBadge({ score, size = 12 }: { score: number; size?: number }) {
  const label = score >= 25 ? "positive" : score <= -25 ? "negative" : "neutral";
  const Icon = label === "positive" ? Smile : label === "negative" ? Frown : Meh;
  const color =
    label === "positive"
      ? "text-emerald-600"
      : label === "negative"
      ? "text-red-600"
      : "text-ink-400";
  return (
    <span title={`Sentiment ${score > 0 ? "+" : ""}${score}`} className={cn("inline-flex", color)}>
      <Icon size={size} />
    </span>
  );
}
