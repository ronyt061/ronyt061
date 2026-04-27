import { cn } from "@/lib/utils";

export function QueueHealth({
  data
}: {
  data: Array<{ day: string; opened: number; resolved: number }>;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.opened, d.resolved]));
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
          Last 14 days
        </span>
        <span className="flex items-center gap-3 text-[10px] text-ink-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-3 rounded-sm bg-ink-700" /> Opened
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-3 rounded-sm bg-emerald-500" /> Resolved
          </span>
        </span>
      </div>
      <div className="grid grid-cols-14 gap-1.5 sm:grid-cols-14">
        <div className="col-span-full grid grid-cols-14 items-end gap-1.5">
          {data.map((d) => (
            <DayBar key={d.day} day={d.day} opened={d.opened} resolved={d.resolved} max={max} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayBar({
  day,
  opened,
  resolved,
  max
}: {
  day: string;
  opened: number;
  resolved: number;
  max: number;
}) {
  const oH = Math.max(2, Math.round((opened / max) * 64));
  const rH = Math.max(2, Math.round((resolved / max) * 64));
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex h-16 w-full items-end justify-center gap-0.5">
        <span className="block w-1.5 rounded-t-sm bg-ink-700" style={{ height: `${oH}px` }} title={`${day} opened: ${opened}`} />
        <span className="block w-1.5 rounded-t-sm bg-emerald-500" style={{ height: `${rH}px` }} title={`${day} resolved: ${resolved}`} />
      </div>
      <span className={cn("text-[9px] tabular-nums text-ink-400")}>{day.slice(8)}</span>
    </div>
  );
}
