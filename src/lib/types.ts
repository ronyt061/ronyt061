export type TicketStatus = "open" | "pending" | "resolved";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketChannel = "email" | "form" | "api";
export type MessageKind = "reply" | "note" | "system";

export interface Contact {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  name: string;
  kind: string;
  identifier: string | null;
  notes: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Ticket {
  id: string;
  number: number;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  channel: TicketChannel;
  contact_id: string;
  assignee_id: string | null;
  asset_id: string | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketRow extends Ticket {
  contact_name: string | null;
  contact_email: string;
  assignee_name: string | null;
  asset_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  tags: string;
}

export interface Message {
  id: string;
  ticket_id: string;
  author_id: string | null;
  contact_id: string | null;
  body: string;
  kind: MessageKind;
  created_at: string;
  author_name: string | null;
  contact_name: string | null;
}
