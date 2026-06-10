/**
 * Seeds the demo: agents + teams, B2B accounts + contracts, SLA
 * policies, ~25 tickets across statuses with sentiment + complexity
 * pre-computed, KB articles, and 14 days of resolved-history so the
 * dashboard charts look alive.
 *
 * Usage: npm run seed
 */
import { db } from "../src/lib/db";
import { createUser, findUserByEmail } from "../src/lib/repo/users";
import { createAccount } from "../src/lib/repo/accounts";
import { createContract } from "../src/lib/repo/contracts";
import { createTeam, addTeamMember } from "../src/lib/repo/teams";
import { createSLAPolicy } from "../src/lib/repo/sla";
import { createArticle } from "../src/lib/repo/articles";
import { createTicket, applyAutoTags, updateTicket } from "../src/lib/repo/tickets";
import { postMessage } from "../src/lib/repo/messages";
import { autoTag, complexityOf, sentimentOf } from "../src/lib/ai";
import { createAsset } from "../src/lib/repo/assets";

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

async function main() {
  console.log("→ resetting demo data");
  db.exec(`
    DELETE FROM ticket_tags;
    DELETE FROM tags;
    DELETE FROM messages;
    DELETE FROM tickets;
    DELETE FROM contracts;
    DELETE FROM team_members;
    DELETE FROM teams;
    DELETE FROM sla_policies;
    DELETE FROM articles;
    DELETE FROM assets;
    DELETE FROM contacts;
    DELETE FROM accounts;
    DELETE FROM kpi_snapshots;
    DELETE FROM users;
    UPDATE ticket_counter SET value = 1000 WHERE id = 1;
  `);

  console.log("→ users + teams");
  const sam =
    findUserByEmail("agent@lume.dev") ||
    (await createUser("agent@lume.dev", "Sam Rivera", "password"));
  const nora = await createUser("nora@lume.dev", "Nora Park", "password");
  const lee = await createUser("lee@lume.dev", "Lee Almeida", "password");

  const tier1 = createTeam("Tier 1", "#3b6cf2");
  const tier2 = createTeam("Tier 2", "#a855f7");
  addTeamMember(tier1.id, sam.id);
  addTeamMember(tier1.id, nora.id);
  addTeamMember(tier2.id, lee.id);

  console.log("→ SLA policies");
  const gold = createSLAPolicy({
    name: "Gold",
    first_response_minutes: 60,
    resolution_minutes: 240,
    applies_to_tier: "gold"
  });
  const silver = createSLAPolicy({
    name: "Silver",
    first_response_minutes: 240,
    resolution_minutes: 480,
    applies_to_tier: "silver"
  });
  const bronze = createSLAPolicy({
    name: "Bronze",
    first_response_minutes: 480,
    resolution_minutes: 1440,
    applies_to_tier: "bronze"
  });

  console.log("→ accounts + contracts");
  const northwind = createAccount({
    name: "Northwind Industrial",
    domain: "northwind.test",
    tier: "gold",
    health_score: 78,
    mrr_cents: 1480000,
    renewal_at: isoDaysFromNow(28),
    notes: "Strategic account, manufacturing vertical."
  });
  const acme = createAccount({
    name: "Acme Robotics",
    domain: "acme.test",
    tier: "silver",
    health_score: 52,
    mrr_cents: 540000,
    renewal_at: isoDaysFromNow(72),
    notes: "Recent escalations on the deployment workflow."
  });
  const globex = createAccount({
    name: "Globex Software",
    domain: "globex.test",
    tier: "gold",
    health_score: 91,
    mrr_cents: 2100000,
    renewal_at: isoDaysFromNow(120),
    notes: "Champion: VP Eng."
  });
  const initech = createAccount({
    name: "Initech Holdings",
    domain: "initech.test",
    tier: "bronze",
    health_score: 36,
    mrr_cents: 95000,
    renewal_at: isoDaysFromNow(15),
    notes: "Churn risk — schedule a QBR."
  });

  for (const a of [
    { acc: northwind, plan: "Enterprise · Premium support", value: 1850000 },
    { acc: acme, plan: "Growth · Business support", value: 720000 },
    { acc: globex, plan: "Enterprise · Premium support", value: 2400000 },
    { acc: initech, plan: "Starter · Standard support", value: 110000 }
  ]) {
    createContract({
      account_id: a.acc.id,
      plan: a.plan,
      sla_tier: a.acc.tier,
      starts_at: isoDaysFromNow(-330).slice(0, 10),
      ends_at: a.acc.renewal_at!.slice(0, 10),
      value_cents: a.value
    });
  }

  console.log("→ assets");
  createAsset({ name: "HP LaserJet — 4F", kind: "printer", identifier: "HPLJ-4F-002" });
  createAsset({ name: "MacBook Pro 14 — pool 12", kind: "laptop", identifier: "MBP14-P12" });
  createAsset({ name: "Production Postgres — primary", kind: "database", identifier: "pg-prod-01" });

  console.log("→ KB articles");
  const articles = [
    { slug: "reset-2fa", title: "Resetting 2FA for a user", category: "access", body: "When a user loses access to their 2FA device, an admin can reset it from Settings → Members → Reset 2FA. The user must re-enroll on next sign-in." },
    { slug: "vpn-flapping", title: "Diagnosing flapping VPN sessions", category: "network", body: "1. Confirm the concentrator firmware. 2. Check the user's local DNS. 3. Try forcing TCP fallback. If the disconnects continue, escalate to networking." },
    { slug: "refund-process", title: "Issuing a refund", category: "billing", body: "Refunds are processed end-of-day. Open the invoice, click Issue refund, select full or partial, and confirm. Loop the account exec on amounts over $1000." },
    { slug: "printer-jam", title: "Common printer jam fixes", category: "hardware", body: "Most jams trace back to media. Confirm tray paper matches the size selected in print options. If jams continue, run a maintenance kit check." },
    { slug: "sso-bindings", title: "Verifying SSO bindings", category: "access", body: "Mismatched SAML bindings present as a 2FA loop. Compare the IdP entity ID and ACS URL against Settings → SSO." },
    { slug: "sentiment-tagging", title: "How sentiment scoring works", category: "general", body: "Each customer message is scored -100..+100 from a lexicon and ML model. The ticket-level score is a moving average of the last five non-note messages." },
    { slug: "sla-amber", title: "What does an amber SLA badge mean?", category: "general", body: "Amber means the timer has used at least half of its budget. Take action: respond, reassign, or escalate. Red means the SLA has been breached." },
    { slug: "qbr-template", title: "Quarterly Business Review template", category: "general", body: "Open with health score and renewal date. Walk through ticket volume, sentiment trend, top intents, and top KB hits. Close with one ask." },
    { slug: "feature-request-flow", title: "Logging a feature request", category: "general", body: "Tag the ticket feature-request, link to the roadmap card, and acknowledge the customer with a realistic timeline. Don't promise dates we don't own." },
    { slug: "outage-protocol", title: "Outage response protocol", category: "general", body: "1. Open a status incident. 2. Page on-call. 3. Post to the affected accounts' Slack-shared channels. 4. After resolution, send a postmortem to Gold accounts." }
  ];
  for (const a of articles) createArticle(a);

  console.log("→ tickets");
  type Seed = {
    subject: string;
    body: string;
    email: string;
    name: string;
    title?: string;
    channel?: "email" | "form" | "api";
    priority?: "low" | "normal" | "high" | "urgent";
    status?: "open" | "pending" | "resolved";
    team_id?: string;
    assignee?: "sam" | "nora" | "lee" | null;
    follow_up?: { from: "agent" | "customer" | "note"; body: string }[];
    csat?: number;
    age_days?: number;
  };
  const seeds: Seed[] = [
    {
      subject: "Production DB is intermittently unreachable",
      body: "Half our requests are failing with connection refused since 09:14. This is critical, please respond ASAP.",
      email: "ops@northwind.test",
      name: "Mira Holt",
      title: "Head of Platform",
      priority: "urgent",
      team_id: tier2.id,
      assignee: "lee",
      age_days: 0,
      follow_up: [
        { from: "agent", body: "Acknowledged — paging the DB on-call. Will update inside 10 minutes." },
        { from: "note", body: "Status page incident #2042 opened." }
      ]
    },
    {
      subject: "Login loop after the latest 2FA reset",
      body: "After resetting my authenticator I'm bounced back to the login page on every retry. Tried two browsers. Frustrated.",
      email: "priya@northwind.test",
      name: "Priya Shah",
      title: "Sr Engineer",
      priority: "high",
      team_id: tier1.id,
      assignee: "sam",
      age_days: 0
    },
    {
      subject: "Refund request for invoice #88421",
      body: "We were billed twice for the March seat increase. Could you refund the duplicate charge?",
      email: "billing@acme.test",
      name: "Alex Reeves",
      title: "FinOps",
      priority: "normal",
      team_id: tier1.id,
      assignee: "nora",
      age_days: 1,
      follow_up: [
        { from: "agent", body: "Confirmed the duplicate — refund will issue end of day. Thanks for flagging." }
      ]
    },
    {
      subject: "VPN keeps dropping after 10 minutes",
      body: "Started yesterday afternoon. Reconnect, fine for ten minutes, dropped again. Happening to my whole team.",
      email: "kenji@globex.test",
      name: "Kenji Watanabe",
      priority: "high",
      team_id: tier1.id,
      assignee: "sam",
      age_days: 1
    },
    {
      subject: "Printer 4F is jamming on every job",
      body: "The LaserJet near the kitchen jams on the second sheet. I've cleared paper twice. Could someone take a look?",
      email: "jordan@northwind.test",
      name: "Jordan Liu",
      priority: "normal",
      team_id: tier1.id,
      assignee: "sam",
      age_days: 1
    },
    {
      subject: "Account access for new hire — Tomas",
      body: "Tomas starts Monday. Could you provision SSO access for the standard onboarding apps?",
      email: "people@globex.test",
      name: "People Ops",
      priority: "low",
      team_id: tier1.id,
      assignee: "nora",
      status: "pending",
      age_days: 2
    },
    {
      subject: "Loaner laptop for Friday demo",
      body: "I'm presenting at the Maple room and would like to borrow a MacBook for the day.",
      email: "alex@globex.test",
      name: "Alex Reeves",
      channel: "form",
      priority: "low",
      team_id: tier1.id,
      assignee: "nora",
      status: "pending",
      age_days: 2
    },
    {
      subject: "Wifi is weak in the Maple conference room",
      body: "Anyone joining a call from Maple keeps dropping. Hardwired ports work fine.",
      email: "facilities@northwind.test",
      name: "Facilities",
      priority: "normal",
      team_id: tier1.id,
      assignee: "sam",
      status: "resolved",
      csat: 5,
      age_days: 7,
      follow_up: [
        { from: "agent", body: "Replaced the AP yesterday — readings look good now." },
        { from: "customer", body: "Confirmed, working great. Thanks!" }
      ]
    },
    {
      subject: "Feature request: dark mode in the dashboard",
      body: "Would be nice to have a dark theme — I work late and the bright UI is rough on the eyes.",
      email: "alex@acme.test",
      name: "Alex Reeves",
      channel: "form",
      priority: "low",
      team_id: tier1.id,
      status: "pending",
      age_days: 5
    },
    {
      subject: "Cannot resolve an alert in the dashboard — broken",
      body: "Click resolve, modal opens, click confirm, page reloads, still open. Useless.",
      email: "kim@acme.test",
      name: "Kim Mendes",
      priority: "high",
      team_id: tier2.id,
      assignee: "lee",
      age_days: 0
    },
    {
      subject: "Renewal review and additional seats",
      body: "We're 30 days out from renewal. Could you send a quote for +20 seats and our usage report?",
      email: "champion@globex.test",
      name: "VP Eng",
      title: "VP Engineering",
      priority: "normal",
      team_id: tier1.id,
      assignee: "nora",
      age_days: 3
    },
    {
      subject: "Billing portal won't load",
      body: "Spinner forever, then a blank page. Cleared cache, same. Need to download my invoice for finance.",
      email: "finance@initech.test",
      name: "Lori Banks",
      priority: "normal",
      team_id: tier1.id,
      assignee: "sam",
      age_days: 4
    },
    {
      subject: "API is rate-limiting our exports",
      body: "We hit 429 on 70% of requests during nightly export. Doesn't match the docs.",
      email: "data@globex.test",
      name: "Data Eng",
      priority: "high",
      team_id: tier2.id,
      assignee: "lee",
      age_days: 1
    },
    {
      subject: "Monitor flickers when external camera plugged in",
      body: "Specifically my left monitor flickers whenever I plug in the Logitech webcam. Pulling the cable fixes it.",
      email: "rae@northwind.test",
      name: "Rae Chen",
      priority: "low",
      team_id: tier1.id,
      assignee: "sam",
      status: "resolved",
      csat: 4,
      age_days: 11
    },
    {
      subject: "Outage update — postmortem requested",
      body: "Per our SLA, please send the postmortem for the May 12 outage by EOW.",
      email: "ciso@northwind.test",
      name: "CISO",
      title: "Chief Information Security Officer",
      priority: "high",
      team_id: tier2.id,
      assignee: "lee",
      age_days: 2
    },
    {
      subject: "How do I export a ticket report?",
      body: "I need last month's tickets for the QBR. Is there a CSV export anywhere?",
      email: "dee@acme.test",
      name: "Dee Park",
      channel: "form",
      priority: "low",
      team_id: tier1.id,
      status: "resolved",
      csat: 5,
      age_days: 9
    },
    {
      subject: "Sentiment scoring seems off on a ticket",
      body: "Ticket #1042 was tagged negative but the customer was friendly. Could you check?",
      email: "qa@globex.test",
      name: "QA Lead",
      priority: "low",
      team_id: tier1.id,
      assignee: "nora",
      age_days: 6
    },
    {
      subject: "VPN concentrator firmware upgrade window",
      body: "Confirming the upgrade window for our VPN concentrator next week. Send the runbook?",
      email: "netops@globex.test",
      name: "Net Ops",
      priority: "normal",
      team_id: tier1.id,
      assignee: "sam",
      age_days: 4
    },
    {
      subject: "We need a refund again — billed three times this quarter",
      body: "This is unacceptable. We've been double-billed twice and now triple-billed. Looking at canceling.",
      email: "cfo@initech.test",
      name: "CFO",
      title: "CFO",
      priority: "urgent",
      team_id: tier2.id,
      assignee: "lee",
      age_days: 0
    },
    {
      subject: "Onboarding session prep",
      body: "Looking forward to the onboarding session next Tuesday. Could you send the agenda?",
      email: "newadmin@globex.test",
      name: "New Admin",
      priority: "low",
      team_id: tier1.id,
      assignee: "nora",
      status: "pending",
      age_days: 3
    },
    {
      subject: "Webhooks delivering 502 intermittently",
      body: "About 5% of our webhook deliveries are 502'ing. Can you confirm anything on your side?",
      email: "data@acme.test",
      name: "Data Eng",
      priority: "high",
      team_id: tier2.id,
      assignee: "lee",
      age_days: 2
    },
    {
      subject: "SSO bindings broken after IdP migration",
      body: "We migrated IdPs over the weekend and now everyone hits the 2FA loop. Help.",
      email: "it@northwind.test",
      name: "IT Lead",
      priority: "urgent",
      team_id: tier2.id,
      assignee: "lee",
      age_days: 0
    },
    {
      subject: "Quote for additional storage tier",
      body: "Could you send pricing for a +5TB storage tier?",
      email: "finance@globex.test",
      name: "Finance",
      priority: "normal",
      team_id: tier1.id,
      assignee: "nora",
      status: "pending",
      age_days: 4
    },
    {
      subject: "Customer-portal CSS is broken on mobile",
      body: "Our customer-portal page renders incorrectly on iOS Safari. Padding gone.",
      email: "design@acme.test",
      name: "Design Lead",
      priority: "normal",
      team_id: tier2.id,
      assignee: "lee",
      age_days: 5
    },
    {
      subject: "Thanks for the quick turnaround!",
      body: "Just wanted to say thanks for resolving last week's escalation so quickly. Appreciate it.",
      email: "champion@northwind.test",
      name: "Champion",
      priority: "low",
      team_id: tier1.id,
      assignee: "sam",
      status: "resolved",
      csat: 5,
      age_days: 12
    }
  ];

  const agentMap = { sam: sam.id, nora: nora.id, lee: lee.id };

  for (const s of seeds) {
    const sentiment_score = sentimentOf(s.body);
    const complexity_score = complexityOf([{ body: s.body, kind: "reply" }]);
    const ticket = createTicket({
      subject: s.subject,
      body: s.body,
      contact_email: s.email,
      contact_name: s.name,
      channel: s.channel,
      priority: s.priority,
      team_id: s.team_id || null,
      sentiment_score,
      complexity_score
    });

    if (s.title) {
      db.prepare("UPDATE contacts SET title = ? WHERE email = ?").run(s.title, s.email.toLowerCase());
    }
    if (s.age_days) {
      const created = isoDaysFromNow(-s.age_days);
      // Re-anchor SLA targets to the backdated created_at so older
      // tickets without an agent reply legitimately register as
      // "breaching SLA" in the demo.
      const row = db
        .prepare(
          `SELECT t.first_response_due_at, t.resolution_due_at,
                  p.first_response_minutes, p.resolution_minutes
             FROM tickets t LEFT JOIN sla_policies p ON p.id = t.sla_policy_id
            WHERE t.id = ?`
        )
        .get(ticket.id) as
        | {
            first_response_due_at: string | null;
            resolution_due_at: string | null;
            first_response_minutes: number | null;
            resolution_minutes: number | null;
          }
        | undefined;
      if (row?.first_response_minutes && row?.resolution_minutes) {
        const t = new Date(created + "Z").getTime();
        const first = new Date(t + row.first_response_minutes * 60_000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        const res = new Date(t + row.resolution_minutes * 60_000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        db.prepare(
          `UPDATE tickets SET first_response_due_at = ?, resolution_due_at = ? WHERE id = ?`
        ).run(first, res, ticket.id);
      }
      db.prepare(
        "UPDATE tickets SET created_at = ?, updated_at = ? WHERE id = ?"
      ).run(created, created, ticket.id);
      db.prepare("UPDATE messages SET created_at = ? WHERE ticket_id = ?").run(created, ticket.id);
    }

    applyAutoTags(ticket.id, autoTag(s.subject, s.body));

    if (s.follow_up) {
      for (const f of s.follow_up) {
        if (f.from === "agent") {
          postMessage({
            ticket_id: ticket.id,
            body: f.body,
            kind: "reply",
            author_id: sam.id,
            sentiment_score: sentimentOf(f.body)
          });
        } else if (f.from === "note") {
          postMessage({ ticket_id: ticket.id, body: f.body, kind: "note", author_id: sam.id });
        } else {
          postMessage({
            ticket_id: ticket.id,
            body: f.body,
            kind: "reply",
            contact_id: ticket.contact_id,
            sentiment_score: sentimentOf(f.body)
          });
        }
      }
    }

    updateTicket(ticket.id, {
      status: s.status,
      assignee_id: s.assignee ? agentMap[s.assignee] : undefined,
      csat_score: s.csat ?? undefined
    });
    if (s.status === "resolved") {
      const at = s.age_days ? isoDaysFromNow(-s.age_days + 1) : isoDaysFromNow(0);
      db.prepare("UPDATE tickets SET resolved_at = ? WHERE id = ?").run(at, ticket.id);
    }
  }

  // Backfill 14-day historical resolutions for the dashboard chart so
  // even days where no seed-ticket resolved have *some* signal.
  for (let i = 1; i <= 13; i++) {
    const day = isoDaysFromNow(-i).slice(0, 10);
    db.prepare(
      `INSERT OR REPLACE INTO kpi_snapshots (day, metric, dim_key, value) VALUES (?, ?, '', ?)`
    ).run(day, "opened", 4 + ((i * 3) % 5));
    db.prepare(
      `INSERT OR REPLACE INTO kpi_snapshots (day, metric, dim_key, value) VALUES (?, ?, '', ?)`
    ).run(day, "resolved", 3 + ((i * 2) % 4));
  }

  console.log("✓ seed complete");
  console.log("  agent: agent@lume.dev / password");
  console.log("  agent: nora@lume.dev   / password");
  console.log("  agent: lee@lume.dev    / password");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
