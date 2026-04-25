"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Inbox, Box, LogOut, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Kbd } from "@/components/ui/Kbd";
import { CommandPalette } from "@/components/CommandPalette";
import type { User } from "@/lib/auth";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/assets", label: "Assets", icon: Box }
];

export function Shell({ user, children }: { user: User; children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex h-screen w-full bg-white">
      <aside className="flex w-56 shrink-0 flex-col border-r border-ink-100 bg-ink-50/40">
        <div className="flex h-14 items-center px-4">
          <Link href="/inbox" className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-ink-900 text-xs font-semibold text-white">
              ·
            </span>
            <span className="text-sm font-semibold tracking-tight">Lume</span>
          </Link>
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          className="mx-3 mb-3 flex h-8 items-center justify-between rounded-md border border-ink-200 bg-white px-2.5 text-xs text-ink-500 hover:border-ink-300"
        >
          <span className="flex items-center gap-2">
            <Search size={13} />
            Search or jump to…
          </span>
          <span className="flex items-center gap-0.5">
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <nav className="flex-1 space-y-0.5 px-2">
          {NAV.map((item) => {
            const active = path === item.href || path?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm",
                  active ? "bg-white text-ink-900 shadow-sm ring-1 ring-ink-100" : "text-ink-600 hover:text-ink-900"
                )}
              >
                <item.icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-ink-100 p-3">
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} size={28} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-ink-900">{user.name}</div>
              <div className="truncate text-[11px] text-ink-500">{user.email}</div>
            </div>
            <button
              onClick={logout}
              className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">{children}</main>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
