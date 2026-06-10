import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTicketByNumber } from "@/lib/repo/tickets";

export async function GET(_req: Request, { params }: { params: { number: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const n = parseInt(params.number, 10);
  if (Number.isNaN(n)) return NextResponse.json({ error: "Invalid number" }, { status: 400 });
  const ticket = getTicketByNumber(n);
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ticket });
}
