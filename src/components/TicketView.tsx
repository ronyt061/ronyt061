"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { Asset, Contact, Message, Tag, TicketRow, TicketStatus } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { timeAgo, cn } from "@/lib/utils";
import { Composer } from "@/components/Composer";
import { TicketSidePanel } from "@/components/TicketSidePanel";
import { Button } from "@/components/ui/Button";

const STATUS_NEXT: Record<TicketStatus, { next: TicketStatus; label: string }> = {
  open: { next: "resolved", label: "Resolve" },
  pending: { next: "resolved", label: "Resolve" },
  resolved: { next: "open", label: "Reopen" }
};

export function TicketView({
  ticket,
  messages,
  contact,
  tags,
  agents,
  assets,
  linkedAsset
}: {
  ticket: TicketRow;
  messages: Message[];
  contact: Contact;
  tags: Tag[];
  agents: { id: string; name: string; email: string }[];
  assets: Asset[];
  linkedAsset: Asset | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [thread, setThread] = useState(messages);

  function refresh() {
    start(() => router.refresh());
  }

  async function setStatus(status: TicketStatus) {
    await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    refresh();
  }

  function onSent(msg: Message) {
    setThread((prev) => [...prev, msg]);
  }

  const flip = STATUS_NEXT[ticket.status as TicketStatus];

  return (
    <div className="flex min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-ink-100 px-6">
          <Link
            href="/inbox"
            className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Back to inbox"
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="truncate text-sm font-semibold text-ink-900">{ticket.subject}</span>
              <span className="text-xs text-ink-400">#{ticket.number}</span>
            </div>
            <div className="text-xs text-ink-500">
              {contact.name || contact.email} · {timeAgo(ticket.created_at)} ago
            </div>
          </div>
          <div className="flex items-center gap-2">
            {ticket.status !== "pending" && (
              <Button size="sm" variant="outline" onClick={() => setStatus("pending")} disabled={pending}>
                Mark pending
              </Button>
            )}
            <Button size="sm" variant="primary" onClick={() => setStatus(flip.next)} disabled={pending}>
              {flip.label}
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <ul className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {thread.map((m) => (
              <MessageBubble key={m.id} m={m} contact={contact} />
            ))}
          </ul>
        </div>

        <Composer ticketId={ticket.id} contact={contact} onSent={onSent} />
      </div>

      <TicketSidePanel
        ticket={ticket}
        tags={tags}
        agents={agents}
        assets={assets}
        linkedAsset={linkedAsset}
      />
    </div>
  );
}

function MessageBubble({ m, contact }: { m: Message; contact: Contact }) {
  const isAgent = !!m.author_id;
  const isNote = m.kind === "note";
  const who = isAgent ? m.author_name || "Agent" : m.contact_name || contact.name || contact.email;

  return (
    <li className={cn("flex w-full gap-3", isAgent ? "justify-end" : "justify-start")}>
      {!isAgent && <Avatar name={who} size={28} className="mt-1" />}
      <div className={cn("max-w-[70%]", isAgent ? "items-end" : "items-start")}>
        <div className={cn("mb-1 flex items-baseline gap-2", isAgent ? "justify-end" : "")}>
          <span className="text-xs font-medium text-ink-700">{who}</span>
          <span className="text-[11px] text-ink-400">{timeAgo(m.created_at)} ago</span>
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
      {isAgent && <Avatar name={who} size={28} className="mt-1" />}
    </li>
  );
}
