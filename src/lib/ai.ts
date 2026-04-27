import type { Account, Contact, Message } from "./types";

const TAG_RULES: Array<{ tag: string; patterns: RegExp[] }> = [
  { tag: "billing", patterns: [/\binvoice\b/i, /\bbilling\b/i, /\bcharge(d)?\b/i, /\brefund\b/i, /\bpayment\b/i] },
  { tag: "bug", patterns: [/\berror\b/i, /\bcrash\b/i, /\bbroken\b/i, /\bdoesn'?t work\b/i, /\bfail(ed|ing|s)?\b/i] },
  { tag: "hardware", patterns: [/\bprinter\b/i, /\blaptop\b/i, /\bmonitor\b/i, /\bdevice\b/i, /\bdrive\b/i] },
  { tag: "network", patterns: [/\bvpn\b/i, /\bwifi\b/i, /\binternet\b/i, /\bnetwork\b/i, /\boutage\b/i] },
  { tag: "access", patterns: [/\blogin\b/i, /\bpassword\b/i, /\baccess\b/i, /\baccount\b/i, /\b2fa\b/i, /\bsso\b/i] },
  { tag: "feature-request", patterns: [/\bfeature request\b/i, /\bwould be nice\b/i, /\bcould you add\b/i] },
  { tag: "urgent", patterns: [/\burgent\b/i, /\basap\b/i, /\bcritical\b/i, /\bdown\b/i] }
];

export function autoTag(subject: string, body: string): string[] {
  const text = `${subject}\n${body}`;
  const out: string[] = [];
  for (const r of TAG_RULES) {
    if (r.patterns.some((p) => p.test(text))) out.push(r.tag);
  }
  return out.slice(0, 3);
}

const POS_WORDS = [
  "thanks",
  "thank you",
  "great",
  "appreciate",
  "love",
  "awesome",
  "excellent",
  "perfect",
  "resolved",
  "happy"
];
const NEG_WORDS = [
  "frustrated",
  "angry",
  "broken",
  "useless",
  "terrible",
  "awful",
  "unacceptable",
  "outage",
  "down",
  "asap",
  "urgent",
  "ridiculous",
  "still not",
  "again",
  "fail",
  "cancel",
  "refund"
];

export function sentimentOf(text: string): number {
  const lc = text.toLowerCase();
  let score = 0;
  for (const w of POS_WORDS) if (lc.includes(w)) score += 18;
  for (const w of NEG_WORDS) if (lc.includes(w)) score -= 22;
  if (/!{2,}/.test(text)) score -= 8;
  if (/[A-Z]{4,}/.test(text)) score -= 8;
  return Math.max(-100, Math.min(100, score));
}

export function sentimentLabel(score: number): "positive" | "neutral" | "negative" {
  if (score >= 25) return "positive";
  if (score <= -25) return "negative";
  return "neutral";
}

export function complexityOf(thread: Pick<Message, "body" | "kind">[]): number {
  if (!thread.length) return 0;
  const words = thread.reduce((n, m) => n + m.body.split(/\s+/).length, 0);
  const replies = thread.filter((m) => m.kind === "reply").length;
  const longest = Math.max(...thread.map((m) => m.body.length));
  let score = 0;
  score += Math.min(40, Math.floor(words / 30));
  score += Math.min(30, replies * 6);
  score += Math.min(30, Math.floor(longest / 80));
  return Math.max(0, Math.min(100, score));
}

interface AssistContext {
  subject: string;
  contact: Pick<Contact, "name" | "email" | "title"> | null;
  account: Pick<Account, "name" | "tier" | "health_score"> | null;
  agentName: string;
  thread: Pick<Message, "body" | "kind" | "author_name" | "contact_name">[];
}

export async function assistDraft(ctx: AssistContext): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await anthropic("draft", ctx);
    } catch (err) {
      console.warn("[assistDraft] Anthropic failed, falling back:", (err as Error).message);
    }
  }
  return localDraft(ctx);
}

export async function summarizeThread(ctx: AssistContext): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await anthropic("summarize", ctx);
    } catch (err) {
      console.warn("[summarizeThread] Anthropic failed, falling back:", (err as Error).message);
    }
  }
  return localSummary(ctx);
}

export interface IntentResult {
  intent: string;
  confidence: number;
  suggested_actions: string[];
}

export async function detectIntent(ctx: AssistContext): Promise<IntentResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const text = await anthropic("intent", ctx);
      return parseIntent(text) || localIntent(ctx);
    } catch (err) {
      console.warn("[detectIntent] Anthropic failed, falling back:", (err as Error).message);
    }
  }
  return localIntent(ctx);
}

function localDraft(ctx: AssistContext): string {
  const greeting = ctx.contact?.name ? `Hi ${ctx.contact.name.split(" ")[0]},` : "Hi there,";
  const ack = ctx.account
    ? `Thanks for reaching out — I've taken a look at what you sent on behalf of ${ctx.account.name}.`
    : "Thanks for reaching out — I've taken a look at what you sent.";
  const tierLine =
    ctx.account?.tier === "gold"
      ? "Given this is a Gold-tier account, I'm prioritising it now."
      : "I'll keep this open and follow up shortly.";
  return [
    greeting,
    "",
    ack,
    "",
    "Could you confirm a couple of details so I can get this sorted for you?",
    "",
    tierLine,
    "",
    "Best,",
    ctx.agentName
  ].join("\n");
}

function localSummary(ctx: AssistContext): string {
  const replies = ctx.thread.filter((m) => m.kind === "reply").length;
  const customerLast = [...ctx.thread].reverse().find((m) => m.kind === "reply" && !m.author_name);
  const summary = customerLast
    ? customerLast.body.replace(/\s+/g, " ").trim().slice(0, 180)
    : "No customer message yet.";
  return `${replies} message${replies === 1 ? "" : "s"} on the thread. Latest customer message: "${summary}${
    summary.length === 180 ? "…" : ""
  }"`;
}

function localIntent(ctx: AssistContext): IntentResult {
  const text = ctx.thread.map((m) => m.body).join("\n").toLowerCase();
  let intent = "general_inquiry";
  const actions: string[] = [];
  if (/\b(refund|invoice|billing|charge)\b/.test(text)) {
    intent = "billing_dispute";
    actions.push("Verify recent invoices", "Loop in finance");
  } else if (/\b(down|outage|unreachable|failing|fail(ed|ure)?|connection refused|cant access|cannot access|broken|critical|asap)\b/.test(text)) {
    intent = "service_disruption";
    actions.push("Check status page", "Escalate to Tier 2", "Open incident");
  } else if (/\b(login|password|2fa|sso|access)\b/.test(text)) {
    intent = "access_issue";
    actions.push("Reset credentials", "Confirm SSO bindings");
  } else if (/\b(feature|would be nice|could you add)\b/.test(text)) {
    intent = "feature_request";
    actions.push("Log on roadmap", "Acknowledge with timeline");
  } else if (/\b(printer|laptop|monitor|hardware|device)\b/.test(text)) {
    intent = "hardware_issue";
    actions.push("Confirm asset link", "Schedule on-site");
  }
  if (!actions.length) actions.push("Acknowledge", "Ask clarifying question");
  return { intent, confidence: 0.62, suggested_actions: actions.slice(0, 3) };
}

function parseIntent(raw: string): IntentResult | null {
  try {
    const json = JSON.parse(raw);
    if (typeof json.intent === "string" && Array.isArray(json.suggested_actions)) {
      return {
        intent: json.intent,
        confidence: typeof json.confidence === "number" ? json.confidence : 0.7,
        suggested_actions: json.suggested_actions.slice(0, 4)
      };
    }
  } catch {}
  return null;
}

async function anthropic(
  task: "draft" | "summarize" | "intent",
  ctx: AssistContext
): Promise<string> {
  const transcript = ctx.thread
    .map((m) => {
      const who =
        m.kind === "note"
          ? "INTERNAL NOTE"
          : m.author_name
          ? `Agent ${m.author_name}`
          : `Customer ${m.contact_name || ""}`;
      return `[${who}] ${m.body}`;
    })
    .join("\n\n");

  const accountLine = ctx.account
    ? `Account: ${ctx.account.name} (tier ${ctx.account.tier}, health ${ctx.account.health_score}/100)`
    : "Account: (unknown)";
  const contactLine = ctx.contact
    ? `Customer: ${ctx.contact.name || ctx.contact.email}${ctx.contact.title ? ` (${ctx.contact.title})` : ""}`
    : "Customer: (unknown)";

  const userByTask: Record<typeof task, { system: string; user: string }> = {
    draft: {
      system: `You are a senior B2B support agent drafting a single reply on behalf of ${ctx.agentName}. Be warm, concise, specific. Reflect the account tier when relevant. No greetings beyond a single line. End with "Best, ${ctx.agentName}". If clarification is needed, ask one focused question. Do not invent facts.`,
      user: `Subject: ${ctx.subject}\n${contactLine}\n${accountLine}\n\nThread:\n${transcript}\n\nWrite the next reply now.`
    },
    summarize: {
      system: `You are a support manager summarising a ticket thread for an agent in 1-2 sentences. No preamble.`,
      user: `Subject: ${ctx.subject}\n${contactLine}\n${accountLine}\n\nThread:\n${transcript}\n\nSummary:`
    },
    intent: {
      system: `You classify support thread intent. Reply ONLY with strict JSON of the form: {"intent":"snake_case_label","confidence":0.0-1.0,"suggested_actions":["..."]}. No prose.`,
      user: `Subject: ${ctx.subject}\n${contactLine}\n\nThread:\n${transcript}`
    }
  };

  const { system, user } = userByTask[task];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 600,
      system,
      messages: [{ role: "user", content: user }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { content: Array<{ type: string; text?: string }> };
  return (
    json.content
      .filter((b) => b.type === "text")
      .map((b) => b.text || "")
      .join("\n")
      .trim() || ""
  );
}
