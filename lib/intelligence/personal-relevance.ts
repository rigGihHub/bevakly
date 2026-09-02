export type FeedbackKind = 'important' | 'irrelevant' | 'follow';

export type RelevanceItem = {
  url: string;
  title: string;
  source: string;
  sourceTier: number;
  sourceScope: string;
  category: string;
  score: number;
  independentSourceCount: number;
  geographies: string[];
};

export type FeedbackRecord = {
  itemKey: string;
  kind: FeedbackKind;
  at: string;
  category: string;
  source: string;
  sourceScope: string;
  geographies: string[];
  tokens: string[];
};

export type PersonalScore = {
  baseScore: number;
  adjustment: number;
  score: number;
  protectedSignal: boolean;
  reasons: string[];
};

const stop = new Set(['och','att','det','som','med','för','från','till','den','ett','en','på','av','om','nya','nytt','ny','har','ska','kan','sin','sina','inom','efter','över','under','mot','the','and','for','with','from','new','into']);

export function stableItemKey(url: string) {
  let h = 2166136261;
  for (let i = 0; i < url.length; i++) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `item-${(h >>> 0).toString(36)}`;
}

export function titleTokens(title: string) {
  return [...new Set(title.toLocaleLowerCase('sv-SE').split(/[^a-zåäö0-9]+/).filter(x => x.length >= 4 && !stop.has(x)))].slice(0, 12);
}

export function buildFeedback(item: RelevanceItem, kind: FeedbackKind, at = new Date().toISOString()): FeedbackRecord {
  return {
    itemKey: stableItemKey(item.url), kind, at,
    category: item.category, source: item.source, sourceScope: item.sourceScope,
    geographies: item.geographies.slice(0, 5), tokens: titleTokens(item.title),
  };
}

function weight(kind: FeedbackKind) {
  if (kind === 'important') return 1;
  if (kind === 'follow') return 1.35;
  return -0.8;
}

function recency(at: string, now: Date) {
  const age = Math.max(0, (now.getTime() - new Date(at).getTime()) / 86400000);
  return Math.max(0.25, Math.exp(-age / 120));
}

export function personalScore(item: RelevanceItem, feedback: FeedbackRecord[], now = new Date()): PersonalScore {
  const key = stableItemKey(item.url);
  const itemTokens = new Set(titleTokens(item.title));
  let raw = 0;
  const reasonScores = new Map<string, number>();

  for (const fb of feedback.slice(-200)) {
    const w = weight(fb.kind) * recency(fb.at, now);
    if (fb.itemKey === key) {
      const exact = fb.kind === 'follow' ? 18 : fb.kind === 'important' ? 12 : -12;
      raw += exact;
      reasonScores.set(fb.kind === 'irrelevant' ? 'Du markerade just denna händelse som ointressant' : fb.kind === 'follow' ? 'Du följer denna händelse' : 'Du markerade denna händelse som viktig', exact);
      continue;
    }
    if (fb.category === item.category) {
      raw += 2.2 * w;
      reasonScores.set(`Du brukar ${w > 0 ? 'prioritera' : 'nedprioritera'} ${item.category.toLowerCase()}`, (reasonScores.get(`Du brukar ${w > 0 ? 'prioritera' : 'nedprioritera'} ${item.category.toLowerCase()}`) ?? 0) + Math.abs(2.2 * w));
    }
    if (fb.source === item.source) raw += 1.4 * w;
    if (fb.sourceScope === item.sourceScope) raw += 0.4 * w;
    const geoOverlap = item.geographies.some(g => fb.geographies.includes(g));
    if (geoOverlap) {
      raw += 1.6 * w;
      reasonScores.set('Matchar geografier du reagerat på tidigare', (reasonScores.get('Matchar geografier du reagerat på tidigare') ?? 0) + Math.abs(1.6 * w));
    }
    const tokenOverlap = fb.tokens.filter(t => itemTokens.has(t)).length;
    if (tokenOverlap >= 2) {
      raw += Math.min(3.5, tokenOverlap * 0.85) * w;
      reasonScores.set('Liknar ämnen du reagerat på tidigare', (reasonScores.get('Liknar ämnen du reagerat på tidigare') ?? 0) + Math.abs(Math.min(3.5, tokenOverlap * 0.85) * w));
    }
  }

  const protectedSignal = item.score >= 80 || item.independentSourceCount >= 2 || (item.sourceTier === 1 && item.category === 'Regelverk');
  let adjustment = Math.max(-15, Math.min(18, raw));
  if (protectedSignal && adjustment < -3) adjustment = -3;
  const score = Math.max(0, Math.min(100, Math.round(item.score + adjustment)));
  const reasons = [...reasonScores.entries()].sort((a,b)=>b[1]-a[1]).slice(0,2).map(([r])=>r);
  if (protectedSignal && raw < -3) reasons.unshift('Skyddad signal: starkt källstöd eller hög grundrelevans');
  return { baseScore: item.score, adjustment: Math.round(adjustment), score, protectedSignal, reasons: reasons.slice(0,3) };
}

export function feedbackSummary(feedback: FeedbackRecord[]) {
  const out = { total: feedback.length, important: 0, irrelevant: 0, follow: 0 };
  for (const f of feedback) out[f.kind]++;
  return out;
}
