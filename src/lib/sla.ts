import type { SLAState, TicketRow } from "./types";

const AMBER_AT = 0.5; // remaining-time fraction at which we go amber

function parseSqliteTs(iso: string): number {
  return new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime();
}

export interface SLATarget {
  label: "First response" | "Resolution";
  due_at: string;
  remaining_ms: number;
  fraction_remaining: number; // 0..1, can be negative when breached
  state: SLAState;
}

export interface SLASummary {
  next: SLATarget | null;
  responded_target: SLATarget | null;
  resolution_target: SLATarget | null;
}

export function summarize(ticket: TicketRow, now = Date.now()): SLASummary {
  const created = parseSqliteTs(ticket.created_at);
  const respondedTarget = sloTarget(
    ticket.first_response_due_at,
    created,
    now,
    !!ticket.first_responded_at,
    "First response"
  );
  const resolutionTarget = sloTarget(
    ticket.resolution_due_at,
    created,
    now,
    ticket.status === "resolved",
    "Resolution"
  );

  let next: SLATarget | null = null;
  if (ticket.status !== "resolved") {
    if (respondedTarget && respondedTarget.state !== "met") next = respondedTarget;
    else if (resolutionTarget && resolutionTarget.state !== "met") next = resolutionTarget;
  }
  return {
    next,
    responded_target: respondedTarget,
    resolution_target: resolutionTarget
  };
}

function sloTarget(
  due_at: string | null,
  startedMs: number,
  nowMs: number,
  isMet: boolean,
  label: SLATarget["label"]
): SLATarget | null {
  if (!due_at) return null;
  const due = parseSqliteTs(due_at);
  const remaining = due - nowMs;
  const total = Math.max(due - startedMs, 1);
  const fraction = remaining / total;
  let state: SLAState;
  if (isMet) state = "met";
  else if (remaining <= 0) state = "breached";
  else if (fraction <= AMBER_AT) state = "amber";
  else state = "healthy";
  return { label, due_at, remaining_ms: remaining, fraction_remaining: fraction, state };
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) {
    const overdue = -ms;
    const m = Math.floor(overdue / 60_000);
    if (m < 60) return `breached ${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `breached ${h}h`;
    const d = Math.floor(h / 24);
    return `breached ${d}d`;
  }
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}
