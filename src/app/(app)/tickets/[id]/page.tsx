import { notFound } from "next/navigation";
import { getTicketByNumber, getTagsForTicket } from "@/lib/repo/tickets";
import { listMessages } from "@/lib/repo/messages";
import { getContact } from "@/lib/repo/contacts";
import { listAgents } from "@/lib/repo/users";
import { listAssets, getAsset } from "@/lib/repo/assets";
import { TicketView } from "@/components/TicketView";

export const dynamic = "force-dynamic";

export default async function TicketPage({ params }: { params: { id: string } }) {
  const number = parseInt(params.id, 10);
  if (Number.isNaN(number)) notFound();
  const ticket = getTicketByNumber(number);
  if (!ticket) notFound();
  const messages = listMessages(ticket.id);
  const contact = getContact(ticket.contact_id)!;
  const tags = getTagsForTicket(ticket.id);
  const agents = listAgents();
  const assets = listAssets();
  const linkedAsset = ticket.asset_id ? getAsset(ticket.asset_id) : null;

  return (
    <TicketView
      ticket={ticket}
      messages={messages}
      contact={contact}
      tags={tags}
      agents={agents}
      assets={assets}
      linkedAsset={linkedAsset}
    />
  );
}
