import Link from "next/link";
import {
  Building2,
  CalendarDays,
  Clock3,
  HeartPulse,
  ListTodo,
  type LucideIcon,
  Mail,
  Phone,
  Tag as TagIcon,
  Trophy
} from "lucide-react";
import type { Account, Asset, Contact, Contract, Tag, TicketRow } from "@/lib/types";
import { Avatar } from "@/components/ui/Avatar";
import { cn, timeAgo } from "@/lib/utils";

const TIER_RING: Record<string, string> = {
  gold: "ring-amber-200 bg-amber-50 text-amber-800",
  silver: "ring-ink-200 bg-ink-50 text-ink-700",
  bronze: "ring-orange-200 bg-orange-50 text-orange-700"
};

export interface Customer360RecentTicket {
  id: string;
  number: number;
  subject: string;
  status: string;
  sentiment_score: number;
  created_at: string;
}

export function Customer360({
  ticket,
  contact,
  account,
  contracts,
  recent,
  tags,
  asset
}: {
  ticket: TicketRow;
  contact: Contact;
  account: Account | null;
  contracts: Contract[];
  recent: Customer360RecentTicket[];
  tags: Tag[];
  asset: Asset | null;
}) {
  const renewalDays = account?.renewal_at ? daysUntil(account.renewal_at) : null;

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-l border-ink-100 bg-ink-50/30 lg:flex">
      <div className="flex-1 overflow-y-auto">
        <Section title="Contact">
          <div className="flex items-start gap-3 px-4">
            <Avatar name={contact.name || contact.email} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink-900">
                {contact.name || contact.email}
              </div>
              {contact.title && (
                <div className="truncate text-xs text-ink-500">{contact.title}</div>
              )}
              <div className="mt-1 flex flex-col gap-0.5 text-[11px] text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <Mail size={10} /> {contact.email}
                </span>
                {contact.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={10} /> {contact.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Section>

        {account ? (
          <Section title="Account">
            <div className="mx-4 rounded-lg border border-ink-100 bg-white p-3">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-ink-400" />
                <div className="text-sm font-semibold text-ink-900">{account.name}</div>
                <span
                  className={cn(
                    "ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1",
                    TIER_RING[account.tier] || TIER_RING.bronze
                  )}
                >
                  {account.tier}
                </span>
              </div>
              {account.domain && (
                <div className="mt-0.5 text-[11px] text-ink-400">{account.domain}</div>
              )}

              <div className="mt-3 grid grid-cols-3 gap-2">
                <Stat
                  icon={HeartPulse}
                  label="Health"
                  value={String(account.health_score)}
                  tone={
                    account.health_score >= 70
                      ? "good"
                      : account.health_score >= 40
                      ? "warn"
                      : "bad"
                  }
                />
                <Stat
                  icon={Trophy}
                  label="MRR"
                  value={
                    account.mrr_cents
                      ? `$${Math.round(account.mrr_cents / 100).toLocaleString()}`
                      : "—"
                  }
                />
                <Stat
                  icon={CalendarDays}
                  label="Renewal"
                  value={renewalDays != null ? `${renewalDays}d` : "—"}
                  tone={
                    renewalDays != null && renewalDays <= 30
                      ? "warn"
                      : undefined
                  }
                />
              </div>
            </div>
          </Section>
        ) : (
          <Section title="Account">
            <p className="px-4 text-xs text-ink-400">No account linked.</p>
          </Section>
        )}

        {contracts.length > 0 && (
          <Section title="Contracts">
            <ul className="space-y-1.5 px-4">
              {contracts.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-md border border-ink-100 bg-white px-2.5 py-1.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-ink-900">{c.plan}</div>
                    <div className="text-[10px] text-ink-400">
                      {c.starts_at.slice(0, 10)} → {c.ends_at.slice(0, 10)}
                    </div>
                  </div>
                  <div className="ml-2 text-[11px] font-medium text-ink-700">
                    ${Math.round(c.value_cents / 100).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Recent tickets">
          {recent.length === 0 ? (
            <p className="px-4 text-xs text-ink-400">No prior tickets.</p>
          ) : (
            <ul className="space-y-1 px-4">
              {recent.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/tickets/${t.number}`}
                    className={cn(
                      "flex items-start gap-2 rounded-md px-1.5 py-1 hover:bg-white",
                      t.id === ticket.id && "bg-white ring-1 ring-ink-100"
                    )}
                  >
                    <ListTodo size={11} className="mt-0.5 text-ink-400" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs text-ink-800">
                        <span className="text-ink-400">#{t.number}</span> {t.subject}
                      </div>
                      <div className="text-[10px] text-ink-400">
                        {t.status} · {timeAgo(t.created_at)} ago
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Properties">
          <div className="space-y-1.5 px-4">
            <Row label="Status" value={ticket.status} />
            <Row label="Priority" value={ticket.priority} />
            <Row label="Team" value={ticket.team_name || "—"} dot={ticket.team_color} />
            <Row label="Assignee" value={ticket.assignee_name || "Unassigned"} />
            {asset && <Row label="Asset" value={asset.name} />}
            {tags.length > 0 && (
              <div className="pt-1">
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  Tags
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[10px] text-ink-700 ring-1 ring-ink-200"
                    >
                      <TagIcon size={9} className="text-ink-400" /> {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title="SLA">
          <div className="space-y-1.5 px-4 text-xs text-ink-700">
            <div className="flex items-center justify-between">
              <span className="text-ink-500">First response</span>
              <span>{ticket.first_response_due_at?.slice(0, 16) || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">Resolution</span>
              <span>{ticket.resolution_due_at?.slice(0, 16) || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-500">First responded</span>
              <span>
                {ticket.first_responded_at ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <Clock3 size={10} /> {timeAgo(ticket.first_responded_at)} ago
                  </span>
                ) : (
                  "Pending"
                )}
              </span>
            </div>
          </div>
        </Section>
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-ink-100 py-3 last:border-0">
      <div className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
        {title}
      </div>
      {children}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "good" | "warn" | "bad";
}) {
  const color =
    tone === "good"
      ? "text-emerald-700"
      : tone === "warn"
      ? "text-amber-700"
      : tone === "bad"
      ? "text-red-700"
      : "text-ink-900";
  return (
    <div className="rounded-md border border-ink-100 bg-ink-50/50 px-2 py-1.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-ink-400">
        <Icon size={9} />
        {label}
      </div>
      <div className={cn("mt-0.5 text-sm font-semibold", color)}>{value}</div>
    </div>
  );
}

function Row({
  label,
  value,
  dot
}: {
  label: string;
  value: string;
  dot?: string | null;
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-ink-500">{label}</span>
      <span className="inline-flex items-center gap-1.5 capitalize text-ink-900">
        {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
        {value}
      </span>
    </div>
  );
}

function daysUntil(iso: string): number {
  const t = new Date(iso.endsWith("Z") ? iso : iso + "Z").getTime();
  const ms = t - Date.now();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}
