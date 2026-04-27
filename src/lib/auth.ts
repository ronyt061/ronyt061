import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

export { hashPassword, verifyPassword } from "./password";

const COOKIE = "lume_session";
const ALG = "HS256";
const TTL = "30d";

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is required");
  return new TextEncoder().encode(s);
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function issueSession(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(secret());
}

export async function setSessionCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export async function getSession(): Promise<User | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const id = payload.sub as string;
    const row = db
      .prepare("SELECT id, email, name, role FROM users WHERE id = ?")
      .get(id) as User | undefined;
    return row || null;
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<User> {
  const user = await getSession();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}
