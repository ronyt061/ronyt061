"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Frown,
  Inbox,
  LayoutGrid,
  type LucideIcon,
  RotateCcw,
  Search,
  Settings,
  UserCheck
} from "lucide-react";
import type { TicketRow } from "@/lib/types";
import { cn } from "@/lib/utils";

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  perform: () => void | Promise<void>;
};

export function CommandPalette({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const path = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [cursor, setCursor] = useState(0);

  const onTicketPage = path?.startsWith("/tickets/");
  const ticketNumber = onTicketPage ? path!.split("/")[2] : null;

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCursor(0);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const url = `/api/tickets?view=all${query ? `&q=${encodeURIComponent(query)}` : ""}`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { tickets: [] }))
      .then((d) => setTickets((d.tickets || []).slice(0, 10)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [open, query]);

  const navActions: Action[] = useMemo(
    () => [
      { id: "go-dashboard", label: "Go to Dashboard", icon: LayoutGrid, perform: () => router.push("/dashboard") },
      { id: "go-inbox", label: "Go to Inbox", icon: Inbox, perform: () => router.push("/inbox") },
      { id: "go-breaching", label: "Show breaching SLA", icon: AlertTriangle, perform: () => router.push("/inbox?view=breaching") },
      { id: "go-negative", label: "Show negative sentiment", icon: Frown, perform: () => router.push("/inbox?view=negative") },
      { id: "go-kb", label: "Go to Knowledge Base", icon: BookOpenText, perform: () => router.push("/kb") },
      { id: "go-settings", label: "Go to Settings", icon: Settings, perform: () => router.push("/settings") }
    ],
    [router]
  );

  const ticketActions: Action[] = useMemo(() => {
    if (!ticketNumber) return [];
    return [
      { id: "resolve", label: "Resolve this ticket", icon: CheckCircle2, perform: () => updateTicketByNumber(ticketNumber, { status: "resolved" }, router) },
      { id: "reopen", label: "Reopen this ticket", icon: RotateCcw, perform: () => updateTicketByNumber(ticketNumber, { status: "open" }, router) },
      { id: "pending", label: "Mark this ticket pending", icon: ArrowRight, perform: () => updateTicketByNumber(ticketNumber, { status: "pending" }, router) },
      {
        id: "assign-me",
        label: "Assign this ticket to me",
        icon: UserCheck,
        perform: async () => {
          const me = await fetch("/api/auth/me").then((r) => r.json());
          if (me.user) await updateTicketByNumber(ticketNumber, { assignee_id: me.user.id }, router);
        }
      },
      {
        id: "escalate",
        label: "Escalate priority to urgent",
        icon: AlertTriangle,
        perform: () => updateTicketByNumber(ticketNumber, { priority: "urgent" }, router)
      }
    ];
  }, [ticketNumber, router]);

  const filteredActions = useMemo(() => {
    const all = [...ticketActions, ...navActions];
    if (!query) return all;
    return all.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));
  }, [query, navActions, ticketActions]);

  const total = tickets.length + filteredActions.length;

  useEffect(() => {
    setCursor(0);
  }, [query, total]);

  function close() {
    onOpenChange(false);
  }

  function pick(idx: number) {
    if (idx < tickets.length) {
      router.push(`/tickets/${tickets[idx].number}`);
      close();
      return;
    }
    const action = filteredActions[idx - tickets.length];
    if (action) {
      Promise.resolve(action.perform()).finally(close);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") return close();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(total - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(cursor);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/30 px-4 pt-[12vh] animate-fade" onClick={close}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-ink-200 bg-white shadow-2xl animate-in"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        <div className="flex items-center gap-2 border-b border-ink-100 px-4">
          <Search size={14} className="text-ink-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tickets, run commands…"
            className="h-12 flex-1 bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-1">
          {tickets.length === 0 && filteredActions.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-ink-400">No matches.</div>
          )}

          {tickets.length > 0 && (
            <Group label="Tickets">
              {tickets.map((t, i) => (
                <Row
                  key={t.id}
                  active={cursor === i}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => pick(i)}
                >
                  <span className="font-mono text-[11px] text-ink-400">#{t.number}</span>
                  <span className="ml-2 truncate text-sm text-ink-900">{t.subject}</span>
                  <span className="ml-auto truncate text-xs text-ink-400">
                    {t.account_name || t.contact_name || t.contact_email}
                  </span>
                </Row>
              ))}
            </Group>
          )}

          {filteredActions.length > 0 && (
            <Group label="Actions">
              {filteredActions.map((a, i) => {
                const idx = tickets.length + i;
                const Icon = a.icon;
                return (
                  <Row
                    key={a.id}
                    active={cursor === idx}
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => pick(idx)}
                  >
                    <Icon size={13} className="text-ink-400" />
                    <span className="text-sm text-ink-900">{a.label}</span>
                  </Row>
                );
              })}
            </Group>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-ink-100 px-4 py-2 text-[11px] text-ink-400">
          <span>↑↓ to navigate · ↵ to select · esc to close</span>
        </div>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Row({
  children,
  active,
  onClick,
  onMouseEnter
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left",
        active ? "bg-ink-100" : "hover:bg-ink-50"
      )}
    >
      {children}
    </button>
  );
}

async function updateTicketByNumber(
  number: string,
  body: Record<string, unknown>,
  router: ReturnType<typeof useRouter>
) {
  const res = await fetch(`/api/tickets/by-number/${number}`).catch(() => null);
  let id: string | null = null;
  if (res && res.ok) {
    const { ticket } = await res.json();
    id = ticket?.id || null;
  }
  if (!id) return;
  await fetch(`/api/tickets/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  router.refresh();
}
