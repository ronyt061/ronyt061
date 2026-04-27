import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { applyAutoTags, createTicket, listTickets, viewCounts } from "@/lib/repo/tickets";
import { NewTicket, StatusEnum } from "@/lib/validators";
import { autoTag, complexityOf, sentimentOf } from "@/lib/ai";

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const status = StatusEnum.optional().safeParse(url.searchParams.get("status") || undefined);
  const view = url.searchParams.get("view") || "all";
  const search = url.searchParams.get("q") || undefined;
  const account_id = url.searchParams.get("account_id") || undefined;
  const tickets = listTickets({
    view,
    user_id: user.id,
    status: status.success ? status.data : undefined,
    search,
    account_id,
    limit: 200
  });
  return NextResponse.json({ tickets, counts: viewCounts(user.id) });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = NewTicket.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const sentiment_score = sentimentOf(parsed.data.body);
  const complexity_score = complexityOf([{ body: parsed.data.body, kind: "reply" }]);
  const ticket = createTicket({ ...parsed.data, sentiment_score, complexity_score });
  applyAutoTags(ticket.id, autoTag(parsed.data.subject, parsed.data.body));
  return NextResponse.json({ ticket }, { status: 201 });
}
