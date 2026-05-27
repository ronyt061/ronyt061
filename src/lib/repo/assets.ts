import { db, uid } from "../db";
import type { Asset } from "../types";

export function listAssets(query?: string): Asset[] {
  if (query) {
    const q = `%${query.toLowerCase()}%`;
    return db
      .prepare(
        "SELECT * FROM assets WHERE LOWER(name) LIKE ? OR LOWER(identifier) LIKE ? ORDER BY name LIMIT 50"
      )
      .all(q, q) as Asset[];
  }
  return db.prepare("SELECT * FROM assets ORDER BY name").all() as Asset[];
}

export function getAsset(id: string): Asset | null {
  return (db.prepare("SELECT * FROM assets WHERE id = ?").get(id) as Asset) || null;
}

export function createAsset(input: {
  name: string;
  kind: string;
  identifier?: string;
  notes?: string;
}): Asset {
  const id = uid("a_");
  db.prepare(
    "INSERT INTO assets (id, name, kind, identifier, notes) VALUES (?, ?, ?, ?, ?)"
  ).run(id, input.name, input.kind, input.identifier || null, input.notes || null);
  return getAsset(id)!;
}
