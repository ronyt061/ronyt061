import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTicket, updateTicket } from "@/lib/repo/tickets";
import { listMessages, postMessage } from "@/lib/repo/messages";
import { NewMessage } from "@/lib/validators";
import { sentimentOf } from "@/lib/ai";
import { db } from "@/lib/db";

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
  const sentiment_score = sentimentOf(parsed.data.body);
  const message = postMessage({
    ticket_id: params.id,
    body: parsed.data.body,
    kind: parsed.data.kind,
    author_id: user.id,
    sentiment_score
  });

  // Roll thread sentiment up onto the ticket as a moving average of the
  // last 5 customer/agent messages, ignoring internal notes.
  const recent = (
    db
      .prepare(
        `SELECT sentiment_score FROM messages
           WHERE ticket_id = ? AND kind != 'note'
           ORDER BY created_at DESC LIMIT 5`
      )
      .all(params.id) as Array<{ sentiment_score: number }>
  ).map((r) => r.sentiment_score);
  if (recent.length) {
    const avg = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
    updateTicket(params.id, { sentiment_score: avg });
  }
  return NextResponse.json({ message }, { status: 201 });
}
