"use client";

import { useState } from "react";
import { Box, Plus } from "lucide-react";
import type { Asset } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AssetsView({ initial }: { initial: Asset[] }) {
  const [assets, setAssets] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState("hardware");
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, kind, identifier: identifier || undefined })
    });
    setBusy(false);
    if (!res.ok) return;
    const { asset } = await res.json();
    setAssets((prev) => [...prev, asset].sort((a, b) => a.name.localeCompare(b.name)));
    setName("");
    setIdentifier("");
    setCreating(false);
  }

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-ink-100 px-6">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-ink-900">Assets</h1>
          <p className="text-xs text-ink-500">Hardware, deployments, anything ticket-linkable.</p>
        </div>
        <Button size="sm" variant="primary" onClick={() => setCreating(true)}>
          <Plus size={12} /> New asset
        </Button>
      </header>

      {creating && (
        <form
          onSubmit={create}
          className="border-b border-ink-100 bg-ink-50/40 px-6 py-3"
        >
          <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
            <label className="flex-1">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                Name
              </span>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="MacBook Pro 14" required />
            </label>
            <label className="w-32">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-400">Kind</span>
              <Input value={kind} onChange={(e) => setKind(e.target.value)} />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                Identifier
              </span>
              <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="serial / hostname" />
            </label>
            <Button type="submit" variant="primary" size="md" disabled={busy}>
              Save
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto">
        {assets.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <Box size={20} className="mx-auto text-ink-300" />
              <p className="mt-2 text-sm font-medium text-ink-900">No assets yet.</p>
              <p className="mt-1 text-xs text-ink-500">Add one to start linking it from tickets.</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {assets.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-6 py-3">
                <Box size={14} className="text-ink-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink-900">{a.name}</div>
                  <div className="text-xs text-ink-500">
                    {a.kind}
                    {a.identifier ? ` · ${a.identifier}` : ""}
                  </div>
                </div>
                {a.notes && <div className="max-w-xs truncate text-xs text-ink-400">{a.notes}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
