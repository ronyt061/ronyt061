import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTicket } from "@/lib/repo/tickets";
import { listMessages, postMessage } from "@/lib/repo/messages";
import { NewMessage } from "@/lib/validators";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!getTicket(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ messages: listMessages(params.id) });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!getTicket(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const json = await req.json().catch(() => null);
  const parsed = NewMessage.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const message = postMessage({
    ticket_id: params.id,
    body: parsed.data.body,
    kind: parsed.data.kind,
    author_id: user.id
  });
  return NextResponse.json({ message }, { status: 201 });
}
