import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { contactsForAccount, getAccount, ticketsForAccount } from "@/lib/repo/accounts";
import { contractsForAccount } from "@/lib/repo/contracts";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const account = getAccount(params.id);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    account,
    contracts: contractsForAccount(account.id),
    contacts: contactsForAccount(account.id),
    recent_tickets: ticketsForAccount(account.id, 8)
  });
}
