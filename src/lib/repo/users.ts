import { db, uid } from "../db";
import { hashPassword } from "../password";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  password_hash: string;
}

export async function createUser(email: string, name: string, password: string): Promise<UserRow> {
  const id = uid("u_");
  const password_hash = await hashPassword(password);
  db.prepare(
    "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)"
  ).run(id, email.toLowerCase(), name, password_hash);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow;
}

export function findUserByEmail(email: string): UserRow | null {
  return (
    (db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase()) as UserRow) ||
    null
  );
}

export function listAgents() {
  return db.prepare("SELECT id, email, name, role FROM users ORDER BY name").all() as Array<{
    id: string;
    email: string;
    name: string;
    role: string;
  }>;
}
