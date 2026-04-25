import Link from "next/link";
import { listTickets } from "@/lib/repo/tickets";
import type { TicketStatus } from "@/lib/types";
import { getSession } from "@/lib/auth";
import { InboxFilters } from "@/components/InboxFilters";
import { InboxRow } from "@/components/InboxRow";

export const dynamic = "force-dynamic";

const STATUSES: TicketStatus[] = ["open", "pending", "resolved"];

export default async function InboxPage({
  searchParams
}: {
  searchParams: { status?: string; scope?: string; q?: string };
}) {
  const user = (await getSession())!;
  const status = (STATUSES as string[]).includes(searchParams.status || "")
    ? (searchParams.status as TicketStatus)
    : "open";
  const scope = (["all", "mine", "unassigned"] as const).includes((searchParams.scope as any) || "all")
    ? ((searchParams.scope as any) || "all")
    : "all";
  const tickets = listTickets({
    status,
    assignee_id: scope === "mine" ? user.id : scope === "unassigned" ? "unassigned" : "any",
    search: searchParams.q
  });

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-ink-100 px-6">
        <h1 className="text-sm font-semibold tracking-tight text-ink-900">Inbox</h1>
        <div className="text-xs text-ink-400">
          {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
        </div>
      </header>

      <InboxFilters status={status} scope={scope} q={searchParams.q || ""} />

      <div className="flex-1 overflow-y-auto">
        {tickets.length === 0 ? (
          <Empty status={status} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link href={`/tickets/${t.number}`} className="block">
                  <InboxRow ticket={t} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function Empty({ status }: { status: TicketStatus }) {
  const lines: Record<TicketStatus, [string, string]> = {
    open: ["You're all caught up.", "Nothing open. Take a breath."],
    pending: ["Nothing waiting.", "No tickets are pending a response."],
    resolved: ["No resolved tickets yet.", "Once you resolve tickets, they'll show up here."]
  };
  const [title, sub] = lines[status];
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-3 h-2 w-2 rounded-full bg-emerald-500" />
      <p className="text-sm font-medium text-ink-900">{title}</p>
      <p className="mt-1 text-xs text-ink-500">{sub}</p>
    </div>
  );
}
