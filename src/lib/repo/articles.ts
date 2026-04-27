import { db, uid } from "../db";
import type { Article } from "../types";

export function listArticles(query?: string): Article[] {
  if (query) {
    const q = `%${query.toLowerCase()}%`;
    return db
      .prepare(
        `SELECT * FROM articles
           WHERE LOWER(title) LIKE ? OR LOWER(body) LIKE ? OR LOWER(category) LIKE ?
           ORDER BY updated_at DESC LIMIT 50`
      )
      .all(q, q, q) as Article[];
  }
  return db.prepare("SELECT * FROM articles ORDER BY updated_at DESC").all() as Article[];
}

export function getArticle(slug: string): Article | null {
  return (db.prepare("SELECT * FROM articles WHERE slug = ?").get(slug) as Article) || null;
}

export function createArticle(input: {
  slug: string;
  title: string;
  body: string;
  category?: string;
}): Article {
  const id = uid("art_");
  db.prepare(
    `INSERT INTO articles (id, slug, title, body, category) VALUES (?, ?, ?, ?, ?)`
  ).run(id, input.slug, input.title, input.body, input.category || "general");
  return getArticle(input.slug)!;
}

export function categories(): string[] {
  const rows = db
    .prepare("SELECT DISTINCT category FROM articles ORDER BY category")
    .all() as Array<{ category: string }>;
  return rows.map((r) => r.category);
}
