"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("agent@lume.dev");
  const [password, setPassword] = useState("password");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body = mode === "login" ? { email, password } : { email, password, name };
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong");
      return;
    }
    router.push("/inbox");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink-50 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white">
            <span className="text-lg">·</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Lume</h1>
          <p className="mt-1 text-sm text-ink-500">A quiet inbox for tickets that need a human.</p>
        </div>

        <form onSubmit={submit} className="space-y-3 rounded-xl border border-ink-100 bg-white p-6 shadow-sm">
          {mode === "register" && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Email</span>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-600">Password</span>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
          <button
            type="button"
            className="block w-full text-center text-xs text-ink-500 hover:text-ink-900"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-400">
          Demo: <span className="font-mono text-ink-500">agent@lume.dev / password</span>
        </p>
      </div>
    </main>
  );
}
