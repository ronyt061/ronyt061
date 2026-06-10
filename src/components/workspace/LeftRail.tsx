"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Frown,
  Inbox,
  ListChecks,
  type LucideIcon,
  UserCircle,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewCounts {
  mine: number;
  unassigned: number;
  breaching: number;
  negative: number;
  all: number;
  teams: Array<{ team_id: string; team_name: string; team_color: string; n: number }>;
}

const ITEMS: Array<{
  view: string;
  label: string;
  icon: LucideIcon;
  countKey: keyof ViewCounts;
  emphasize?: "amber" | "red";
}> = [
  { view: "all", label: "All open", icon: Inbox, countKey: "all" },
  { view: "mine", label: "My open", icon: UserCircle, countKey: "mine" },
  { view: "unassigned", label: "Unassigned", icon: ListChecks, countKey: "unassigned" },
  { view: "breaching", label: "Breaching SLA", icon: AlertTriangle, countKey: "breaching", emphasize: "red" },
  { view: "negative", label: "Negative sentiment", icon: Frown, countKey: "negative", emphasize: "amber" }
];

export function LeftRail({ counts, basePath = "/inbox" }: { counts: ViewCounts; basePath?: string }) {
  const params = useSearchParams();
  const current = params.get("view") || "all";

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-ink-100 bg-ink-50/30">
      <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
        Views
      </div>
      <nav className="space-y-0.5 px-2">
        {ITEMS.map((item) => {
          const active = current === item.view;
          const count = counts[item.countKey] as number;
          const Icon = item.icon;
          return (
            <Link
              key={item.view}
              href={`${basePath}?view=${item.view}`}
              className={cn(
                "group flex h-7 items-center justify-between rounded-md px-2 text-xs",
                active
                  ? "bg-white text-ink-900 ring-1 ring-ink-100 shadow-sm"
                  : "text-ink-600 hover:text-ink-900 hover:bg-white/60"
              )}
            >
              <span className="flex items-center gap-2">
                <Icon size={12} className={cn(active ? "text-ink-700" : "text-ink-400")} />
                {item.label}
              </span>
              {count > 0 && (
                <span
                  className={cn(
                    "ml-2 inline-flex h-4 min-w-[1rem] items-center justify-center rounded px-1 text-[10px] font-medium",
                    item.emphasize === "red"
                      ? "bg-red-50 text-red-600"
                      : item.emphasize === "amber"
                      ? "bg-amber-50 text-amber-700"
                      : active
                      ? "bg-ink-100 text-ink-700"
                      : "bg-ink-50 text-ink-500"
                  )}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {counts.teams.length > 0 && (
        <>
          <div className="mt-4 px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
            Teams
          </div>
          <nav className="space-y-0.5 px-2">
            {counts.teams.map((t) => {
              const active = current === `team:${t.team_id}`;
              return (
                <Link
                  key={t.team_id}
                  href={`${basePath}?view=team:${t.team_id}`}
                  className={cn(
                    "flex h-7 items-center justify-between rounded-md px-2 text-xs",
                    active
                      ? "bg-white text-ink-900 ring-1 ring-ink-100 shadow-sm"
                      : "text-ink-600 hover:text-ink-900 hover:bg-white/60"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: t.team_color }}
                    />
                    {t.team_name}
                  </span>
                  {t.n > 0 && (
                    <span className="ml-2 inline-flex h-4 min-w-[1rem] items-center justify-center rounded bg-ink-50 px-1 text-[10px] font-medium text-ink-500">
                      {t.n}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </>
      )}

      <div className="mt-auto p-3 text-[10px] text-ink-400">
        <div className="flex items-center gap-1">
          <Users size={10} /> Press{" "}
          <kbd className="kbd">⌘K</kbd> for actions
        </div>
      </div>
    </aside>
  );
}
