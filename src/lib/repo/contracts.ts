import { db, uid } from "../db";
import type { Contract } from "../types";

export function contractsForAccount(accountId: string): Contract[] {
  return db
    .prepare("SELECT * FROM contracts WHERE account_id = ? ORDER BY ends_at DESC")
    .all(accountId) as Contract[];
}

export function createContract(input: {
  account_id: string;
  plan: string;
  sla_tier: string;
  starts_at: string;
  ends_at: string;
  value_cents?: number;
  notes?: string;
}): Contract {
  const id = uid("ctr_");
  db.prepare(
    `INSERT INTO contracts (id, account_id, plan, sla_tier, starts_at, ends_at, value_cents, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.account_id,
    input.plan,
    input.sla_tier,
    input.starts_at,
    input.ends_at,
    input.value_cents ?? 0,
    input.notes || null
  );
  return db.prepare("SELECT * FROM contracts WHERE id = ?").get(id) as Contract;
}
