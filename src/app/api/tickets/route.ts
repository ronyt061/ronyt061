import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createTicket, listTickets, applyAutoTags } from "@/lib/repo/tickets";
import { NewTicket, StatusEnum } from "@/lib/validators";
import { autoTag } from "@/lib/ai";

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const status = StatusEnum.optional().safeParse(url.searchParams.get("status") || undefined);
  const scope = url.searchParams.get("scope") || "all";
  const search = url.searchParams.get("q") || undefined;
  const assignee_id =
    scope === "mine" ? user.id : scope === "unassigned" ? "unassigned" : "any";
  const tickets = listTickets({
    status: status.success ? status.data : undefined,
    assignee_id,
    search,
    limit: 200
  });
  return NextResponse.json({ tickets });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = NewTicket.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const ticket = createTicket(parsed.data);
  applyAutoTags(ticket.id, autoTag(parsed.data.subject, parsed.data.body));
  return NextResponse.json({ ticket }, { status: 201 });
}
