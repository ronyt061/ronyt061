import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenText } from "lucide-react";
import { getArticle } from "@/lib/repo/articles";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticle(params.slug);
  if (!article) notFound();
  return (
    <>
      <header className="flex h-12 items-center gap-2 border-b border-ink-100 px-4">
        <Link
          href="/kb"
          className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          aria-label="Back to knowledge base"
        >
          <ArrowLeft size={14} />
        </Link>
        <BookOpenText size={13} className="text-ink-400" />
        <span className="text-[11px] uppercase tracking-wider text-ink-500">{article.category}</span>
      </header>
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <article className="mx-auto max-w-2xl">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">{article.title}</h1>
          <p className="mt-1 text-xs text-ink-400">Updated {timeAgo(article.updated_at)} ago</p>
          <div className="prose prose-sm mt-6 whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
            {article.body}
          </div>
        </article>
      </div>
    </>
  );
}
