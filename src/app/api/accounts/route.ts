import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listAccounts } from "@/lib/repo/accounts";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ accounts: listAccounts() });
}
