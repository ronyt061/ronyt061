import { NextResponse } from "next/server";
import { z } from "zod";
import { applyAutoTags, createTicket } from "@/lib/repo/tickets";
import { autoTag, complexityOf, sentimentOf } from "@/lib/ai";

const FormPayload = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  subject: z.string().min(1),
  message: z.string().min(1)
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = FormPayload.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const sentiment_score = sentimentOf(parsed.data.message);
  const complexity_score = complexityOf([{ body: parsed.data.message, kind: "reply" }]);
  const ticket = createTicket({
    subject: parsed.data.subject,
    body: parsed.data.message,
    contact_email: parsed.data.email,
    contact_name: parsed.data.name,
    channel: "form",
    sentiment_score,
    complexity_score
  });
  applyAutoTags(ticket.id, autoTag(parsed.data.subject, parsed.data.message));
  return NextResponse.json({ ok: true, ticket: { number: ticket.number } }, { status: 201 });
}
