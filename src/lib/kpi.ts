import { db } from "./db";

export interface DashboardKPIs {
  open: number;
  pending: number;
  resolved_today: number;
  breaching: number;
  median_first_response_minutes: number | null;
  csat_avg: number | null;
  negative_sentiment: number;
  high_complexity: number;
  open_by_tier: Array<{ tier: string; count: number }>;
  open_by_team: Array<{ team_id: string; team_name: string; team_color: string; count: number }>;
  daily: Array<{ day: string; opened: number; resolved: number }>;
  recent_activity: Array<{
    number: number;
    subject: string;
    contact_name: string | null;
    account_name: string | null;
    sentiment_score: number;
    updated_at: string;
  }>;
}

export function dashboardKPIs(): DashboardKPIs {
  const num = (sql: string, params: any[] = []) =>
    (db.prepare(sql).get(...params) as { n: number }).n;

  const open = num("SELECT COUNT(*) AS n FROM tickets WHERE status = 'open'");
  const pending = num("SELECT COUNT(*) AS n FROM tickets WHERE status = 'pending'");
  const resolved_today = num(
    "SELECT COUNT(*) AS n FROM tickets WHERE status = 'resolved' AND date(resolved_at) = date('now')"
  );
  const breaching = num(
    `SELECT COUNT(*) AS n FROM tickets WHERE status != 'resolved' AND
     ((first_responded_at IS NULL AND first_response_due_at <= datetime('now')) OR
      resolution_due_at <= datetime('now'))`
  );
  const negative_sentiment = num(
    "SELECT COUNT(*) AS n FROM tickets WHERE status != 'resolved' AND sentiment_score <= -25"
  );
  const high_complexity = num(
    "SELECT COUNT(*) AS n FROM tickets WHERE status != 'resolved' AND complexity_score >= 60"
  );

  // Median first-response minutes — coarse: average over last 30d.
  const medRow = db
    .prepare(
      `SELECT AVG((julianday(first_responded_at) - julianday(created_at)) * 24 * 60) AS m
         FROM tickets
         WHERE first_responded_at IS NOT NULL AND created_at >= date('now', '-30 days')`
    )
    .get() as { m: number | null };
  const median_first_response_minutes = medRow.m ? Math.round(medRow.m) : null;

  const csatRow = db
    .prepare(
      `SELECT AVG(csat_score) AS s FROM tickets WHERE csat_score IS NOT NULL AND created_at >= date('now', '-90 days')`
    )
    .get() as { s: number | null };
  const csat_avg = csatRow.s != null ? Math.round(csatRow.s * 10) / 10 : null;

  const open_by_tier = db
    .prepare(
      `SELECT COALESCE(a.tier, 'unknown') AS tier, COUNT(t.id) AS count
         FROM tickets t LEFT JOIN accounts a ON a.id = t.account_id
         WHERE t.status != 'resolved'
         GROUP BY tier
         ORDER BY tier`
    )
    .all() as Array<{ tier: string; count: number }>;

  const open_by_team = db
    .prepare(
      `SELECT t.id AS team_id, t.name AS team_name, t.color AS team_color, COUNT(tk.id) AS count
         FROM teams t LEFT JOIN tickets tk ON tk.team_id = t.id AND tk.status != 'resolved'
         GROUP BY t.id ORDER BY t.name`
    )
    .all() as Array<{ team_id: string; team_name: string; team_color: string; count: number }>;

  const days: Array<{ day: string; opened: number; resolved: number }> = [];
  for (let i = 13; i >= 0; i--) {
    const opened = num(
      "SELECT COUNT(*) AS n FROM tickets WHERE date(created_at) = date('now', ?)",
      [`-${i} days`]
    );
    const resolved = num(
      "SELECT COUNT(*) AS n FROM tickets WHERE resolved_at IS NOT NULL AND date(resolved_at) = date('now', ?)",
      [`-${i} days`]
    );
    days.push({ day: dayLabel(i), opened, resolved });
  }

  const recent_activity = db
    .prepare(
      `SELECT t.number, t.subject, c.name AS contact_name, a.name AS account_name,
              t.sentiment_score, t.updated_at
         FROM tickets t
         JOIN contacts c ON c.id = t.contact_id
         LEFT JOIN accounts a ON a.id = t.account_id
         ORDER BY t.updated_at DESC
         LIMIT 10`
    )
    .all() as DashboardKPIs["recent_activity"];

  return {
    open,
    pending,
    resolved_today,
    breaching,
    median_first_response_minutes,
    csat_avg,
    negative_sentiment,
    high_complexity,
    open_by_tier,
    open_by_team,
    daily: days,
    recent_activity
  };
}

function dayLabel(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}
