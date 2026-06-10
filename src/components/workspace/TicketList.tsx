"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { TicketRow } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { cn, timeAgo } from "@/lib/utils";
import { SLATimer } from "./SLATimer";
import { SentimentBadge } from "./SentimentBadge";
import { ComplexityBar } from "./ComplexityBar";
import { AccountChip } from "./AccountChip";

const STATUS_DOT: Record<string, string> = {
  open: "bg-amber-500",
  pending: "bg-sky-500",
  resolved: "bg-emerald-500"
};

export function TicketList({
  tickets,
  basePath = "/inbox",
  selectable = true
}: {
  tickets: TicketRow[];
  basePath?: string;
  selectable?: boolean;
}) {
  const params = useSearchParams();
  const selected = params.get("id");

  if (tickets.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16 text-center">
        <div>
          <div className="mx-auto mb-2 h-2 w-2 rounded-full bg-emerald-500" />
          <p className="text-sm font-medium text-ink-900">All clear in this view.</p>
          <p className="mt-1 text-xs text-ink-500">Nothing to act on right now.</p>
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-ink-100">
      {tickets.map((t) => {
        const active = selectable && selected === t.id;
        const last = t.last_message_at || t.updated_at;
        const tags = (t.tags || "").split(",").filter(Boolean).slice(0, 3);
        const search = new URLSearchParams(params.toString());
        search.set("id", t.id);
        const href = selectable
          ? `${basePath}?${search.toString()}`
          : `/tickets/${t.number}`;
        return (
          <li key={t.id}>
            <Link
              href={href}
              className={cn(
                "flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                active ? "bg-ink-50" : "hover:bg-ink-50/60"
              )}
            >
              <span
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  STATUS_DOT[t.status] || "bg-ink-300"
                )}
              />
              <Avatar name={t.contact_name || t.contact_email} size={26} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-xs font-medium text-ink-900">
                    {t.contact_name || t.contact_email}
                  </span>
                  <span className="text-[10px] text-ink-400">#{t.number}</span>
                  <span className="ml-auto whitespace-nowrap text-[10px] text-ink-400">
                    {timeAgo(last)}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-ink-700">{t.subject}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {t.account_name && (
                    <AccountChip name={t.account_name} tier={t.account_tier} />
                  )}
                  <SLATimer ticket={t} compact />
                  <SentimentBadge score={t.sentiment_score} />
                  <ComplexityBar score={t.complexity_score} />
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-ink-50 px-1 py-0.5 text-[10px] font-medium text-ink-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
