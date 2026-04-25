import type { Message } from "./types";

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

interface DraftContext {
  subject: string;
  contactName: string | null;
  agentName: string;
  thread: Pick<Message, "body" | "kind" | "author_name" | "contact_name">[];
}

export async function magicDraft(ctx: DraftContext): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await draftViaAnthropic(ctx);
    } catch (err) {
      console.warn("[magicDraft] Anthropic failed, falling back:", (err as Error).message);
    }
  }
  return localDraft(ctx);
}

function localDraft(ctx: DraftContext): string {
  const greeting = ctx.contactName ? `Hi ${ctx.contactName.split(" ")[0]},` : "Hi there,";
  const last = [...ctx.thread].reverse().find((m) => m.kind === "reply" && !m.author_name);
  const ack = last
    ? "Thanks for the details — I've taken a look at what you sent."
    : "Thanks for reaching out.";
  const body = [
    greeting,
    "",
    ack,
    "",
    "I'd like to make sure I understand correctly before we proceed. Could you confirm a couple of details so I can get this sorted for you?",
    "",
    "I'll keep this ticket open and follow up shortly.",
    "",
    "Best,",
    ctx.agentName
  ].join("\n");
  return body;
}

async function draftViaAnthropic(ctx: DraftContext): Promise<string> {
  const transcript = ctx.thread
    .map((m) => {
      const who = m.kind === "note" ? "INTERNAL NOTE" : m.author_name ? `Agent ${m.author_name}` : `Customer ${m.contact_name || ""}`;
      return `[${who}] ${m.body}`;
    })
    .join("\n\n");

  const system = `You are a senior customer-support agent drafting a single reply on behalf of ${ctx.agentName}. Be warm, concise, specific. No greetings beyond a single line. No sign-off boilerplate beyond "Best, ${ctx.agentName}". Do not invent facts. If clarification is needed, ask one focused question.`;
  const user = `Subject: ${ctx.subject}\nCustomer: ${ctx.contactName || "(unknown)"}\n\nThread:\n${transcript}\n\nWrite the next reply now.`;

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
  const text = json.content
    .filter((b) => b.type === "text")
    .map((b) => b.text || "")
    .join("\n")
    .trim();
  return text || localDraft(ctx);
}
