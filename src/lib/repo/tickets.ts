import { db, nextTicketNumber, uid } from "../db";
import type { Ticket, TicketRow, TicketStatus, TicketPriority } from "../types";
import { getOrCreateContact } from "./contacts";
import { postMessage } from "./messages";
import { attachTag, tagsForTicket } from "./tags";

const SELECT_LIST = `
  SELECT
    t.*,
    c.name  AS contact_name,
    c.email AS contact_email,
    u.name  AS assignee_name,
    a.name  AS asset_name,
    (SELECT body FROM messages m WHERE m.ticket_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
    (SELECT created_at FROM messages m WHERE m.ticket_id = t.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
    COALESCE(
      (SELECT GROUP_CONCAT(tag.name, ',')
         FROM ticket_tags tt JOIN tags tag ON tag.id = tt.tag_id
         WHERE tt.ticket_id = t.id),
      ''
    ) AS tags
  FROM tickets t
  JOIN contacts c ON c.id = t.contact_id
  LEFT JOIN users u ON u.id = t.assignee_id
  LEFT JOIN assets a ON a.id = t.asset_id
`;

export function listTickets(opts?: {
  status?: TicketStatus;
  assignee_id?: string | "unassigned" | "any";
  search?: string;
  limit?: number;
}): TicketRow[] {
  const where: string[] = [];
  const params: any[] = [];
  if (opts?.status) {
    where.push("t.status = ?");
    params.push(opts.status);
  }
  if (opts?.assignee_id === "unassigned") {
    where.push("t.assignee_id IS NULL");
  } else if (opts?.assignee_id && opts.assignee_id !== "any") {
    where.push("t.assignee_id = ?");
    params.push(opts.assignee_id);
  }
  if (opts?.search) {
    where.push("(LOWER(t.subject) LIKE ? OR LOWER(c.email) LIKE ? OR LOWER(c.name) LIKE ?)");
    const q = `%${opts.search.toLowerCase()}%`;
    params.push(q, q, q);
  }
  const sql =
    SELECT_LIST +
    (where.length ? " WHERE " + where.join(" AND ") : "") +
    " ORDER BY t.updated_at DESC LIMIT ?";
  params.push(opts?.limit ?? 100);
  return db.prepare(sql).all(...params) as TicketRow[];
}

export function getTicket(id: string): TicketRow | null {
  return (db.prepare(SELECT_LIST + " WHERE t.id = ?").get(id) as TicketRow) || null;
}

export function getTicketByNumber(number: number): TicketRow | null {
  return (db.prepare(SELECT_LIST + " WHERE t.number = ?").get(number) as TicketRow) || null;
}

export function createTicket(input: {
  subject: string;
  body: string;
  contact_email: string;
  contact_name?: string;
  channel?: "email" | "form" | "api";
  priority?: TicketPriority;
}): Ticket {
  const contact = getOrCreateContact(input.contact_email, input.contact_name);
  const id = uid("tk_");
  const number = nextTicketNumber();
  db.prepare(
    `INSERT INTO tickets (id, number, subject, status, priority, channel, contact_id)
     VALUES (?, ?, ?, 'open', ?, ?, ?)`
  ).run(
    id,
    number,
    input.subject,
    input.priority || "normal",
    input.channel || "api",
    contact.id
  );
  postMessage({
    ticket_id: id,
    body: input.body,
    kind: "reply",
    contact_id: contact.id
  });
  return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket;
}

export function updateTicket(
  id: string,
  patch: Partial<Pick<Ticket, "status" | "priority" | "assignee_id" | "asset_id" | "subject">>
): Ticket | null {
  const fields: string[] = [];
  const params: any[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    fields.push(`${k} = ?`);
    params.push(v);
  }
  if (!fields.length) return getTicket(id);
  fields.push("updated_at = datetime('now')");
  params.push(id);
  db.prepare(`UPDATE tickets SET ${fields.join(", ")} WHERE id = ?`).run(...params);
  return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket | null;
}

export function applyAutoTags(ticketId: string, tags: string[]) {
  for (const t of tags) attachTag(ticketId, t);
}

export function getTagsForTicket(ticketId: string) {
  return tagsForTicket(ticketId);
}
