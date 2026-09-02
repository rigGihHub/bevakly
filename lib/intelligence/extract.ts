import { wasteKeywords, type WatchSource } from "./sources";

export type ExtractedLink = { title: string; url: string };

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(href: string, source: WatchSource) {
  try { return new URL(href, source.baseUrl).toString(); } catch { return ""; }
}

export function extractRelevantLinks(html: string, source: WatchSource): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const anchorRegex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = anchorRegex.exec(html))) {
    const title = cleanText(match[2]);
    if (title.length < 18 || title.length > 180) continue;
    const lower = title.toLocaleLowerCase("sv-SE");
    if (!wasteKeywords.some((keyword) => lower.includes(keyword))) continue;
    const url = absoluteUrl(match[1], source);
    if (!url || !url.startsWith("http")) continue;
    links.push({ title, url });
  }

  const unique = new Map<string, ExtractedLink>();
  for (const link of links) unique.set(`${link.title}|${link.url}`, link);
  return [...unique.values()].slice(0, 18);
}
