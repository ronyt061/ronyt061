import Link from "next/link";
import { cn } from "@/lib/utils";

interface AccountSentiment {
  account_id: string;
  account_name: string;
  tier: string;
  health_score: number;
  open_count: number;
  avg_sentiment: number;
}

export function SentimentHeatmap({ rows }: { rows: AccountSentiment[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-ink-100 bg-white p-4 text-center text-xs text-ink-400">
        No accounts yet.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-ink-100 bg-white">
      <div className="border-b border-ink-100 px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
          Sentiment by account
        </span>
      </div>
      <ul className="divide-y divide-ink-100">
        {rows.map((r) => (
          <li key={r.account_id}>
            <Link
              href={`/inbox?view=all&account_id=${r.account_id}`}
              className="flex items-center gap-3 px-3 py-2 hover:bg-ink-50"
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  r.avg_sentiment >= 25
                    ? "bg-emerald-500"
                    : r.avg_sentiment <= -25
                    ? "bg-red-500"
                    : "bg-ink-300"
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-ink-900">{r.account_name}</div>
                <div className="text-[10px] text-ink-500">
                  {r.tier} · {r.open_count} open · health {r.health_score}
                </div>
              </div>
              <span
                className={cn(
                  "tabular-nums text-[11px] font-medium",
                  r.avg_sentiment >= 0 ? "text-emerald-700" : "text-red-700"
                )}
              >
                {r.avg_sentiment > 0 ? "+" : ""}
                {r.avg_sentiment}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
