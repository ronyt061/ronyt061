"use client";

import { useState } from "react";
import {
  Languages,
  Loader2,
  type LucideIcon,
  Sparkles,
  Target,
  Wand2,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";

interface IntentResult {
  intent: string;
  confidence: number;
  suggested_actions: string[];
}

export function AIAssistPanel({
  ticketId,
  onInsert
}: {
  ticketId: string;
  onInsert: (text: string) => void;
}) {
  const [busy, setBusy] = useState<null | "draft" | "summarize" | "intent">(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [intent, setIntent] = useState<IntentResult | null>(null);

  async function call(kind: "draft" | "summarize" | "intent") {
    setBusy(kind);
    const res = await fetch(`/api/assist/${kind}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticket_id: ticketId })
    }).catch(() => null);
    setBusy(null);
    if (!res || !res.ok) return;
    const data = await res.json();
    if (kind === "draft") onInsert(data.draft);
    if (kind === "summarize") setSummary(data.summary);
    if (kind === "intent") setIntent(data);
  }

  return (
    <div className="rounded-lg border border-ink-100 bg-gradient-to-b from-indigo-50/40 to-white px-3 py-2.5">
      <div className="mb-2 flex items-center gap-1.5">
        <Sparkles size={12} className="text-indigo-500" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
          AI Assist
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <AssistBtn
          icon={Wand2}
          label="Draft reply"
          active={busy === "draft"}
          onClick={() => call("draft")}
        />
        <AssistBtn
          icon={Languages}
          label="Summarize"
          active={busy === "summarize"}
          onClick={() => call("summarize")}
        />
        <AssistBtn
          icon={Target}
          label="Detect intent"
          active={busy === "intent"}
          onClick={() => call("intent")}
        />
      </div>

      {summary && (
        <div className="mt-2 rounded-md bg-white px-2.5 py-1.5 text-[11px] leading-relaxed text-ink-700 ring-1 ring-ink-100">
          <span className="font-medium text-ink-900">Summary · </span>
          {summary}
        </div>
      )}

      {intent && (
        <div className="mt-2 rounded-md bg-white px-2.5 py-1.5 text-[11px] leading-relaxed ring-1 ring-ink-100">
          <div className="flex items-center justify-between">
            <span className="font-medium text-ink-900">
              Intent · <span className="text-indigo-700">{intent.intent.replace(/_/g, " ")}</span>
            </span>
            <span className="text-[10px] text-ink-400">
              {(intent.confidence * 100).toFixed(0)}% conf.
            </span>
          </div>
          {intent.suggested_actions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {intent.suggested_actions.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-700 ring-1 ring-indigo-100"
                >
                  <Wrench size={9} /> {a}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssistBtn({
  icon: Icon,
  label,
  onClick,
  active
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={active}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md bg-white px-2 text-[11px] font-medium text-ink-700 ring-1 ring-ink-200 hover:text-ink-900 hover:ring-ink-300 disabled:opacity-60"
      )}
    >
      {active ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />}
      {label}
    </button>
  );
}
