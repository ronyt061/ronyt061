import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTicket } from "@/lib/repo/tickets";
import { listMessages } from "@/lib/repo/messages";
import { magicDraft } from "@/lib/ai";
import { getContact } from "@/lib/repo/contacts";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const t = getTicket(params.id);
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const messages = listMessages(t.id);
  const contact = getContact(t.contact_id);
  const draft = await magicDraft({
    subject: t.subject,
    contactName: contact?.name || null,
    agentName: user.name,
    thread: messages.map((m) => ({
      body: m.body,
      kind: m.kind,
      author_name: m.author_name,
      contact_name: m.contact_name
    }))
  });
  return NextResponse.json({ draft });
}
