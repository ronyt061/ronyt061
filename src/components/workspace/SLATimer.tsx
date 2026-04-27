"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { TicketRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatRemaining, summarize } from "@/lib/sla";

const STYLES: Record<string, string> = {
  healthy: "text-emerald-700 bg-emerald-50 ring-emerald-100",
  amber: "text-amber-700 bg-amber-50 ring-amber-100",
  breached: "text-red-700 bg-red-50 ring-red-100",
  met: "text-ink-500 bg-ink-50 ring-ink-100"
};

export function SLATimer({
  ticket,
  compact = false
}: {
  ticket: TicketRow;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30_000);
    const onFocus = () => setNow(Date.now());
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(i);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const summary = summarize(ticket, now);
  const target = summary.next || summary.responded_target || summary.resolution_target;
  if (!target) return null;
  const Icon =
    target.state === "breached" ? AlertTriangle : target.state === "met" ? CheckCircle2 : Clock;
  const text =
    target.state === "met"
      ? `${target.label} met`
      : `${target.label} ${target.state === "breached" ? formatRemaining(target.remaining_ms) : `due in ${formatRemaining(target.remaining_ms)}`}`;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ring-1",
          STYLES[target.state]
        )}
        title={text}
      >
        <Icon size={9} />
        {target.state === "breached" ? "breached" : formatRemaining(target.remaining_ms)}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1",
        STYLES[target.state]
      )}
    >
      <Icon size={11} />
      {text}
    </span>
  );
}
