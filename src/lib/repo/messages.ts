import { db, uid } from "../db";
import type { Message, MessageKind } from "../types";

export function listMessages(ticketId: string): Message[] {
  return db
    .prepare(
      `SELECT m.*, u.name AS author_name, c.name AS contact_name
         FROM messages m
         LEFT JOIN users u ON u.id = m.author_id
         LEFT JOIN contacts c ON c.id = m.contact_id
         WHERE m.ticket_id = ?
         ORDER BY m.created_at ASC`
    )
    .all(ticketId) as Message[];
}

export function postMessage(input: {
  ticket_id: string;
  body: string;
  kind: MessageKind;
  author_id?: string | null;
  contact_id?: string | null;
  sentiment_score?: number;
}): Message {
  const id = uid("m_");
  db.prepare(
    `INSERT INTO messages (id, ticket_id, author_id, contact_id, body, kind, sentiment_score)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.ticket_id,
    input.author_id || null,
    input.contact_id || null,
    input.body,
    input.kind,
    input.sentiment_score ?? 0
  );

  // Stamp first_responded_at on first agent reply.
  if (input.kind === "reply" && input.author_id) {
    db.prepare(
      `UPDATE tickets
         SET first_responded_at = COALESCE(first_responded_at, datetime('now')),
             updated_at = datetime('now')
       WHERE id = ?`
    ).run(input.ticket_id);
  } else {
    db.prepare("UPDATE tickets SET updated_at = datetime('now') WHERE id = ?").run(input.ticket_id);
  }

  return db
    .prepare(
      `SELECT m.*, u.name AS author_name, c.name AS contact_name
         FROM messages m
         LEFT JOIN users u ON u.id = m.author_id
         LEFT JOIN contacts c ON c.id = m.contact_id
         WHERE m.id = ?`
    )
    .get(id) as Message;
}
