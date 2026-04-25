/**
 * Seeds the demo: one agent, a small set of contacts, assets, and ~12
 * tickets with realistic-feeling threads.
 *
 * Usage: npm run seed
 */
import { db } from "../src/lib/db";
import { createUser, findUserByEmail } from "../src/lib/repo/users";
import { createAsset } from "../src/lib/repo/assets";
import { applyAutoTags, createTicket, updateTicket } from "../src/lib/repo/tickets";
import { postMessage } from "../src/lib/repo/messages";
import { autoTag } from "../src/lib/ai";

async function main() {
  console.log("→ resetting demo data");
  db.exec(`
    DELETE FROM ticket_tags;
    DELETE FROM tags;
    DELETE FROM messages;
    DELETE FROM tickets;
    DELETE FROM assets;
    DELETE FROM contacts;
    DELETE FROM users;
    UPDATE ticket_counter SET value = 1000 WHERE id = 1;
  `);

  console.log("→ creating agent");
  const agent =
    findUserByEmail("agent@lume.dev") ||
    (await createUser("agent@lume.dev", "Sam Rivera", "password"));
  const agent2 = await createUser("nora@lume.dev", "Nora Park", "password");

  console.log("→ creating assets");
  const printer = createAsset({
    name: "HP LaserJet — 4F",
    kind: "printer",
    identifier: "HPLJ-4F-002",
    notes: "Floor 4 east wing"
  });
  const macbook = createAsset({
    name: "MacBook Pro 14 — pool 12",
    kind: "laptop",
    identifier: "MBP14-P12",
    notes: "Loaner pool"
  });
  createAsset({ name: "Production Postgres — primary", kind: "database", identifier: "pg-prod-01" });
  createAsset({ name: "VPN concentrator — HQ", kind: "network", identifier: "vpn-hq-01" });
  createAsset({ name: "Conference room — Maple", kind: "room", identifier: "room-maple" });

  console.log("→ creating tickets");
  const seeds: Array<{
    subject: string;
    body: string;
    email: string;
    name: string;
    channel?: "email" | "form" | "api";
    priority?: "low" | "normal" | "high" | "urgent";
    status?: "open" | "pending" | "resolved";
    asset_id?: string;
    assignee?: "me" | "nora" | null;
    follow_up?: { from: "agent" | "customer" | "note"; body: string }[];
  }> = [
    {
      subject: "Printer on 4F is jamming on every job",
      body: "Hey — the LaserJet near the kitchen is jamming on the second sheet of every job. I cleared paper twice. Could someone take a look?",
      email: "jordan@northwind.test",
      name: "Jordan Liu",
      channel: "email",
      priority: "high",
      asset_id: printer.id,
      assignee: "me",
      follow_up: [
        { from: "agent", body: "Hi Jordan — I'll head over after standup. Can you confirm which tray you loaded?" },
        { from: "customer", body: "Tray 2, the regular paper. Same one we always use." }
      ]
    },
    {
      subject: "Can't log in — 2FA loop",
      body: "Every time I enter my code I'm bounced back to the login. Tried two browsers.",
      email: "priya@northwind.test",
      name: "Priya Shah",
      channel: "email",
      priority: "urgent",
      assignee: "me"
    },
    {
      subject: "Loaner laptop request for Friday",
      body: "I'm presenting at the Maple room and would like to borrow a MacBook for the day.",
      email: "alex@partner.test",
      name: "Alex Reeves",
      channel: "form",
      priority: "low",
      asset_id: macbook.id,
      status: "pending",
      follow_up: [
        { from: "agent", body: "Booked — pick up at the front desk Friday 8:30am." },
        { from: "note", body: "Reminder: collect the previous loaner from Alex first." }
      ]
    },
    {
      subject: "VPN keeps dropping after ~10 minutes",
      body: "Started yesterday. I get disconnected, reconnect, fine for ten minutes, then dropped again.",
      email: "kenji@northwind.test",
      name: "Kenji Watanabe",
      channel: "email",
      priority: "high"
    },
    {
      subject: "Refund request — invoice #88421",
      body: "We were billed twice for the March seat increase. Can you refund the duplicate charge?",
      email: "billing@partner.test",
      name: "Partner Billing",
      channel: "email",
      assignee: "nora"
    },
    {
      subject: "Feature request: dark mode in the dashboard",
      body: "Would be nice to have a dark theme — I work late and the bright UI is rough on the eyes.",
      email: "alex@partner.test",
      name: "Alex Reeves",
      channel: "form",
      priority: "low",
      status: "pending"
    },
    {
      subject: "New laptop arrived but won't power on",
      body: "Unboxed today. Plugged in for an hour, holding power for ten seconds, nothing.",
      email: "mira@northwind.test",
      name: "Mira Holt",
      channel: "email",
      priority: "high",
      asset_id: macbook.id
    },
    {
      subject: "Outage on the production database — down right now",
      body: "Critical — dashboards are 500'ing across the board. Looks like the primary is unreachable.",
      email: "ops@northwind.test",
      name: "Ops On-Call",
      channel: "email",
      priority: "urgent"
    },
    {
      subject: "How do I export a ticket report?",
      body: "I need to grab last month's tickets for the QBR deck. Is there a CSV export anywhere?",
      email: "dee@partner.test",
      name: "Dee Park",
      channel: "form"
    },
    {
      subject: "Wifi is weak in the Maple conference room",
      body: "Anyone joining a call from Maple keeps dropping. Hardwired ports work fine.",
      email: "facilities@northwind.test",
      name: "Facilities",
      channel: "email",
      status: "resolved",
      follow_up: [
        { from: "agent", body: "Replaced the AP yesterday — readings look good now." },
        { from: "customer", body: "Confirmed, working great. Thanks!" }
      ]
    },
    {
      subject: "Account access for new hire — Tomas",
      body: "Tomas starts Monday. Can you provision SSO access for the usual onboarding apps?",
      email: "hr@northwind.test",
      name: "People Ops",
      channel: "email"
    },
    {
      subject: "Monitor flickers when external camera plugged in",
      body: "Specifically my left monitor flickers whenever I plug in the Logitech webcam. Pulling the cable fixes it.",
      email: "rae@partner.test",
      name: "Rae Chen",
      channel: "email"
    }
  ];

  for (const s of seeds) {
    const t = createTicket({
      subject: s.subject,
      body: s.body,
      contact_email: s.email,
      contact_name: s.name,
      channel: s.channel,
      priority: s.priority
    });
    applyAutoTags(t.id, autoTag(s.subject, s.body));
    if (s.follow_up) {
      for (const f of s.follow_up) {
        if (f.from === "agent") {
          postMessage({ ticket_id: t.id, body: f.body, kind: "reply", author_id: agent.id });
        } else if (f.from === "note") {
          postMessage({ ticket_id: t.id, body: f.body, kind: "note", author_id: agent.id });
        } else {
          postMessage({ ticket_id: t.id, body: f.body, kind: "reply", contact_id: t.contact_id });
        }
      }
    }
    updateTicket(t.id, {
      status: s.status,
      asset_id: s.asset_id || null,
      assignee_id:
        s.assignee === "me" ? agent.id : s.assignee === "nora" ? agent2.id : undefined
    });
  }

  console.log("✓ seed complete");
  console.log("  agent: agent@lume.dev / password");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
