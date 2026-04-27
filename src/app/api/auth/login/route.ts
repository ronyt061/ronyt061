import { NextResponse } from "next/server";
import { LoginInput } from "@/lib/validators";
import { findUserByEmail } from "@/lib/repo/users";
import { issueSession, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = LoginInput.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const user = findUserByEmail(parsed.data.email);
  if (!user || !(await verifyPassword(parsed.data.password, user.password_hash))) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const token = await issueSession(user.id);
  await setSessionCookie(token);
  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role });
}
