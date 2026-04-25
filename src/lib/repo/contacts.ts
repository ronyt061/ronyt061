import { db, uid } from "../db";
import type { Contact } from "../types";

export function getOrCreateContact(email: string, name?: string | null): Contact {
  const existing = db
    .prepare("SELECT * FROM contacts WHERE email = ?")
    .get(email.toLowerCase()) as Contact | undefined;
  if (existing) {
    if (name && !existing.name) {
      db.prepare("UPDATE contacts SET name = ? WHERE id = ?").run(name, existing.id);
      return { ...existing, name };
    }
    return existing;
  }
  const id = uid("c_");
  db.prepare("INSERT INTO contacts (id, email, name) VALUES (?, ?, ?)").run(
    id,
    email.toLowerCase(),
    name || null
  );
  return db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as Contact;
}

export function getContact(id: string): Contact | null {
  return (db.prepare("SELECT * FROM contacts WHERE id = ?").get(id) as Contact) || null;
}
