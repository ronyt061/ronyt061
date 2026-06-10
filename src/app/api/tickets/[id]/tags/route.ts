import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getTicket } from "@/lib/repo/tickets";
import { attachTag, detachTag, tagsForTicket } from "@/lib/repo/tags";
import { TagInput } from "@/lib/validators";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!getTicket(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ tags: tagsForTicket(params.id) });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!getTicket(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const json = await req.json().catch(() => null);
  const parsed = TagInput.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const tag = attachTag(params.id, parsed.data.name);
  return NextResponse.json({ tag, tags: tagsForTicket(params.id) }, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const tagId = url.searchParams.get("tag_id");
  if (!tagId) return NextResponse.json({ error: "tag_id required" }, { status: 400 });
  detachTag(params.id, tagId);
  return NextResponse.json({ tags: tagsForTicket(params.id) });
}
