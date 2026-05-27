import { getTicket } from "./repo/tickets";
import { getContact } from "./repo/contacts";
import { getAccount } from "./repo/accounts";
import { listMessages } from "./repo/messages";
import type { Account, Contact, Message } from "./types";

export interface BuiltContext {
  ticket: NonNullable<ReturnType<typeof getTicket>>;
  contact: Contact | null;
  account: Account | null;
  messages: Message[];
}

export function buildContext(ticketId: string): BuiltContext | null {
  const ticket = getTicket(ticketId);
  if (!ticket) return null;
  const contact = getContact(ticket.contact_id);
  const account = ticket.account_id ? getAccount(ticket.account_id) : null;
  const messages = listMessages(ticket.id);
  return { ticket, contact, account, messages };
}
