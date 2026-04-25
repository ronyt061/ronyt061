import { NextResponse } from "next/server";
import { z } from "zod";
import { applyAutoTags, createTicket } from "@/lib/repo/tickets";
import { autoTag } from "@/lib/ai";

const Inbound = z.object({
  from: z.string().email(),
  from_name: z.string().optional(),
  subject: z.string().min(1),
  body: z.string().min(1)
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Inbound.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const ticket = createTicket({
    subject: parsed.data.subject,
    body: parsed.data.body,
    contact_email: parsed.data.from,
    contact_name: parsed.data.from_name,
    channel: "email"
  });
  applyAutoTags(ticket.id, autoTag(parsed.data.subject, parsed.data.body));
  return NextResponse.json({ ok: true, ticket }, { status: 201 });
}
