# Supportbench-style helpdesk

A B2B-flavoured customer-support / ticketing app. Three-panel agent
workspace, Customer 360 sidebar, dynamic SLA timers, sentiment +
complexity scoring, KPI dashboard, knowledge base, teams.

The product evolved from an earlier minimalist build (`Lume`); the
foundations — Next.js + SQLite + JWT auth + intake webhooks — are
preserved, and the UX is rebuilt around the SupportBench mental model.

## Stack

- **Next.js 14 (App Router) + TypeScript** for the full-stack app.
- **Tailwind + Lucide** for UI; small in-repo `components/ui/*` layer
  modeled on Shadcn.
- **SQLite via `better-sqlite3`** for zero-config demo. The schema
  uses portable SQL and maps to PostgreSQL with one driver swap.
- **JWT cookie sessions (`jose`) + bcrypt** for auth.
- **AI provider-agnostic**: when `ANTHROPIC_API_KEY` is set, draft /
  summarize / intent / sentiment go through Claude; otherwise a
  deterministic local fallback keeps the demo offline-capable.

## Run it

```bash
npm install
cp .env.example .env       # set AUTH_SECRET to anything for local
npm run seed               # creates teams, accounts, contracts,
                           # SLA policies, KB articles, ~25 tickets
npm run dev                # http://localhost:3000
```

Sign in:

- `agent@lume.dev` / `password` — Sam Rivera (Tier 1)
- `nora@lume.dev`  / `password` — Nora Park (Tier 1)
- `lee@lume.dev`   / `password` — Lee Almeida (Tier 2)

## Surfaces

- `/dashboard` — KPI cards (Open / Pending / Breaching SLA / Negative
  sentiment / Median first response / CSAT), 14-day queue health,
  open-by-tier and open-by-team rollups, sentiment heatmap by account.
- `/inbox` — three-panel workspace. Left rail: views
  (`All / Mine / Unassigned / Breaching SLA / Negative sentiment` +
  per-team queues). Centre: compact list with SLA countdown,
  sentiment face, complexity bar, account chip, tags. Right: the
  selected ticket renders in-place with the full thread, AI Assist
  panel, composer, and Customer 360 sidebar.
- `/tickets/[number]` — same workspace, addressable directly.
- `/kb` — searchable Knowledge Base (10 seeded articles across 4
  categories).
- `/settings` — Teams, SLA policies, members.
- `⌘K` / `Ctrl K` — palette: ticket search, jumps, and per-ticket
  actions (Resolve / Reopen / Pending / Assign-to-me / Escalate).

## Customer 360

Per ticket the right column shows:

- Contact card (name, title, email, phone).
- Account block: tier chip (Gold / Silver / Bronze), health score,
  MRR, days-to-renewal.
- Active contracts.
- Recent tickets for the same account.
- Properties (status, priority, team, assignee, asset, tags).
- SLA timestamps (first-response due, resolution due, first-responded).

## SLA timers

Each ticket inherits the SLA policy associated with its account tier
(Gold = 1h / 4h, Silver = 4h / 8h, Bronze = 8h / 24h). The
`SLATimer` component renders a live countdown that turns amber at 50%
budget remaining and red on breach. The same component shows on every
inbox row in compact form.

## AI surfaces

- **Auto-tag** runs silently on ticket create.
- **Sentiment** is scored on every message and rolled up onto the
  ticket as a moving average of the last five non-note messages.
- **Complexity** scores the thread 0-100.
- **AI Assist panel** above the composer exposes three actions:
  - *Draft reply* (account-tier-aware)
  - *Summarize* the thread
  - *Detect intent* with confidence + suggested next steps

All AI calls share the provider-agnostic pipeline in `src/lib/ai.ts`.
Local fallbacks are deterministic so the demo runs without API keys.

## API

- `GET /api/kpi` — dashboard payload.
- `GET /api/tickets?view=…&q=…` — list with filters; `view` is one
  of `all|mine|unassigned|breaching|negative|team:<id>`.
- `GET /api/accounts`, `GET /api/accounts/[id]` — accounts with
  contracts, contacts, recent tickets.
- `GET /api/teams`, `GET /api/sla/policies`, `GET /api/articles`.
- `POST /api/assist/{draft,summarize,intent}` — AI assist; body
  `{ ticket_id }`.
- `POST /api/intake/email`, `POST /api/intake/form` — webhook intake.

## Switching to PostgreSQL

The schema in `src/lib/db.ts` uses constructs that translate
directly with three swaps:

- `datetime('now')` → `now()`.
- `INSERT OR IGNORE` → `INSERT … ON CONFLICT DO NOTHING`.
- `GROUP_CONCAT(x, ',')` → `string_agg(x, ',')`.

Replace `better-sqlite3` with `pg`; the repository signatures don't
change.

## Out of scope (deferred)

- Public customer portal (anonymous self-service).
- No-code automations engine.
- Skill-based routing (`users.skills` exists; the routing logic
  doesn't yet).
- Multi-tenant org separation.
- Realtime over WebSocket — SLA timers tick client-side; lists
  refresh on navigation.
- File attachments.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run seed`
- `npm run typecheck`
- `npm run lint`
