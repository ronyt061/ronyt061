import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getArticle } from "@/lib/repo/articles";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const article = getArticle(params.slug);
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ article });
}
