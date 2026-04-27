import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { categories, listArticles } from "@/lib/repo/articles";

export async function GET(req: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;
  return NextResponse.json({ articles: listArticles(q), categories: categories() });
}
