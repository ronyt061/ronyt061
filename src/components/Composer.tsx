"use client";

import { useEffect, useRef, useState } from "react";
import { Send, MessageSquareDashed } from "lucide-react";
import type { Contact, Message } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function Composer({
  ticketId,
  onSent,
  initialBody,
  onConsumeInitial
}: {
  ticketId: string;
  contact: Contact;
  onSent: (m: Message) => void;
  initialBody?: string;
  onConsumeInitial?: () => void;
}) {
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"reply" | "note">("reply");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialBody && initialBody.length > 0) {
      setBody(initialBody);
      setKind("reply");
      onConsumeInitial?.();
      setTimeout(() => ref.current?.focus(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBody]);

  async function send() {
    if (!body.trim() || busy) return;
    setBusy(true);
    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body, kind })
    });
    setBusy(false);
    if (!res.ok) return;
    const { message } = await res.json();
    onSent(message);
    setBody("");
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="border-t border-ink-100 bg-white px-4 py-3">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => setKind("reply")}
            className={cn(
              "h-6 rounded px-2 font-medium",
              kind === "reply" ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"
            )}
          >
            Reply
          </button>
          <button
            onClick={() => setKind("note")}
            className={cn(
              "h-6 rounded px-2 font-medium",
              kind === "note" ? "bg-amber-500 text-white" : "text-ink-500 hover:text-ink-900"
            )}
          >
            <span className="inline-flex items-center gap-1">
              <MessageSquareDashed size={11} /> Internal note
            </span>
          </button>
        </div>

        <div
          className={cn(
            "rounded-xl border bg-white px-3 py-2 transition-colors",
            kind === "note" ? "border-amber-200 bg-amber-50/40" : "border-ink-200 focus-within:border-ink-400"
          )}
        >
          <textarea
            ref={ref}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKey}
            rows={3}
            placeholder={kind === "note" ? "Note to your team — not visible to the customer." : "Write a reply…"}
            className="block w-full resize-none bg-transparent text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[11px] text-ink-400">Use AI Assist above to draft, summarise, or detect intent.</span>
            <div className="flex items-center gap-2 text-[11px] text-ink-400">
              <span className="hidden sm:inline">⌘↵ to send</span>
              <Button size="sm" variant="primary" onClick={send} disabled={busy || !body.trim()}>
                <Send size={12} />
                {kind === "note" ? "Save note" : "Send"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
