import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname, resolve } from "path";

const DB_PATH = resolve(process.env.DATABASE_PATH || "./data/lume.db");
mkdirSync(dirname(DB_PATH), { recursive: true });

declare global {
  // eslint-disable-next-line no-var
  var __lumeDb: Database.Database | undefined;
}

function open(): Database.Database {
  const d = new Database(DB_PATH, { timeout: 5000 });
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON");
  migrate(d);
  return d;
}

// Lazy proxy so that simply importing `db` doesn't open the SQLite file
// (which fights Next.js's parallel build-time route analysis on a fresh
// database). The connection is created on first real use.
export const db: Database.Database = new Proxy({} as Database.Database, {
  get(_target, prop) {
    if (!global.__lumeDb) global.__lumeDb = open();
    const real = global.__lumeDb as unknown as Record<string | symbol, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  }
});

function migrate(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           TEXT PRIMARY KEY,
      email        TEXT NOT NULL UNIQUE,
      name         TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role         TEXT NOT NULL DEFAULT 'agent',
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      domain        TEXT,
      tier          TEXT NOT NULL DEFAULT 'bronze',
      health_score  INTEGER NOT NULL DEFAULT 70,
      mrr_cents     INTEGER NOT NULL DEFAULT 0,
      renewal_at    TEXT,
      notes         TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS accounts_tier_idx ON accounts(tier);

    CREATE TABLE IF NOT EXISTS contracts (
      id          TEXT PRIMARY KEY,
      account_id  TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      plan        TEXT NOT NULL,
      sla_tier    TEXT NOT NULL,
      starts_at   TEXT NOT NULL,
      ends_at     TEXT NOT NULL,
      value_cents INTEGER NOT NULL DEFAULT 0,
      notes       TEXT
    );

    CREATE TABLE IF NOT EXISTS teams (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL UNIQUE,
      color      TEXT NOT NULL DEFAULT '#3b6cf2',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS team_members (
      team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (team_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS sla_policies (
      id                       TEXT PRIMARY KEY,
      name                     TEXT NOT NULL,
      first_response_minutes   INTEGER NOT NULL,
      resolution_minutes       INTEGER NOT NULL,
      applies_to_tier          TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS articles (
      id         TEXT PRIMARY KEY,
      slug       TEXT NOT NULL UNIQUE,
      title      TEXT NOT NULL,
      body       TEXT NOT NULL,
      category   TEXT NOT NULL DEFAULT 'general',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id         TEXT PRIMARY KEY,
      email      TEXT NOT NULL UNIQUE,
      name       TEXT,
      account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
      title      TEXT,
      phone      TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assets (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      kind       TEXT NOT NULL,
      identifier TEXT,
      account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
      notes      TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id                     TEXT PRIMARY KEY,
      number                 INTEGER NOT NULL UNIQUE,
      subject                TEXT NOT NULL,
      status                 TEXT NOT NULL DEFAULT 'open',
      priority               TEXT NOT NULL DEFAULT 'normal',
      channel                TEXT NOT NULL DEFAULT 'email',
      contact_id             TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      account_id             TEXT REFERENCES accounts(id) ON DELETE SET NULL,
      team_id                TEXT REFERENCES teams(id) ON DELETE SET NULL,
      assignee_id            TEXT REFERENCES users(id) ON DELETE SET NULL,
      asset_id               TEXT REFERENCES assets(id) ON DELETE SET NULL,
      sla_policy_id          TEXT REFERENCES sla_policies(id) ON DELETE SET NULL,
      first_response_due_at  TEXT,
      resolution_due_at      TEXT,
      first_responded_at     TEXT,
      resolved_at            TEXT,
      sentiment_score        INTEGER NOT NULL DEFAULT 0,
      complexity_score       INTEGER NOT NULL DEFAULT 0,
      csat_score             INTEGER,
      due_at                 TEXT,
      created_at             TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS tickets_status_idx ON tickets(status);
    CREATE INDEX IF NOT EXISTS tickets_assignee_idx ON tickets(assignee_id);
    CREATE INDEX IF NOT EXISTS tickets_team_idx ON tickets(team_id);
    CREATE INDEX IF NOT EXISTS tickets_account_idx ON tickets(account_id);
    CREATE INDEX IF NOT EXISTS tickets_updated_idx ON tickets(updated_at DESC);
    CREATE INDEX IF NOT EXISTS tickets_first_due_idx ON tickets(first_response_due_at);
    CREATE INDEX IF NOT EXISTS tickets_res_due_idx ON tickets(resolution_due_at);

    CREATE TABLE IF NOT EXISTS messages (
      id              TEXT PRIMARY KEY,
      ticket_id       TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      author_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
      contact_id      TEXT REFERENCES contacts(id) ON DELETE SET NULL,
      body            TEXT NOT NULL,
      kind            TEXT NOT NULL DEFAULT 'reply',
      sentiment_score INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS messages_ticket_idx ON messages(ticket_id, created_at);

    CREATE TABLE IF NOT EXISTS tags (
      id   TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS ticket_tags (
      ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      tag_id    TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (ticket_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS kpi_snapshots (
      day     TEXT NOT NULL,
      metric  TEXT NOT NULL,
      dim_key TEXT NOT NULL DEFAULT '',
      value   REAL NOT NULL,
      PRIMARY KEY (day, metric, dim_key)
    );

    CREATE TABLE IF NOT EXISTS ticket_counter (
      id    INTEGER PRIMARY KEY CHECK (id = 1),
      value INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO ticket_counter (id, value) VALUES (1, 1000);
  `);

  // Idempotent column adds for environments where the database
  // pre-dates the additive columns above.
  addColumn(d, "contacts", "account_id", "TEXT");
  addColumn(d, "contacts", "title", "TEXT");
  addColumn(d, "contacts", "phone", "TEXT");
  addColumn(d, "assets", "account_id", "TEXT");
  addColumn(d, "tickets", "account_id", "TEXT");
  addColumn(d, "tickets", "team_id", "TEXT");
  addColumn(d, "tickets", "sla_policy_id", "TEXT");
  addColumn(d, "tickets", "first_response_due_at", "TEXT");
  addColumn(d, "tickets", "resolution_due_at", "TEXT");
  addColumn(d, "tickets", "first_responded_at", "TEXT");
  addColumn(d, "tickets", "resolved_at", "TEXT");
  addColumn(d, "tickets", "sentiment_score", "INTEGER NOT NULL DEFAULT 0");
  addColumn(d, "tickets", "complexity_score", "INTEGER NOT NULL DEFAULT 0");
  addColumn(d, "tickets", "csat_score", "INTEGER");
  addColumn(d, "messages", "sentiment_score", "INTEGER NOT NULL DEFAULT 0");
}

function addColumn(d: Database.Database, table: string, column: string, decl: string) {
  const cols = d
    .prepare(`PRAGMA table_info(${table})`)
    .all() as Array<{ name: string }>;
  if (cols.some((c) => c.name === column)) return;
  d.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`);
}

export function nextTicketNumber(): number {
  const row = db
    .prepare("UPDATE ticket_counter SET value = value + 1 WHERE id = 1 RETURNING value")
    .get() as { value: number };
  return row.value;
}

export function uid(prefix = ""): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${time}${rand}`;
}
