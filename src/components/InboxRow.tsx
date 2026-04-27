import type { TicketRow } from "@/lib/types";
import { cn, isOverdue, timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";

const STATUS_DOT: Record<string, string> = {
  open: "bg-amber-500",
  pending: "bg-sky-500",
  resolved: "bg-emerald-500"
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "",
  low: "Low"
};

export function InboxRow({ ticket }: { ticket: TicketRow }) {
  const overdue = isOverdue(ticket);
  const tags = ticket.tags ? ticket.tags.split(",").filter(Boolean) : [];
  const last = ticket.last_message_at || ticket.updated_at;
  const snippet = (ticket.last_message || "").replace(/\s+/g, " ").trim();

  return (
    <div className="group flex items-start gap-3 px-6 py-3 transition-colors hover:bg-ink-50">
      <div className="mt-1.5 flex flex-col items-center gap-1">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            overdue ? "bg-red-500" : STATUS_DOT[ticket.status] || "bg-ink-300"
          )}
          title={overdue ? "Overdue" : ticket.status}
        />
      </div>
      <Avatar name={ticket.contact_name || ticket.contact_email} size={28} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium text-ink-900">
            {ticket.contact_name || ticket.contact_email}
          </span>
          <span className="truncate text-xs text-ink-400">#{ticket.number}</span>
          {ticket.priority !== "normal" && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                ticket.priority === "urgent"
                  ? "bg-red-50 text-red-600"
                  : ticket.priority === "high"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-ink-100 text-ink-500"
              )}
            >
              {PRIORITY_LABEL[ticket.priority]}
            </span>
          )}
          <span className="ml-auto whitespace-nowrap text-[11px] text-ink-400">{timeAgo(last)}</span>
        </div>
        <div className="mt-0.5 truncate text-sm text-ink-700">{ticket.subject}</div>
        {snippet && <div className="mt-0.5 truncate text-xs text-ink-400">{snippet}</div>}
        {tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded bg-ink-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-500"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
