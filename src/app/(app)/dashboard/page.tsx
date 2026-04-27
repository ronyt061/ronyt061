import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Frown,
  Gauge,
  HeartHandshake,
  Inbox as InboxIcon,
  Sparkles,
  TimerReset
} from "lucide-react";
import { db } from "@/lib/db";
import { dashboardKPIs } from "@/lib/kpi";
import { listAccounts } from "@/lib/repo/accounts";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { QueueHealth } from "@/components/dashboard/QueueHealth";
import { SentimentHeatmap } from "@/components/dashboard/SentimentHeatmap";
import { timeAgo } from "@/lib/utils";
import { SentimentBadge } from "@/components/workspace/SentimentBadge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const kpi = dashboardKPIs();

  const sentimentRows = listAccounts().map((a) => {
    const row = db
      .prepare(
        `SELECT COALESCE(AVG(sentiment_score), 0) AS s, COUNT(*) AS n
           FROM tickets WHERE account_id = ? AND status != 'resolved'`
      )
      .get(a.id) as { s: number; n: number };
    return {
      account_id: a.id,
      account_name: a.name,
      tier: a.tier,
      health_score: a.health_score,
      open_count: row.n,
      avg_sentiment: Math.round(row.s)
    };
  });

  return (
    <>
      <header className="flex items-center justify-between border-b border-ink-100 px-6 py-3">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-ink-900">Dashboard</h1>
          <p className="text-[11px] text-ink-500">
            Real-time queue health, SLA risk, and customer sentiment.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-indigo-100">
          <Sparkles size={11} /> AI scoring active
        </span>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto bg-ink-50/30 p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard icon={InboxIcon} label="Open" value={kpi.open} href="/inbox?view=all" />
          <KpiCard icon={TimerReset} label="Pending" value={kpi.pending} href="/inbox?view=all" />
          <KpiCard
            icon={AlertTriangle}
            label="Breaching SLA"
            value={kpi.breaching}
            tone={kpi.breaching > 0 ? "bad" : "good"}
            href="/inbox?view=breaching"
          />
          <KpiCard
            icon={Frown}
            label="Negative sentiment"
            value={kpi.negative_sentiment}
            tone={kpi.negative_sentiment > 0 ? "warn" : "good"}
            href="/inbox?view=negative"
          />
          <KpiCard
            icon={Clock}
            label="Median first response"
            value={kpi.median_first_response_minutes != null ? `${kpi.median_first_response_minutes}m` : "—"}
            tone="default"
          />
          <KpiCard
            icon={HeartHandshake}
            label="CSAT"
            value={kpi.csat_avg != null ? kpi.csat_avg.toFixed(1) : "—"}
            tone={kpi.csat_avg != null && kpi.csat_avg >= 4 ? "good" : "default"}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <QueueHealth data={kpi.daily} />
          </div>
          <div className="rounded-xl border border-ink-100 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                Open by tier
              </span>
              <Gauge size={12} className="text-ink-400" />
            </div>
            <ul className="space-y-1.5">
              {kpi.open_by_tier.map((r) => (
                <li key={r.tier} className="flex items-center justify-between text-xs">
                  <span className="capitalize text-ink-700">{r.tier}</span>
                  <span className="font-mono tabular-nums text-ink-900">{r.count}</span>
                </li>
              ))}
              {kpi.open_by_tier.length === 0 && (
                <li className="text-xs text-ink-400">No open tickets.</li>
              )}
            </ul>
            <div className="mt-3 border-t border-ink-100 pt-2.5">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                Open by team
              </div>
              <ul className="space-y-1">
                {kpi.open_by_team.map((t) => (
                  <li key={t.team_id} className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-ink-700">
                      <span className="h-2 w-2 rounded-full" style={{ background: t.team_color }} />
                      {t.team_name}
                    </span>
                    <span className="font-mono tabular-nums text-ink-900">{t.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-ink-100 bg-white">
            <div className="flex items-center justify-between border-b border-ink-100 px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                Recent activity
              </span>
              <CheckCircle2 size={12} className="text-ink-400" />
            </div>
            <ul className="divide-y divide-ink-100">
              {kpi.recent_activity.map((r) => (
                <li key={r.number}>
                  <Link
                    href={`/tickets/${r.number}`}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-ink-50"
                  >
                    <SentimentBadge score={r.sentiment_score} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium text-ink-900">
                        <span className="text-ink-400">#{r.number}</span> {r.subject}
                      </div>
                      <div className="truncate text-[11px] text-ink-500">
                        {r.contact_name || "—"}
                        {r.account_name ? ` · ${r.account_name}` : ""}
                      </div>
                    </div>
                    <span className="text-[10px] text-ink-400">{timeAgo(r.updated_at)} ago</span>
                  </Link>
                </li>
              ))}
              {kpi.recent_activity.length === 0 && (
                <li className="px-3 py-3 text-xs text-ink-400">No activity yet.</li>
              )}
            </ul>
          </div>
          <SentimentHeatmap rows={sentimentRows} />
        </div>
      </div>
    </>
  );
}
