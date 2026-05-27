"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type {
  Account,
  Asset,
  Contact,
  Contract,
  Message,
  Tag,
  TicketRow,
  TicketPriority,
  TicketStatus
} from "@/lib/types";
import type { Customer360RecentTicket } from "./Customer360";
import { Avatar } from "@/components/ui/Avatar";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Composer } from "@/components/Composer";
import { AIAssistPanel } from "./AIAssistPanel";
import { Customer360 } from "./Customer360";
import { SLATimer } from "./SLATimer";
import { SentimentBadge } from "./SentimentBadge";
import { ComplexityBar } from "./ComplexityBar";
import { AccountChip } from "./AccountChip";

const STATUS_NEXT: Record<TicketStatus, { next: TicketStatus; label: string }> = {
  open: { next: "resolved", label: "Resolve" },
  pending: { next: "resolved", label: "Resolve" },
  resolved: { next: "open", label: "Reopen" }
};
const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];

export function TicketWorkspace({
  ticket,
  messages,
  contact,
  account,
  contracts,
  recent,
  tags,
  asset,
  agents,
  teams
}: {
  ticket: TicketRow;
  messages: Message[];
  contact: Contact;
  account: Account | null;
  contracts: Contract[];
  recent: Customer360RecentTicket[];
  tags: Tag[];
  asset: Asset | null;
  agents: { id: string; name: string }[];
  teams: { id: string; name: string; color: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [thread, setThread] = useState(messages);
  const [draftBody, setDraftBody] = useState("");

  function refresh() {
    start(() => router.refresh());
  }

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    refresh();
  }

  const flip = STATUS_NEXT[ticket.status as TicketStatus];

  return (
    <div className="flex min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-ink-100 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[11px] font-mono text-ink-400">#{ticket.number}</span>
              <span className="truncate text-sm font-semibold text-ink-900">{ticket.subject}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500">
              <span>{contact.name || contact.email}</span>
              {ticket.account_name && (
                <AccountChip name={ticket.account_name} tier={ticket.account_tier} />
              )}
              <SLATimer ticket={ticket} />
              <SentimentBadge score={ticket.sentiment_score} />
              <span className="inline-flex items-center gap-1">
                <ComplexityBar score={ticket.complexity_score} /> {ticket.complexity_score}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <SmallSelect
              value={ticket.priority}
              onChange={(v) => patch({ priority: v })}
              items={PRIORITIES.map((p) => ({ value: p, label: p }))}
              label="Priority"
            />
            <SmallSelect
              value={ticket.team_id || ""}
              onChange={(v) => patch({ team_id: v || null })}
              items={[{ value: "", label: "No team" }, ...teams.map((t) => ({ value: t.id, label: t.name }))]}
              label="Team"
            />
            <SmallSelect
              value={ticket.assignee_id || ""}
              onChange={(v) => patch({ assignee_id: v || null })}
              items={[{ value: "", label: "Unassigned" }, ...agents.map((a) => ({ value: a.id, label: a.name }))]}
              label="Assignee"
            />
            {ticket.status !== "pending" && (
              <Button size="sm" variant="outline" onClick={() => patch({ status: "pending" })} disabled={pending}>
                Pending
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={() => patch({ status: flip.next })} disabled={pending}>
              {flip.label}
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ul className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {thread.map((m) => (
              <Bubble key={m.id} m={m} contact={contact} />
            ))}
          </ul>
        </div>

        <div className="border-t border-ink-100 px-4 pt-2.5">
          <div className="mx-auto w-full max-w-3xl">
            <AIAssistPanel ticketId={ticket.id} onInsert={(text) => setDraftBody(text)} />
          </div>
        </div>

        <Composer
          ticketId={ticket.id}
          contact={contact}
          onSent={(m) => setThread((p) => [...p, m])}
          initialBody={draftBody}
          onConsumeInitial={() => setDraftBody("")}
        />
      </div>

      <Customer360
        ticket={ticket}
        contact={contact}
        account={account}
        contracts={contracts}
        recent={recent}
        tags={tags}
        asset={asset}
      />
    </div>
  );
}

function Bubble({ m, contact }: { m: Message; contact: Contact }) {
  const isAgent = !!m.author_id;
  const isNote = m.kind === "note";
  const who = isAgent ? m.author_name || "Agent" : m.contact_name || contact.name || contact.email;
  return (
    <li className={cn("flex w-full gap-3", isAgent ? "justify-end" : "justify-start")}>
      {!isAgent && <Avatar name={who} size={26} className="mt-1" />}
      <div className={cn("max-w-[70%]")}>
        <div className={cn("mb-1 flex items-baseline gap-2", isAgent ? "justify-end" : "")}>
          <span className="text-[11px] font-medium text-ink-700">{who}</span>
          {!isNote && <SentimentBadge score={m.sentiment_score} size={10} />}
          <span className="text-[10px] text-ink-400">{timeAgo(m.created_at)} ago</span>
        </div>
        <div
          className={cn(
            "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isNote
              ? "border border-amber-200 bg-amber-50 text-amber-900"
              : isAgent
              ? "bg-ink-900 text-white"
              : "bg-ink-100 text-ink-900"
          )}
        >
          {m.body}
        </div>
        {isNote && (
          <div className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-amber-700">
            <ChevronRight size={10} /> Internal note
          </div>
        )}
      </div>
      {isAgent && <Avatar name={who} size={26} className="mt-1" />}
    </li>
  );
}

function SmallSelect({
  value,
  onChange,
  items,
  label
}: {
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: string }[];
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-1 rounded-md border border-ink-200 bg-white px-2 py-1 text-[11px] text-ink-700 hover:border-ink-300">
      <span className="text-ink-400">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-[11px] capitalize text-ink-900 focus:outline-none"
      >
        {items.map((i) => (
          <option key={i.value} value={i.value}>
            {i.label}
          </option>
        ))}
      </select>
    </label>
  );
}
