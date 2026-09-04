import { wasteKeywords } from "./sources";

export type ArticleExtraction = {
  title: string;
  description: string;
  publishedAt: string | null;
  textSample: string;
};

function decode(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"').replace(/&aring;/g, "å").replace(/&auml;/g, "ä").replace(/&ouml;/g, "ö");
}

function clean(value: string) {
  return decode(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function meta(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern); if (match) return clean(match[1]);
  }
  return "";
}

function firstMatch(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) { const m = html.match(pattern); if (m?.[1]) return clean(m[1]); }
  return "";
}

export function extractArticle(html: string, keywords: string[] = wasteKeywords): ArticleExtraction {
  const title = meta(html, "og:title") || firstMatch(html, [/<h1[^>]*>([\s\S]*?)<\/h1>/i, /<title[^>]*>([\s\S]*?)<\/title>/i]);
  const description = meta(html, "og:description") || meta(html, "description");
  const dateRaw = meta(html, "article:published_time") || firstMatch(html, [
    /<time[^>]+datetime=["']([^"']+)["']/i,
    /"datePublished"\s*:\s*"([^"]+)"/i,
  ]);
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m => clean(m[1]))
    .filter(p => p.length >= 45 && (keywords.length===0 || keywords.some(k => p.toLocaleLowerCase("sv-SE").includes(k.toLocaleLowerCase("sv-SE")))))
    .slice(0, 5);
  const textSample = paragraphs.join(" ").slice(0, 1600);
  let publishedAt: string | null = null;
  if (dateRaw) { const d = new Date(dateRaw); if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString(); }
  return { title, description, publishedAt, textSample };
}

export function factualSummary(article: ArticleExtraction, fallbackTitle: string) {
  const base = article.description || article.textSample;
  if (!base) return `Källträff om: ${fallbackTitle}. Öppna originalkällan för fullständiga fakta.`;
  const sentences = base.split(/(?<=[.!?])\s+/).filter(s => s.length > 25).slice(0, 2).join(" ");
  return (sentences || base).slice(0, 420);
}
