"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, ChevronDown, Plus, Tag as TagIcon, Unlink, X } from "lucide-react";
import type { Asset, Tag, TicketRow, TicketPriority, TicketStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUSES: { v: TicketStatus; label: string; dot: string }[] = [
  { v: "open", label: "Open", dot: "bg-amber-500" },
  { v: "pending", label: "Pending", dot: "bg-sky-500" },
  { v: "resolved", label: "Resolved", dot: "bg-emerald-500" }
];
const PRIORITIES: { v: TicketPriority; label: string }[] = [
  { v: "low", label: "Low" },
  { v: "normal", label: "Normal" },
  { v: "high", label: "High" },
  { v: "urgent", label: "Urgent" }
];

export function TicketSidePanel({
  ticket,
  tags: initialTags,
  agents,
  assets,
  linkedAsset
}: {
  ticket: TicketRow;
  tags: Tag[];
  agents: { id: string; name: string; email: string }[];
  assets: Asset[];
  linkedAsset: Asset | null;
}) {
  const router = useRouter();
  const [tags, setTags] = useState(initialTags);

  async function patch(body: Record<string, unknown>) {
    await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    router.refresh();
  }

  async function addTag(name: string) {
    const res = await fetch(`/api/tickets/${ticket.id}/tags`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name })
    });
    if (!res.ok) return;
    const { tags } = await res.json();
    setTags(tags);
  }
  async function removeTag(id: string) {
    const res = await fetch(`/api/tickets/${ticket.id}/tags?tag_id=${id}`, { method: "DELETE" });
    if (!res.ok) return;
    const { tags } = await res.json();
    setTags(tags);
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l border-ink-100 bg-ink-50/30 lg:flex">
      <div className="border-b border-ink-100 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Properties</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <Field label="Status">
          <Select
            value={ticket.status}
            onChange={(v) => patch({ status: v })}
            items={STATUSES.map((s) => ({
              value: s.v,
              label: (
                <span className="inline-flex items-center gap-2">
                  <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                  {s.label}
                </span>
              )
            }))}
          />
        </Field>

        <Field label="Priority">
          <Select
            value={ticket.priority}
            onChange={(v) => patch({ priority: v })}
            items={PRIORITIES.map((p) => ({ value: p.v, label: p.label }))}
          />
        </Field>

        <Field label="Assignee">
          <Select
            value={ticket.assignee_id || ""}
            onChange={(v) => patch({ assignee_id: v || null })}
            items={[
              { value: "", label: <span className="text-ink-400">Unassigned</span> },
              ...agents.map((a) => ({ value: a.id, label: a.name }))
            ]}
          />
        </Field>

        <Field label="Linked asset">
          {linkedAsset ? (
            <div className="flex items-center justify-between rounded-md border border-ink-200 bg-white px-2.5 py-1.5">
              <div className="flex min-w-0 items-center gap-2">
                <Box size={13} className="text-ink-400" />
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-ink-900">{linkedAsset.name}</div>
                  {linkedAsset.identifier && (
                    <div className="truncate text-[10px] text-ink-400">{linkedAsset.identifier}</div>
                  )}
                </div>
              </div>
              <button
                onClick={() => patch({ asset_id: null })}
                className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                title="Unlink"
              >
                <Unlink size={12} />
              </button>
            </div>
          ) : (
            <AssetPicker assets={assets} onPick={(id) => patch({ asset_id: id })} />
          )}
        </Field>

        <Field label="Tags">
          <TagEditor tags={tags} onAdd={addTag} onRemove={removeTag} />
        </Field>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-400">{label}</p>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  items
}: {
  value: string;
  onChange: (v: string) => void;
  items: { value: string; label: React.ReactNode }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = items.find((i) => i.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-full items-center justify-between rounded-md border border-ink-200 bg-white px-2.5 text-xs text-ink-900 hover:border-ink-300"
      >
        <span>{current?.label}</span>
        <ChevronDown size={13} className="text-ink-400" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 animate-in rounded-lg border border-ink-100 bg-white p-1 shadow-lg">
          {items.map((i) => (
            <button
              key={i.value}
              onClick={() => {
                onChange(i.value);
                setOpen(false);
              }}
              className={cn(
                "flex h-7 w-full items-center rounded px-2 text-left text-xs",
                i.value === value ? "bg-ink-100 text-ink-900" : "text-ink-700 hover:bg-ink-50"
              )}
            >
              {i.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AssetPicker({ assets, onPick }: { assets: Asset[]; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = q
    ? assets.filter((a) =>
        (a.name + " " + (a.identifier || "")).toLowerCase().includes(q.toLowerCase())
      )
    : assets.slice(0, 8);

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder="Search assets…"
        className="h-8 w-full rounded-md border border-ink-200 bg-white px-2.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-ink-400 focus:outline-none"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-lg border border-ink-100 bg-white p-1 shadow-lg">
          {filtered.map((a) => (
            <button
              key={a.id}
              onMouseDown={(e) => {
                e.preventDefault();
                onPick(a.id);
                setOpen(false);
                setQ("");
              }}
              className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-ink-50"
            >
              <Box size={12} className="mt-0.5 text-ink-400" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-ink-900">{a.name}</span>
                {a.identifier && (
                  <span className="block truncate text-[10px] text-ink-400">{a.identifier}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TagEditor({
  tags,
  onAdd,
  onRemove
}: {
  tags: Tag[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);

  function commit() {
    const v = input.trim();
    if (v) onAdd(v);
    setInput("");
    setEditing(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((t) => (
        <span
          key={t.id}
          className="group inline-flex h-6 items-center gap-1 rounded-md bg-white px-2 text-xs text-ink-700 ring-1 ring-ink-200"
        >
          <TagIcon size={10} className="text-ink-400" />
          {t.name}
          <button
            onClick={() => onRemove(t.id)}
            className="rounded p-0.5 text-ink-300 hover:text-ink-700"
            aria-label="Remove tag"
          >
            <X size={10} />
          </button>
        </span>
      ))}
      {editing ? (
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setInput("");
              setEditing(false);
            }
          }}
          onBlur={commit}
          placeholder="tag…"
          className="h-6 w-20 rounded-md border border-ink-200 bg-white px-1.5 text-xs focus:border-ink-400 focus:outline-none"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        >
          <Plus size={11} /> Add
        </button>
      )}
    </div>
  );
}
