import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listTeams, teamCounts } from "@/lib/repo/teams";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ teams: listTeams(), counts: teamCounts() });
}
