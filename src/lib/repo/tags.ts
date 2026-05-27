import { db, uid } from "../db";
import type { Tag } from "../types";

export function listTags(): Tag[] {
  return db.prepare("SELECT * FROM tags ORDER BY name").all() as Tag[];
}

export function getOrCreateTag(name: string): Tag {
  const clean = name.trim().toLowerCase();
  const existing = db.prepare("SELECT * FROM tags WHERE name = ?").get(clean) as Tag | undefined;
  if (existing) return existing;
  const id = uid("t_");
  db.prepare("INSERT INTO tags (id, name) VALUES (?, ?)").run(id, clean);
  return { id, name: clean };
}

export function tagsForTicket(ticketId: string): Tag[] {
  return db
    .prepare(
      "SELECT t.* FROM tags t JOIN ticket_tags tt ON tt.tag_id = t.id WHERE tt.ticket_id = ? ORDER BY t.name"
    )
    .all(ticketId) as Tag[];
}

export function attachTag(ticketId: string, name: string): Tag {
  const tag = getOrCreateTag(name);
  db.prepare("INSERT OR IGNORE INTO ticket_tags (ticket_id, tag_id) VALUES (?, ?)").run(
    ticketId,
    tag.id
  );
  return tag;
}

export function detachTag(ticketId: string, tagId: string) {
  db.prepare("DELETE FROM ticket_tags WHERE ticket_id = ? AND tag_id = ?").run(ticketId, tagId);
}
