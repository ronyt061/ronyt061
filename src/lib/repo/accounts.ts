import { db, uid } from "../db";
import type { Account, AccountTier } from "../types";

export function listAccounts(): Account[] {
  return db.prepare("SELECT * FROM accounts ORDER BY name").all() as Account[];
}

export function getAccount(id: string): Account | null {
  return (db.prepare("SELECT * FROM accounts WHERE id = ?").get(id) as Account) || null;
}

export function getAccountByDomain(domain: string): Account | null {
  return (
    (db.prepare("SELECT * FROM accounts WHERE domain = ?").get(domain.toLowerCase()) as Account) ||
    null
  );
}

export function createAccount(input: {
  name: string;
  domain?: string;
  tier?: AccountTier;
  health_score?: number;
  mrr_cents?: number;
  renewal_at?: string | null;
  notes?: string | null;
}): Account {
  const id = uid("acc_");
  db.prepare(
    `INSERT INTO accounts (id, name, domain, tier, health_score, mrr_cents, renewal_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.name,
    input.domain?.toLowerCase() || null,
    input.tier || "bronze",
    input.health_score ?? 70,
    input.mrr_cents ?? 0,
    input.renewal_at || null,
    input.notes || null
  );
  return getAccount(id)!;
}

export function ticketsForAccount(accountId: string, limit = 10) {
  return db
    .prepare(
      `SELECT id, number, subject, status, sentiment_score, created_at
         FROM tickets WHERE account_id = ? ORDER BY created_at DESC LIMIT ?`
    )
    .all(accountId, limit);
}

export function contactsForAccount(accountId: string) {
  return db.prepare("SELECT * FROM contacts WHERE account_id = ? ORDER BY name").all(accountId);
}
