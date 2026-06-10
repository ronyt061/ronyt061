import { listTeams, teamCounts, teamMembers } from "@/lib/repo/teams";
import { listSLAPolicies } from "@/lib/repo/sla";
import { listAgents } from "@/lib/repo/users";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const teams = listTeams();
  const counts = new Map(teamCounts().map((c) => [c.team_id, c]));
  const policies = listSLAPolicies();
  const agents = listAgents();

  return (
    <>
      <header className="flex items-center justify-between border-b border-ink-100 px-6 py-3">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-ink-900">Settings</h1>
          <p className="text-[11px] text-ink-500">Teams, SLA policies, members.</p>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto bg-ink-50/30 p-6">
        <Section title="Teams">
          <Table
            columns={["Team", "Members", "Open", "Pending", "Resolved"]}
            rows={teams.map((t) => {
              const c = counts.get(t.id) || { open: 0, pending: 0, resolved: 0 };
              const members = teamMembers(t.id) as Array<{ name: string }>;
              return [
                <span key="t" className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                  <span className="font-medium">{t.name}</span>
                </span>,
                members.map((m) => m.name).join(", ") || "—",
                String(c.open),
                String(c.pending),
                String(c.resolved)
              ];
            })}
          />
        </Section>

        <Section title="SLA Policies">
          <Table
            columns={["Policy", "Tier", "First response", "Resolution"]}
            rows={policies.map((p) => [
              <span key="p" className="font-medium">
                {p.name}
              </span>,
              <span key="tier" className="capitalize">
                {p.applies_to_tier}
              </span>,
              minutesLabel(p.first_response_minutes),
              minutesLabel(p.resolution_minutes)
            ])}
          />
        </Section>

        <Section title="Members">
          <Table
            columns={["Name", "Email", "Role"]}
            rows={agents.map((a) => [
              <span key="n" className="font-medium">
                {a.name}
              </span>,
              <span key="e" className="font-mono text-[11px]">
                {a.email}
              </span>,
              <span key="r" className="capitalize">
                {a.role}
              </span>
            ])}
          />
        </Section>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        {title}
      </h2>
      <div className="rounded-xl border border-ink-100 bg-white">{children}</div>
    </section>
  );
}

function Table({
  columns,
  rows
}: {
  columns: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-ink-100 text-left text-[10px] uppercase tracking-wider text-ink-400">
          {columns.map((c) => (
            <th key={c} className="px-4 py-2 font-semibold">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="px-4 py-3 text-center text-ink-400">
              No rows.
            </td>
          </tr>
        ) : (
          rows.map((r, i) => (
            <tr key={i} className="border-b border-ink-100 last:border-0">
              {r.map((cell, j) => (
                <td key={j} className="px-4 py-2 align-middle text-ink-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function minutesLabel(m: number): string {
  if (m < 60) return `${m}m`;
  const h = m / 60;
  if (h < 24) return `${h}h`;
  const d = h / 24;
  return `${d}d`;
}
