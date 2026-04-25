# Lume

A minimalist ticketing & customer-support app. The core power of a Zoho
Desk; a UI that feels like a basic email inbox.

## Design philosophy

- **Minimalist dashboard** — the inbox shows only what needs attention.
- **Progressive disclosure** — properties, asset linking, and tags live
  in a side panel that's collapsed by default and never blocks the
  conversation.
- **Low cognitive load** — colour-coded status dots (amber = open,
  sky = pending, emerald = resolved, red = overdue) and one universal
  icon per concept.
- **Keyboard-first** — `⌘K` / `Ctrl K` opens a command palette for
  search, navigation, and per-ticket actions.
- **Invisible AI** — auto-tagging happens silently on intake; "Magic
  Draft" is a single icon that drops a draft into the composer.

## Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS,
  Lucide icons. A small in-repo `components/ui/*` layer mirrors the
  Shadcn UI API without a CLI scaffold.
- **Backend**: Next.js route handlers (Node.js). All business logic
  lives in `src/lib/repo/*` so it can be lifted into an Express/NestJS
  service without changes.
- **Database**: SQLite (`better-sqlite3`) for zero-config demo. Schema is
  written with portable SQL and maps 1:1 to PostgreSQL — see
  [Switching to PostgreSQL](#switching-to-postgresql).
- **Auth**: email + password with a JWT (`jose`) in an httpOnly cookie.
  OAuth 2.0 is wired conceptually — a callback route can mint the same
  JWT.
- **AI**: provider-agnostic. If `ANTHROPIC_API_KEY` is set, Magic Draft
  calls Claude; otherwise a deterministic local heuristic produces a
  useful draft. Auto-tagging is a rule-based silent pass on intake.

## Run it

```bash
npm install
cp .env.example .env       # set AUTH_SECRET to anything for local dev
npm run seed               # creates demo agent, contacts, assets, tickets
npm run dev                # http://localhost:3000
```

Sign in with **`agent@lume.dev` / `password`**.

## What to look at first

1. **Inbox** (`/inbox`). Three filter pills (Open / Pending / Resolved),
   a scope toggle (All / Mine / Unassigned), and a tight search box.
   That's it. Status colour, priority chip, last-message snippet,
   relative time. Overdue rows show red.
2. **Ticket view** (`/tickets/<number>`). Chat-like thread, Resolve in
   one click, Magic Draft to draft a reply, side panel for properties.
   Press `⌘↵` to send.
3. **Smart Asset Linking**. On any ticket, open the side panel's
   "Linked asset" row, type to search, pick. The conversation is never
   crowded.
4. **Command palette**. Press `⌘K`. Search any ticket, jump to Inbox /
   Assets, and on a ticket page run "Resolve / Reopen / Mark pending /
   Assign to me".
5. **Invisible AI**. POST to the intake endpoint and watch tags appear
   silently:

   ```bash
   curl -X POST http://localhost:3000/api/intake/email \
     -H 'content-type: application/json' \
     -d '{"from":"new@partner.test","from_name":"New User",
          "subject":"Printer is jamming on every print",
          "body":"Same printer as before, please help"}'
   ```

   The new ticket appears in the inbox tagged `hardware` and `bug`.

## Project layout

```
src/
  app/
    layout.tsx, page.tsx, login/page.tsx, globals.css
    (app)/                       # authed routes — share the chrome
      layout.tsx                 # auth gate + Shell
      inbox/page.tsx
      tickets/[id]/page.tsx
      assets/page.tsx
    api/
      auth/{login,logout,register,me}/route.ts
      tickets/route.ts                       # list, create
      tickets/[id]/route.ts                  # get, patch
      tickets/[id]/messages/route.ts         # post reply / note
      tickets/[id]/tags/route.ts             # add / remove tag
      tickets/[id]/draft/route.ts            # Magic Draft
      tickets/by-number/[number]/route.ts    # palette lookup
      assets/route.ts                        # list / create
      agents/route.ts                        # for assignee picker
      intake/email/route.ts                  # email webhook (JSON)
      intake/form/route.ts                   # public form submission
  components/
    Shell.tsx, CommandPalette.tsx
    InboxFilters.tsx, InboxRow.tsx
    TicketView.tsx, Composer.tsx, TicketSidePanel.tsx
    AssetsView.tsx
    ui/{Button,Input,Avatar,Kbd}.tsx
  lib/
    db.ts                        # sqlite + migrations
    auth.ts, password.ts         # jose JWT, bcrypt
    ai.ts                        # magicDraft + autoTag
    types.ts, validators.ts (zod), utils.ts
    repo/{tickets,messages,tags,assets,contacts,users}.ts
scripts/seed.ts                  # the demo dataset
```

## Switching to PostgreSQL

The schema in `src/lib/db.ts` uses only constructs that are valid in both
SQLite and PostgreSQL with two trivial swaps:

- `datetime('now')` → `now()` (or `CURRENT_TIMESTAMP`).
- `INSERT OR IGNORE` → `INSERT … ON CONFLICT DO NOTHING`.
- `GROUP_CONCAT(x, ',')` (in `repo/tickets.ts`) →
  `string_agg(x, ',')`.

Replace `better-sqlite3` with `pg`, and replace
`db.prepare(sql).all(...)` with a thin wrapper over `client.query`. None
of the repository signatures change.

## What's intentionally out of scope

- SMTP/IMAP — intake is JSON webhook only.
- OAuth provider integration — JWT-only auth; an OAuth callback route is
  a future-add that mints the same session token.
- Realtime updates — list and thread refresh on navigation. SSE/WebSocket
  is a future-add.
- File attachments — schema can be extended; not in MVP.
- Multi-tenancy — single workspace.

## Scripts

- `npm run dev` — Next.js dev server on :3000.
- `npm run build` — production build.
- `npm run start` — production server.
- `npm run seed` — wipe and re-seed the demo dataset.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint` — Next's ESLint.

## Demo credentials

- `agent@lume.dev` / `password` — primary agent
- `nora@lume.dev` / `password` — second agent (for assignee changes)
