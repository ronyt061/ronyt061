import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAsset, listAssets } from "@/lib/repo/assets";
import { NewAsset } from "@/lib/validators";

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  return NextResponse.json({ assets: listAssets(q) });
}

export async function POST(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = NewAsset.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const asset = createAsset(parsed.data);
  return NextResponse.json({ asset }, { status: 201 });
}
