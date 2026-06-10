import { listTickets, viewCounts, getTicket, getTagsForTicket, recentByAccount } from "@/lib/repo/tickets";
import { listMessages } from "@/lib/repo/messages";
import { getContact } from "@/lib/repo/contacts";
import { getAccount } from "@/lib/repo/accounts";
import { contractsForAccount } from "@/lib/repo/contracts";
import { getAsset } from "@/lib/repo/assets";
import { listTeams } from "@/lib/repo/teams";
import { listAgents } from "@/lib/repo/users";
import { getSession } from "@/lib/auth";
import type { Customer360RecentTicket } from "@/components/workspace/Customer360";
import { LeftRail } from "@/components/workspace/LeftRail";
import { TicketList } from "@/components/workspace/TicketList";
import { TicketWorkspace } from "@/components/workspace/TicketWorkspace";
import { InboxSearch } from "@/components/workspace/InboxSearch";

export const dynamic = "force-dynamic";

export default async function InboxPage({
  searchParams
}: {
  searchParams: { view?: string; q?: string; id?: string; status?: string; account_id?: string };
}) {
  const user = (await getSession())!;
  const view = searchParams.view || "all";
  const tickets = listTickets({
    view,
    user_id: user.id,
    search: searchParams.q,
    account_id: searchParams.account_id,
    limit: 200
  });
  const counts = viewCounts(user.id);

  const selectedId = searchParams.id || tickets[0]?.id;
  const selected = selectedId ? getTicket(selectedId) : null;
  const messages = selected ? listMessages(selected.id) : [];
  const contact = selected ? getContact(selected.contact_id) : null;
  const account = selected?.account_id ? getAccount(selected.account_id) : null;
  const contracts = account ? contractsForAccount(account.id) : [];
  const recent = (account ? recentByAccount(account.id, 6) : []) as Customer360RecentTicket[];
  const asset = selected?.asset_id ? getAsset(selected.asset_id) : null;
  const tags = selected ? getTagsForTicket(selected.id) : [];
  const teams = listTeams();
  const agents = listAgents();

  return (
    <div className="flex h-full">
      <LeftRail counts={counts} basePath="/inbox" />

      <div className="flex w-[360px] shrink-0 flex-col border-r border-ink-100">
        <InboxSearch q={searchParams.q || ""} />
        <div className="flex-1 overflow-y-auto">
          <TicketList tickets={tickets} basePath="/inbox" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {selected && contact ? (
          <TicketWorkspace
            ticket={selected}
            messages={messages}
            contact={contact}
            account={account}
            contracts={contracts}
            recent={recent}
            tags={tags}
            asset={asset}
            agents={agents}
            teams={teams}
          />
        ) : (
          <EmptyPreview />
        )}
      </div>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 text-center">
      <div>
        <div className="mx-auto mb-2 h-2 w-2 rounded-full bg-ink-300" />
        <p className="text-sm font-medium text-ink-900">Select a ticket to preview.</p>
        <p className="mt-1 text-xs text-ink-500">
          Use the views on the left or press <kbd className="kbd">⌘K</kbd> to search.
        </p>
      </div>
    </div>
  );
}
