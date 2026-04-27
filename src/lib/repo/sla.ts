import { db, uid } from "../db";
import type { SLAPolicy, AccountTier } from "../types";

export function listSLAPolicies(): SLAPolicy[] {
  return db
    .prepare("SELECT * FROM sla_policies ORDER BY first_response_minutes ASC")
    .all() as SLAPolicy[];
}

export function getSLAPolicy(id: string): SLAPolicy | null {
  return (db.prepare("SELECT * FROM sla_policies WHERE id = ?").get(id) as SLAPolicy) || null;
}

export function policyForTier(tier: AccountTier): SLAPolicy | null {
  return (
    (db
      .prepare("SELECT * FROM sla_policies WHERE applies_to_tier = ?")
      .get(tier) as SLAPolicy) || null
  );
}

export function createSLAPolicy(input: {
  name: string;
  first_response_minutes: number;
  resolution_minutes: number;
  applies_to_tier: AccountTier;
}): SLAPolicy {
  const id = uid("sla_");
  db.prepare(
    `INSERT INTO sla_policies (id, name, first_response_minutes, resolution_minutes, applies_to_tier)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, input.name, input.first_response_minutes, input.resolution_minutes, input.applies_to_tier);
  return getSLAPolicy(id)!;
}
