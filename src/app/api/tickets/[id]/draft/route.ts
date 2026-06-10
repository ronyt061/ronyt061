import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { buildContext } from "@/lib/assistContext";
import { assistDraft } from "@/lib/ai";

// Legacy alias for /api/assist/draft. Kept so older clients keep working.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = buildContext(params.id);
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const draft = await assistDraft({
    subject: ctx.ticket.subject,
    contact: ctx.contact
      ? { name: ctx.contact.name, email: ctx.contact.email, title: ctx.contact.title }
      : null,
    account: ctx.account
      ? { name: ctx.account.name, tier: ctx.account.tier, health_score: ctx.account.health_score }
      : null,
    agentName: user.name,
    thread: ctx.messages.map((m) => ({
      body: m.body,
      kind: m.kind,
      author_name: m.author_name,
      contact_name: m.contact_name
    }))
  });
  return NextResponse.json({ draft });
}
