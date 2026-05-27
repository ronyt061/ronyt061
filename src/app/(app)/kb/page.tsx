import Link from "next/link";
import { BookOpenText } from "lucide-react";
import { categories, listArticles } from "@/lib/repo/articles";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function KbPage({
  searchParams
}: {
  searchParams: { q?: string; category?: string };
}) {
  const all = listArticles(searchParams.q);
  const articles = searchParams.category
    ? all.filter((a) => a.category === searchParams.category)
    : all;
  const cats = categories();

  return (
    <>
      <header className="flex items-center justify-between border-b border-ink-100 px-6 py-3">
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-ink-900">Knowledge Base</h1>
          <p className="text-[11px] text-ink-500">
            Articles agents can suggest into a reply.
          </p>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 shrink-0 border-r border-ink-100 bg-ink-50/30 px-3 py-4">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
            Categories
          </div>
          <ul className="space-y-0.5">
            <li>
              <Link
                href="/kb"
                className={`flex h-7 items-center rounded-md px-2 text-xs ${
                  !searchParams.category ? "bg-white ring-1 ring-ink-100 text-ink-900" : "text-ink-600 hover:text-ink-900"
                }`}
              >
                All
              </Link>
            </li>
            {cats.map((c) => (
              <li key={c}>
                <Link
                  href={`/kb?category=${encodeURIComponent(c)}`}
                  className={`flex h-7 items-center rounded-md px-2 text-xs ${
                    searchParams.category === c
                      ? "bg-white ring-1 ring-ink-100 text-ink-900"
                      : "text-ink-600 hover:text-ink-900"
                  }`}
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex-1 overflow-y-auto">
          {articles.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div>
                <BookOpenText size={20} className="mx-auto text-ink-300" />
                <p className="mt-2 text-sm font-medium text-ink-900">No articles match.</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {articles.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/kb/${a.slug}`}
                    className="block px-6 py-3 hover:bg-ink-50"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-ink-900">{a.title}</div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-ink-500">
                          {a.body.replace(/\s+/g, " ").slice(0, 160)}
                        </div>
                      </div>
                      <span className="whitespace-nowrap text-[10px] text-ink-400">
                        {a.category} · {timeAgo(a.updated_at)} ago
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
