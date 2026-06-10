"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export function InboxSearch({ q }: { q: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [val, setVal] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (val) sp.set("q", val);
      else sp.delete("q");
      sp.delete("id");
      router.replace(`/inbox?${sp.toString()}`);
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [val]);

  return (
    <div className="border-b border-ink-100 px-3 py-2">
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Search subject, contact, account…"
          className="h-7 w-full rounded-md border border-ink-200 bg-white pl-7 pr-2 text-[12px] text-ink-900 placeholder:text-ink-400 focus:border-ink-400 focus:outline-none"
        />
      </div>
    </div>
  );
}
