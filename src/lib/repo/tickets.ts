import { db, nextTicketNumber, uid } from "../db";
import type { Ticket, TicketRow, TicketStatus, TicketPriority, AccountTier } from "../types";
import { getOrCreateContact } from "./contacts";
import { postMessage } from "./messages";
import { attachTag, tagsForTicket } from "./tags";
import { policyForTier } from "./sla";
import { getAccount } from "./accounts";

const SELECT_LIST = `
  SELECT
    t.*,
    c.name  AS contact_name,
    c.email AS contact_email,
    a.name  AS account_name,
    a.tier  AS account_tier,
    a.health_score AS account_health,
    tm.name  AS team_name,
    tm.color AS team_color,
    u.name  AS assignee_name,
    ast.name AS asset_name,
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
  LEFT JOIN accounts a ON a.id = t.account_id
  LEFT JOIN teams tm ON tm.id = t.team_id
  LEFT JOIN users u ON u.id = t.assignee_id
  LEFT JOIN assets ast ON ast.id = t.asset_id
`;

export type TicketView =
  | "all"
  | "mine"
  | "unassigned"
  | "breaching"
  | "negative"
  | string; // team:<id>

export function listTickets(opts?: {
  view?: TicketView;
  user_id?: string;
  status?: TicketStatus;
  search?: string;
  account_id?: string;
  limit?: number;
}): TicketRow[] {
  const where: string[] = [];
  const params: any[] = [];
  if (opts?.status) {
    where.push("t.status = ?");
    params.push(opts.status);
  }
  if (opts?.account_id) {
    where.push("t.account_id = ?");
    params.push(opts.account_id);
  }
  const view = opts?.view || "all";
  if (view === "mine" && opts?.user_id) {
    where.push("t.assignee_id = ?");
    params.push(opts.user_id);
  } else if (view === "unassigned") {
    where.push("t.assignee_id IS NULL");
  } else if (view === "breaching") {
    where.push(
      "(t.status != 'resolved' AND ((t.first_responded_at IS NULL AND t.first_response_due_at <= datetime('now')) OR t.resolution_due_at <= datetime('now')))"
    );
  } else if (view === "negative") {
    where.push("t.sentiment_score <= -25");
  } else if (typeof view === "string" && view.startsWith("team:")) {
    where.push("t.team_id = ?");
    params.push(view.slice(5));
  }
  if (opts?.search) {
    where.push(
      "(LOWER(t.subject) LIKE ? OR LOWER(c.email) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(a.name) LIKE ?)"
    );
    const q = `%${opts.search.toLowerCase()}%`;
    params.push(q, q, q, q);
  }
  const sql =
    SELECT_LIST +
    (where.length ? " WHERE " + where.join(" AND ") : "") +
    " ORDER BY t.updated_at DESC LIMIT ?";
  params.push(opts?.limit ?? 200);
  return db.prepare(sql).all(...params) as TicketRow[];
}

export function getTicket(id: string): TicketRow | null {
  return (db.prepare(SELECT_LIST + " WHERE t.id = ?").get(id) as TicketRow) || null;
}

export function getTicketByNumber(number: number): TicketRow | null {
  return (db.prepare(SELECT_LIST + " WHERE t.number = ?").get(number) as TicketRow) || null;
}

export function viewCounts(userId: string) {
  const get = (where: string, params: any[] = []) =>
    (db.prepare(`SELECT COUNT(*) AS n FROM tickets t WHERE ${where}`).get(...params) as { n: number }).n;
  const teams = db
    .prepare(
      `SELECT t.id AS team_id, t.name AS team_name, t.color AS team_color,
              COUNT(tk.id) AS n
         FROM teams t LEFT JOIN tickets tk ON tk.team_id = t.id AND tk.status != 'resolved'
        GROUP BY t.id ORDER BY t.name`
    )
    .all() as Array<{ team_id: string; team_name: string; team_color: string; n: number }>;
  return {
    mine: get("t.assignee_id = ? AND t.status != 'resolved'", [userId]),
    unassigned: get("t.assignee_id IS NULL AND t.status != 'resolved'"),
    breaching: get(
      "t.status != 'resolved' AND ((t.first_responded_at IS NULL AND t.first_response_due_at <= datetime('now')) OR t.resolution_due_at <= datetime('now'))"
    ),
    negative: get("t.sentiment_score <= -25 AND t.status != 'resolved'"),
    all: get("t.status != 'resolved'"),
    teams
  };
}

function addMinutes(iso: string, minutes: number): string {
  const t = new Date((iso.endsWith("Z") ? iso : iso + "Z")).getTime() + minutes * 60_000;
  return new Date(t).toISOString().slice(0, 19).replace("T", " ");
}

export function createTicket(input: {
  subject: string;
  body: string;
  contact_email: string;
  contact_name?: string;
  channel?: "email" | "form" | "api";
  priority?: TicketPriority;
  team_id?: string | null;
  sentiment_score?: number;
  complexity_score?: number;
}): Ticket {
  const contact = getOrCreateContact(input.contact_email, input.contact_name);
  const account = contact.account_id ? getAccount(contact.account_id) : null;
  const policy = account ? policyForTier(account.tier as AccountTier) : null;
  const id = uid("tk_");
  const number = nextTicketNumber();
  const created_at = new Date().toISOString().slice(0, 19).replace("T", " ");
  const first_due = policy ? addMinutes(created_at, policy.first_response_minutes) : null;
  const res_due = policy ? addMinutes(created_at, policy.resolution_minutes) : null;
  db.prepare(
    `INSERT INTO tickets
        (id, number, subject, status, priority, channel,
         contact_id, account_id, team_id, sla_policy_id,
         first_response_due_at, resolution_due_at,
         sentiment_score, complexity_score, created_at, updated_at)
     VALUES (?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    number,
    input.subject,
    input.priority || "normal",
    input.channel || "api",
    contact.id,
    account?.id || null,
    input.team_id || null,
    policy?.id || null,
    first_due,
    res_due,
    input.sentiment_score ?? 0,
    input.complexity_score ?? 0,
    created_at,
    created_at
  );
  postMessage({
    ticket_id: id,
    body: input.body,
    kind: "reply",
    contact_id: contact.id,
    sentiment_score: input.sentiment_score ?? 0
  });
  return db.prepare("SELECT * FROM tickets WHERE id = ?").get(id) as Ticket;
}

export function updateTicket(
  id: string,
  patch: Partial<
    Pick<
      Ticket,
      | "status"
      | "priority"
      | "assignee_id"
      | "asset_id"
      | "team_id"
      | "subject"
      | "sentiment_score"
      | "complexity_score"
      | "csat_score"
    >
  >
): Ticket | null {
  const fields: string[] = [];
  const params: any[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    fields.push(`${k} = ?`);
    params.push(v);
  }
  if (patch.status === "resolved") {
    fields.push("resolved_at = COALESCE(resolved_at, datetime('now'))");
  } else if (patch.status === "open" || patch.status === "pending") {
    fields.push("resolved_at = NULL");
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

export function recentByAccount(accountId: string, limit = 8) {
  return db
    .prepare(
      `SELECT id, number, subject, status, sentiment_score, created_at
         FROM tickets WHERE account_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .all(accountId, limit);
}
