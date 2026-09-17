import type { IndustryProfile } from './industries';
import type { SourceType } from './sources';
import { scoreSignal, type ScoredSignal } from './score';

export type FeedRankingInput={
  title:string; body?:string; sourceType:SourceType; trustScore:number;
  geographyMatches?:number; competitorPriority?:1|2|3|null; publishedAt?:string|null;
};

export function scoreForProfile(input:FeedRankingInput,profile:IndustryProfile):ScoredSignal{
  return scoreSignal({...input,topicKeywords:profile.keywords});
}

export function relevanceFirstComparator<T extends {score:number;publishedAt:string|null}>(a:T,b:T){
  const scoreDelta=b.score-a.score;
  if(Math.abs(scoreDelta)>=8)return scoreDelta;
  const aTime=a.publishedAt?new Date(a.publishedAt).getTime():0;
  const bTime=b.publishedAt?new Date(b.publishedAt).getTime():0;
  return bTime-aTime||scoreDelta;
}
