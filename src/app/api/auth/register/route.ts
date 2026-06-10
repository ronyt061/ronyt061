import { NextResponse } from "next/server";
import { RegisterInput } from "@/lib/validators";
import { createUser, findUserByEmail } from "@/lib/repo/users";
import { issueSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = RegisterInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (findUserByEmail(parsed.data.email)) {
    return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
  }
  const user = await createUser(parsed.data.email, parsed.data.name, parsed.data.password);
  const token = await issueSession(user.id);
  await setSessionCookie(token);
  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
}
