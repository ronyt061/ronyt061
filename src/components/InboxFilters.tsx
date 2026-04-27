"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

const STATUSES = [
  { v: "open", label: "Open", dot: "bg-amber-500" },
  { v: "pending", label: "Pending", dot: "bg-sky-500" },
  { v: "resolved", label: "Resolved", dot: "bg-emerald-500" }
] as const;

const SCOPES = [
  { v: "all", label: "All" },
  { v: "mine", label: "Mine" },
  { v: "unassigned", label: "Unassigned" }
] as const;

export function InboxFilters({
  status,
  scope,
  q
}: {
  status: string;
  scope: string;
  q: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (query) sp.set("q", query);
      else sp.delete("q");
      router.replace(`/inbox?${sp.toString()}`);
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function setParam(key: string, value: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set(key, value);
    router.push(`/inbox?${sp.toString()}`);
  }

  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-100 px-6 py-2.5">
      <div className="flex items-center gap-1">
        {STATUSES.map((s) => (
          <button
            key={s.v}
            onClick={() => setParam("status", s.v)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
              status === s.v ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-100"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", s.dot, status === s.v ? "opacity-100" : "opacity-70")} />
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-1 sm:flex">
          {SCOPES.map((s) => (
            <button
              key={s.v}
              onClick={() => setParam("scope", s.v)}
              className={cn(
                "h-7 rounded-md px-2.5 text-xs font-medium",
                scope === s.v ? "bg-ink-100 text-ink-900" : "text-ink-500 hover:text-ink-900"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="h-7 w-48 rounded-md border border-ink-200 bg-white pl-7 pr-2 text-xs text-ink-900 placeholder:text-ink-400 focus:border-ink-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
