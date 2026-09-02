import { personalScore, type FeedbackRecord, type RelevanceItem } from './personal-relevance';

export type BriefItem = RelevanceItem & {
  publishedAt: string;
  importance: string;
  evidence: string;
  factualSummary: string;
};

export type MorningBrief = {
  since: string;
  until: string;
  totalNew: number;
  protectedCount: number;
  independentCount: number;
  categoryCounts: Array<{ category: string; count: number }>;
  top: Array<{ item: BriefItem; personalScore: number; protectedSignal: boolean; reasons: string[] }>;
};

export function buildMorningBrief(
  items: BriefItem[],
  since: string,
  until: string,
  feedback: FeedbackRecord[],
  limit = 5,
): MorningBrief {
  const sinceMs = new Date(since).getTime();
  const untilMs = new Date(until).getTime();
  const inWindow = items.filter(item => {
    const ms = new Date(item.publishedAt).getTime();
    return Number.isFinite(ms) && ms > sinceMs && ms <= untilMs;
  });

  const ranked = inWindow.map(item => {
    const personal = personalScore(item, feedback, new Date(until));
    const sourceBonus = Math.min(6, Math.max(0, item.independentSourceCount - 1) * 3);
    const protectedBonus = personal.protectedSignal ? 5 : 0;
    return {
      item,
      personalScore: Math.min(100, personal.score + sourceBonus + protectedBonus),
      protectedSignal: personal.protectedSignal,
      reasons: personal.reasons,
    };
  }).sort((a,b) => b.personalScore - a.personalScore || new Date(b.item.publishedAt).getTime() - new Date(a.item.publishedAt).getTime());

  const categories = new Map<string, number>();
  for (const item of inWindow) categories.set(item.category, (categories.get(item.category) ?? 0) + 1);

  return {
    since,
    until,
    totalNew: inWindow.length,
    protectedCount: ranked.filter(x => x.protectedSignal).length,
    independentCount: inWindow.filter(x => x.independentSourceCount >= 2).length,
    categoryCounts: [...categories.entries()].map(([category,count]) => ({category,count})).sort((a,b)=>b.count-a.count || a.category.localeCompare(b.category,'sv')),
    top: ranked.slice(0, Math.max(1, limit)),
  };
}
