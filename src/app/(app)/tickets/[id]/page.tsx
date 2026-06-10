import { notFound } from "next/navigation";
import { getTicketByNumber, getTagsForTicket, recentByAccount, viewCounts } from "@/lib/repo/tickets";
import { listMessages } from "@/lib/repo/messages";
import { getContact } from "@/lib/repo/contacts";
import { getAccount } from "@/lib/repo/accounts";
import { contractsForAccount } from "@/lib/repo/contracts";
import { getAsset } from "@/lib/repo/assets";
import { listAgents } from "@/lib/repo/users";
import { listTeams } from "@/lib/repo/teams";
import { getSession } from "@/lib/auth";
import { LeftRail } from "@/components/workspace/LeftRail";
import { TicketWorkspace } from "@/components/workspace/TicketWorkspace";
import type { Customer360RecentTicket } from "@/components/workspace/Customer360";

export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: { id: string } }) {
  const number = parseInt(params.id, 10);
  if (Number.isNaN(number)) notFound();
  const ticket = getTicketByNumber(number);
  if (!ticket) notFound();
  const user = (await getSession())!;
  const messages = listMessages(ticket.id);
  const contact = getContact(ticket.contact_id)!;
  const account = ticket.account_id ? getAccount(ticket.account_id) : null;
  const contracts = account ? contractsForAccount(account.id) : [];
  const recent = (account ? recentByAccount(account.id, 6) : []) as Customer360RecentTicket[];
  const asset = ticket.asset_id ? getAsset(ticket.asset_id) : null;
  const tags = getTagsForTicket(ticket.id);
  const agents = listAgents();
  const teams = listTeams();
  const counts = viewCounts(user.id);

  return (
    <div className="flex h-full">
      <LeftRail counts={counts} basePath="/inbox" />
      <div className="flex min-w-0 flex-1 flex-col">
        <TicketWorkspace
          ticket={ticket}
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
      </div>
    </div>
  );
}
