export type TicketStatus = "open" | "pending" | "resolved";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketChannel = "email" | "form" | "api";
export type MessageKind = "reply" | "note" | "system";
export type AccountTier = "bronze" | "silver" | "gold";
export type SLAState = "healthy" | "amber" | "breached" | "met";

export interface Contact {
  id: string;
  email: string;
  name: string | null;
  account_id: string | null;
  title: string | null;
  phone: string | null;
  created_at: string;
}

export interface Account {
  id: string;
  name: string;
  domain: string | null;
  tier: AccountTier;
  health_score: number;
  mrr_cents: number;
  renewal_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface Contract {
  id: string;
  account_id: string;
  plan: string;
  sla_tier: string;
  starts_at: string;
  ends_at: string;
  value_cents: number;
  notes: string | null;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface SLAPolicy {
  id: string;
  name: string;
  first_response_minutes: number;
  resolution_minutes: number;
  applies_to_tier: AccountTier;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  name: string;
  kind: string;
  identifier: string | null;
  account_id: string | null;
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
  account_id: string | null;
  team_id: string | null;
  assignee_id: string | null;
  asset_id: string | null;
  sla_policy_id: string | null;
  first_response_due_at: string | null;
  resolution_due_at: string | null;
  first_responded_at: string | null;
  resolved_at: string | null;
  sentiment_score: number;
  complexity_score: number;
  csat_score: number | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketRow extends Ticket {
  contact_name: string | null;
  contact_email: string;
  account_name: string | null;
  account_tier: AccountTier | null;
  account_health: number | null;
  team_name: string | null;
  team_color: string | null;
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
  sentiment_score: number;
  created_at: string;
  author_name: string | null;
  contact_name: string | null;
}
